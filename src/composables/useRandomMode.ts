import { ref } from 'vue'
import * as turf from '@turf/turf'
import { useDepartments } from "@/composables/useDepartments";
import {
    fetchDepartmentCommunes,
    resolveCommune,
    findCommuneAt,
} from "@/utils/geo/communes";
import { randomPointWhere } from "@/utils/geo/random";
import type { BBox } from "@/utils/geo/coordinates";
import {
    buildLocation,
    type GeoCaptchaLocation,
} from "@/utils/geocaptcha/location";
import type { Department } from "@/utils/geo/departments";

/**
 * Provides the random-location generation mode for GeoCaptcha.
 *
 * Each call to {@link roll} selects a random department, loads its commune geometries, and
 * attempts to generate a random point that falls inside one of its communes. The resulting point
 * is then resolved to commune information and exposed as a {@link GeoCaptchaLocation}.
 *
 * @param maxAttempts - Maximum number of department/point-generation attempts to make before
 * giving up. Defaults to `5`.
 *
 * @returns Reactive state containing the selected department, generated location, loading state,
 * error message, and generation function.
 */
export function useRandomMode(maxAttempts = 5) {
    const { departments, load } = useDepartments();

    /** Department selected during the latest successful generation. */
    const department = ref<Department | null>(null);
    /** Location generated during the latest successful generation */
    const location = ref<GeoCaptchaLocation | null>(null);
    /** Whether a location is currently being generated */
    const loading = ref(false);
    /** Error message from the latest failed generation attempt */
    const error = ref('');

    /**
     * Generates a random location in a randomly selected department.
     *
     * The department list is loaded before generation. For each attempt, a department is selected
     * at random and its commune geometries are loaded. A random point is then sampled from the
     * department's bounding box until a point belonging to one of its communes is found.
     *
     * If a valid location cannot be generated within `maxAttempts`, the function returns `null`
     * and exposes an error message through {@link error}.
     *
     * Concurrent calls are ignored while a generation is already in progress.
     *
     * @returns The generated location, or `null` if generation fails or is already in progress.
     */
    async function roll(): Promise<GeoCaptchaLocation | null> {
        if (loading.value) return null
        loading.value = true;
        error.value = ''

        try {
            await load()
            if (!departments.value.length) {
                throw new Error('Aucun département')
            }

            for (let attempt = 0; attempt < maxAttempts; attempt++) {
                const dept = departments.value[
                    Math.floor(Math.random() * departments.value.length)
                ];
                const communes = await fetchDepartmentCommunes(dept.code);

                const point = randomPointWhere(
                    turf.bbox(communes) as BBox,
                    (p) => findCommuneAt(communes, p) !== undefined,
                );
                if (!point) continue

                const commune = await resolveCommune(point, findCommuneAt(communes, point))
                if (!commune) continue

                department.value = dept
                location.value = buildLocation(point, commune)
                return location.value
            }

            error.value = 'Impossible de générer une localisation, veuillez réessayer.'
            return null
        } catch {
            error.value = 'Erreur réseau lors de la génération, veuillez réessayer.'
            return null
        } finally {
            loading.value = false
        }
    }

    return {
        department,
        location,
        loading,
        error,
        roll,
    }
}