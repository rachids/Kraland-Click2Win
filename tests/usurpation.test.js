import { describe, expect, it } from 'vitest';
import { createGame } from '../src/core/game.js';
import { EVENTS } from '../src/core/events.js';
import { FONCTIONS_BY_ID } from '../src/data/index.js';
import { ERRORS, RESULT_TITLES } from '../src/data/strings.js';
import { getUsurpationChance, usurp } from '../src/systems/usurpation.js';

/**
 * Replays an exact die result.
 * @param {number} roll Desired result.
 * @param {number} [sides] Die size.
 * @returns {() => number} A `Math.random` substitute.
 */
function fixedRoll(roll, sides = 100) {
  return () => (roll - 1) / sides + 1e-9;
}

/**
 * Builds a game rich and healthy enough to attempt any usurpation.
 * @returns {import('../src/core/game.js').Game} A game instance.
 */
function readyGame() {
  const game = createGame();
  game.state.money = 100000;
  game.state.maxHealth = 200;
  game.state.health = 200;
  return game;
}

describe('getUsurpationChance', () => {
  it('is the base chance for a fresh character', () => {
    const state = createGame().state;
    expect(getUsurpationChance(state, FONCTIONS_BY_ID.get('citoyen'))).toBe(70);
  });

  it('adds a tenth of political power and the luck factor', () => {
    const state = createGame().state;
    state.politicalPower = 50;
    state.luckFactor = 1;
    expect(getUsurpationChance(state, FONCTIONS_BY_ID.get('juge'))).toBe(65 + 5 + 1);
  });

  // Unlike Auto-Soutien, the original neither rounded nor capped this one.
  it('is neither rounded nor capped', () => {
    const state = createGame().state;
    state.politicalPower = 10000;
    expect(getUsurpationChance(state, FONCTIONS_BY_ID.get('prelu'))).toBe(1001);
  });
});

describe('usurp', () => {
  it('refuses when health is too low, spending nothing', () => {
    const game = createGame();
    game.state.health = 1;

    const result = usurp(game, 'citoyen', fixedRoll(50));
    expect(result.isError).toBe(true);
    expect(result.message).toBe(ERRORS.notEnoughHealth);
    expect(game.state.money).toBe(500);
    expect(game.state.health).toBe(1);
  });

  it('refuses when money is too low', () => {
    const game = createGame();
    game.state.money = 1;

    const result = usurp(game, 'citoyen', fixedRoll(50));
    expect(result.isError).toBe(true);
    expect(result.message).toBe(ERRORS.notEnoughMoney);
  });

  it('promotes the player on a success', () => {
    const game = readyGame();
    const result = usurp(game, 'citoyen', fixedRoll(50)); // chance 70, roll 50

    expect(result.title).toBe(RESULT_TITLES.success);
    expect(game.state.fonction).toBe('Citoyen');
    expect(game.state.moneyPerClick).toBe(1 + 5); // salaire
    expect(game.state.politicalPowerPerSecond).toBe(0.02); // ppModifier 2 / 100
    expect(game.state.usurpedFonctions).toEqual(['citoyen']);
    expect(game.state.money).toBe(100000 - 5);
    expect(game.state.health).toBe(195);
  });

  it('pays cost and fatigue even on a failure', () => {
    const game = readyGame();
    const result = usurp(game, 'citoyen', fixedRoll(90)); // chance 70, roll 90

    expect(result.title).toBe(RESULT_TITLES.failure);
    expect(game.state.fonction).toBe('Prolo');
    expect(game.state.money).toBe(100000 - 5);
    expect(game.state.health).toBe(195);
    expect(game.state.usurpedFonctions).toEqual([]);
  });

  it('grants bonus political power on a critical success', () => {
    const game = readyGame();
    let call = 0;
    const random = () => {
      call += 1;
      if (call === 1) return (1 - 1) / 100 + 1e-9; // d100 -> 1
      return (4 - 1) / 4 + 1e-9; // d4 (ppModifier 2 × 2) -> 4
    };

    const result = usurp(game, 'citoyen', random);
    expect(result.title).toBe(RESULT_TITLES.criticalSuccess);
    expect(game.state.politicalPower).toBe(4);
    expect(game.state.fonction).toBe('Citoyen');
  });

  it('wipes money and health on a critical failure', () => {
    const game = readyGame();
    const result = usurp(game, 'citoyen', fixedRoll(100));

    expect(result.title).toBe(RESULT_TITLES.criticalFailure);
    expect(game.state.money).toBe(0);
    expect(game.state.health).toBe(0);
    expect(game.state.fonction).toBe('Prolo');
  });

  // Bug fix: the original left money at a small negative float after the wipe.
  it('never leaves money or health negative', () => {
    const game = readyGame();
    game.state.money = 5.4;
    usurp(game, 'citoyen', fixedRoll(100));

    expect(game.state.money).toBeGreaterThanOrEqual(0);
    expect(game.state.health).toBeGreaterThanOrEqual(0);
    expect(Object.is(game.state.money, -0)).toBe(false);
  });

  it('announces a taken fonction so the UI can remove its card', () => {
    const game = readyGame();
    const taken = [];
    game.events.on(EVENTS.FONCTION_TAKEN, (payload) => taken.push(payload));

    usurp(game, 'citoyen', fixedRoll(50));
    expect(taken).toEqual([{ id: 'citoyen' }]);
  });

  it('does not announce a fonction on a failure', () => {
    const game = readyGame();
    const taken = [];
    game.events.on(EVENTS.FONCTION_TAKEN, (payload) => taken.push(payload));

    usurp(game, 'citoyen', fixedRoll(99));
    expect(taken).toEqual([]);
  });

  it('returns null for an unknown fonction', () => {
    expect(usurp(readyGame(), 'nope', fixedRoll(50))).toBeNull();
  });

  it('applies the salary of the highest office', () => {
    const game = readyGame();
    usurp(game, 'prelu', fixedRoll(1)); // critical success on a 1% chance

    expect(game.state.moneyPerClick).toBe(1 + 99999999);
    expect(game.state.fonction).toBe('PREMIER ELU §§');
  });
});
