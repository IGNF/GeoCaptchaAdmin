import { onMounted, ref } from 'vue'
import { useFranceGeometry } from "@/composables/useFranceGeometry";
import { fetchCommuneAt } from "@/utils/geo/communes";
import {
    buildLocation,
    type GeoCaptchaLocation,
} from "@/utils/geocaptcha/location";
import type { BBox } from "@/utils/geo/coordinates";

export type PickResult =
    | { status: 'ok'; location: GeoCaptchaLocation }
    | { status: 'outside' } // Box out of France (or mostly sea)
    | { status: 'error' } // network error
    | {status: 'stale' } // a recent selection took over : ignore

const MAX_ATTEMPTS = 5;

export function useMapMode() {
    const { load, randomPointInFrance } = useFranceGeometry();

    const location = ref<GeoCaptchaLocation | null>(null);
    const loading = ref(false);
    let token = 0 // invalidates responses from an obsolete selection

    onMounted(() => { load().catch(() => {}) })

    async function pick(bbox: BBox):Promise<PickResult> {
        const current = ++token;
        location.value = null;
        loading.value = true;

        try {
            await load()

            for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
                const point = randomPointInFrance(bbox);
                if (!point) break;

                const commune = await fetchCommuneAt(point);
                if (current !== token) return { status: 'stale' };
                if (!commune) continue;

                const result = buildLocation(point, commune);
                location.value = result;
                return { status: 'ok', location: result };
            }
            return { status: 'outside' };
        } catch {
            return current === token ? { status: 'error' } : { status: 'stale' };
        } finally {
            if (current === token) loading.value = false;
        }
    }

    function reset() {
        token++
        location.value = null;
        loading.value = false;
    }

    return { location, loading, pick, reset };
}