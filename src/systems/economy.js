/**
 * @file Economy system: click income, passive production, regeneration.
 *
 * Registered with the game so `core/loop.js` drives it; it has no idea the DOM exists.
 */

import { EVENTS } from '../core/events.js';
import { addClamped } from '../core/math.js';

/** Identifier of this system in the game's registry. */
export const ECONOMY_SYSTEM_ID = 'economy';

/**
 * Advances production and regeneration by a real-time delta.
 *
 * All three resources scale with `deltaSeconds` rather than a fixed tick count, which is
 * what keeps income correct in a throttled background tab.
 *
 * Health is clamped to `[0, maxHealth]`: the original added the full increment whenever
 * `health < maxHealth` and only corrected the overshoot on the *following* tick, so
 * `PdV > PdV Max` was briefly visible on screen.
 *
 * @param {import('../core/state.js').GameState} state State, mutated in place.
 * @param {number} deltaSeconds Real seconds elapsed since the previous tick.
 * @returns {void}
 */
export function advanceProduction(state, deltaSeconds) {
  state.money += state.moneyPerSecond * deltaSeconds;
  state.politicalPower += state.politicalPowerPerSecond * deltaSeconds;
  state.health = addClamped(state.health, state.healthPerSecond * deltaSeconds, 0, state.maxHealth);
}

/**
 * Applies one click on the mine.
 * @param {import('../core/state.js').GameState} state State, mutated in place.
 * @returns {number} FK earned by this click.
 */
export function applyClick(state) {
  state.money += state.moneyPerClick;
  return state.moneyPerClick;
}

/**
 * Builds the economy system.
 * @returns {import('../core/game.js').System} The system.
 */
export function createEconomySystem() {
  return {
    id: ECONOMY_SYSTEM_ID,
    tick(game, deltaSeconds) {
      advanceProduction(game.state, deltaSeconds);
    },
  };
}

/**
 * Handles a click on the mine and announces it, so the UI can play its animation.
 * @param {import('../core/game.js').Game} game The game.
 * @param {unknown} [sourceEvent] The originating DOM event, forwarded to the UI untouched.
 * @returns {number} FK earned by this click.
 */
export function clickMine(game, sourceEvent) {
  const amount = applyClick(game.state);
  game.events.emit(EVENTS.MINE_CLICKED, { amount, event: sourceEvent });
  return amount;
}
