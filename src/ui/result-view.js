/**
 * @file Renders the result panel shown after an ordre or usurpation.
 */

import { DISPLAY_DECIMALS } from '../data/balance.js';
import { formatRollDetails, RESULT_TITLES } from '../data/strings.js';
import { prettify } from '../core/format.js';
import { roundToDecimals } from '../core/math.js';
import { createElement, requireById } from './dom.js';

/** CSS class used for error panels. */
const ERROR_CLASS = 'error';
/** CSS class used for normal outcome panels. */
const DISPLAY_CLASS = 'display';
/** A chance of exactly 100% means the action was automatic, so no detail line is shown. */
const AUTOMATIC_CHANCE = 100;

/**
 * Builds the result-panel renderer.
 * @returns {{render: (result: import('../systems/ordres.js').ActionResult) => void}} The renderer.
 */
export function createResultView() {
  const container = requireById('resultatJet');

  return {
    /**
     * Displays an action result.
     * @param {import('../systems/ordres.js').ActionResult} result Outcome to display.
     * @returns {void}
     */
    render(result) {
      const isError = result.title === RESULT_TITLES.error;
      const details =
        result.chance === AUTOMATIC_CHANCE
          ? ''
          : formatRollDetails(
              prettify(roundToDecimals(result.chance, DISPLAY_DECIMALS.rate)),
              result.roll,
            );

      const panel = createElement('div', { className: isError ? ERROR_CLASS : DISPLAY_CLASS });
      // Title text is interpolated, so build it as text rather than markup.
      panel.append(
        createElement('h3', { text: details ? `${result.title} ${details}` : result.title }),
      );
      // Messages are static French copy from src/data/strings.js and contain markup.
      panel.append(createElement('p', { html: result.message }));

      container.replaceChildren(panel);
    },
  };
}
