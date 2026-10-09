import {
    BBox,
    LonLat,
} from "@/utils/geo/coordinates";

/**
 * Returns a random number withing the given range.
 *
 * The returned value is greater than or equal to `min` and strictly less than `max`.
 *
 * @param min - Inclusive lower bound.
 * @param max - Exclusive upper bound.
 */
export const randomInRange = (min: number, max: number): number =>
    Math.random() * (max - min) + min;

const round6 = (n: number) => Number(n.toFixed(6));

/**
 * Generates random points within a bounding box until one satisfies the given predicate.
 *
 * Each generated coordinate is rounded to 6 decimal places before being passed to the predicate.
 *
 * @param bbox - Bounding box in the form `[minLon, minLat, maxLon, maxLat]`
 * @param predicate - Function used to determine whether a generated point is acceptable.
 * @param maxTries - Maximum number of random points to test. Defaults to `100`.
 * @returns The first point which satisfies `predicate` or null if no suitable point is found
 * within `maxTries` attempts.
 */
export function randomPointWhere(
    [minLon, minLat, maxLon, maxLat]: BBox,
    predicate: (point: LonLat) => boolean,
    maxTries = 100,
): LonLat | null {
    for (let i = 0; i < maxTries; i++) {
        const point: LonLat = [
            round6(randomInRange(minLon, maxLon)),
            round6(randomInRange(minLat, maxLat)),
        ]
        if (predicate(point)) return point;
    }
    return null;
}