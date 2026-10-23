import {
    API_URL,
    authHeaders,
    type ApiCredentials
} from "@/services/api-config";
import type { Tile } from "@/utils/geo/tile";
import type { GeoCaptchaMode } from '@/utils/geocaptcha/modes';

/** Body of the request that creates (or updates) a GeoCaptcha. */
export interface KingpinPayload extends Tile {
    id: string;
    zipcode: string;
    mode: GeoCaptchaMode;
    ok: '1';
}

/** Coordinates of a tile, as returned by the backend (assumed to be at `TILE_ZOOM`). */
export interface TileCoord {
    x: number;
    y: number;
}

/** One page of the GeoCaptcha list. Only fields the heatmap needs are typed */
export interface KingpinPage {
    kingpin: Array<{ tileCoord?: TileCoord }>;
    /** Total number of GeoCaptcha on the backend, across all pages */
    nbTotalObjects?: number;
}

/**
 * Creates or updates a GeoCaptcha ("Kingpin") on the backend.
 *
 * @param payload - The GeoCaptcha to save.
 * @param credentials - API credentials used to authenticate the request.
 * @returns The backend's confirmation message.
 * @throws If the backend answers with a non-2xx status or the request fails.
 */
export async function saveKingpin(
    payload: KingpinPayload,
    credentials: ApiCredentials,
): Promise<{ msg: string }> {
    const response = await fetch(
        `${API_URL}/admin/kingpin`,
        {
            method: 'POST',
            headers: {
                Accept: '*/*',
                'Content-Type': 'application/json',
                ...authHeaders(credentials),
            },
            body: JSON.stringify(payload),
        }
    );
    if (!response.ok) {
        const detail = await response.text().catch(() => '');
        throw new Error(`Kingpin creation failed (HTTP ${response.status}) ${detail}`);
    }

    const body = await response.json();

    if (typeof body?.msg !== 'string') {
        throw new Error('Unexpected response from the kingpin endpoint');
    }

    return body;
}

/**
 * Fetches one page of GeoCaptchas.
 *
 * @param firstObject - 1-based index of the first object in the page.
 * @param nbObjects - Maximum number of objects in the page.
 * @param credentials - API credentials used to authenticate the request.
 * @param signal - Abort the request when the result is no longer needed.
 * @returns The page.
 * @throws If the request fails, the status is not 2xx or the payload has an unexpected shape.
 */
export async function fetchKingpinPage(
    firstObject: number,
    nbObjects: number,
    credentials: ApiCredentials,
    signal?: AbortSignal,
): Promise<KingpinPage> {
    const params = new URLSearchParams({
        firstObject: String(firstObject),
        nbObjects: String(nbObjects),
    });
    const response = await fetch(`${API_URL}/admin/kingpin?${params}`, {
        headers: { Accept: 'application/json', ...authHeaders(credentials) },
        signal,
    });
    if (!response.ok) {
        const detail = await response.text().catch(() => '');
        throw new Error(`Kingpin list request failed (HTTP ${response.status}) ${detail}`);
    }

    const data = await response.json();
    if (!Array.isArray(data?.kingpin)) throw new Error('Unexpected kingpin list format');
    return data as KingpinPage;
}