import { describe, expect, it } from 'vitest';
import {
  createInitialState,
  getDisplayMoney,
  getPurchaseCount,
  incrementPurchaseCount,
} from '../src/core/state.js';
import { STARTING_VALUES } from '../src/data/balance.js';
import { STARTING_FONCTION } from '../src/data/strings.js';

describe('createInitialState', () => {
  it('matches the original starting values', () => {
    const state = createInitialState();

    // The original did `addToScore(500)` and `addToPointsPerClick(1)` at boot.
    expect(state.money).toBe(500);
    expect(state.moneyPerClick).toBe(1);
    expect(state.moneyPerSecond).toBe(0);
    expect(state.politicalPower).toBe(0);
    expect(state.politicalPowerPerSecond).toBe(0);
    expect(state.health).toBe(25);
    expect(state.maxHealth).toBe(25);
    expect(state.healthPerSecond).toBe(0.1);
    expect(state.luckFactor).toBe(0);
    expect(state.fonction).toBe('Prolo');
  });

  it('reads its values from the balance data', () => {
    const state = createInitialState();
    expect(state.money).toBe(STARTING_VALUES.money);
    expect(state.health).toBe(STARTING_VALUES.health);
    expect(state.fonction).toBe(STARTING_FONCTION);
  });

  it('starts with nothing bought', () => {
    const state = createInitialState();
    expect(state.mulePurchases).toEqual({});
    expect(state.regenPurchases).toEqual({});
    expect(state.maxHealthPurchases).toBe(0);
    expect(state.ownedPioches).toEqual([]);
    expect(state.usurpedFonctions).toEqual([]);
  });

  it('returns an independent object every time', () => {
    const first = createInitialState();
    const second = createInitialState();
    first.money = 99;
    first.ownedPioches.push('Bois');

    expect(second.money).toBe(500);
    expect(second.ownedPioches).toEqual([]);
  });

  // Save/load is out of scope, but keeping state plain is what makes it a small change.
  it('is a plain serializable object', () => {
    const state = createInitialState();
    expect(() => structuredClone(state)).not.toThrow();
    expect(JSON.parse(JSON.stringify(state))).toEqual(state);

    for (const value of Object.values(state)) {
      expect(typeof value).not.toBe('function');
    }
  });
});

describe('purchase counters', () => {
  it('reports zero for an item never bought', () => {
    expect(getPurchaseCount({}, 'PCCDI')).toBe(0);
  });

  it('increments and reports', () => {
    const counters = {};
    expect(incrementPurchaseCount(counters, 'PCCDI')).toBe(1);
    expect(incrementPurchaseCount(counters, 'PCCDI')).toBe(2);
    expect(getPurchaseCount(counters, 'PCCDI')).toBe(2);
    expect(getPurchaseCount(counters, 'LAN')).toBe(0);
  });
});

describe('getDisplayMoney', () => {
  // Port of the original getScore(), which returned Math.ceil(score).
  it('rounds money up to the next whole FK', () => {
    expect(getDisplayMoney({ money: 500 })).toBe(500);
    expect(getDisplayMoney({ money: 500.01 })).toBe(501);
    expect(getDisplayMoney({ money: 0.1 })).toBe(1);
    expect(getDisplayMoney({ money: 0 })).toBe(0);
  });
});
