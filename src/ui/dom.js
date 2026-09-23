/**
 * @file Native replacements for the handful of jQuery features the game used.
 *
 * See REFACTOR_PLAN.md §4 for the full inventory. In short:
 * `$()` → `querySelector`, `.on()` → `addEventListener`, `.append(html)` →
 * `insertAdjacentHTML`, `.hide()/.show()` → `style.display`, `.fadeIn()/.fadeOut()/.animate()`
 * → the Web Animations API, `.data()` → `dataset`, `.html()` → `textContent`/`innerHTML`.
 */

/** Duration of the fade helpers, in milliseconds. Matches jQuery's default. */
const FADE_DURATION_MS = 400;

/**
 * Finds the first element matching a selector.
 * @param {string} selector CSS selector.
 * @param {ParentNode} [root] Search root. Defaults to `document`.
 * @returns {Element|null} The element, or `null`.
 */
export function query(selector, root = document) {
  return root.querySelector(selector);
}

/**
 * Finds every element matching a selector.
 * @param {string} selector CSS selector.
 * @param {ParentNode} [root] Search root. Defaults to `document`.
 * @returns {Element[]} The matching elements, as a real array.
 */
export function queryAll(selector, root = document) {
  return [...root.querySelectorAll(selector)];
}

/**
 * Finds an element by id, throwing if it is missing.
 *
 * Fails loudly at boot rather than silently doing nothing later, which is what jQuery's
 * empty-set behaviour used to do.
 *
 * @param {string} id Element id, without the `#`.
 * @returns {HTMLElement} The element.
 * @throws {Error} If no element has that id.
 */
export function requireById(id) {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Missing required element #${id}`);
  return element;
}

/**
 * Creates an element.
 * @param {string} tagName Tag to create.
 * @param {object} [options] Options.
 * @param {string|string[]} [options.className] Class name(s) to add.
 * @param {string} [options.text] Text content, assigned safely via `textContent`.
 * @param {string} [options.html] Inner HTML. Only for trusted, author-written content.
 * @param {Record<string, string>} [options.attributes] Attributes to set.
 * @param {Record<string, string>} [options.dataset] `data-*` values to set.
 * @returns {HTMLElement} The new element.
 */
export function createElement(tagName, { className, text, html, attributes, dataset } = {}) {
  const element = document.createElement(tagName);

  if (className) {
    const names = Array.isArray(className) ? className : className.split(' ');
    element.classList.add(...names.filter(Boolean));
  }
  if (text !== undefined) element.textContent = text;
  if (html !== undefined) element.innerHTML = html;
  for (const [name, value] of Object.entries(attributes ?? {})) element.setAttribute(name, value);
  for (const [name, value] of Object.entries(dataset ?? {})) element.dataset[name] = value;

  return element;
}

/**
 * Attaches a delegated listener.
 *
 * Replaces jQuery's `$(document).on(event, selector, handler)`. One listener on a container
 * handles any number of current *and future* children, which is what lets the shop re-render
 * without rebinding anything.
 *
 * @param {Element|Document} root Container to listen on.
 * @param {string} eventName DOM event name.
 * @param {string} selector Selector the event target must match (or be inside).
 * @param {(event: Event, matched: Element) => void} handler Called with the event and the
 *   matched element.
 * @returns {() => void} Unsubscribe function.
 */
export function delegate(root, eventName, selector, handler) {
  /** @param {Event} event */
  const listener = (event) => {
    const matched = event.target instanceof Element ? event.target.closest(selector) : null;
    if (matched && root.contains(matched)) handler(event, matched);
  };
  root.addEventListener(eventName, listener);
  return () => root.removeEventListener(eventName, listener);
}

/**
 * Sets an element's text, skipping the write when nothing changed.
 *
 * The render loop runs ten times a second; avoiding no-op writes keeps the browser from
 * re-laying-out text that did not move.
 *
 * @param {Element|null} element Target element.
 * @param {string} text New text.
 * @returns {void}
 */
export function setText(element, text) {
  if (element && element.textContent !== text) element.textContent = text;
}

/**
 * Replaces an element's inner HTML with trusted, author-written markup.
 *
 * Only ever called with static French copy from `src/data/`, never with user input.
 *
 * @param {Element|null} element Target element.
 * @param {string} html Markup to insert.
 * @returns {void}
 */
export function setHtml(element, html) {
  if (element) element.innerHTML = html;
}

/**
 * Hides an element. Equivalent to jQuery's `.hide()`.
 * @param {Element|null} element Target element.
 * @returns {void}
 */
export function hide(element) {
  if (element) element.style.display = 'none';
}

/**
 * Shows an element. Equivalent to jQuery's `.show()` for block-level elements.
 * @param {Element|null} element Target element.
 * @param {string} [display] Display value to restore.
 * @returns {void}
 */
export function show(element, display = 'block') {
  if (element) element.style.display = display;
}

/**
 * Whether the browser can run Web Animations. Guards the fade helpers so the game still
 * works (without animation) in an environment that lacks them, such as a test runner.
 * @param {Element} element Element to check.
 * @returns {boolean} Whether `element.animate` is usable.
 */
function canAnimate(element) {
  return typeof element.animate === 'function';
}

/**
 * Fades an element in. Replaces jQuery's `.fadeIn()`.
 * @param {Element|null} element Target element.
 * @param {number} [duration] Duration in milliseconds.
 * @returns {void}
 */
export function fadeIn(element, duration = FADE_DURATION_MS) {
  if (!element) return;
  show(element);
  if (!canAnimate(element)) return;
  element.animate([{ opacity: 0 }, { opacity: 1 }], { duration, easing: 'linear' });
}

/**
 * Fades an element out, then hides it. Replaces jQuery's `.fadeOut()`.
 * @param {Element|null} element Target element.
 * @param {number} [duration] Duration in milliseconds.
 * @returns {Promise<void>} Resolves once the element is hidden.
 */
export async function fadeOut(element, duration = FADE_DURATION_MS) {
  if (!element) return;
  if (!canAnimate(element)) {
    hide(element);
    return;
  }
  await element.animate([{ opacity: 1 }, { opacity: 0 }], { duration, easing: 'linear' }).finished;
  hide(element);
}
