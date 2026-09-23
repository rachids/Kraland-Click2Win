/**
 * @file "Fonctions" — the political jobs the player can usurp (Usurper tab).
 *
 * Each successful usurpation sets the player's current job, adds PP/second and adds a
 * salary to FK/click. A fonction can only be usurped once: its card and menu entry are
 * removed on success.
 */

import { ASSET_URLS, EXTERNAL_LINKS } from '../config/assets.js';

/** Shared prefix of every fonction's "potential" line. */
const POTENTIAL_LABEL = 'Potentiel : PP/10 =';

/** Sentence repeated at the end of most descriptions. */
const MODIFIERS_NOTE =
  'De nombreux modificateurs peuvent influencer le potentiel (scripts, amis dans le staff, etc).';

/** Sentence repeated in the middle of every description. */
const PP_BONUS_NOTE =
  "Vous bénéficiez d'un bonus équivalent au dixième de votre puissance politique.";

/**
 * @typedef {object} Fonction
 * @property {string} id Stable identifier; doubles as the CSS class of its order card.
 * @property {string} label French job title, shown to the player.
 * @property {number} ppModifier PP/second granted (divided by `PP_PER_SECOND_DIVISOR`),
 *   and the basis of the critical-success PP bonus.
 * @property {number} chance Base success chance, in percent.
 * @property {number} cost Price, in FK.
 * @property {number} salaire FK/click granted on success.
 * @property {number} costPDV PdV spent on the attempt, win or lose.
 * @property {string} txtChance Label preceding the computed success chance.
 * @property {string} description French flavour text (contains HTML markup).
 */

/**
 * @type {ReadonlyArray<Fonction>}
 */
