/**
 * @file "Régen" — health regeneration upgrades (Scripts de MAJ tab).
 *
 * Each purchase adds to PdV/second and raises that item's price by 40%
 * (see `COST_GROWTH.regen`), so they can be bought repeatedly.
 */

/**
 * @typedef {object} RegenItem
 * @property {string} id Stable identifier, used in the DOM and in state. Never translated.
 * @property {string} name French display name.
 * @property {string} description French flavour text.
 * @property {number} regenAdd PdV/second granted per purchase.
 * @property {number} baseCost Price of the first purchase, in FK.
 */

/**
 * @type {ReadonlyArray<RegenItem>}
 */
export const REGEN_ITEMS = Object.freeze([
  Object.freeze({
    id: 'Dodo',
    name: 'Dormir',
    description: "Le meilleur moyen d'avoir des cernes.",
    regenAdd: 0.01,
    baseCost: 100,
  }),
  Object.freeze({
    id: 'RedBoule',
    name: 'Red Boule',
    description:
      "Boisson qui, en plus d'ajouter tout plein d'énergie, multiplie les risques d'AVC.",
    regenAdd: 0.05,
    baseCost: 400,
  }),
  Object.freeze({
    id: 'PastilleBonheur',
    name: 'Pastille du Bonheur',
    description: "Seuls l'élite kralandaise a accès à ces cachetons.",
    regenAdd: 0.5,
    baseCost: 2500,
  }),
  Object.freeze({
    id: 'Quebecois',
    name: 'Sommeil de Québécois',
    description: "Quand il est minuit à Kraland, il est 18h là-bas, c'est opti en criss!",
    regenAdd: 1,
    baseCost: 10000,
  }),
]);
