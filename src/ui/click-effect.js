/**
 * @file The floating "+N FK" that rises from the cursor when the mine is clicked.
 *
 * Replaces jQuery's `.animate({top: '-=50px', opacity: 0}, 750)` with the Web Animations
 * API. The original animated `top`, which forces a layout on every frame; animating
 * `transform` instead is composited, so the motion is identical but smoother.
 */

import { DISPLAY_DECIMALS } from '../data/balance.js';
import { UI } from '../data/strings.js';
import { ASSET_URLS } from '../config/assets.js';
import { prettify } from '../core/format.js';
import { roundToDecimals } from '../core/math.js';
import { createElement } from './dom.js';

/** How far the label rises, in pixels. Matches the original `-=50px`. */
const RISE_DISTANCE_PX = 50;
/** Animation duration, in milliseconds. Matches the original. */
const DURATION_MS = 750;
/** Offset of the label from the cursor, in pixels. Matches the original. */
const CURSOR_OFFSET = Object.freeze({ x: 20, y: -20 });
/** Size of the money icon, in pixels. */
const ICON_SIZE = 16;

/**
 * Builds the click-effect renderer.
 * @param {HTMLElement} clicker The element the labels are appended to.
 * @returns {{spawn: (amount: number, event: MouseEvent) => void}} The renderer.
 */
export function createClickEffect(clicker) {
  return {
    /**
     * Spawns one floating label at the cursor and animates it away.
     * @param {number} amount FK earned by the click.
     * @param {MouseEvent} event The click that triggered it, used for positioning.
     * @returns {void}
     */
    spawn(amount, event) {
      if (!event) return;

      const label = createElement('div', { className: 'money-flowing' });
      label.append(String(prettify(roundToDecimals(amount, DISPLAY_DECIMALS.rate))));
      label.append(
        createElement('img', {
          attributes: {
            src: ASSET_URLS.moneyIcon,
            width: String(ICON_SIZE),
            height: String(ICON_SIZE),
            alt: UI.moneyIconAlt,
          },
        }),
      );

      // `.money-flowing` is position:fixed, so viewport coordinates are the right ones.
      label.style.left = `${event.clientX + CURSOR_OFFSET.x}px`;
      label.style.top = `${event.clientY + CURSOR_OFFSET.y}px`;
      clicker.append(label);

      if (typeof label.animate !== 'function') {
        label.remove();
        return;
      }

      label
        .animate(
          [
            { transform: 'translateY(0)', opacity: 1 },
            { transform: `translateY(-${RISE_DISTANCE_PX}px)`, opacity: 0 },
          ],
          { duration: DURATION_MS, easing: 'ease-out', fill: 'forwards' },
        )
        .finished.then(() => label.remove())
        .catch(() => label.remove());
    },
  };
}