export const FONCTIONS = Object.freeze([
  Object.freeze({
    id: 'citoyen',
    label: 'Citoyen',
    ppModifier: 2,
    chance: 70,
    cost: 5,
    salaire: 5,
    costPDV: 5,
    txtChance: POTENTIAL_LABEL,
    description:
      'Vous pouvez usurper un citoyen de la ville et quitter le monde du prolétariat. La ' +
      `difficulté est pas si pire. ${PP_BONUS_NOTE} La difficulté est additionnée du ` +
      `centième du meilleur score à <a href="${EXTERNAL_LINKS.robotUnicornAttack}" ` +
      'target="_blank">Robot Uniorn Attack</a> du mec dont on tente d\'usurper l\'identité ' +
      '(sauf si le mec est une licorne).',
  }),
  Object.freeze({
    id: 'juge',
    label: 'Juge',
    ppModifier: 5,
    chance: 65,
    cost: 8,
    salaire: 50,
    costPDV: 10,
    txtChance: POTENTIAL_LABEL,
    description:
      'Vous pouvez usurper le poste de juge de votre ville et prendre cette place. La ' +
      'difficulté est pas super haute et vous devriez vous en sortir. ' +
      `${PP_BONUS_NOTE} La difficulté est additionnée du dixième de la touffe de ch'veux du ` +
      "fonctionnaire dont on tente d'usurper le poste (sauf si le fonctionnaire est " +
      `chauve). ${MODIFIERS_NOTE}`,
  }),
  Object.freeze({
    id: 'bourgmestre',
    label: 'Bourgmestre',
    ppModifier: 7,
    chance: 60,
    cost: 12,
    salaire: 200,
    costPDV: 15,
    txtChance: POTENTIAL_LABEL,
    description:
      'Vous pouvez usurper le poste de bourgmestre de votre ville et prendre cette place. La ' +
      'difficulté commence à pointer le bout de son nez mais avec une bonne PP ça devrait ' +
      `aller <em>chillax nigga</em>. ${PP_BONUS_NOTE} La difficulté est additionnée du quart ` +
      "du nombre de joueurs restants sur Kraland (sauf s'il n'y a plus de joueur). " +
      `${MODIFIERS_NOTE}`,
  }),
  Object.freeze({
    id: 'intendant',
    label: 'Intendant',
    ppModifier: 9,
    chance: 55,
    cost: 18,
    salaire: 300,
    costPDV: 20,
    txtChance: POTENTIAL_LABEL,
    description:
      "Vous pouvez usurper le poste d'intendant de votre province et prendre cette place. La " +
      `difficulté est là et va falloir faire avec. ${PP_BONUS_NOTE} La difficulté est ` +
      "additionnée de la tendance du PIB Grec (sauf s'il n'y a plus de Grèce). " +
      `${MODIFIERS_NOTE}`,
  }),
  Object.freeze({
    id: 'gouverneur',
    label: 'Gouverneur',
    ppModifier: 15,
    chance: 40,
    cost: 25,
    salaire: 500,
    costPDV: 25,
    txtChance: POTENTIAL_LABEL,
    description:
      'Vous pouvez usurper le poste de gouverneur de votre province et prendre cette place. ' +
      "La difficulté est chaude mais c'est la saison qui veut ça. " +
      `${PP_BONUS_NOTE} La difficulté est additionnée du cosinus de la dernière position ` +
      "sexuelle qui a été effectuée dans un rayon de 5km autour de vous (à l'exception des " +
      `positions dites <em>onanistes</em>). ${MODIFIERS_NOTE}`,
  }),
  Object.freeze({
    id: 'inspecteur',
    label: 'Inspecteur des Impôts',
    ppModifier: 25,
    chance: 30,
    cost: 28,
    salaire: 1000,
    costPDV: 30,
    txtChance: POTENTIAL_LABEL,
    description:
      "Vous pouvez usurper le poste d'inspecteur des impôts de votre empire et rejoindre une " +
      'magnifique équipe de P.I.P.E. La difficulté est chaude sa mère. ' +
      `${PP_BONUS_NOTE} La difficulté est additionnée de l'ID du dernier mec banni (sauf si ` +
      `c'est un DY car leurs IDs sont bien trop élevés). ${MODIFIERS_NOTE}`,
  }),
  Object.freeze({
    id: 'minfo',
    label: "Ministre de l'Information",
    ppModifier: 30,
    chance: 25,
    cost: 30,
    salaire: 2000,
    costPDV: 35,
    txtChance: POTENTIAL_LABEL,
    description:
      "Vous pouvez usurper le poste de ministre de l'information de votre empire et prendre " +
      'cette place. La difficulté est chanmax et va falloir une moule de bâtard pour ' +
      `réussir. ${PP_BONUS_NOTE} La difficulté est additionnée du dernier monoligne de ` +
      'Révolution multiplié par mille (sauf si ce monoligne dépasse les 7 caractères, ' +
      `smileys inclus). ${MODIFIERS_NOTE}`,
  }),
  Object.freeze({
    id: 'mae',
    label: 'Ministre des Affaires Etrangères',
    ppModifier: 40,
    chance: 15,
    cost: 35,
    salaire: 5000,
    costPDV: 40,
    txtChance: POTENTIAL_LABEL,
    description:
      'Vous pouvez usurper le poste de ministre des affaires étragères de votre empire et ' +
      'prendre cette place. La difficulté est <em>toff man</em> et en plus il faut savoir ' +
      `parler plusieurs langues. ${PP_BONUS_NOTE} La difficulté est additionnée du nombre de ` +
      'RP dinettes ayant eu lieu au cours de la dernière heure (sauf si ceux-ci contiennent ' +
      `du RP saiks). ${MODIFIERS_NOTE}`,
  }),
  Object.freeze({
    id: 'pm',
    label: 'Premier Ministre',
    ppModifier: 60,
    chance: 10,
    cost: 40,
    salaire: 25793,
    costPDV: 45,
    txtChance: POTENTIAL_LABEL,
    description:
      'Vous pouvez usurper le poste de premier ministre de votre empire et prendre cette ' +
      'place. La difficulté est <em>harkorr</em> et respect si tu réussis. ' +
      `${PP_BONUS_NOTE} La difficulté est additionnée du pourcentage de Krach boursier IRL ` +
      `ou IG (ou les deux). ${MODIFIERS_NOTE}`,
  }),
  Object.freeze({
    id: 'prelu',
    label: 'PREMIER ELU §§',
    ppModifier: 100,
    chance: 1,
    cost: 40,
    salaire: 99999999,
    costPDV: 70,
    txtChance: POTENTIAL_LABEL,
    description:
      'Vous pouvez usurper le poste de PREMIER ELU §§ de votre jeu préféré et prendre cette ' +
      'honorable place. La difficulté est insurmontable mais une fois réussie vous aurez ' +
      `légitimement gagné KI. ${PP_BONUS_NOTE} La difficulté est additionnée du nombre de ` +
      "personnes présente à la Tower RIK (sauf si par chance j'y suis). De nombreux " +
      'modificateurs peuvent influencer le potentiel (scripts, ennemis de red' +
      `<img src="${ASSET_URLS.redstawStar}" align="middle">star, etc).`,
  }),
]);
