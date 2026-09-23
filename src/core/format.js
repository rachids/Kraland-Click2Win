/**
 * @file Number → string conversion. The single place where numbers become text.
 *
 * Keeping every conversion here is what makes a big-number library (out of scope today)
 * a drop-in change later: only this module would need to learn the new type.
 */

/**
 * Narrow no-break space (U+202F), the ISO thousands separator.
 *
 * The original emitted the HTML entity `&#8239;`, which forced `innerHTML` everywhere a
 * number was displayed. We emit the character itself so values can be assigned with
 * `textContent`. Identical glyph, identical rendering.
 * @type {string}
 */
export const THOUSANDS_SEPARATOR = '\u202F';

/**
 * Formats a number with thousands separators, preserving any decimal part as-is.
 *
 * Faithful port of the original `prettify()` (itself borrowed from civClicker): it groups
 * the integer part in threes and leaves the fractional part untouched, so `1234.5` becomes
 * `"1 234.5"` — note the decimal *point*, as in the original, not a French comma.
 *
 * @param {number|string} input Value to format.
 * @returns {string} The formatted value.
 * @example
 * prettify(1234567.89); // → "1 234 567.89" (with narrow no-break spaces)
 */
export function prettify(input) {
  const text = String(input);
  const [integerPart, fractionalPart] = text.split('.');
  const suffix = fractionalPart === undefined ? '' : `.${fractionalPart}`;

  // Group the integer part in threes, walking backwards from the last digit. A leading
  // "-" is never grouped because the loop stops before index 0.
  let grouped = '';
  let digitCount = 0;
  for (let index = integerPart.length; index > 0; index -= 1) {
    grouped = integerPart[index - 1] + grouped;
    digitCount += 1;
    if (digitCount === 3 && index !== 1) {
      grouped = THOUSANDS_SEPARATOR + grouped;
      digitCount = 0;
    }
  }

  return grouped + suffix;
}
