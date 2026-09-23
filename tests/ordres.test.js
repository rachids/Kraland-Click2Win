import { describe, expect, it } from 'vitest';
import { createGame } from '../src/core/game.js';
import { EVENTS } from '../src/core/events.js';
import { STARTING_VALUES } from '../src/data/balance.js';
import { ERRORS, RESULT_TITLES } from '../src/data/strings.js';
import {
  autoSoutien,
  consumeMeal,
  executeOrdre,
  getMaxHealthCost,
  getSoutienChance,
  increaseMaxHealth,
} from '../src/systems/ordres.js';
import { ORDRES_BY_ID } from '../src/data/index.js';

/**
 * A deterministic randomness source that replays a fixed list of die results.
 * @param {number[]} rolls Desired `rollDie` outputs, in order.
 * @returns {() => number} A `Math.random` substitute.
 */
function rollsOf(...rolls) {
  let index = 0;
  return () => {
    // rollDie does Math.floor(random() * sides) + 1, so (roll - 1) / sides replays `roll`
    // for any number of sides (a tiny epsilon keeps floating point on the right side).
    const roll = rolls[Math.min(index, rolls.length - 1)];
    index += 1;
    return (roll - 1) / 100 + 1e-9;
  };
}

/**
 * Replays an exact die result for a die of a given size.
 * @param {number} roll Desired result.
 * @param {number} sides Die size.
 * @returns {number} A value in [0, 1).
 */
function randomFor(roll, sides) {
  return (roll - 1) / sides + 1e-9;
}

describe('getSoutienChance', () => {
  const ordre = ORDRES_BY_ID.get('soutien');

  it('is the base chance for a fresh character', () => {
    const state = createGame().state;
    expect(getSoutienChance(state, ordre)).toBe(6);
  });

  it('adds a tenth of political power and the luck factor', () => {
    const state = createGame().state;
    state.politicalPower = 100;
    state.luckFactor = 2.5;
    expect(getSoutienChance(state, ordre)).toBe(6 + 10 + 2.5);
  });

  it('rounds to one decimal, as the original did', () => {
    const state = createGame().state;
    state.politicalPower = 1.234;
    expect(getSoutienChance(state, ordre)).toBe(6.1);
  });

  it('is capped at 95%', () => {
    const state = createGame().state;
    state.politicalPower = 100000;
    expect(getSoutienChance(state, ordre)).toBe(95);
  });
});

describe('autoSoutien', () => {
  it('refuses when health is too low, without spending anything', () => {
    const game = createGame();
    game.state.health = 1;

    const result = autoSoutien(game, rollsOf(50));
    expect(result.isError).toBe(true);
    expect(result.title).toBe(RESULT_TITLES.error);
    expect(result.message).toBe(ERRORS.notEnoughHealth);
    expect(game.state.health).toBe(1);
  });

  it('always pays the fatigue cost', () => {
    const game = createGame();
    autoSoutien(game, rollsOf(50, 2));
    expect(game.state.health).toBe(20); // 25 - 5
  });

  it('grants political power on a success', () => {
    const game = createGame();
    game.state.politicalPower = 500; // chance = 56

    // First roll is the d100 (a hit), second is the d4 PP gain.
    let call = 0;
    const random = () => {
      call += 1;
      return call === 1 ? randomFor(10, 100) : randomFor(3, 4);
    };

    const result = autoSoutien(game, random);
    expect(result.title).toBe(RESULT_TITLES.success);
    expect(game.state.politicalPower).toBe(503);
  });

  it('doubles the roll on a critical success', () => {
    const game = createGame();
    let call = 0;
    const random = () => {
      call += 1;
      if (call === 1) return randomFor(1, 100); // critical
      return randomFor(4, 4); // both d4 rolls give 4
    };

    const result = autoSoutien(game, random);
    expect(result.title).toBe(RESULT_TITLES.criticalSuccess);
    expect(game.state.politicalPower).toBe(8);
    expect(result.message).toContain('8');
  });

  it('reports a plain failure without changing political power', () => {
    const game = createGame();
    const result = autoSoutien(game, rollsOf(50, 2));

    expect(result.title).toBe(RESULT_TITLES.failure);
    expect(game.state.politicalPower).toBe(0);
  });

  // Bug fix: the original had no lower bound on health.
  it('never lets health go negative on a critical failure', () => {
    const game = createGame();
    game.state.health = 5; // exactly the fatigue cost

    let call = 0;
    const random = () => {
      call += 1;
      if (call === 1) return randomFor(100, 100); // critical failure
      return randomFor(4, 4);
    };

    autoSoutien(game, random);
    expect(game.state.health).toBe(0);
    expect(game.state.health).toBeGreaterThanOrEqual(0);
  });
});

