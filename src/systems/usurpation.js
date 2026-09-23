/**
 * @file Usurpation system: stealing political jobs ("Usurper" tab).
 *
 * A successful usurpation sets the player's job, adds PP/second and adds the job's salary
 * to FK/click. Each fonction can only be taken once.
 */

import { PP_PER_SECOND_DIVISOR, ROLL } from '../data/balance.js';
import { FONCTIONS_BY_ID } from '../data/index.js';
import { ERRORS, MESSAGES, RESULT_TITLES } from '../data/strings.js';
import { EVENTS } from '../core/events.js';
import { addClamped, rollDie } from '../core/math.js';
import { getDisplayMoney } from '../core/state.js';
import { spendMoney } from './shop.js';

/**
 * Success chance of usurping a fonction.
 *
 * Port of `poste.chance + PP/10 + luckFactor`. Unlike Auto-Soutien this one is neither
 * rounded nor capped, matching the original.
 *
 * @param {import('../core/state.js').GameState} state Current state.
 * @param {import('../data/fonctions.js').Fonction} fonction The job being usurped.
 * @returns {number} Success chance, in percent.
 */
export function getUsurpationChance(state, fonction) {
  return fonction.chance + state.politicalPower / ROLL.politicalPowerDivisor + state.luckFactor;
}

/**
 * Applies the rewards of a successful usurpation.
 * @param {import('../core/state.js').GameState} state State, mutated in place.
 * @param {import('../data/fonctions.js').Fonction} fonction The job taken.
 * @returns {void}
 */
function applyPromotion(state, fonction) {
  state.fonction = fonction.label;
  state.politicalPowerPerSecond += fonction.ppModifier / PP_PER_SECOND_DIVISOR;
  state.moneyPerClick += fonction.salaire;
  state.usurpedFonctions.push(fonction.id);
}

/**
 * Attempts to usurp a fonction.
 *
 * The cost in FK and PdV is paid whatever the outcome, exactly as in the original.
 *
 * @param {import('../core/game.js').Game} game The game.
 * @param {string} fonctionId Id of the job to usurp.
 * @param {() => number} [random] Randomness source, injectable for tests.
 * @returns {import('./ordres.js').ActionResult|null} Outcome, or `null` for an unknown id.
 */
export function usurp(game, fonctionId, random = Math.random) {
  const { state } = game;
  const fonction = FONCTIONS_BY_ID.get(fonctionId);
  if (!fonction) return null;

  /** @type {import('./ordres.js').ActionResult} */
  let result;

  if (fonction.costPDV > state.health) {
    result = {
      title: RESULT_TITLES.error,
      message: ERRORS.notEnoughHealth,
      chance: 100,
      roll: 0,
      isError: true,
    };
    game.events.emit(EVENTS.ACTION_RESOLVED, result);
    return result;
  }

  if (fonction.cost > getDisplayMoney(state)) {
    result = {
      title: RESULT_TITLES.error,
      message: ERRORS.notEnoughMoney,
      chance: 100,
      roll: 0,
      isError: true,
    };
    game.events.emit(EVENTS.ACTION_RESOLVED, result);
    return result;
  }

  const roll = rollDie(ROLL.diceSides, random);
  const chance = getUsurpationChance(state, fonction);

  spendMoney(state, fonction.cost);
  state.health = addClamped(state.health, -fonction.costPDV, 0, state.maxHealth);

  let taken = false;

  if (roll === ROLL.criticalSuccess) {
    const ppGained = rollDie(fonction.ppModifier * 2, random);
    state.politicalPower += ppGained;
    applyPromotion(state, fonction);
    taken = true;
    result = {
      title: RESULT_TITLES.criticalSuccess,
      message: MESSAGES.usurpationCriticalSuccess(fonction.label, ppGained),
      chance,
      roll,
      isError: false,
    };
  } else if (roll === ROLL.criticalFailure) {
    // The message quotes the losses *before* they are applied, as in the original.
    const healthLost = state.health;
    const moneyLost = getDisplayMoney(state);
    result = {
      title: RESULT_TITLES.criticalFailure,
      message: MESSAGES.usurpationCriticalFailure(fonction.ppModifier, healthLost, moneyLost),
      chance,
      roll,
      isError: false,
    };
    state.health = 0;
    state.money = 0;
  } else if (roll <= chance) {
    applyPromotion(state, fonction);
    taken = true;
    result = {
      title: RESULT_TITLES.success,
      message: MESSAGES.usurpationSuccess(fonction.label),
      chance,
      roll,
      isError: false,
    };
  } else {
    result = {
      title: RESULT_TITLES.failure,
      message: MESSAGES.usurpationFailure,
      chance,
      roll,
      isError: false,
    };
  }

  game.events.emit(EVENTS.ACTION_RESOLVED, result);
  if (taken) game.events.emit(EVENTS.FONCTION_TAKEN, { id: fonction.id });
  return result;
}
