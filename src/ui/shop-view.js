/**
 * @file Renders the three purchasable lists: mules, pioches and régen items.
 *
 * All three share one card layout, so one generic renderer serves them all — which is also
 * what lets a future Upgrades tab reuse this view with a new data module.
 *
 * ## No inline handlers
 *
 * The original generated `onclick="buyMule('PC du CDI')"` into the HTML, which forced the
 * purchase functions to be globals. Cards now carry `data-action` / `data-id` and a single
 * delegated listener per container dispatches them.
 *
 * ## Prices are displayed, never stored
 *
 * The price shown here is whatever `getCost(state, id)` returns. Nothing reads it back.
 */

import { UI } from '../data/strings.js';
import { createElement, delegate, fadeOut, query } from './dom.js';

/** `data-action` value carried by every buy button. */
const BUY_ACTION = 'buy';

/**
 * @typedef {object} ShopEntry
 * @property {string} id Stable content id.
 * @property {string} name French display name.
 * @property {string} description French flavour text.
 */

/**
 * Builds one purchasable card.
 * @param {ShopEntry} entry Content entry.
 * @param {number} cost Current price, in FK.
 * @param {object} options Options.
 * @param {string} options.kind Content kind, used for the card id and the action payload.
 * @param {boolean} options.withLineBreak Whether to put the button on its own line, as the
 *   original markup did for pioches and régen items but not for mules.
 * @returns {HTMLElement} The card element.
 */
function buildCard(entry, cost, { kind, withLineBreak }) {
  const card = createElement('div', {
    className: 'set-element',
    attributes: { id: `card-${kind}-${entry.id}` },
  });

  card.append(createElement('strong', { className: 'titre', text: entry.name }));
  card.append(createElement('p', { className: 'description', text: entry.description }));

  const price = createElement('p', { className: 'prix' });
  price.append(`${UI.pricePrefix} `);
  price.append(
    createElement('strong', {
      attributes: { 'data-price-for': entry.id },
      text: `${cost} ${UI.currency}`,
    }),
  );
  if (withLineBreak) price.append(createElement('br'));
  price.append(
    createElement('button', {
      text: UI.buyButton,
      attributes: { type: 'button' },
      dataset: { action: BUY_ACTION, id: entry.id },
    }),
  );

  card.append(price);
  return card;
}

/**
 * Creates a shop list renderer.
 *
 * @param {object} options Options.
 * @param {HTMLElement} options.container Element the cards are rendered into.
 * @param {ReadonlyArray<ShopEntry>} options.entries Content to display.
 * @param {string} options.kind Content kind (`mule`, `pioche`, `regen`).
 * @param {(state: import('../core/state.js').GameState, id: string) => number} options.getCost
 *   Price lookup. The only source of displayed prices.
 * @param {(id: string) => void} options.onBuy Called with the content id when a card's button
 *   is pressed.
 * @param {boolean} [options.withLineBreak] Whether to break the line before the button.
 * @returns {{render: (state: import('../core/state.js').GameState) => void,
 *   removeCard: (id: string) => void}} The renderer.
 */
export function createShopView({ container, entries, kind, getCost, onBuy, withLineBreak = true }) {
  container.replaceChildren();
  /** @type {Map<string, HTMLElement>} */
  const priceNodes = new Map();

  for (const entry of entries) {
    const card = buildCard(entry, Number.NaN, { kind, withLineBreak });
    container.append(card);
    priceNodes.set(entry.id, query(`[data-price-for="${entry.id}"]`, card));
  }

  delegate(container, 'click', `button[data-action="${BUY_ACTION}"]`, (_event, button) => {
    onBuy(button.dataset.id);
  });

  return {
    /**
     * Refreshes every displayed price from the current state.
     * @param {import('../core/state.js').GameState} state Current state.
     * @returns {void}
     */
    render(state) {
      for (const [id, node] of priceNodes) {
        const text = `${getCost(state, id)} ${UI.currency}`;
        if (node && node.textContent !== text) node.textContent = text;
      }
    },

    /**
     * Fades a card out and stops tracking it. Used for one-shot pioches.
     * @param {string} id Content id.
     * @returns {void}
     */
    removeCard(id) {
      const card = query(`#card-${kind}-${id}`, container);
      priceNodes.delete(id);
      void fadeOut(card);
    },
  };
}
