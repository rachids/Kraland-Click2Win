import { describe, expect, it } from 'vitest';
import { createGame } from '../src/core/game.js';
import { EVENTS } from '../src/core/events.js';
import {
  PURCHASE_REFUSAL,
  buyMule,
  buyPioche,
  buyRegen,
  canAfford,
  escalateCost,
  getMuleCost,
  getPiocheCost,
  getRegenCost,
  spendMoney,
} from '../src/systems/shop.js';
import { MULES_BY_ID, PIOCHES_BY_ID, REGEN_BY_ID } from '../src/data/index.js';

/**
 * Builds a game with a generous bankroll so purchases are not refused for the wrong reason.
 * @param {number} money Starting FK.
 * @returns {import('../src/core/game.js').Game} A game instance.
 */
function gameWithMoney(money) {
  const game = createGame();
  game.state.money = money;
  return game;
}

describe('escalateCost', () => {
  it('returns the base cost before any purchase', () => {
    expect(escalateCost(100, 0.15, 0)).toBe(100);
  });

  // Original: cout += Math.floor(cout * 0.15), applied once per purchase.
  it('reproduces the floor-truncated mule curve', () => {
    expect(escalateCost(100, 0.15, 1)).toBe(115);
    expect(escalateCost(100, 0.15, 2)).toBe(132);
    expect(escalateCost(100, 0.15, 3)).toBe(151);
    expect(escalateCost(100, 0.15, 4)).toBe(173);
  });

  it('truncates at every step rather than at the end', () => {
    // A closed-form 100 * 1.15**3 would be 152.08 -> the iterative floor gives 151.
    expect(escalateCost(100, 0.15, 3)).toBe(151);
    expect(escalateCost(100, 0.15, 3)).not.toBe(Math.floor(100 * 1.15 ** 3));
  });
});

describe('cost functions read from data and state, never from the DOM', () => {
  it('derives the mule price from the purchase counter', () => {
    const state = createGame().state;
    expect(getMuleCost(state, 'PCCDI')).toBe(100);

    state.mulePurchases.PCCDI = 1;
    expect(getMuleCost(state, 'PCCDI')).toBe(115);

    state.mulePurchases.PCCDI = 2;
    expect(getMuleCost(state, 'PCCDI')).toBe(132);
  });

  it('derives the régen price with its own 40% curve', () => {
    const state = createGame().state;
    expect(getRegenCost(state, 'Dodo')).toBe(100);

    state.regenPurchases.Dodo = 1;
    expect(getRegenCost(state, 'Dodo')).toBe(140);

    state.regenPurchases.Dodo = 2;
    expect(getRegenCost(state, 'Dodo')).toBe(196);
  });

  it('keeps pioche prices flat, because they are one-shot', () => {
    const state = createGame().state;
    expect(getPiocheCost(state, 'Bois')).toBe(200);
    state.ownedPioches.push('Bois');
    expect(getPiocheCost(state, 'Bois')).toBe(200);
  });

  it('starts every item at the price declared in its data module', () => {
    const state = createGame().state;
    for (const [id, mule] of MULES_BY_ID) expect(getMuleCost(state, id)).toBe(mule.baseCost);
    for (const [id, item] of REGEN_BY_ID) expect(getRegenCost(state, id)).toBe(item.baseCost);
    for (const [id, pioche] of PIOCHES_BY_ID) {
      expect(getPiocheCost(state, id)).toBe(pioche.baseCost);
    }
  });

  it('returns NaN for an unknown id instead of guessing', () => {
    const state = createGame().state;
    expect(getMuleCost(state, 'nope')).toBeNaN();
    expect(getRegenCost(state, 'nope')).toBeNaN();
    expect(getPiocheCost(state, 'nope')).toBeNaN();
  });

  // The whole point of issue #5: no logic module may touch the DOM.
  it('computes prices with no DOM available at all', () => {
    expect(typeof globalThis.document).toBe('undefined');
    const state = createGame().state;
    expect(getMuleCost(state, 'PCCDI')).toBe(100);
  });
});

describe('canAfford / spendMoney', () => {
  it('compares against the displayed (ceiled) money, like the original', () => {
    const state = createGame().state;
    state.money = 99.2; // displays as 100
    expect(canAfford(state, 100)).toBe(true);
  });

  it('refuses an invalid cost', () => {
    const state = createGame().state;
    expect(canAfford(state, Number.NaN)).toBe(false);
    expect(canAfford(state, -5)).toBe(false);
  });

  it('never lets money go negative', () => {
    const state = createGame().state;
    state.money = 99.2;
    spendMoney(state, 100);
    expect(state.money).toBe(0);
  });
});

