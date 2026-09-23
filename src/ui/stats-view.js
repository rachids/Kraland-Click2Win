/**
 * @file Renders the numeric readouts in the left and right panels.
 *
 * Everything here is display-only: it reads state and writes text, never the other way
 * round. `setText` skips unchanged values so the ten-times-a-second refresh is cheap.
 */

import { DISPLAY_DECIMALS } from '../data/balance.js';
import { prettify } from '../core/format.js';
import { roundToDecimals } from '../core/math.js';
import { getDisplayMoney } from '../core/state.js';
import { setText } from './dom.js';

/**
 * Builds the stats renderer.
 *
 * Element lookups happen once at construction rather than on every frame.
 *
 * @returns {{render: (state: import('../core/state.js').GameState) => void}} The renderer.
 */
export function createStatsView() {
  const elements = {
    money: document.getElementById('money_value'),
    perSecond: document.getElementById('perSecond'),
    perClick: document.getElementById('perClick'),
    politicalPower: document.getElementById('pp_value'),
    ppPerSecond: document.getElementById('ppPerSecond_value'),
    health: document.getElementById('pdv_value'),
    maxHealth: document.getElementById('pdvmax_value'),
    healthPerSecond: document.getElementById('pdvpersecond'),
    fonction: document.getElementById('fonction_value'),
    luckFactor: document.getElementById('facteurChance'),
  };

  return {
    /**
     * Writes the current state into the page.
     * @param {import('../core/state.js').GameState} state Current state.
     * @returns {void}
     */
    render(state) {
      const { rate, health } = DISPLAY_DECIMALS;

      setText(elements.money, prettify(getDisplayMoney(state)));
      setText(elements.perSecond, prettify(roundToDecimals(state.moneyPerSecond, rate)));
      setText(elements.perClick, prettify(roundToDecimals(state.moneyPerClick, rate)));
      setText(elements.politicalPower, prettify(roundToDecimals(state.politicalPower, rate)));
      setText(elements.ppPerSecond, prettify(state.politicalPowerPerSecond));
      setText(elements.health, prettify(roundToDecimals(state.health, health)));
      setText(elements.maxHealth, prettify(roundToDecimals(state.maxHealth, health)));
      setText(elements.healthPerSecond, prettify(roundToDecimals(state.healthPerSecond, health)));
      setText(elements.fonction, state.fonction);
      setText(elements.luckFactor, String(state.luckFactor));
    },
  };
}
