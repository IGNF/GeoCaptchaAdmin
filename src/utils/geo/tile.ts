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

/**
 * Converts a tile to the geographic position of its center.
 *
 * @param x - Column index.
 * @param y - Row index.
 * @param z - Zoom level. Defaults to {@link TILE_ZOOM}.
 * @returns `[lon, lat]` in WGS84 degrees (the axis order OpenLayers expects).
 */
export function tileCenterToLonLat(x: number, y: number, z = TILE_ZOOM): [number, number] {
    const n = 2 ** z;
    const lon = ((x + 0.5) / n) * 360 - 180;
    const lat = (Math.atan(Math.sinh(Math.PI * (1 - (2 * (y + 0.5)) / n))) * 180) / Math.PI;
    return [lon, lat];
}