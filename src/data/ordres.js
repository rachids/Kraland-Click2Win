/**
 * @file "Ordres" — the one-off actions the player can issue (Ordres tab).
 *
 * Unlike the other content types, each ordre has bespoke rules, so an ordre's data entry
 * carries an `action` id that `systems/ordres.js` maps to its handler. The data never
 * references a function by name the way the original `fnName: "autoSoutien"` did — the
 * mapping is explicit and checked at build time.
 */

/** Action identifiers. Used to route an ordre to its handler in `systems/ordres.js`. */
export const ORDRE_ACTIONS = Object.freeze({
  AUTO_SOUTIEN: 'autoSoutien',
  CONSUME_MEAL: 'consumeMeal',
  INCREASE_MAX_HEALTH: 'increaseMaxHealth',
});

/** `txtChance` label used by ordres that always succeed. */
const AUTOMATIC_LABEL = 'Automatique -';

/**
 * @typedef {object} Ordre
 * @property {string} id Stable identifier; doubles as the CSS class of its order card.
 * @property {string} name French display name.
 * @property {string} description French flavour text.
 * @property {string} action One of {@link ORDRE_ACTIONS}.
 * @property {number} cost Price, in FK. For `INCREASE_MAX_HEALTH` this is the base cost of
 *   an escalating curve; for the others it is flat.
 * @property {number} costPDV PdV spent.
 * @property {number} chance Base success chance, in percent.
 * @property {string} txtChance Label preceding the computed success chance.
 * @property {number} [ppAdd] Upper bound of the random PP gain (Auto-Soutien).
 * @property {number} [pdvAdd] Upper bound of the random PdV gain (meal).
 * @property {number} [pdvMax] PdV max granted per purchase (max-health upgrade).
 */

/**
 * @type {ReadonlyArray<Ordre>}
 */
export const ORDRES = Object.freeze([
  Object.freeze({
    id: 'soutien',
    name: 'Auto-Soutien',
    action: ORDRE_ACTIONS.AUTO_SOUTIEN,
    description:
      'Vous pouvez faire un discours de soutien envers vous même parce que vous êtes un ' +
      'abusator et que osef les règles. Votre propre PP augmentera de X/4 mais comme je ne ' +
      'sais pas compter ce sera un chiffre arbitrairement décidé par Random, notre maître à ' +
      'tous.',
    ppAdd: 4,
    cost: 0,
    costPDV: 5,
    chance: 6,
    txtChance: 'Potentiel : PP/10 + Eloquence =',
  }),
  Object.freeze({
    id: 'consommer',
    name: 'Consommer un repas',
    action: ORDRE_ACTIONS.CONSUME_MEAL,
    description:
      'Vous pouvez acheter et consommer un repas de luxe sur place et en subir les effets. ' +
      "Pas de marchandage possible parce qu'en plus d'être un établissement tombé entre les " +
      'mains de Zyor Mawi, vous devriez être foutrement riche avec vos mules.',
    pdvAdd: 5,
    cost: 50,
    costPDV: 0.5,
    chance: 100,
    txtChance: AUTOMATIC_LABEL,
  }),
  Object.freeze({
    id: 'ajoutPdvMax',
    name: 'Augmenter PdV',
    action: ORDRE_ACTIONS.INCREASE_MAX_HEALTH,
    description:
      "Vous pouvez augmenter d'1 point votre maximum de points de vie en dépensant du " +
      'franc-kra parce que les PA ne valent rien ici.',
    pdvMax: 1,
    cost: 305,
    costPDV: 0,
    chance: 100,
    txtChance: AUTOMATIC_LABEL,
  }),
]);
