/**
 * @file Every user-facing string in the game.
 *
 * Code, comments and docs are in English; the game itself is in French and its humour is
 * load-bearing, so all copy lives here rather than being scattered through the logic.
 * This is also the file to translate from if the game is ever localised.
 *
 * Strings that contain HTML markup (`<strong>`, `<em>`, `<br/>`, `<a>`, `<img>`) are static
 * author-written content and are injected with `innerHTML`; anything interpolated from game
 * state is either a number or goes through `textContent`.
 */

/**
 * Titles of the result panel shown after an action.
 * @type {Readonly<Record<string, string>>}
 */
export const RESULT_TITLES = Object.freeze({
  criticalSuccess: 'Réussite Critique',
  success: 'Action Réussie',
  criticalFailure: 'Echec Critique',
  failure: 'Action Ratée',
  error: 'Erreur',
});

/**
 * Error messages shown when the player cannot afford an action.
 * @type {Readonly<Record<string, string>>}
 */
export const ERRORS = Object.freeze({
  notEnoughHealth: "Vous n'avez pas assez de points de vie.",
  notEnoughMoney: "Vous n'avez pas assez de francs-kra.",
});

/**
 * Small pieces of UI chrome.
 * @type {Readonly<Record<string, string>>}
 */
export const UI = Object.freeze({
  buyButton: 'Acheter',
  confirmButton: 'Ok!',
  helpMarker: '[?]',
  pricePrefix: 'Prix:',
  currency: 'FK',
  costLabel: 'Coût:',
  fatigueLabel: 'Fatigue:',
  healthUnit: 'PdV',
  usurpPrefix: 'Usurper un',
  separator: ' - ',
  moneyIconAlt: 'argent',
});

/**
 * Builders for the dynamic French messages produced by the game's actions.
 *
 * Each returns a ready-to-display HTML string. They are plain functions rather than
 * templates with placeholders so the French reads naturally at the call site.
 */
export const MESSAGES = Object.freeze({
  /**
   * Auto-Soutien, critical success.
   * @param {number} ppGained PP awarded.
   * @returns {string} HTML message.
   */
  soutienCriticalSuccess: (ppGained) =>
    "KEL DISKOUR !! Si peu de caractères et pourtant tellement d'ovations ! Sans doute le " +
    'meilleur monoligne EVAR. Un seul mot: WOAH!<br/>Votre PP augmente de ' +
    `${ppGained}.`,

  /**
   * Auto-Soutien, success.
   * @param {number} ppGained PP awarded.
   * @returns {string} HTML message.
   */
  soutienSuccess: (ppGained) =>
    'Votre discours résonne comme une symphonie mêlant intelligence, répartie, organisation ' +
    `et haleine fraîche.<br/>Votre PP augmente de ${ppGained}.`,

  /**
   * Auto-Soutien, critical failure.
   * @param {number} healthLost PdV lost on top of the action's cost.
   * @param {number} ppLost PP lost.
   * @returns {string} HTML message.
   */
  soutienCriticalFailure: (healthLost, ppLost) =>
    'Vous êtes totalement ridicule: vous avez bafouillé, vous vous êtes mordu la langue deux ' +
    'fois, avez postillonné sur vos plus fidèles soutiens, en plus votre braguette était ' +
    "ouverte et dans la panique vous l'avez fermée un peu brutalement, occasionnant quelques " +
    `légers dégats autant physique que médiatique (PdV -${healthLost}, PP -${ppLost})`,

  /** Auto-Soutien, plain failure. */
  soutienFailure:
    "Vous aviez oublié qu'aujourd'hui c'était la kermesse de l'école primaire et que par " +
    "conséquent, personne n'est venu à votre meeting.",

  /**
   * Luxury meal consumed.
   * @param {number} healthGained Net PdV gained.
   * @returns {string} HTML message.
   */
  mealSuccess: (healthGained) =>
    "Vous dégustez un succulent repas d'une auberge non farouche.<br/>Vos PdV augmentent de " +
    `${healthGained}.`,

  /**
   * Maximum health increased.
   * @param {number} maxHealthGained PdV max added.
   * @param {number} cost Price paid, in FK.
   * @returns {string} HTML message.
   */
  maxHealthSuccess: (maxHealthGained, cost) =>
    `Vous avez ajouté <strong>${maxHealthGained} PdV max.</strong> au prix fort de ${cost} FK.`,

  /**
   * Usurpation, critical success.
   * @param {string} fonctionLabel The stolen job title.
   * @param {number} ppGained PP awarded.
   * @returns {string} HTML message.
   */
  usurpationCriticalSuccess: (fonctionLabel, ppGained) =>
    `<strong>Coup d'Etat!</strong> En plus d'avoir chopé ce tant convoité titre de ` +
    `${fonctionLabel}, le peuple vous acclame et vous gagnez de la puissance politique à ` +
    `foison, à perte de vue. Une quantité siiiii énorme !! (PP +${ppGained}`,

  /**
   * Usurpation, success.
   * @param {string} fonctionLabel The stolen job title.
   * @returns {string} HTML message.
   */
  usurpationSuccess: (fonctionLabel) =>
    `Vous êtes maintenant un parfait <strong>${fonctionLabel}</strong>.`,

  /**
   * Usurpation, critical failure.
   * @param {number} ppLost PP mentioned in the message.
   * @param {number} healthLost All remaining PdV.
   * @param {number} moneyLost All remaining FK.
   * @returns {string} HTML message.
   */
  usurpationCriticalFailure: (ppLost, healthLost, moneyLost) =>
    '<strong>Scandale !</strong> Alors que vous vous apprêtiez à usurper, un groupe de ' +
    'clic-opti vous tombe dessus, vous mets dans le coma, vous dépouille de votre argent et ' +
    "vous dépose à l'eau, mouillant vos élégantes bobettes que vous ne gardiez uniquement " +
    `pour cette occasion spéciale ! (PP -${ppLost}, PdV -${healthLost}, Argent -${moneyLost})`,

  /** Usurpation, plain failure. */
  usurpationFailure: "Vous n'avez pas réussi votre usurpation.",
});

/**
 * Builds the parenthesised "(chances: X% - jet: Y)" detail line of the result panel.
 * @param {string} formattedChance Already-formatted success chance.
 * @param {number} roll The d100 result.
 * @returns {string} Detail text.
 */
export function formatRollDetails(formattedChance, roll) {
  return `(chances: ${formattedChance}% - jet: ${roll})`;
}

/** Label for the player's starting job. */
export const STARTING_FONCTION = 'Prolo';
