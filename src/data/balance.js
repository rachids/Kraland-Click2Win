/**
 * @file Game balance constants.
 *
 * Every number that tunes the game lives here, so balancing never means hunting through
 * logic. These values reproduce the original game exactly — do not change them unless you
 * intend to change the balance.
 */

/**
 * The player's starting situation.
 * @type {Readonly<{money: number, moneyPerClick: number, moneyPerSecond: number,
 *   politicalPower: number, politicalPowerPerSecond: number, health: number,
 *   maxHealth: number, healthPerSecond: number, luckFactor: number}>}
 */
export const STARTING_VALUES = Object.freeze({
  /** Francs-kra (FK). Original: `score = 0` then `addToScore(500)`. */
  money: 500,
  /** FK earned per click. Original: `pointsPerClick = 0` then `addToPointsPerClick(1)`. */
  moneyPerClick: 1,
  /** FK earned per second. */
  moneyPerSecond: 0,
  /** Puissance politique (PP). */
  politicalPower: 0,
  /** PP earned per second. */
  politicalPowerPerSecond: 0,
  /** Points de vie (PdV). */
  health: 25,
  /** Maximum PdV. */
  maxHealth: 25,
  /** PdV regenerated per second. */
  healthPerSecond: 0.1,
  /** Bonus added to every skill roll. */
  luckFactor: 0,
});

/**
 * Loop timing.
 *
 * The original ran a fixed 30 ticks/second and produced `perSecond / 30` per tick, which
 * silently under-produced in throttled background tabs. The simulation is now driven by
 * real elapsed time, so `tickIntervalMs` only controls how often we sample the clock.
 * @type {Readonly<{tickIntervalMs: number, renderIntervalMs: number, maxDeltaSeconds: number}>}
 */
export const LOOP = Object.freeze({
  /** Target simulation interval. 1000/30 ms ≈ the original 30 "fps". */
  tickIntervalMs: 1000 / 30,
  /** How often the DOM readouts are refreshed. Decoupled from the simulation. */
  renderIntervalMs: 100,
  /**
   * Upper bound on a single tick's delta. Prevents a suspended laptop or a
   * long-throttled tab from granting a huge lump sum — the game has no offline progress.
   */
  maxDeltaSeconds: 60,
});

/**
 * Cost escalation, expressed as the fraction added to the price after each purchase.
 * Applied as `cost += Math.floor(cost * rate)`, i.e. integer-truncated at every step.
 * @type {Readonly<{mule: number, regen: number}>}
 */
export const COST_GROWTH = Object.freeze({
  /** Original: `cout += Math.floor(cout * 0.15)`. */
  mule: 0.15,
  /** Original: `cout += Math.floor(cout * 0.40)`. */
  regen: 0.4,
});

/**
 * Cost curve for the "Augmenter PdV" order, which does not use a flat growth rate.
 * Original: `cout += Math.floor(100 * (pdvMax - 25) * Math.pow(1.05, pdvMax))`,
 * evaluated *after* the max-health increase was applied.
 * @type {Readonly<{multiplier: number, base: number}>}
 */
export const MAX_HEALTH_COST_CURVE = Object.freeze({
  multiplier: 100,
  base: 1.05,
});

/**
 * Rules shared by every skill check.
 * @type {Readonly<{diceSides: number, criticalSuccess: number, criticalFailure: number,
 *   politicalPowerDivisor: number, maxSuccessChance: number}>}
 */
export const ROLL = Object.freeze({
  /** A d100. Original: `randeaume(100)`. */
  diceSides: 100,
  /** A roll of 1 is always a critical success. */
  criticalSuccess: 1,
  /** A roll of 100 is always a critical failure. */
  criticalFailure: 100,
  /** Success chance gains `politicalPower / 10`. */
  politicalPowerDivisor: 10,
  /** Hard cap on the Auto-Soutien success chance. Original: `if (chance > 95) chance = 95`. */
  maxSuccessChance: 95,
});

/**
 * Display precision, in decimal places.
 * @type {Readonly<Record<string, number>>}
 */
export const DISPLAY_DECIMALS = Object.freeze({
  /** FK/sec, FK/click, PP and roll chances. */
  rate: 1,
  /** PdV, PdV max and PdV/sec. */
  health: 2,
});

/** Divisor applied to a fonction's `ppModifier` when it becomes PP/second. */
export const PP_PER_SECOND_DIVISOR = 100;

/** Fraction of a mule's FK/sec that is also added to the FK/click value. */
export const MULE_CLICK_BONUS_RATIO = 0.1;
