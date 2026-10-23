// TODO: replace by actual .ENV
/** Base URL of the backend API. */
export const API_URL: string = 'http://127.0.0.1:3000/api/v1';

/** Credentials identifying the calling application of the backend. */
export interface ApiCredentials {
    apiKey: string
    appId: string
}

/**
 * Builds the authentication headers expected by the backend.
 *
 * @param credentials - The API credentials.
 * @returns Headers to spread into a `fetch` call.
 */
export const authHeaders = ({ apiKey, appId }: ApiCredentials) => ({
    'x-api-key': apiKey,
    'x-app-id': appId,
});