/**
 * @file "Pioches" — pickaxes that increase FK per click (la quincaillerie de pouch tab).
 *
 * Unlike mules, each pioche is a one-shot purchase: once bought, its card disappears and it
 * can never be bought again. That is why pioches have no cost-growth rate.
 */

/**
 * @typedef {object} Pioche
 * @property {string} id Stable identifier, used in the DOM and in state. Never translated.
 * @property {string} name French display name.
 * @property {string} description French flavour text.
 * @property {number} perClickModifier FK/click granted.
 * @property {number} baseCost Price, in FK.
 */

/**
 * @type {ReadonlyArray<Pioche>}
 */
export const PIOCHES = Object.freeze([
  Object.freeze({
    id: 'Bois',
    name: 'Bois',
    description: 'Une pioche en bois pas super efficace mais très loyale',
    perClickModifier: 2,
    baseCost: 200,
  }),
  Object.freeze({
    id: 'Pierre',
    name: 'Pierre',
    description: 'Pioche de pierre, faites de cailloux sucés par des prisonniers politiques',
    perClickModifier: 5,
    baseCost: 500,
  }),
  Object.freeze({
    id: 'Metal',
    name: 'Metal',
    description:
      'Une pioche en métal, perce autant les ressources minières que les surfaces craniennes',
    perClickModifier: 10,
    baseCost: 1000,
  }),
  Object.freeze({
    id: 'Titane',
    name: 'Titane',
    description: 'Pioche forgée en titane, idéal pour être le prolo-kikitoudur',
    perClickModifier: 50,
    baseCost: 15000,
  }),
]);