describe('buyMule', () => {
  it('pays the data-derived price and grants production', () => {
    const game = gameWithMoney(1000);
    const result = buyMule(game, 'PCCDI');

    expect(result).toEqual({ success: true, cost: 100 });
    expect(game.state.money).toBe(900);
    expect(game.state.moneyPerSecond).toBe(1);
    expect(game.state.mulePurchases.PCCDI).toBe(1);
  });

  // Original: game.addToPointsPerClick(mule.perSecondModifier / 10)
  it('adds 10% of the mule production to the click value', () => {
    const game = gameWithMoney(100000);
    buyMule(game, 'LAN'); // perSecondModifier: 100
    expect(game.state.moneyPerSecond).toBe(100);
    expect(game.state.moneyPerClick).toBe(1 + 10);
  });

  it('escalates the price by 15% for each subsequent purchase', () => {
    const game = gameWithMoney(10000);

    buyMule(game, 'PCCDI');
    expect(getMuleCost(game.state, 'PCCDI')).toBe(115);

    buyMule(game, 'PCCDI');
    expect(getMuleCost(game.state, 'PCCDI')).toBe(132);

    expect(game.state.money).toBe(10000 - 100 - 115);
    expect(game.state.moneyPerSecond).toBe(2);
  });

  it('refuses when the player cannot pay, and changes nothing', () => {
    const game = gameWithMoney(99);
    const result = buyMule(game, 'PCCDI');

    expect(result.success).toBe(false);
    expect(result.reason).toBe(PURCHASE_REFUSAL.NOT_ENOUGH_MONEY);
    expect(game.state.money).toBe(99);
    expect(game.state.moneyPerSecond).toBe(0);
    expect(game.state.mulePurchases.PCCDI).toBeUndefined();
  });

  it('refuses an unknown mule', () => {
    const game = gameWithMoney(10000);
    expect(buyMule(game, 'nope')).toEqual({
      success: false,
      reason: PURCHASE_REFUSAL.UNKNOWN_ITEM,
    });
  });

  it('announces success on the event bus', () => {
    const game = gameWithMoney(1000);
    const events = [];
    game.events.on(EVENTS.PURCHASE_SUCCEEDED, (payload) => events.push(payload));

    buyMule(game, 'PCCDI');
    expect(events).toEqual([{ kind: 'mule', id: 'PCCDI', cost: 100 }]);
  });
});

describe('buyPioche', () => {
  it('pays and grants FK per click', () => {
    const game = gameWithMoney(1000);
    const result = buyPioche(game, 'Bois');

    expect(result).toEqual({ success: true, cost: 200 });
    expect(game.state.money).toBe(800);
    expect(game.state.moneyPerClick).toBe(1 + 2);
    expect(game.state.ownedPioches).toEqual(['Bois']);
  });

  it('cannot be bought twice', () => {
    const game = gameWithMoney(10000);
    buyPioche(game, 'Bois');
    const second = buyPioche(game, 'Bois');

    expect(second.success).toBe(false);
    expect(second.reason).toBe(PURCHASE_REFUSAL.ALREADY_OWNED);
    expect(game.state.moneyPerClick).toBe(3);
    expect(game.state.ownedPioches).toEqual(['Bois']);
  });

  it('asks the UI to remove the card', () => {
    const game = gameWithMoney(1000);
    const removed = [];
    game.events.on(EVENTS.PIOCHE_REMOVED, (payload) => removed.push(payload));

    buyPioche(game, 'Bois');
    expect(removed).toEqual([{ id: 'Bois' }]);
  });

  it('refuses when too expensive', () => {
    const game = gameWithMoney(10);
    expect(buyPioche(game, 'Titane').reason).toBe(PURCHASE_REFUSAL.NOT_ENOUGH_MONEY);
    expect(game.state.ownedPioches).toEqual([]);
  });
});

describe('buyRegen', () => {
  it('pays and grants health regeneration', () => {
    const game = gameWithMoney(1000);
    const result = buyRegen(game, 'Dodo');

    expect(result).toEqual({ success: true, cost: 100 });
    expect(game.state.money).toBe(900);
    expect(game.state.healthPerSecond).toBeCloseTo(0.11, 10);
    expect(game.state.regenPurchases.Dodo).toBe(1);
  });

  it('escalates the price by 40% for each subsequent purchase', () => {
    const game = gameWithMoney(10000);

    buyRegen(game, 'Dodo');
    expect(getRegenCost(game.state, 'Dodo')).toBe(140);

    buyRegen(game, 'Dodo');
    expect(getRegenCost(game.state, 'Dodo')).toBe(196);

    expect(game.state.money).toBe(10000 - 100 - 140);
  });

  it('refuses when too expensive', () => {
    const game = gameWithMoney(50);
    expect(buyRegen(game, 'Dodo').reason).toBe(PURCHASE_REFUSAL.NOT_ENOUGH_MONEY);
    expect(game.state.healthPerSecond).toBe(0.1);
  });
});
