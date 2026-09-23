/**
 * @file Shop system: prices and purchase rules for mules, pioches and régen items.
 *
 * ## Prices come from data + state, never from the DOM
 *
 * The original read the current price back out of the page
 * (`parseInt($('#' + mule.type).html())`) and wrote the escalated price into `innerHTML`,
 * making the DOM the single source of truth for prices. Here, a price is a pure function
 * of the content definition and a purchase counter held in state, and the UI merely
 * displays what these functions return.
 *
 * The escalation is applied **iteratively**, one purchase at a time, because
 * `Math.floor` at every step makes the curve non-closed-form. That reproduces the original
 * integer sequence exactly.
 */

import { COST_GROWTH, MULE_CLICK_BONUS_RATIO } from '../data/balance.js';
import { MULES_BY_ID, PIOCHES_BY_ID, REGEN_BY_ID } from '../data/index.js';
import { EVENTS } from '../core/events.js';
import { isValidCost } from '../core/math.js';
import { getDisplayMoney, getPurchaseCount, incrementPurchaseCount } from '../core/state.js';

/** Reasons a purchase can be refused. */
export const PURCHASE_REFUSAL = Object.freeze({
  UNKNOWN_ITEM: 'unknown-item',
  NOT_ENOUGH_MONEY: 'not-enough-money',
  ALREADY_OWNED: 'already-owned',
  INVALID_COST: 'invalid-cost',
});

/** Content kinds handled by this system. */
export const SHOP_KINDS = Object.freeze({
  MULE: 'mule',
  PIOCHE: 'pioche',
  REGEN: 'regen',
});

/**
 * Applies a compounding, floor-truncated cost increase `purchases` times.
 *
 * Reproduces the original `cout += Math.floor(cout * rate)` loop step by step.
 *
 * @param {number} baseCost Price of the very first purchase.
 * @param {number} rate Fraction added after each purchase (e.g. `0.15`).
 * @param {number} purchases How many purchases already happened.
 * @returns {number} Price of the next purchase.
 */
export function escalateCost(baseCost, rate, purchases) {
  let cost = baseCost;
  for (let index = 0; index < purchases; index += 1) {
    cost += Math.floor(cost * rate);
  }
  return cost;
}

/**
 * Current price of a mule.
 * @param {import('../core/state.js').GameState} state Current state.
 * @param {string} id Mule id.
 * @returns {number} Price in FK, or `NaN` if the id is unknown.
 */
export function getMuleCost(state, id) {
  const mule = MULES_BY_ID.get(id);
  if (!mule) return Number.NaN;
  return escalateCost(mule.baseCost, COST_GROWTH.mule, getPurchaseCount(state.mulePurchases, id));
}

/**
 * Current price of a régen item.
 * @param {import('../core/state.js').GameState} state Current state.
 * @param {string} id Régen item id.
 * @returns {number} Price in FK, or `NaN` if the id is unknown.
 */
export function getRegenCost(state, id) {
  const item = REGEN_BY_ID.get(id);
  if (!item) return Number.NaN;
  return escalateCost(item.baseCost, COST_GROWTH.regen, getPurchaseCount(state.regenPurchases, id));
}

/**
 * Price of a pioche. Pioches are one-shot, so this never escalates.
 * @param {import('../core/state.js').GameState} _state Current state (unused; kept for a
 *   uniform signature across cost functions).
 * @param {string} id Pioche id.
 * @returns {number} Price in FK, or `NaN` if the id is unknown.
 */
export function getPiocheCost(_state, id) {
  return PIOCHES_BY_ID.get(id)?.baseCost ?? Number.NaN;
}

/**
 * Deducts a price from the player's money.
 *
 * Money is floored at zero. The original subtracted from the raw float while checking
 * affordability against `Math.ceil(money)`, so a purchase could leave money very slightly
 * negative (always by less than 1 FK, and always displayed as `0`).
 *
 * @param {import('../core/state.js').GameState} state State, mutated in place.
 * @param {number} cost Price to pay.
 * @returns {void}
 */
export function spendMoney(state, cost) {
  state.money = Math.max(0, state.money - cost);
}

/**
 * Whether the player can afford a price.
 *
 * Compares against the *displayed* (ceiled) money, exactly like the original, so the
 * button is never refused while the page shows enough FK.
 *
 * @param {import('../core/state.js').GameState} state Current state.
 * @param {number} cost Price to check.
 * @returns {boolean} Whether the purchase is affordable.
 */
export function canAfford(state, cost) {
  return isValidCost(cost) && cost <= getDisplayMoney(state);
}

