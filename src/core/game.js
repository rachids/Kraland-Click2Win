/**
 * @file The game container: state + event bus + a registry of systems.
 *
 * `core/` knows nothing about economy, shops or politics — it only knows how to hold state
 * and tick a list of systems. That is what lets Careers, a Political system, Upgrades or
 * Prestige be added as a new system module plus one registration line in `main.js`, with
 * no edit to any engine file.
 */

import { createEventBus } from './events.js';
import { createInitialState } from './state.js';

/**
 * @typedef {object} System
 * @property {string} id Unique identifier, used for lookup and de-duplication.
 * @property {(game: Game) => void} [init] Run once when the system is registered.
 * @property {(game: Game, deltaSeconds: number) => void} [tick] Run every simulation step
 *   with the real elapsed time since the previous step.
 */

/**
 * @typedef {object} Game
 * @property {import('./state.js').GameState} state Mutable game state.
 * @property {ReturnType<typeof createEventBus>} events Pub/sub bus.
 * @property {(system: System) => Game} registerSystem Adds a system (chainable).
 * @property {(id: string) => System|undefined} getSystem Looks a system up by id.
 * @property {(deltaSeconds: number) => void} tick Advances every registered system.
 */

/**
 * Creates a game instance.
 * @param {object} [options] Options.
 * @param {import('./state.js').GameState} [options.state] Initial state; a fresh one by default.
 * @returns {Game} The game instance.
 */
export function createGame({ state = createInitialState() } = {}) {
  const events = createEventBus();
  /** @type {Map<string, System>} */
  const systems = new Map();

  /** @type {Game} */
  const game = {
    state,
    events,

    registerSystem(system) {
      if (!system?.id) throw new Error('A system must have an id.');
      if (systems.has(system.id)) throw new Error(`System "${system.id}" is already registered.`);
      systems.set(system.id, system);
      system.init?.(game);
      return game;
    },

    getSystem(id) {
      return systems.get(id);
    },

    tick(deltaSeconds) {
      for (const system of systems.values()) {
        system.tick?.(game, deltaSeconds);
      }
    },
  };

  return game;
}
