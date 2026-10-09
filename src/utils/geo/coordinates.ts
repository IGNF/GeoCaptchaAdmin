/**
 * A geographic point represented as `[longitude, latitude]`.
 */
export type LonLat = [
    longitude: number,
    latitude: number
];

/**
 * A geographic bounding box represented as :
 * `[min longitude, min latitude, max longitude, max latitude]`.
 */
export type BBox = [
    minLon: number,
    minLat: number,
    maxLon: number,
    maxLat: number
];