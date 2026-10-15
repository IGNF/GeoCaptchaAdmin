import {onBeforeUnmount, ref, shallowRef} from "vue";
import type { ApiCredentials } from '@/services/api-config'
import { fetchKingpinPage, type TileCoord } from '@/services/kingpin-service'

interface Options {
    /** Number of GeoCaptchas requested per page. Defaults to 100 */
    pageSize?: number
    /** Safety cap on the number of pages fetched. Defaults to 50 (5000 GeoCaptchas). */
    maxPages?: number
}

/**
 * Loads the tiles of every GeoCaptcha, page by page, without duplicates.
 *
 * @param credentials - Getter for the API credentials, so it always reflects the latest props.
 * @param options - Paging options.
 * @returns
 * - `tiles`: unique tiles, one per distinct `(x, y)`.
 * - `loading`: `true` while loading is in progress.
 * - `error`: user-facing message, `''` when there is no error.
 * - `truncated`: `true` when `maxPages` was reached before last page.
 * - `load`: starts (or restarts) the loading.
 */
export function useKingpinTiles(credentials: () => ApiCredentials, options: Options = {}) {
    const { pageSize = 100, maxPages = 50 } = options;
    const tiles = shallowRef<TileCoord[]>([]);
    const loading = ref(false);
    const error = ref('');
    const truncated = ref(false);

    let controller: AbortController | null = null;

    async function load() {
        controller?.abort();
        controller = new AbortController();
        const { signal } = controller;

        const loadCredantials = credentials();

        loading.value = true;
        error.value = '';
        truncated.value = false;

        // Keyed by tile: several GeoCaptchas on the same tile count once
        const unique = new Map<string, TileCoord>();

        try {
            let firstObject = 1;
            let fetched = 0;
            let complete = false;

            for (let page = 0; page < maxPages && !complete; page++) {
                const { kingpin, nbTotalObjects } = await fetchKingpinPage(
                    firstObject,
                    pageSize,
                    loadCredantials,
                    signal,
                );

                for (const { tileCoord } of kingpin) {
                    if (tileCoord) unique.set(`${tileCoord.x}_${tileCoord.y}`, tileCoord);
                }

                fetched += kingpin.length;
                firstObject += pageSize;
                complete = kingpin.length < pageSize || (nbTotalObjects !== undefined && fetched >= nbTotalObjects);
            }

            if (signal.aborted) return;
            truncated.value = !complete;
            tiles.value = Array.from(unique.values())
        } catch (err) {
            if (signal.aborted) return // superseded by a new load, or unmounted
            console.error(err)
            error.value = 'Les données de la carte de chaleur n’ont pas pu être chargées.'
        } finally {
            if (!signal.aborted) loading.value = false;
        }
    }

    onBeforeUnmount(() => controller?.abort());

    return { tiles, loading, error, truncated, load };
}