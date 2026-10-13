import { onBeforeUnmount, ref } from "vue";
import type { TileFetcher } from "@/services/tile-source";
import type { Tile } from "@/utils/geo/tile";
import { BACKGROUND_LAYER, foregroundLayerFor } from "@/utils/geocaptcha/layers";
import type { GeoCaptchaMode } from '@/utils/geocaptcha/modes'

/**
 * Loads and owns the two images of a GeoCaptcha (rotating foreground and static background),
 * including the lifetime of their object URLs.
 *
 * @param fetcher - Source of the tile images
 * @returns
 * - `foregroundSrc`, `backgroundSrc`: object URLs of the loaded images,  `''` when none.
 * - `loading`: `true` while a load is in progress.
 * - `error`: user-facing message, `''` when there is no error.
 * - `load`: fetches the images for a tile.
 * - `reset`: cancels any load and releases the images.
 */
export function useGeoCaptchaImages(fetcher: TileFetcher) {
    const foregroundSrc = ref('');
    const backgroundSrc = ref('');
    const loading = ref(false);
    const error = ref('');

    // Incremented on every load/reset to discard responses from a superseded load
    let token = 0;
    let controller: AbortController | null = null;

    const revoke = (url: string) => { if (url) URL.revokeObjectURL(url) }

    /** Revokes the current object URLs and clears both sources. */
    function releaseUrls() {
        revoke(foregroundSrc.value);
        revoke(backgroundSrc.value);
        foregroundSrc.value = '';
        backgroundSrc.value = '';
    }

    /**
     * Fetches the foreground and background images of a tile, in parallel.
     *
     * Previous images are released first. If a newer call starts, or `reset` is called, before
     * this one finishes, its result is discarded and its object URLs revoked.
     *
     * @param tile - Tile to fetch.
     * @param mode - Imagery mode. It selects the foreground layer; the background is always the
     * plan layer.
     * @returns `true` if both images loaded, `false` on a failure of if superseded.
     */
    async function load(tile: Tile, mode: GeoCaptchaMode): Promise<boolean> {
        const current = ++token;
        controller?.abort();
        controller = new AbortController();
        const { signal } = controller;

        releaseUrls()
        loading.value = true;
        error.value = '';

        const results = await Promise.allSettled([
            fetcher({ layer:foregroundLayerFor(mode), ...tile }, signal),
            fetcher({ layer: BACKGROUND_LAYER, ...tile }, signal),
        ]);

        const urls = results.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []));

        if (current !== token) {
            urls.forEach(revoke);
            return false;
        }

        loading.value = false;
        if (urls.length < 2) {
            // Avoid leaking the image which did load
            urls.forEach(revoke);
            error.value = "Les images du GéoCaptcha n'ont pas pu être chargées.";
            return false;
        }

        [foregroundSrc.value, backgroundSrc.value] = urls;
        return true;
    }

    /** Cancels any load in progress and releases the images and the error state. */
    function reset() {
        token++;
        controller?.abort();
        loading.value = false;
        error.value = '';
        releaseUrls();
    }

    onBeforeUnmount(reset);

    return { foregroundSrc, backgroundSrc, loading, error, load, reset };
}