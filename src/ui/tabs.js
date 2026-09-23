/**
 * @file Native replacement for jQuery UI's `.tabs()` widget.
 *
 * The vendored jQuery UI build contained `core.js, widget.js, tabs.js` only, so `tabs` was
 * the single widget in use — verified by instrumenting the real widget (see
 * REFACTOR_PLAN.md §4.2). This reimplements the parts that matter in ~60 lines:
 * showing one panel at a time, the ARIA roles, and keyboard navigation.
 *
 * ## The `ui-*` classes are deliberately not reproduced
 *
 * jQuery UI decorated the markup with `ui-tabs`, `ui-state-active`, `ui-corner-top` and
 * friends, but the jQuery UI *theme* stylesheet was never vendored: `css/kraland.css`
 * contains zero `ui-*` rules, so every one of those classes was visually inert.
 *
 * Instead we apply `.on` to the active `<li>`. The Kraland stylesheet already ships
 * `.sl li.on` / `.sl li.on a` rules (white background, bold text, dark border) written for
 * exactly this purpose, which were dead code while jQuery UI was in charge. This is the one
 * deliberate visual change in the refactor — see REFACTOR_PLAN.md §8, change #8.
 */

import { queryAll } from './dom.js';

/** Class applied to the active tab, matching the existing `.sl li.on` rules. */
const ACTIVE_TAB_CLASS = 'on';

/**
 * @typedef {object} TabsController
 * @property {(index: number) => void} select Activates a tab by index.
 * @property {() => number} getActiveIndex Index of the active tab.
 * @property {() => void} destroy Removes the listeners.
 */

/**
 * Turns a container of `<a href="#panel-id">` links into a tab set.
 *
 * @param {HTMLElement} container Element holding both the tab list and the panels.
 * @param {object} [options] Options.
 * @param {number} [options.initialIndex] Tab shown first.
 * @param {string} [options.linkSelector] Selector for the tab links.
 * @returns {TabsController} Controller for the tab set.
 */
export function createTabs(container, { initialIndex = 0, linkSelector = '.sl ul li a' } = {}) {
  const links = /** @type {HTMLAnchorElement[]} */ (queryAll(linkSelector, container));
  const tabs = links.map((link) => ({
    link,
    item: link.closest('li'),
    panel: container.querySelector(link.getAttribute('href')),
  }));

  let activeIndex = initialIndex;

  const list = container.querySelector('.sl ul');
  list?.setAttribute('role', 'tablist');

  tabs.forEach(({ link, item, panel }, index) => {
    const panelId = panel?.id ?? `tab-panel-${index}`;
    const tabId = `${panelId}-tab`;

    link.id = tabId;
    link.setAttribute('role', 'tab');
    link.setAttribute('aria-controls', panelId);
    item?.setAttribute('role', 'presentation');

    panel?.setAttribute('role', 'tabpanel');
    panel?.setAttribute('aria-labelledby', tabId);
  });

  /**
   * Activates a tab and hides the others.
   * @param {number} index Tab to activate.
   * @param {boolean} [focus] Whether to move keyboard focus to the new tab.
   * @returns {void}
   */
  function select(index, focus = false) {
    if (index < 0 || index >= tabs.length) return;
    activeIndex = index;

    tabs.forEach(({ link, item, panel }, tabIndex) => {
      const isActive = tabIndex === index;
      item?.classList.toggle(ACTIVE_TAB_CLASS, isActive);
      link.setAttribute('aria-selected', String(isActive));
      // Roving tabindex: only the active tab is reachable with Tab.
      link.tabIndex = isActive ? 0 : -1;
      if (panel) {
        panel.style.display = isActive ? '' : 'none';
        panel.setAttribute('aria-hidden', String(!isActive));
      }
    });

    if (focus) tabs[index].link.focus();
  }

  /** @param {MouseEvent} event */
  function handleClick(event) {
    const link = /** @type {Element} */ (event.target)?.closest(linkSelector);
    if (!link) return;
    const index = links.indexOf(/** @type {HTMLAnchorElement} */ (link));
    if (index === -1) return;
    // Prevent the browser from jumping to the anchor and adding a history entry.
    event.preventDefault();
    select(index);
  }

  /** @param {KeyboardEvent} event */
  function handleKeydown(event) {
    const steps = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
    if (event.key in steps) {
      event.preventDefault();
      select((activeIndex + steps[event.key] + tabs.length) % tabs.length, true);
      return;
    }
    if (event.key === 'Home') {
      event.preventDefault();
      select(0, true);
    } else if (event.key === 'End') {
      event.preventDefault();
      select(tabs.length - 1, true);
    }
  }

  container.addEventListener('click', handleClick);
  container.addEventListener('keydown', handleKeydown);
  select(activeIndex);

  return {
    select,
    getActiveIndex: () => activeIndex,
    destroy() {
      container.removeEventListener('click', handleClick);
      container.removeEventListener('keydown', handleKeydown);
    },
  };
}
