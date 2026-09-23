/**
 * @file Composition root.
 *
 * The only file that knows about every layer at once. It builds the game, registers the
 * systems, wires the views to the event bus and starts the loop — and nothing else.
 *
 * Adding a future feature (Careers, Political system, Upgrades, Prestige) means adding a
 * data module, a system module, a view module, and a few lines here. No engine file under
 * `src/core/` has to change. See ARCHITECTURE.md.
 */

import { LOOP, STARTING_VALUES } from './data/balance.js';
import { FONCTIONS, MULES, ORDRES, PIOCHES, REGEN_ITEMS } from './data/index.js';
import { UI } from './data/strings.js';
import { createGame } from './core/game.js';
import { createLoop } from './core/loop.js';
import { EVENTS } from './core/events.js';
import { clickMine, createEconomySystem } from './systems/economy.js';
import {
  buyMule,
  buyPioche,
  buyRegen,
  getMuleCost,
  getPiocheCost,
  getRegenCost,
} from './systems/shop.js';
import { executeOrdre, getMaxHealthCost, getSoutienChance } from './systems/ordres.js';
import { getUsurpationChance, usurp } from './systems/usurpation.js';
import { requireById } from './ui/dom.js';
import { createTabs } from './ui/tabs.js';
import { createStatsView } from './ui/stats-view.js';
import { createShopView } from './ui/shop-view.js';
import { createOrdresView } from './ui/ordres-view.js';
import { createResultView } from './ui/result-view.js';
import { createClickEffect } from './ui/click-effect.js';

/**
 * Boots the game.
 * @returns {void}
 */
function start() {
  const game = createGame();
  game.registerSystem(createEconomySystem());

  // ---------------------------------------------------------------- views

  const statsView = createStatsView();
  const resultView = createResultView();

  const clicker = requireById('clicker');
  const clickEffect = createClickEffect(clicker);

  const muleView = createShopView({
    container: requireById('available_mules'),
    entries: MULES,
    kind: 'mule',
    getCost: getMuleCost,
    onBuy: (id) => buyMule(game, id),
    withLineBreak: false,
  });

  const piocheView = createShopView({
    container: requireById('available_pioches'),
    entries: PIOCHES,
    kind: 'pioche',
    getCost: getPiocheCost,
    onBuy: (id) => buyPioche(game, id),
  });

  const regenView = createShopView({
    container: requireById('available_regen'),
    entries: REGEN_ITEMS,
    kind: 'regen',
    getCost: getRegenCost,
    onBuy: (id) => buyRegen(game, id),
  });

  const ordresView = createOrdresView({
    container: requireById('available_ordres'),
    entries: ORDRES.map((ordre) => ({
      id: ordre.id,
      menuLabel: ordre.name,
      title: ordre.name,
      description: ordre.description,
      cost: ordre.cost,
      costPDV: ordre.costPDV,
      txtChance: ordre.txtChance,
      chance: ordre.chance,
      action: ordre.action,
    })),
    onConfirm: (id) => executeOrdre(game, id, { startingMaxHealth: STARTING_VALUES.maxHealth }),
    getChance: (state, entry) =>
      entry.id === 'soutien' ? getSoutienChance(state, findOrdre(entry.id)) : entry.chance,
    getCost: (state, entry) =>
      entry.id === 'ajoutPdvMax'
        ? getMaxHealthCost(state, findOrdre(entry.id), STARTING_VALUES.maxHealth)
        : entry.cost,
  });

  const usurpationView = createOrdresView({
    container: requireById('available_usurping'),
    entries: FONCTIONS.map((fonction) => ({
      id: fonction.id,
      menuLabel: fonction.label,
      title: `${UI.usurpPrefix} ${fonction.label}`,
      description: fonction.description,
      cost: fonction.cost,
      costPDV: fonction.costPDV,
      txtChance: fonction.txtChance,
      chance: fonction.chance,
    })),
    onConfirm: (id) => usurp(game, id),
    getChance: (state, entry) =>
      getUsurpationChance(
        state,
        FONCTIONS.find((fonction) => fonction.id === entry.id),
      ),
    labelSuffixInside: true,
  });

  /**
   * Looks an ordre definition up by id.
   * @param {string} id Ordre id.
   * @returns {import('./data/ordres.js').Ordre|undefined} The definition.
   */
  function findOrdre(id) {
    return ORDRES.find((ordre) => ordre.id === id);
  }

  // ---------------------------------------------------------------- wiring

  clicker.addEventListener('click', (event) => clickMine(game, event));

  game.events.on(EVENTS.MINE_CLICKED, ({ amount, event }) => clickEffect.spawn(amount, event));

  game.events.on(EVENTS.ACTION_RESOLVED, (result) => {
    // The original hid every order card once an Auto-Soutien resolved.
    if (!result.isError) ordresView.hideAllCards();
    resultView.render(result);
  });

  game.events.on(EVENTS.PIOCHE_REMOVED, ({ id }) => piocheView.removeCard(id));
  game.events.on(EVENTS.FONCTION_TAKEN, ({ id }) => usurpationView.removeEntry(id));

  createTabs(requireById('tabs'));

  // ---------------------------------------------------------------- loop

  const views = [statsView, muleView, piocheView, regenView, ordresView, usurpationView];

  /**
   * Refreshes every view from the current state.
   * @returns {void}
   */
  function render() {
    for (const view of views) view.render(game.state);
  }

  const loop = createLoop({
    onTick: (deltaSeconds) => {
      game.tick(deltaSeconds);
      game.events.emit(EVENTS.TICK, { deltaSeconds });
    },
    onRender: render,
    tickIntervalMs: LOOP.tickIntervalMs,
    renderIntervalMs: LOOP.renderIntervalMs,
  });

  render();
  loop.start();
}

start();
