/** Radius of the gauge arc, in SVG user units. */
export const GAUGE_RADIUS = 80;

/** Length of the half-circle arc (pi x radius), used as the full `stroke-dasharray`. */
export const GAUGE_ARC_LENGTH = Math.PI * GAUGE_RADIUS;

/**
 * Color steps, from the lowest ratio up. A ratio below `below` gets that color.
 * Ratios at or above the latest step get {@link GAUGE_COLOR_TOP}.
 */
export const GAUGE_COLOR_STEP = [
    { below: 0.6, color: 'rgb(255, 0, 0)' },
    { below: 0.75, color: 'rgb(255 132 0)' },
    { below: 0.85, color: 'rgb(255, 200, 0)' },
] as const;

/** Color of the highest ratios. */
export const GAUGE_COLOR_TOP = 'rgb(73, 204, 144)';

/**
 * Position of a value within a range, clamped to [0, 1].
 *
 * @param value - The value to place.
 * @param min - Lower bound of the range.
 * @param max - Upper bound of the range.
 * @returns A ratio in [0, 1]. `0` when the range is empty or inverted.
 */
export function gaugeRatio(value: number, min: number, max: number): number {
    const range = max - min;
    if (!(range > 0)) return 0;
    return Math.min(Math.max((value - min) / range, 0), 1);
}

/** Picks the gauge color for a ratio.
 *
 * @param ratio - a ratio in [0, 1], see {@link gaugeRatio}.
 * @returns A CSS color.
 */
export function gaugeColor(ratio: number): string {
    return GAUGE_COLOR_STEP.find((step) => ratio < step.below)?.color ?? GAUGE_COLOR_TOP;
}