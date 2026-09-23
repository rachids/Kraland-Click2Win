/**
 * @file Game state: a plain, serializable object.
 *
 * Deliberately free of classes, closures and functions so it stays `structuredClone`-able
 * and `JSON.stringify`-able. Save/load is out of scope today, but keeping this property
 * means adding it later is a few lines rather than a rewrite.
 *
 * The original kept state in closure variables behind ~20 hand-written getters and
 * setters; systems now read and write these fields directly.
 */

import { STARTING_VALUES } from '../data/balance.js';
import { STARTING_FONCTION } from '../data/strings.js';

/**
 * @typedef {object} GameState
 * @property {number} money Francs-kra (FK) held. Never negative.
 * @property {number} moneyPerClick FK earned per click on the mine.
 * @property {number} moneyPerSecond FK earned per second.
 * @property {number} politicalPower Puissance politique (PP) held.
 * @property {number} politicalPowerPerSecond PP earned per second.
 * @property {number} health Points de vie (PdV). Always within `[0, maxHealth]`.
 * @property {number} maxHealth Maximum PdV.
 * @property {number} healthPerSecond PdV regenerated per second.
 * @property {number} luckFactor Flat bonus added to skill-check success chances.
 * @property {string} fonction French label of the player's current job.
 * @property {Record<string, number>} mulePurchases Mule id → times bought. Drives price.
 * @property {Record<string, number>} regenPurchases Régen id → times bought. Drives price.
 * @property {number} maxHealthPurchases Times "Augmenter PdV" was bought. Drives price.
 * @property {string[]} ownedPioches Ids of pickaxes bought (each is one-shot).
 * @property {string[]} usurpedFonctions Ids of jobs already taken (each is one-shot).
 */

/**
 * Builds a fresh game state.
 *
 * Every value comes from `data/balance.js`, so a new game and a balance change never
 * disagree.
 *
 * @returns {GameState} A new state object, safe to mutate.
 */
export function createInitialState() {
  return {
    money: STARTING_VALUES.money,
    moneyPerClick: STARTING_VALUES.moneyPerClick,
    moneyPerSecond: STARTING_VALUES.moneyPerSecond,

    politicalPower: STARTING_VALUES.politicalPower,
    politicalPowerPerSecond: STARTING_VALUES.politicalPowerPerSecond,

    health: STARTING_VALUES.health,
    maxHealth: STARTING_VALUES.maxHealth,
    healthPerSecond: STARTING_VALUES.healthPerSecond,

    luckFactor: STARTING_VALUES.luckFactor,
    fonction: STARTING_FONCTION,

    // Purchase counters. Costs are derived from these, never read back from the DOM.
    mulePurchases: {},
    regenPurchases: {},
    maxHealthPurchases: 0,

    ownedPioches: [],
    usurpedFonctions: [],
  };
}

/**
 * Reads how many times a repeatable item has been bought.
 * @param {Record<string, number>} counters One of the `*Purchases` maps.
 * @param {string} id Content id.
 * @returns {number} Purchase count, `0` if never bought.
 */
export function getPurchaseCount(counters, id) {
  return counters[id] ?? 0;
}

/**
 * Records one more purchase of a repeatable item.
 * @param {Record<string, number>} counters One of the `*Purchases` maps. Mutated in place.
 * @param {string} id Content id.
 * @returns {number} The new purchase count.
 */
export function incrementPurchaseCount(counters, id) {
  counters[id] = getPurchaseCount(counters, id) + 1;
  return counters[id];
}

/**
 * The money value shown to the player.
 *
 * Faithful port of the original `getScore()`, which returned `Math.ceil(score)` while
 * arithmetic ran on the underlying float. Keeping the ceiling here means the displayed
 * figure matches the original exactly, and affordability checks use the same number the
 * player can see.
 *
 * @param {GameState} state Current state.
 * @returns {number} Money, rounded up to the next whole FK.
 */
export function getDisplayMoney(state) {
  return Math.ceil(state.money);
}
