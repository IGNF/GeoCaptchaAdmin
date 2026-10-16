import {
    API_URL,
    authHeaders,
    type ApiCredentials,
} from "@/services/api-config";

/** The part of the session the dashboard reads. */
export interface Session {
    _id?: string;
    success?: boolean;
    begin?: string;
    end?: string;
    captcha?: {
        challenge?: {
            name?: string;
        };
    };
}

/**
 * Fetches one page of sessions.
 *
 * @param firstObject - 1-based index of the first object of the page.
 * @param nbObjects - Maximum number of sessions in the page.
 * @param credentials - API credentials used to authenticate the request.
 * @param signal - Aborts the request when the result is no longer needed.
 * @returns The sessions of the page (empty when the response has none).
 * @throws If the request fails or the status is not 2xx.
 */
export async function fetchSessionsPage(
    firstObject: number,
    nbObjects: number,
    credentials: ApiCredentials,
    signal?: AbortSignal,
): Promise<Session[]> {
    const params = new URLSearchParams({
        firstObject: String(firstObject),
        nbObjects: String(nbObjects),
    });
    const response = await fetch(
        `${API_URL}/admin/session?${params}`, {
        headers: { Accept: "application/json", ...authHeaders(credentials) },
        signal,
    });
    if (!response.ok) {
        const detail = await response.text().catch(() => "");
        throw new Error(`Session list request failed (HTTP ${response.status}) ${detail}`);
    }

    const data = await response.json();
    return Array.isArray(data?.sessions) ? data.sessions : [];
}

/**
 * Deletes a session.
 *
 * @param id - MongoDB session identifier.
 * @param credentials - API credentials used to authenticate the request.
 * @throws If the request fails or the status is not 2xx.
 */
export async function deleteSession(
    id: string,
    credentials: ApiCredentials,
): Promise<void> {
    if (!id) {
        throw new Error("Cannot delete session: missing session ID");
    }

    const response = await fetch(
        `${API_URL}/admin/session/${encodeURIComponent(id)}`,
        {
            method: "DELETE",
            headers: {
                Accept: "application/json",
                ...authHeaders(credentials),
            },
        },
    );

    if (!response.ok) {
        const detail = await response.text().catch(() => "");
        throw new Error(
            `Session deletion failed (HTTP ${response.status}) ${detail}`,
        );
    }
}