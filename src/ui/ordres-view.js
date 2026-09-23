/**
 * @file Renders the "Ordres" and "Usurper" tabs.
 *
 * Both are the same widget: a menu of clickable labels, plus one hidden order card per
 * entry that fades in when its label is picked. The original built both with jQuery string
 * concatenation and inline `onclick` attributes; here the cards are real elements and a
 * single delegated listener per container handles every click.
 */

import { DISPLAY_DECIMALS, ROLL } from '../data/balance.js';
import { UI } from '../data/strings.js';
import { roundToDecimals } from '../core/math.js';
import { createElement, delegate, fadeIn, hide, query, queryAll } from './dom.js';

/** `data-action` value carried by an order's confirm button. */
const CONFIRM_ACTION = 'confirm';
/** Class of the clickable labels in the menu. */
const MENU_ITEM_CLASS = 'loadOrder';
/** Class of an order card. */
const CARD_CLASS = 'od';

/**
 * @typedef {object} OrderEntry
 * @property {string} id Stable content id; also the card's distinguishing CSS class.
 * @property {string} menuLabel Text shown in the menu.
 * @property {string} title Heading of the card.
 * @property {string} description French flavour text (may contain markup).
 * @property {number} cost Price, in FK.
 * @property {number} costPDV Fatigue, in PdV.
 * @property {string} txtChance Label preceding the success chance.
 * @property {number} chance Base success chance, in percent.
 */

/**
 * Builds the footer line: "Coût: N FK | Fatigue: N PdV | <label> N%".
 * @param {OrderEntry} entry Content entry.
 * @param {number} chance Displayed success chance.
 * @returns {HTMLElement} The footer element.
 */
function buildFooter(entry, chance) {
  const footer = createElement('div', { className: 'of' });
  footer.append(
    ` ${UI.costLabel} `,
    createElement('span', {
      attributes: { 'data-cost-for': entry.id },
      text: String(entry.cost),
    }),
    ` ${UI.currency} | ${UI.fatigueLabel} ${entry.costPDV} ${UI.healthUnit} | ${entry.txtChance} `,
    createElement('span', {
      attributes: { 'data-chance-for': entry.id },
      text: `${chance}%`,
    }),
  );
  return footer;
}

/**
 * Builds one order card. Hidden by default: `.od` is `display: none` in the stylesheet.
 * @param {OrderEntry} entry Content entry.
 * @returns {HTMLElement} The card element.
 */
function buildCard(entry) {
  const card = createElement('div', { className: [CARD_CLASS, entry.id] });

  const body = createElement('div', { className: 'op' });
  body.append(createElement('span', { className: 'oh', text: UI.helpMarker }), ' ');
  body.append(createElement('h4', { text: entry.title }), ' ');
  // Descriptions are static French copy containing <em>, <a> and <img>.
  body.append(createElement('div', { className: 'mini', html: entry.description }), ' ');

  const actions = createElement('p', { className: 'os' });
  actions.append(
    createElement('button', {
      className: 'ordreBtn',
      text: UI.confirmButton,
      attributes: { type: 'button' },
      dataset: { action: CONFIRM_ACTION, id: entry.id },
    }),
  );
  body.append(actions);

  card.append(body, ' ', buildFooter(entry, entry.chance), ' ');
  return card;
}

/**
 * Creates an orders view.
 *
 * @param {object} options Options.
 * @param {HTMLElement} options.container Element holding the menu and the cards.
 * @param {ReadonlyArray<OrderEntry>} options.entries Content to display.
 * @param {(id: string) => void} options.onConfirm Called with the content id when an order's
 *   confirm button is pressed.
 * @param {(state: import('../core/state.js').GameState, entry: OrderEntry) => number}
 *   [options.getChance] Computes the displayed success chance. Defaults to the entry's own.
 * @param {(state: import('../core/state.js').GameState, entry: OrderEntry) => number}
 *   [options.getCost] Computes the displayed price. Defaults to the entry's own.
 * @param {boolean} [options.labelSuffixInside] Whether the " - " separator belongs inside the
 *   menu label, as the original usurpation menu did.
 * @returns {{render: (state: import('../core/state.js').GameState) => void,
 *   removeEntry: (id: string) => void, hideAllCards: () => void}} The view.
 */
export function createOrdresView({
  container,
  entries,
  onConfirm,
  getChance = (_state, entry) => entry.chance,
  getCost = (_state, entry) => entry.cost,
  labelSuffixInside = false,
}) {
  const menu = query('.menu_ordres', container);
  menu?.replaceChildren();

  for (const entry of entries) {
    const label = createElement('span', {
      className: MENU_ITEM_CLASS,
      text: labelSuffixInside ? `${entry.menuLabel}${UI.separator}` : entry.menuLabel,
      dataset: { ordre: entry.id },
    });
    menu?.append(label);
    if (!labelSuffixInside) menu?.append(UI.separator);

    container.append(buildCard(entry));
  }

  // One listener for the menu, one for the confirm buttons.
  delegate(container, 'click', `.${MENU_ITEM_CLASS}`, (_event, label) => {
    for (const card of queryAll(`.${CARD_CLASS}`, container)) hide(card);
    fadeIn(query(`.${CARD_CLASS}.${label.dataset.ordre}`, container));
  });

  delegate(container, 'click', `button[data-action="${CONFIRM_ACTION}"]`, (_event, button) => {
    onConfirm(button.dataset.id);
  });

  return {
    /**
     * Refreshes the costs and success chances shown on every card.
     * @param {import('../core/state.js').GameState} state Current state.
     * @returns {void}
     */
    render(state) {
      for (const entry of entries) {
        const chanceNode = query(`[data-chance-for="${entry.id}"]`, container);
        const costNode = query(`[data-cost-for="${entry.id}"]`, container);

        if (chanceNode) {
          const chance = roundToDecimals(getChance(state, entry), DISPLAY_DECIMALS.rate);
          // An automatic action shows a flat 100%, exactly like the original.
          const text = `${entry.chance === ROLL.diceSides ? entry.chance : chance}%`;
          if (chanceNode.textContent !== text) chanceNode.textContent = text;
        }

        if (costNode) {
          const text = String(getCost(state, entry));
          if (costNode.textContent !== text) costNode.textContent = text;
        }
      }
    },

    /**
     * Removes an entry's card and menu label. Used when a fonction has been usurped.
     * @param {string} id Content id.
     * @returns {void}
     */
    removeEntry(id) {
      hide(query(`.${CARD_CLASS}.${id}`, container));
      hide(query(`.${MENU_ITEM_CLASS}[data-ordre="${id}"]`, container));
    },

    /**
     * Hides every card, as the original did after resolving an Auto-Soutien.
     * @returns {void}
     */
    hideAllCards() {
      for (const card of queryAll(`.${CARD_CLASS}`, container)) hide(card);
    },
  };
}
