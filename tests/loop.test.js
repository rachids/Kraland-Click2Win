import { describe, expect, it, vi } from 'vitest';
import { createLoop } from '../src/core/loop.js';
import { createGame } from '../src/core/game.js';
import { createEconomySystem } from '../src/systems/economy.js';

/**
 * Builds a loop driven by a manual clock and a manual scheduler, so ticks can be triggered
 * deterministically without real timers.
 * @param {object} options Loop options, minus the injected clock/scheduler.
 * @returns {{loop: import('../src/core/loop.js').LoopHandle, advance: (ms: number) => void,
 *   fire: () => void, setNow: (ms: number) => void}} Test controls.
 */
function harness(options) {
  let currentMs = 0;
  let scheduled = null;

  const loop = createLoop({
    ...options,
    now: () => currentMs,
    schedule: (callback) => {
      scheduled = callback;
      return 'timer';
    },
    cancel: () => {
      scheduled = null;
    },
  });

  return {
    loop,
    setNow: (ms) => {
      currentMs = ms;
    },
    /** Moves the clock forward and fires one scheduled callback. */
    advance: (ms) => {
      currentMs += ms;
      scheduled?.();
    },
    fire: () => scheduled?.(),
  };
}

describe('createLoop', () => {
  it('passes the real elapsed time to the tick callback', () => {
    const onTick = vi.fn();
    const { loop, advance } = harness({ onTick });

    loop.start();
    advance(1000);
    expect(onTick).toHaveBeenCalledWith(1);

    advance(500);
    expect(onTick).toHaveBeenLastCalledWith(0.5);
  });

  // The reason this loop exists: a throttled background tab fires far fewer callbacks,
  // but each one covers more real time, so production stays correct.
  it('produces the same total whether ticks are frequent or throttled', () => {
    const fast = createGame();
    fast.registerSystem(createEconomySystem());
    fast.state.moneyPerSecond = 60;
    const fastHarness = harness({ onTick: (dt) => fast.tick(dt) });
    fastHarness.loop.start();
    for (let index = 0; index < 300; index += 1) fastHarness.advance(1000 / 30); // 10 s at 30 fps

    const throttled = createGame();
    throttled.registerSystem(createEconomySystem());
    throttled.state.moneyPerSecond = 60;
    const slowHarness = harness({ onTick: (dt) => throttled.tick(dt) });
    slowHarness.loop.start();
    for (let index = 0; index < 10; index += 1) slowHarness.advance(1000); // 10 s at 1 fps

    expect(throttled.state.money).toBeCloseTo(fast.state.money, 6);
    expect(throttled.state.money).toBeCloseTo(500 + 600, 6);
  });

  // No offline progress: a long gap must not pay out in full.
  it('caps a single delta so a suspended tab grants no windfall', () => {
    const onTick = vi.fn();
    const { loop, advance } = harness({ onTick, maxDeltaSeconds: 60 });

    loop.start();
    advance(3_600_000); // one hour
    expect(onTick).toHaveBeenCalledWith(60);
  });

  it('ignores a zero or backwards delta', () => {
    const onTick = vi.fn();
    const { loop, fire, setNow } = harness({ onTick });

    loop.start();
    fire(); // same timestamp -> delta 0
    expect(onTick).not.toHaveBeenCalled();

    setNow(-1000); // clock adjusted backwards
    fire();
    expect(onTick).not.toHaveBeenCalled();
  });

  it('throttles rendering independently of simulation', () => {
    const onTick = vi.fn();
    const onRender = vi.fn();
    const { loop, advance } = harness({ onTick, onRender, renderIntervalMs: 100 });

    loop.start();
    for (let index = 0; index < 3; index += 1) advance(1000 / 30); // ~33 ms each

    expect(onTick).toHaveBeenCalledTimes(3);
    expect(onRender).toHaveBeenCalledTimes(1); // only after ~100 ms
  });

  it('starts and stops idempotently', () => {
    const onTick = vi.fn();
    const { loop, advance } = harness({ onTick });

    expect(loop.isRunning()).toBe(false);
    loop.start();
    loop.start();
    expect(loop.isRunning()).toBe(true);

    loop.stop();
    expect(loop.isRunning()).toBe(false);
    loop.stop();

    advance(1000);
    expect(onTick).not.toHaveBeenCalled();
  });
});

describe('game system registry', () => {
  it('ticks every registered system in order', () => {
    const game = createGame();
    const calls = [];
    game.registerSystem({ id: 'a', tick: (_g, dt) => calls.push(['a', dt]) });
    game.registerSystem({ id: 'b', tick: (_g, dt) => calls.push(['b', dt]) });

    game.tick(0.5);
    expect(calls).toEqual([
      ['a', 0.5],
      ['b', 0.5],
    ]);
  });

  it('runs init once at registration', () => {
    const game = createGame();
    const init = vi.fn();
    game.registerSystem({ id: 'a', init });
    expect(init).toHaveBeenCalledTimes(1);
    expect(init).toHaveBeenCalledWith(game);
  });

  it('tolerates systems without a tick', () => {
    const game = createGame();
    game.registerSystem({ id: 'passive' });
    expect(() => game.tick(1)).not.toThrow();
  });

  it('rejects an anonymous or duplicate system', () => {
    const game = createGame();
    expect(() => game.registerSystem({})).toThrow(/must have an id/);
    game.registerSystem({ id: 'a' });
    expect(() => game.registerSystem({ id: 'a' })).toThrow(/already registered/);
  });

  it('looks systems up by id', () => {
    const game = createGame();
    const system = { id: 'economy' };
    game.registerSystem(system);
    expect(game.getSystem('economy')).toBe(system);
    expect(game.getSystem('nope')).toBeUndefined();
  });
});
