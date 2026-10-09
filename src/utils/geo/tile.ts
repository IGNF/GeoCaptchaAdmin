/** Edge length, in pixels, of a square map tile. */
export const TILE_SIZE = 256;

/** Zoom level at which the GeoCaptcha tiles are requested */
export const TILE_ZOOM = 15;

/** Position of a tile in the Web Mercator XYZ tiling scheme */
export interface Tile {
    x: number;
    y: number;
    z: number;
}

/**
 * Converts a WGS84 position to the tile that contains it.
 *
 * @param lat - Latitude in decimal degrees.
 * @param lon - Longitude in decimal degrees.
 * @param z - Zoom level. Default to {@link TILE_ZOOM}.
 * @returns The containing tile.
 */
export function latLonToTile(lat: number, lon: number, z = TILE_ZOOM): Tile {
    const n = 2 ** z;
    const latRad = (lat * Math.PI) / 180;
    const x = Math.floor(((lon + 180) / 360) * n);
    const y = Math.floor(((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n);
    return { x, y, z }
}