describe('consumeMeal', () => {
  it('refuses when money is too low', () => {
    const game = createGame();
    game.state.money = 10;

    const result = consumeMeal(game, rollsOf(3));
    expect(result.isError).toBe(true);
    expect(result.message).toBe(ERRORS.notEnoughMoney);
    expect(game.state.money).toBe(10);
  });

  it('pays 50 FK and grants the rolled health minus fatigue', () => {
    const game = createGame();
    game.state.health = 10;

    const result = consumeMeal(game, () => randomFor(4, 5)); // d5 -> 4
    expect(game.state.money).toBe(450);
    expect(game.state.health).toBe(13.5); // 10 + (4 - 0.5)
    expect(result.title).toBe(RESULT_TITLES.success);
    expect(result.message).toContain('3.5');
  });

  it('never pushes health above the maximum', () => {
    const game = createGame();
    game.state.health = 24;

    consumeMeal(game, () => randomFor(5, 5));
    expect(game.state.health).toBe(25);
  });
});

describe('getMaxHealthCost', () => {
  const ordre = ORDRES_BY_ID.get('ajoutPdvMax');
  const start = STARTING_VALUES.maxHealth;

  // Sequence captured from the original DOM-driven implementation.
  it('reproduces the original price sequence', () => {
    const state = createGame().state;

    const expected = [305, 660, 1406, 2582, 4228, 6388];
    for (const [purchases, price] of expected.entries()) {
      state.maxHealthPurchases = purchases;
      expect(getMaxHealthCost(state, ordre, start)).toBe(price);
    }
  });
});

describe('increaseMaxHealth', () => {
  it('raises the maximum and charges the data-derived price', () => {
    const game = createGame();
    game.state.money = 1000;

    const result = increaseMaxHealth(game, STARTING_VALUES.maxHealth);
    expect(result.title).toBe(RESULT_TITLES.success);
    expect(game.state.maxHealth).toBe(26);
    expect(game.state.money).toBe(695); // 1000 - 305
    expect(game.state.maxHealthPurchases).toBe(1);
  });

  it('charges the escalated price on the second purchase', () => {
    const game = createGame();
    game.state.money = 5000;

    increaseMaxHealth(game, STARTING_VALUES.maxHealth);
    increaseMaxHealth(game, STARTING_VALUES.maxHealth);

    expect(game.state.maxHealth).toBe(27);
    expect(game.state.money).toBe(5000 - 305 - 660);
  });

  it('refuses when the player cannot pay', () => {
    const game = createGame();
    game.state.money = 100;

    const result = increaseMaxHealth(game, STARTING_VALUES.maxHealth);
    expect(result.isError).toBe(true);
    expect(game.state.maxHealth).toBe(25);
    expect(game.state.money).toBe(100);
  });
});

describe('executeOrdre', () => {
  it('routes an id to its handler and broadcasts the result', () => {
    const game = createGame();
    const resolved = [];
    game.events.on(EVENTS.ACTION_RESOLVED, (payload) => resolved.push(payload));

    const result = executeOrdre(game, 'ajoutPdvMax', {
      startingMaxHealth: STARTING_VALUES.maxHealth,
    });

    expect(result.title).toBe(RESULT_TITLES.success);
    expect(game.state.maxHealth).toBe(26);
    expect(resolved).toHaveLength(1);
  });

  it('returns null for an unknown ordre', () => {
    const game = createGame();
    expect(executeOrdre(game, 'nope', {})).toBeNull();
  });
});
