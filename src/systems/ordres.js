/**
 * @file Ordres system: the three one-off actions of the "Ordres" tab.
 *
 * Every handler is a pure-ish function of `(game, random)` that mutates state and returns a
 * result object; building the French sentence and putting it on screen is the UI's job.
 */

import { MAX_HEALTH_COST_CURVE, ROLL, DISPLAY_DECIMALS } from '../data/balance.js';
import { ORDRES_BY_ID, ORDRE_ACTIONS } from '../data/index.js';
import { ERRORS, MESSAGES, RESULT_TITLES } from '../data/strings.js';
import { EVENTS } from '../core/events.js';
import { addClamped, isValidCost, rollDie, roundToDecimals } from '../core/math.js';
import { getDisplayMoney } from '../core/state.js';
import { canAfford, spendMoney } from './shop.js';

/**
 * @typedef {object} ActionResult
 * @property {string} title French title of the result panel.
 * @property {string} message French body of the result panel (may contain HTML).
 * @property {number} chance Success chance used, in percent.
 * @property {number} roll The d100 result, `0` for automatic actions and errors.
 * @property {boolean} isError Whether this is a refusal rather than an outcome.
 */

/**
 * Builds a refusal result.
 * @param {string} message French explanation.
 * @returns {ActionResult} The result.
 */
function error(message) {
  return { title: RESULT_TITLES.error, message, chance: 100, roll: 0, isError: true };
}

/**
 * Adds health, clamped to `[0, maxHealth]`.
 *
 * The original clamped the maximum only, so PdV could go negative on a critical failure.
 *
 * @param {import('../core/state.js').GameState} state State, mutated in place.
 * @param {number} amount Health to add; may be negative.
 * @returns {void}
 */
function addHealth(state, amount) {
  state.health = addClamped(state.health, amount, 0, state.maxHealth);
}

/**
 * Success chance of the Auto-Soutien order.
 *
 * Port of `Math.round(10 * (PP/10 + chance + luck), 1) / 10`, capped at 95. The stray
 * second argument to `Math.round` was always ignored — see `core/math.js`.
 *
 * @param {import('../core/state.js').GameState} state Current state.
 * @param {import('../data/ordres.js').Ordre} ordre The order definition.
 * @returns {number} Success chance in percent, capped at `ROLL.maxSuccessChance`.
 */
export function getSoutienChance(state, ordre) {
  const raw = state.politicalPower / ROLL.politicalPowerDivisor + ordre.chance + state.luckFactor;
  const rounded = roundToDecimals(raw, DISPLAY_DECIMALS.rate);
  return Math.min(rounded, ROLL.maxSuccessChance);
}

/**
 * Price of the next "Augmenter PdV" purchase.
 *
 * Port of the original curve, which was stored in the DOM and grew by
 * `Math.floor(100 * (maxHealth - 25) * 1.05 ** maxHealth)` after each purchase, evaluated
 * *after* the max-health increase. Replayed iteratively from the starting max health so
 * the integer sequence is identical (305 → 660 → 1406 → 2582 → …).
 *
 * @param {import('../core/state.js').GameState} state Current state.
 * @param {import('../data/ordres.js').Ordre} ordre The order definition.
 * @param {number} startingMaxHealth Max health of a brand-new character.
 * @returns {number} Price in FK.
 */
export function getMaxHealthCost(state, ordre, startingMaxHealth) {
  let cost = ordre.cost;
  for (let index = 0; index < state.maxHealthPurchases; index += 1) {
    const maxHealthAfterPurchase = startingMaxHealth + (index + 1) * ordre.pdvMax;
    cost += Math.floor(
      MAX_HEALTH_COST_CURVE.multiplier *
        (maxHealthAfterPurchase - startingMaxHealth) *
        MAX_HEALTH_COST_CURVE.base ** maxHealthAfterPurchase,
    );
  }
  return cost;
}

/**
 * Auto-Soutien: a self-congratulating speech that can win or lose PP.
 * @param {import('../core/game.js').Game} game The game.
 * @param {() => number} [random] Randomness source, injectable for tests.
 * @returns {ActionResult} Outcome.
 */
