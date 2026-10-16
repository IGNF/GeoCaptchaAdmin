import { onBeforeUnmount, ref, shallowRef } from "vue";
import type { ApiCredentials } from "@/services/api-config";
import { fetchSessionsPage } from "@/services/session-service";
import { computeKingpinStats, type KingpinStat } from "@/utils/dashboard/kingpin-stats";

const SESSIONS_PER_REQUEST = 100;

/**
 * Loads the sessions and computes the statistics of each GéoCaptcha.
 *
 * @param credentials - Getter for the API credentials, so it always reflects the latest props.
 * @returns
 * - `stats`: one entry per GéoCaptcha.
 * - `loading`: `true` while a load is in progress.
 * - `error`: user-facing message, `''` when there is no error.
 * - `load`: starts (or restarts) the loading.
 *
 * @remarks An ongoing load is canceled when `load` is called again or the component unmounts.
 */
export function useKingpinStats(credentials: () => ApiCredentials) {
    const stats = shallowRef<KingpinStat[]>([]);
    const loading = ref(false);
    const error = ref("");

    let controller: AbortController | null = null;

    async function load() {
        controller?.abort();
        controller = new AbortController();
        const { signal } = controller;

        loading.value = true;
        error.value = "";

        try {
            // TODO: only the first page is read, as before: the statistics cover at most 100 sessions
            const sessions = await fetchSessionsPage(
                1,
                SESSIONS_PER_REQUEST,
                credentials(),
                signal
            );
            stats.value = computeKingpinStats(sessions);
        } catch (err) {
            if (signal.aborted) return; // superseded by a newer load, or unmounted
            console.error(err);
            error.value = "Les statistiques n'ont pas pu être chargées.";
        } finally {
            if (!signal.aborted) loading.value = false;
        }
    }

    onBeforeUnmount(() => controller?.abort());

    return { stats, loading, error, load };
}