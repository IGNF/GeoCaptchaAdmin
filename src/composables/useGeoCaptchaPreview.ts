import { ref, shallowRef } from "vue";
import { useGeoCaptchaImages } from "@/composables/useGeoCaptchaImages";
import type { ApiCredentials } from "@/services/api-config";
import { saveKingpin, type KingpinPayload } from "@/services/kingpin-service";
import { createTileFetcher, type TileFetcher } from "@/services/tile-source";
import { latLonToTile } from "@/utils/geo/tile";
import { generateGeoCaptchaId } from "@/utils/geocaptcha/id";
import type { GeoCaptchaLocation } from '@/utils/geocaptcha/location'
import type { GeoCaptchaMode } from '@/utils/geocaptcha/modes'

/**
 * Manages the lifecycle of a GeoCaptcha preview: preparing it, saving it and cleaning up.
 *
 * - `open` computes the tile, creates a single id and loads the images.
 * - `save` persists the GeoCaptcha with that same id.
 * - `close` releases everything.
 *
 * @param credentials - Getter for the API credentials.
 * @param fetcher - Source of the tile images. Defaults to {@link createTileFetcher}.
 * @returns
 * - `foregroundSrc`, `backgroundSrc`, `loading`, `error`: image state, see
 * {@link useGeoCaptchaImages}.
 * - `saving`: `true` while the save request is in flight.
 * - `saveError`: user-facing message when saving failed, `''` otherwise.
 * - `open`, `save`, `close`: lifecycle actions.
 */
export function useGeoCaptchaPreview(
    credentials: () => ApiCredentials,
    fetcher: TileFetcher = createTileFetcher(credentials),
) {
    const images = useGeoCaptchaImages(fetcher);
    const payload = shallowRef<KingpinPayload | null>(null);
    const saving = ref(false);
    const saveError = ref('');

    /**
     * Prepares a preview for a location and starts loading its images.
     *
     * The id is generated here, once, and reused by {@link save}.
     *
     * @param location - Validated location to generate the GeoCaptcha for.
     * @param mode - Selected imagery mode.
     */
    async function open(location: GeoCaptchaLocation, mode: GeoCaptchaMode) {
        const tile = latLonToTile(location.latitude, location.longitude);
        payload.value = {
            id: generateGeoCaptchaId(),
            ...tile,
            zipcode: location.zipcode,
            mode,
            ok:'1',
        }
        saveError.value = '';
        await images.load(tile, mode);
    }

    /**
     * Saves the previewed GeoCaptcha.
     *
     * Retrying after a failure reuses the same id, which is safe because the endpoint is an
     * upsert.
     *
     * @returns The saved id, or `null` if nothing is open, a save is already running, or the
     * request failed.
     */
    async function save(): Promise<string | null> {
        if (!payload.value || saving.value) return null;
        saving.value = true;
        saveError.value = '';
        try {
            await saveKingpin(payload.value, credentials());
            return payload.value.id;
        } catch (error) {
            console.error(error);
            saveError.value = "Le GéoCaptcha n'a pas pu être enregistré, veuillez réessayer."
            return null;
        } finally {
            saving.value = false;
        }
    }

    /** Discards the preview: cancels loading, releases the images and clears the state. */
    function close() {
        images.reset();
        payload.value = null;
        saveError.value = '';
    }

    return {
        foregroundSrc: images.foregroundSrc,
        backgroundSrc: images.backgroundSrc,
        loading: images.loading,
        error: images.error,
        saving,
        saveError,
        open,
        save,
        close,
    }
}