export function autoSoutien(game, random = Math.random) {
  const { state } = game;
  const ordre = ORDRES_BY_ID.get('soutien');

  if (ordre.costPDV > state.health) return error(ERRORS.notEnoughHealth);
  if (ordre.cost > getDisplayMoney(state)) return error(ERRORS.notEnoughMoney);

  addHealth(state, -ordre.costPDV);

  const roll = rollDie(ROLL.diceSides, random);
  let ppAdd = rollDie(ordre.ppAdd, random);
  const chance = getSoutienChance(state, ordre);

  if (roll === ROLL.criticalSuccess) {
    ppAdd += rollDie(ordre.ppAdd, random);
    state.politicalPower += ppAdd;
    return {
      title: RESULT_TITLES.criticalSuccess,
      message: MESSAGES.soutienCriticalSuccess(ppAdd),
      chance,
      roll,
      isError: false,
    };
  }

  if (chance >= roll) {
    state.politicalPower += ppAdd;
    return {
      title: RESULT_TITLES.success,
      message: MESSAGES.soutienSuccess(ppAdd),
      chance,
      roll,
      isError: false,
    };
  }

  if (roll === ROLL.criticalFailure) {
    const healthLost = rollDie(ordre.ppAdd, random);
    addHealth(state, -healthLost);
    state.politicalPower -= ppAdd;
    return {
      title: RESULT_TITLES.criticalFailure,
      message: MESSAGES.soutienCriticalFailure(healthLost, ppAdd),
      chance,
      roll,
      isError: false,
    };
  }

  return {
    title: RESULT_TITLES.failure,
    message: MESSAGES.soutienFailure,
    chance,
    roll,
    isError: false,
  };
}

/**
 * Consume a luxury meal: pay FK and fatigue, gain a random amount of PdV.
 * @param {import('../core/game.js').Game} game The game.
 * @param {() => number} [random] Randomness source, injectable for tests.
 * @returns {ActionResult} Outcome.
 */
export function consumeMeal(game, random = Math.random) {
  const { state } = game;
  const ordre = ORDRES_BY_ID.get('consommer');

  if (ordre.costPDV > state.health) return error(ERRORS.notEnoughHealth);
  if (ordre.cost > getDisplayMoney(state)) return error(ERRORS.notEnoughMoney);

  // The original applied the fatigue cost as part of the net gain rather than separately.
  const netHealthGain = rollDie(ordre.pdvAdd, random) - ordre.costPDV;
  addHealth(state, netHealthGain);
  spendMoney(state, ordre.cost);

  return {
    title: RESULT_TITLES.success,
    message: MESSAGES.mealSuccess(netHealthGain),
    chance: ordre.chance,
    roll: 0,
    isError: false,
  };
}

/**
 * Increase maximum PdV by one, at an escalating price.
 * @param {import('../core/game.js').Game} game The game.
 * @param {number} startingMaxHealth Max health of a brand-new character.
 * @returns {ActionResult} Outcome.
 */
export function increaseMaxHealth(game, startingMaxHealth) {
  const { state } = game;
  const ordre = ORDRES_BY_ID.get('ajoutPdvMax');
  const cost = getMaxHealthCost(state, ordre, startingMaxHealth);

  if (!isValidCost(cost) || !canAfford(state, cost)) return error(ERRORS.notEnoughMoney);

  spendMoney(state, cost);
  state.maxHealth += ordre.pdvMax;
  state.maxHealthPurchases += 1;

  return {
    title: RESULT_TITLES.success,
    message: MESSAGES.maxHealthSuccess(ordre.pdvMax, cost),
    chance: ordre.chance,
    roll: 0,
    isError: false,
  };
}

/**
 * Runs an ordre by id and broadcasts its result.
 *
 * The data layer names an `action`; this map turns it into a handler. The original stored
 * the *name of a global function* in its data (`fnName: "autoSoutien"`) and interpolated it
 * into an inline `onclick` attribute.
 *
 * @param {import('../core/game.js').Game} game The game.
 * @param {string} ordreId Id of the ordre to run.
 * @param {object} [options] Options.
 * @param {() => number} [options.random] Randomness source, injectable for tests.
 * @param {number} [options.startingMaxHealth] Max health of a brand-new character.
 * @returns {ActionResult|null} The outcome, or `null` if the id is unknown.
 */
export function executeOrdre(game, ordreId, { random = Math.random, startingMaxHealth } = {}) {
  const ordre = ORDRES_BY_ID.get(ordreId);
  if (!ordre) return null;

  /** @type {Record<string, () => ActionResult>} */
  const handlers = {
    [ORDRE_ACTIONS.AUTO_SOUTIEN]: () => autoSoutien(game, random),
    [ORDRE_ACTIONS.CONSUME_MEAL]: () => consumeMeal(game, random),
    [ORDRE_ACTIONS.INCREASE_MAX_HEALTH]: () => increaseMaxHealth(game, startingMaxHealth),
  };

  const handler = handlers[ordre.action];
  if (!handler) return null;

  const result = handler();
  game.events.emit(EVENTS.ACTION_RESOLVED, result);
  return result;
}
