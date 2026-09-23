/**
 * @file Delta-time game loop.
 *
 * ## Why not `setInterval` + a fixed tick count?
 *
 * The original ran `setInterval(tick, 1000 / 30)` and produced `perSecond / 30` per tick,
 * which assumes 30 ticks really happen every second. Browsers throttle timers in
 * background tabs to roughly one callback per second (and much less for long-hidden tabs),
 * so a backgrounded game produced about **1/30th** of its nominal income.
 *
 * This loop measures the real elapsed time between callbacks and produces
 * `perSecond × elapsedSeconds`, so income is correct however aggressively the browser
 * throttles. While the tab is focused the behaviour is identical to before.
 *
 * ## No offline progress
 *
 * Nothing is simulated while the page is closed. The per-tick delta is capped at
 * `LOOP.maxDeltaSeconds` so a suspended laptop or a very long throttle cannot hand the
 * player a lump sum on return.
 */

import { LOOP } from '../data/balance.js';

/**
 * @typedef {object} LoopHandle
 * @property {() => void} start Starts the loop. No-op if already running.
 * @property {() => void} stop Stops the loop.
 * @property {() => boolean} isRunning Whether the loop is currently scheduled.
 */

/**
 * Creates a delta-time loop.
 *
 * @param {object} options Options.
 * @param {(deltaSeconds: number) => void} options.onTick Simulation step. Receives the real
 *   elapsed time, in seconds, since the previous step.
 * @param {() => void} [options.onRender] Render step, throttled to
 *   `LOOP.renderIntervalMs` so the DOM is not rewritten on every simulation step.
 * @param {number} [options.tickIntervalMs] Simulation interval. Defaults to `LOOP.tickIntervalMs`.
 * @param {number} [options.renderIntervalMs] Render interval. Defaults to `LOOP.renderIntervalMs`.
 * @param {number} [options.maxDeltaSeconds] Delta cap. Defaults to `LOOP.maxDeltaSeconds`.
 * @param {() => number} [options.now] Clock, in milliseconds. Injectable for tests.
 * @param {(callback: () => void, ms: number) => unknown} [options.schedule] Timer factory.
 * @param {(handle: unknown) => void} [options.cancel] Timer canceller.
 * @returns {LoopHandle} Loop controls.
 */
export function createLoop({
  onTick,
  onRender,
  tickIntervalMs = LOOP.tickIntervalMs,
  renderIntervalMs = LOOP.renderIntervalMs,
  maxDeltaSeconds = LOOP.maxDeltaSeconds,
  now = () => performance.now(),
  schedule = (callback, ms) => setInterval(callback, ms),
  cancel = (handle) => clearInterval(handle),
}) {
  /** @type {unknown} */
  let timer = null;
  let lastTickMs = 0;
  let lastRenderMs = 0;

  /**
   * One iteration: advance the simulation by the real elapsed time, then render if the
   * render interval has passed.
   * @returns {void}
   */
  function step() {
    const currentMs = now();
    const deltaSeconds = Math.min((currentMs - lastTickMs) / 1000, maxDeltaSeconds);
    lastTickMs = currentMs;

    // A backwards or zero delta (clock adjustment, duplicate callback) must never
    // rewind production.
    if (deltaSeconds > 0) onTick(deltaSeconds);

    if (onRender && currentMs - lastRenderMs >= renderIntervalMs) {
      lastRenderMs = currentMs;
      onRender();
    }
  }

  return {
    start() {
      if (timer !== null) return;
      lastTickMs = now();
      lastRenderMs = 0; // force a render on the first step
      timer = schedule(step, tickIntervalMs);
    },
    stop() {
      if (timer === null) return;
      cancel(timer);
      timer = null;
    },
    isRunning() {
      return timer !== null;
    },
  };
}
