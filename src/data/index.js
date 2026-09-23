/**
 * @file Content registry — the one import the rest of the game needs for game data.
 *
 * Adding a new content type (Careers, Upgrades, …) means adding a data module next to these
 * and re-exporting it here; nothing under `src/core/` has to change.
 */

import { MULES } from './mules.js';
import { PIOCHES } from './pioches.js';
import { REGEN_ITEMS } from './regen.js';
import { FONCTIONS } from './fonctions.js';
import { ORDRES } from './ordres.js';

export { MULES } from './mules.js';
export { PIOCHES } from './pioches.js';
export { REGEN_ITEMS } from './regen.js';
export { FONCTIONS } from './fonctions.js';
export { ORDRES, ORDRE_ACTIONS } from './ordres.js';

/**
 * Builds an id → entry lookup from a content list.
 * @template {{id: string}} T
 * @param {ReadonlyArray<T>} entries Content entries.
 * @returns {ReadonlyMap<string, T>} Frozen lookup map.
 */
function indexById(entries) {
  return new Map(entries.map((entry) => [entry.id, entry]));
}

/** @type {ReadonlyMap<string, import('./mules.js').Mule>} */
export const MULES_BY_ID = indexById(MULES);

/** @type {ReadonlyMap<string, import('./pioches.js').Pioche>} */
export const PIOCHES_BY_ID = indexById(PIOCHES);

/** @type {ReadonlyMap<string, import('./regen.js').RegenItem>} */
export const REGEN_BY_ID = indexById(REGEN_ITEMS);

/** @type {ReadonlyMap<string, import('./fonctions.js').Fonction>} */
export const FONCTIONS_BY_ID = indexById(FONCTIONS);

/** @type {ReadonlyMap<string, import('./ordres.js').Ordre>} */
export const ORDRES_BY_ID = indexById(ORDRES);
