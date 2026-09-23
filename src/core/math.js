/**
 * @file Numeric helpers shared by the whole game.
 *
 * Centralising these keeps rounding consistent and makes the historical rounding quirk
 * (see {@link roundToDecimals}) documented in exactly one place.
 */

/**
 * Rounds a value to a fixed number of decimal places.
 *
 * ## Historical note — the `Math.round(x, 1)` quirk
 *
 * The original code rounded with `Math.round(10 * value, 1) / 10` in six places (and with
 * the identical-but-correct `Math.round(10 * value) / 10` in two more). `Math.round()`
 * accepts a single argument, so that stray `1` was **always silently ignored** — the
 * effective behaviour has always been plain `Math.round(10 * value) / 10`.
 *
 * The author's intent was probably "round to N decimals", which is exactly what the
 * effective behaviour already does, so both readings agree. This helper reproduces that
 * effective behaviour **bit-for-bit**; game balance is unchanged.
 *
 * ⚠️ Ambiguity retained for the record: if the intent had instead been `toFixed(1)`-style
 * *string* formatting, output would differ (`0.1` vs `"0.10"`). We deliberately keep the
 * numeric behaviour that shipped.
 *
 * @param {number} value Value to round.
 * @param {number} decimals Number of decimal places to keep. Must be a non-negative integer.
 * @returns {number} The rounded value.
 * @example
 * roundToDecimals(1.2345, 2); // → 1.23
 */
export function roundToDecimals(value, decimals) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

/**
 * Constrains a value to an inclusive range.
 * @param {number} value Value to constrain.
 * @param {number} min Lower bound.
 * @param {number} max Upper bound.
 * @returns {number} `value` clamped to `[min, max]`.
 */
export function clamp(value, min, max) {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

/**
 * Adds a delta to a value and clamps the result to an inclusive range.
 *
 * Used for health, which must never exceed the maximum (the original regeneration could
 * overshoot for one frame) nor fall below zero (the original had no lower bound at all).
 *
 * @param {number} value Current value.
 * @param {number} delta Amount to add; may be negative.
 * @param {number} min Lower bound.
 * @param {number} max Upper bound.
 * @returns {number} The clamped sum.
 */
export function addClamped(value, delta, min, max) {
  return clamp(value + delta, min, max);
}

/**
 * Rolls a die with `sides` faces.
 *
 * Faithful port of the original `randeaume(n)`: returns an integer in `[1, sides]`.
 *
 * @param {number} sides Number of faces. Must be a positive integer.
 * @param {() => number} [random] Source of randomness in `[0, 1)`. Injectable for tests.
 * @returns {number} An integer in `[1, sides]`.
 */
export function rollDie(sides, random = Math.random) {
  return Math.floor(random() * sides) + 1;
}

/**
 * Returns `true` when the value is a usable, finite, non-negative price.
 * Guards purchase paths against `NaN`/`Infinity` sneaking in from bad data.
 * @param {unknown} value Value to check.
 * @returns {boolean} Whether the value is a valid cost.
 */
export function isValidCost(value) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}
