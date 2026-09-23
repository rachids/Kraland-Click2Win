/**
 * @file "Mules" — the passive income buildings (AdopteUneMule.com tab).
 *
 * Buying a mule adds to FK/second, and 10% of that to FK/click. Each purchase raises the
 * price of that same mule by 15% (see `COST_GROWTH.mule`), so mules can be bought
 * repeatedly.
 */

/**
 * @typedef {object} Mule
 * @property {string} id Stable identifier, used in the DOM and in state. Never translated.
 * @property {string} name French display name.
 * @property {string} description French flavour text.
 * @property {number} perSecondModifier FK/second granted per purchase.
 * @property {number} baseCost Price of the first purchase, in FK.
 */

/**
 * @type {ReadonlyArray<Mule>}
 */
export const MULES = Object.freeze([
  Object.freeze({
    id: 'PCCDI',
    name: 'PC du CDI',
    description: "Les admins n'y verront que du feu!",
    perSecondModifier: 1,
    baseCost: 100,
  }),
  Object.freeze({
    id: 'COUZINDUBLED',
    name: 'Cousin du bled',
    description: 'Hey tonton! Les cabas y sont trop lourds!',
    perSecondModifier: 15,
    baseCost: 1300,
  }),
  Object.freeze({
    id: 'LAN',
    name: 'LAN de geeks',
    description: "Bien meilleur qu'une RIK.",
    perSecondModifier: 100,
    baseCost: 9800,
  }),
  // Disabled on the original master branch; kept for reference so the balance curve is
  // visible to whoever re-enables them.
  // { id: 'BOTNET', name: 'BotNet', description: 'Un virus codé pour cliquer sur Kraland.',
  //   perSecondModifier: 500, baseCost: 48000 },
  // { id: 'PIRQTTINOI', name: 'Pirates Tinois', description: 'Les Métants Tinois tipiaks !',
  //   perSecondModifier: 2700, baseCost: 200000 },
]);
