/**
 * @file Minimal publish/subscribe bus.
 *
 * This is the seam that lets future systems (Careers, Political system, Upgrades,
 * Prestige) notify the UI without any existing module importing them. Systems emit,
 * views listen; neither knows the other exists.
 *
 * Event names are namespaced `domain:verb`, e.g. `money:changed`, `ordre:resolved`.
 */

/**
 * @typedef {(payload?: unknown) => void} EventHandler
 */

/**
 * Creates an event bus.
 * @returns {{
 *   on: (eventName: string, handler: EventHandler) => () => void,
 *   once: (eventName: string, handler: EventHandler) => () => void,
 *   off: (eventName: string, handler: EventHandler) => void,
 *   emit: (eventName: string, payload?: unknown) => void,
 *   clear: () => void
 * }} The bus.
 */
export function createEventBus() {
  /** @type {Map<string, Set<EventHandler>>} */
  const handlers = new Map();

  /**
   * Subscribes to an event.
   * @param {string} eventName Event to listen for.
   * @param {EventHandler} handler Called with the event payload.
   * @returns {() => void} Unsubscribe function.
   */
  function on(eventName, handler) {
    if (!handlers.has(eventName)) handlers.set(eventName, new Set());
    handlers.get(eventName).add(handler);
    return () => off(eventName, handler);
  }

  /**
   * Unsubscribes a handler.
   * @param {string} eventName Event it was registered for.
   * @param {EventHandler} handler The exact handler reference passed to `on`.
   * @returns {void}
   */
  function off(eventName, handler) {
    handlers.get(eventName)?.delete(handler);
  }

  /**
   * Subscribes to the next occurrence of an event only.
   * @param {string} eventName Event to listen for.
   * @param {EventHandler} handler Called once, with the event payload.
   * @returns {() => void} Unsubscribe function.
   */
  function once(eventName, handler) {
    const unsubscribe = on(eventName, (payload) => {
      unsubscribe();
      handler(payload);
    });
    return unsubscribe;
  }

  /**
   * Publishes an event. A throwing handler is logged and does not prevent the others from
   * running, so one broken view cannot take the game loop down.
   * @param {string} eventName Event to publish.
   * @param {unknown} [payload] Data passed to every handler.
   * @returns {void}
   */
  function emit(eventName, payload) {
    const listeners = handlers.get(eventName);
    if (!listeners) return;
    // Copy first: a handler may unsubscribe itself while we iterate.
    for (const handler of [...listeners]) {
      try {
        handler(payload);
      } catch (error) {
        console.error(`[events] handler for "${eventName}" threw:`, error);
      }
    }
  }

  /**
   * Removes every subscription. Mainly useful in tests.
   * @returns {void}
   */
  function clear() {
    handlers.clear();
  }

  return { on, once, off, emit, clear };
}

/**
 * Canonical event names. Using these constants instead of raw strings keeps typos out and
 * gives a single place to see everything the game broadcasts.
 * @type {Readonly<Record<string, string>>}
 */
export const EVENTS = Object.freeze({
  /** A simulation tick completed. Payload: `{ deltaSeconds }`. */
  TICK: 'game:tick',
  /** Any state changed and views should refresh. Payload: none. */
  STATE_CHANGED: 'state:changed',
  /** The player clicked the mine. Payload: `{ amount, event }`. */
  MINE_CLICKED: 'mine:clicked',
  /** A shop purchase succeeded. Payload: `{ kind, id }`. */
  PURCHASE_SUCCEEDED: 'shop:purchased',
  /** A shop purchase was refused. Payload: `{ kind, id, reason }`. */
  PURCHASE_FAILED: 'shop:refused',
  /** A pioche was bought and must disappear from the shop. Payload: `{ id }`. */
  PIOCHE_REMOVED: 'shop:pioche-removed',
  /** An ordre or usurpation resolved. Payload: an action result object. */
  ACTION_RESOLVED: 'action:resolved',
  /** A fonction was successfully usurped and must disappear. Payload: `{ id }`. */
  FONCTION_TAKEN: 'usurpation:taken',
});