/**
 * @typedef {object} PurchaseResult
 * @property {boolean} success Whether the purchase went through.
 * @property {string} [reason] One of {@link PURCHASE_REFUSAL} when `success` is `false`.
 * @property {number} [cost] Price paid, when successful.
 */

/**
 * Buys a mule: adds FK/second, and 10% of that to FK/click.
 * @param {import('../core/game.js').Game} game The game.
 * @param {string} id Mule id.
 * @returns {PurchaseResult} Outcome.
 */
export function buyMule(game, id) {
  const { state } = game;
  const mule = MULES_BY_ID.get(id);
  if (!mule) return refuse(game, SHOP_KINDS.MULE, id, PURCHASE_REFUSAL.UNKNOWN_ITEM);

  const cost = getMuleCost(state, id);
  if (!isValidCost(cost)) return refuse(game, SHOP_KINDS.MULE, id, PURCHASE_REFUSAL.INVALID_COST);
  if (!canAfford(state, cost)) {
    return refuse(game, SHOP_KINDS.MULE, id, PURCHASE_REFUSAL.NOT_ENOUGH_MONEY);
  }

  spendMoney(state, cost);
  state.moneyPerSecond += mule.perSecondModifier;
  state.moneyPerClick += mule.perSecondModifier * MULE_CLICK_BONUS_RATIO;
  incrementPurchaseCount(state.mulePurchases, id);

  game.events.emit(EVENTS.PURCHASE_SUCCEEDED, { kind: SHOP_KINDS.MULE, id, cost });
  return { success: true, cost };
}

/**
 * Buys a pioche: adds FK/click. One-shot — the card is removed afterwards.
 * @param {import('../core/game.js').Game} game The game.
 * @param {string} id Pioche id.
 * @returns {PurchaseResult} Outcome.
 */
export function buyPioche(game, id) {
  const { state } = game;
  const pioche = PIOCHES_BY_ID.get(id);
  if (!pioche) return refuse(game, SHOP_KINDS.PIOCHE, id, PURCHASE_REFUSAL.UNKNOWN_ITEM);
  if (state.ownedPioches.includes(id)) {
    return refuse(game, SHOP_KINDS.PIOCHE, id, PURCHASE_REFUSAL.ALREADY_OWNED);
  }

  const cost = getPiocheCost(state, id);
  if (!isValidCost(cost)) return refuse(game, SHOP_KINDS.PIOCHE, id, PURCHASE_REFUSAL.INVALID_COST);
  if (!canAfford(state, cost)) {
    return refuse(game, SHOP_KINDS.PIOCHE, id, PURCHASE_REFUSAL.NOT_ENOUGH_MONEY);
  }

  spendMoney(state, cost);
  state.moneyPerClick += pioche.perClickModifier;
  state.ownedPioches.push(id);

  game.events.emit(EVENTS.PURCHASE_SUCCEEDED, { kind: SHOP_KINDS.PIOCHE, id, cost });
  game.events.emit(EVENTS.PIOCHE_REMOVED, { id });
  return { success: true, cost };
}

/**
 * Buys a régen item: adds PdV/second.
 * @param {import('../core/game.js').Game} game The game.
 * @param {string} id Régen item id.
 * @returns {PurchaseResult} Outcome.
 */
export function buyRegen(game, id) {
  const { state } = game;
  const item = REGEN_BY_ID.get(id);
  if (!item) return refuse(game, SHOP_KINDS.REGEN, id, PURCHASE_REFUSAL.UNKNOWN_ITEM);

  const cost = getRegenCost(state, id);
  if (!isValidCost(cost)) return refuse(game, SHOP_KINDS.REGEN, id, PURCHASE_REFUSAL.INVALID_COST);
  if (!canAfford(state, cost)) {
    return refuse(game, SHOP_KINDS.REGEN, id, PURCHASE_REFUSAL.NOT_ENOUGH_MONEY);
  }

  spendMoney(state, cost);
  state.healthPerSecond += item.regenAdd;
  incrementPurchaseCount(state.regenPurchases, id);

  game.events.emit(EVENTS.PURCHASE_SUCCEEDED, { kind: SHOP_KINDS.REGEN, id, cost });
  return { success: true, cost };
}

/**
 * Announces a refused purchase and builds its result.
 *
 * The original shop buttons failed silently; the event exists so a future UI can surface
 * a reason without changing these rules.
 *
 * @param {import('../core/game.js').Game} game The game.
 * @param {string} kind One of {@link SHOP_KINDS}.
 * @param {string} id Content id.
 * @param {string} reason One of {@link PURCHASE_REFUSAL}.
 * @returns {PurchaseResult} A failed result.
 */
function refuse(game, kind, id, reason) {
  game.events.emit(EVENTS.PURCHASE_FAILED, { kind, id, reason });
  return { success: false, reason };
}
