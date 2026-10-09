import { TILE_SIZE } from "@/utils/geo/tile";
import type { TileLayerName } from "@/utils/geocaptcha/layers";
import type { ApiCredentials } from "@/services/api-config";

/** Identifies one tile image to fetch. */
export interface TileRequest {
    layer: TileLayerName;
    x: number;
    y: number;
    z: number;
}

/**
 * Fetches the image of a tile.
 *
 * @param request - The tile to fetch.
 * @param signal - Aborts the request when the result is no longer needed.
 * @returns An objet URL pointing to the image. The caller owns it and must release it
 * with `URL.revokeObjectURL`.
 */
export type TileFetcher = (request: TileRequest, signal ?: AbortSignal) => Promise<string>;

/**
 * TODO: replace with working routes
 * TEMPORARY stand-in for the tile source: the real tile routes no longer exist.
 *
 * Draws a single random-colored square with the size of a real tile and returns it as an object
 * URL, mimicking a real response. A uniform color gives no visual cue of rotation, so only the
 * drag handle shows the angle while this is in use.
 */
const placeholderTileFetcher: TileFetcher = async () => {
    const canvas = document.createElement('canvas');
    canvas.width = TILE_SIZE;
    canvas.height = TILE_SIZE;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas unavailable');

    ctx.fillStyle = `hsl(${Math.floor(Math.random() * 360)} 65% 55%)`;
    ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);

    const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png'),
    );
    return URL.createObjectURL(blob);
};

/**
 * TODO: return a true fetcher
 * Creates the tile fetcher used by the GeoCaptcha preview.
 *
 * @param _credentials - Getter for the API credentials. Unused by the placeholder; a real fetcher
 * would use it to authenticate its request.
 * @returns A {@link TileFetcher}.
 */
export function createTileFetcher(_credentials: () => ApiCredentials): TileFetcher {
    return placeholderTileFetcher
}