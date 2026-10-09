import {
    API_URL,
    authHeaders,
    type ApiCredentials
} from "@/services/api-config";
import { Tile } from "@/utils/geo/tile";
import type { GeoCaptchaMode } from '@/utils/geocaptcha/modes';

/** Body of the request that creates (or updates) a GeoCaptcha. */
export interface KingpinPayload extends Tile {
    id: string;
    zipcode: string;
    mode: GeoCaptchaMode;
    ok: '1';
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
): Promise<{ mas: string }> {
    const response = await fetch(
        `${API_URL}/api/v1/admin/kingpin`,
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
    if (!response.ok) throw new Error(`Kingpin creation failed (HTTP ${response.status})`);
    return response.json();
}