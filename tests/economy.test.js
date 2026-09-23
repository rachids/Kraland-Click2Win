import { describe, expect, it } from 'vitest';
import { createGame } from '../src/core/game.js';
import { EVENTS } from '../src/core/events.js';
import {
  advanceProduction,
  applyClick,
  clickMine,
  createEconomySystem,
} from '../src/systems/economy.js';

describe('applyClick', () => {
  it('adds the click value to money', () => {
    const state = createGame().state;
    expect(applyClick(state)).toBe(1);
    expect(state.money).toBe(501);
  });

  it('scales with upgrades', () => {
    const state = createGame().state;
    state.moneyPerClick = 42.5;
    expect(applyClick(state)).toBe(42.5);
    expect(state.money).toBe(542.5);
  });
});

describe('advanceProduction', () => {
  it('produces money proportionally to real elapsed time', () => {
    const state = createGame().state;
    state.moneyPerSecond = 10;

    advanceProduction(state, 1);
    expect(state.money).toBe(510);

    advanceProduction(state, 0.5);
    expect(state.money).toBe(515);
  });

  it('produces political power proportionally to real elapsed time', () => {
    const state = createGame().state;
    state.politicalPowerPerSecond = 0.3;

    advanceProduction(state, 2);
    expect(state.politicalPower).toBeCloseTo(0.6, 10);
  });

  it('regenerates health proportionally to real elapsed time', () => {
    const state = createGame().state;
    state.health = 10;

    advanceProduction(state, 5); // 0.1 PdV/s × 5 s
    expect(state.health).toBeCloseTo(10.5, 10);
  });

  // Bug fix: the original added the full increment whenever health < maxHealth, so it
  // overshot and was only corrected on the following tick.
  it('never lets health exceed the maximum', () => {
    const state = createGame().state;
    state.health = 24.99;
    state.healthPerSecond = 1;

    advanceProduction(state, 10);
    expect(state.health).toBe(25);
    expect(state.health).toBeLessThanOrEqual(state.maxHealth);
  });

  it('never overshoots even with a single huge delta', () => {
    const state = createGame().state;
    state.health = 1;
    state.healthPerSecond = 1000;

    advanceProduction(state, 60);
    expect(state.health).toBe(state.maxHealth);
  });

  it('keeps health at the maximum once full', () => {
    const state = createGame().state;
    expect(state.health).toBe(25);

    for (let index = 0; index < 100; index += 1) advanceProduction(state, 1);
    expect(state.health).toBe(25);
  });

  it('raises the ceiling when maximum health grows', () => {
    const state = createGame().state;
    state.maxHealth = 30;
    state.health = 29.5;
    state.healthPerSecond = 10;

    advanceProduction(state, 1);
    expect(state.health).toBe(30);
  });

  // The equivalence that justifies swapping the fixed-tick loop for a delta-time one.
  it('produces the same total as the original 30 fixed ticks per second', () => {
    const fixedTick = createGame().state;
    fixedTick.moneyPerSecond = 7;
    for (let index = 0; index < 30; index += 1) advanceProduction(fixedTick, 1 / 30);

    const deltaTime = createGame().state;
    deltaTime.moneyPerSecond = 7;
    advanceProduction(deltaTime, 1);

    expect(fixedTick.money).toBeCloseTo(deltaTime.money, 10);
  });
});

describe('economy system', () => {
  it('ticks production through the game registry', () => {
    const game = createGame();
    game.registerSystem(createEconomySystem());
    game.state.moneyPerSecond = 100;

    game.tick(2);
    expect(game.state.money).toBe(700);
  });

  it('announces clicks so the UI can animate them', () => {
    const game = createGame();
    const clicks = [];
    game.events.on(EVENTS.MINE_CLICKED, (payload) => clicks.push(payload));

    const earned = clickMine(game, { clientX: 5, clientY: 9 });

    expect(earned).toBe(1);
    expect(game.state.money).toBe(501);
    expect(clicks).toHaveLength(1);
    expect(clicks[0].amount).toBe(1);
    expect(clicks[0].event).toEqual({ clientX: 5, clientY: 9 });
  });
});
