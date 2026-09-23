import { describe, expect, it } from 'vitest';
import { addClamped, clamp, isValidCost, rollDie, roundToDecimals } from '../src/core/math.js';
import { prettify, THOUSANDS_SEPARATOR } from '../src/core/format.js';

describe('roundToDecimals', () => {
  it('rounds to the requested number of decimals', () => {
    expect(roundToDecimals(1.2345, 2)).toBe(1.23);
    expect(roundToDecimals(1.2355, 2)).toBe(1.24);
    expect(roundToDecimals(1.25, 1)).toBe(1.3);
    expect(roundToDecimals(9.99, 0)).toBe(10);
  });

  it('is a no-op on values that are already exact', () => {
    expect(roundToDecimals(25, 2)).toBe(25);
    expect(roundToDecimals(0.1, 1)).toBe(0.1);
  });

  it('handles negative values and zero', () => {
    expect(roundToDecimals(-1.234, 2)).toBe(-1.23);
    expect(roundToDecimals(0, 2)).toBe(0);
  });

  // The whole point of the helper: the original passed a second argument to Math.round,
  // which JavaScript ignores. This locks in that the effective behaviour is unchanged.
  it('reproduces the original Math.round(x, 1) behaviour exactly', () => {
    const samples = [0, 0.04, 0.05, 0.1, 1 / 3, 2 / 3, 1.05, 12.3456, 99.999, 1234.5678, 25];

    for (const value of samples) {
      // Original: Math.round(10 * value, 1) / 10  — the ", 1" was always ignored.
      expect(roundToDecimals(value, 1)).toBe(Math.round(10 * value, 1) / 10);
      expect(roundToDecimals(value, 1)).toBe(Math.round(10 * value) / 10);

      // Original: Math.round(100 * value, 1) / 100
      expect(roundToDecimals(value, 2)).toBe(Math.round(100 * value, 1) / 100);
      expect(roundToDecimals(value, 2)).toBe(Math.round(100 * value) / 100);
    }
  });
});

describe('clamp', () => {
  it('constrains a value to its range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(11, 0, 10)).toBe(10);
  });

  it('returns the bounds when the value sits exactly on them', () => {
    expect(clamp(0, 0, 10)).toBe(0);
    expect(clamp(10, 0, 10)).toBe(10);
  });
});

describe('addClamped', () => {
  it('adds and clamps at the upper bound', () => {
    expect(addClamped(24.9, 1, 0, 25)).toBe(25);
  });

  it('adds and clamps at the lower bound', () => {
    expect(addClamped(2, -10, 0, 25)).toBe(0);
  });

  it('adds normally inside the range', () => {
    expect(addClamped(10, 5, 0, 25)).toBe(15);
  });
});

describe('rollDie', () => {
  it('returns 1 for the lowest random value', () => {
    expect(rollDie(100, () => 0)).toBe(1);
  });

  it('returns the maximum for a random value just below 1', () => {
    expect(rollDie(100, () => 0.999999)).toBe(100);
  });

  it('never leaves the [1, sides] range', () => {
    for (let index = 0; index < 1000; index += 1) {
      const value = rollDie(100);
      expect(value).toBeGreaterThanOrEqual(1);
      expect(value).toBeLessThanOrEqual(100);
      expect(Number.isInteger(value)).toBe(true);
    }
  });

  it('matches the original randeaume() formula', () => {
    const randomValues = [0, 0.1, 0.25, 0.5, 0.75, 0.9999];
    for (const value of randomValues) {
      expect(rollDie(100, () => value)).toBe(Math.floor(value * 100) + 1);
    }
  });
});

describe('isValidCost', () => {
  it('accepts finite non-negative numbers', () => {
    expect(isValidCost(0)).toBe(true);
    expect(isValidCost(1300)).toBe(true);
  });

  it('rejects NaN, Infinity, negatives and non-numbers', () => {
    expect(isValidCost(Number.NaN)).toBe(false);
    expect(isValidCost(Number.POSITIVE_INFINITY)).toBe(false);
    expect(isValidCost(-1)).toBe(false);
    expect(isValidCost('100')).toBe(false);
    expect(isValidCost(undefined)).toBe(false);
    expect(isValidCost(null)).toBe(false);
  });
});

describe('prettify', () => {
  it('leaves short numbers alone', () => {
    expect(prettify(0)).toBe('0');
    expect(prettify(500)).toBe('500');
    expect(prettify(999)).toBe('999');
  });

  it('groups thousands with a narrow no-break space', () => {
    expect(prettify(1000)).toBe(`1${THOUSANDS_SEPARATOR}000`);
    expect(prettify(1234567)).toBe(`1${THOUSANDS_SEPARATOR}234${THOUSANDS_SEPARATOR}567`);
  });

  it('preserves the decimal part untouched', () => {
    expect(prettify(1234.5)).toBe(`1${THOUSANDS_SEPARATOR}234.5`);
    expect(prettify(0.1)).toBe('0.1');
    expect(prettify(25.25)).toBe('25.25');
  });

  it('accepts strings as well as numbers', () => {
    expect(prettify('1000')).toBe(`1${THOUSANDS_SEPARATOR}000`);
  });

  // Regression guard: the original produced the HTML entity &#8239;, we emit U+202F.
  it('emits the narrow no-break space character, not an HTML entity', () => {
    expect(prettify(1000)).not.toContain('&#8239;');
    expect(prettify(1000)).toContain('\u202F');
  });
});
