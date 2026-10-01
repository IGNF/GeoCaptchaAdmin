import {
    computed,
    onMounted,
    reactive,
    ref,
    shallowRef,
    watch,
} from "vue";
import * as turf from '@turf/turf'
import { useDepartments } from "@/composables/useDepartments";
import {
    fetchDepartmentCommunes,
    findCommuneAt,
    resolveCommune,
} from "@/utils/geo/communes";
import {
    buildLocation,
    type GeoCaptchaLocation,
} from "@/utils/geocaptcha/location";
import type { BBox } from "@/utils/geo/coordinates";
import {isValidZipcode, zipcodePrefix} from "@/utils/geo/zipcode";

/**
 * Formats coordinate for display in validation message and input placeholders.
 */
const fmt = (n: number) => n.toFixed(4);

/**
 * Determines whether a value is empty or contains only whitespace.
 */
const isBlank = (v: string | number) => String(v).trim() === '';

/**
 * Parses a coordinate entered as either a number or a string.
 *
 * String values may use either `.` or `,` as the decimal separator.
 *
 * @param value - Coordinate to parse.
 * @returns The parsed finite number or `null` when the value is empty or cannot be parsed as a
 * number.
 */
function parseCoordinate(value: string | number): number | null {
    if (isBlank(value)) return null;
    const n = typeof value === 'number'
        ? value
        : Number(value.replace(',', '.'));
    return Number.isFinite(n) ? n : null
}

/**
 * Provides the state and validation logic for the manual coordinate entry mode of GeoCaptcha.
 *
 * The composable manages:
 * - department selection
 * - latitude and longitude input
 * - optional postal-code input
 * - department bounding-box hints
 * - field-level validation errors
 * - commune lookup from the entered coordinates
 * - construction of the final {@link GeoCaptchaLocation}
 *
 * Validation is performed in two stages:
 * 1. Local validation checks required fields, coordinate formatting, and postal-code
 *    formatting/prefixes.
 * 2. Geographic validation loads the selected department, checks that the coordinates fall within
 *    its bounds, finds the containing commune, and resolves the final commune information.
 *
 * @returns Reactive form state, department options, validation errors, placeholders, and form
 * actions.
 */
export function useExtraCoordinateMode() {
    const {
        options: departmentOptions,
        load: loadDepartments
    } = useDepartments();

    /** Selected INSEE department code. */
    const departmentCode = ref('');
    /** Latitude entered by the user */
    const latitude = ref<string | number>('');
    /** Longitude entered by the user */
    const longitude = ref<string | number>('');
    /**
     * Optional postal code entered by the user
     *
     * When omitted, the postal code is automatically filled from the resolved commune.
     */
    const zipcode = ref(''); // optional, to complete from commune if empty
    /**
     * Bounding box of the selected department.
     *
     * Used to provide coordinate hints in the input placeholders and to avoid unnecessarily broad
     * coordinate ranges in the UI.
     */
    const bbox = shallowRef<BBox | null>(null);
    /** Validation errors associated with each part of the form */
    const errors = reactive({
        departement: '',
        latitude: '',
        longitude: '',
        zipcode: '',
        location: ''
    });

    /**
     * Placeholder displaying the valid latitude range of the selected department when its geometry
     * has been loaded.
     */
    const latitudePlaceholder = computed(() =>
        bbox.value
            ? `Entrez une latitude entre ${fmt(bbox.value[1])} et ${fmt(bbox.value[3])}`
            : 'Entrez une latitude'
    );

    /**
     * Placeholder displaying the valid longitude range of the selected department when its geometry
     * has been loaded.
     */
    const longitudePlaceholder = computed(() =>
        bbox.value
            ? `Entrez une longitude entre ${fmt(bbox.value[0])} et ${fmt(bbox.value[2])}`
            : 'Entrez une longitude',
    );

    /** Clear all validation errors */
    const clearErrors = () => Object.assign(errors, {
        departement: '',
        latitude: '',
        longitude: '',
        zipcode: '',
        location: ''
    });

    /**
     * Checks whether at least one validation error is currently present.
     */
    const hasErrors = () => Object.values(errors).some(Boolean);

    // Load the list of departments when the composable is mounted.
    onMounted(loadDepartments)

    /**
     * Loads the selected department's commune geometry whenever the department changes.
     *
     * The resulting bounding box is used for coordinate placeholders and early validation. If the
     * user changes department while the request is still in flight, its result is ignored.
     */
    watch(departmentCode, async (code) => {
        bbox.value = null
        clearErrors()
        if (!code) return
        try {
            const communes = await fetchDepartmentCommunes(code);
            if (departmentCode.value === code) bbox.value = turf.bbox(communes) as BBox;
        } catch {
            if (departmentCode.value === code) {
                errors.departement = 'Impossible de charger les limites du département.'
            }
        }
    })

    /**
     * Resets the form fields, department selection, and validation errors.
     */
    function reset() {
        departmentCode.value = ''
        latitude.value = ''
        longitude.value = ''
        zipcode.value = ''
        clearErrors()
    }

    /**
     * Validates the entered coordinates and resolves them to a commune.
     *
     * Validation is performed locally first, without network requests.
     * If those checks pass, the selected department's geometry is loaded and used to verify the
     * coordinates fall within the department and inside one of its communes.
     *
     * If the postal code is omitted, it is automatically populated from the resolved commune.
     *
     * @returns The resolved GeoCaptcha location when validation succeeds, or `null` when
     * validation fails.
     *
     * @remark
     * Validation errors are exposed through {@link errors}. A failed network request is reported
     * through the `location` error.
     */
    async function validate(): Promise<GeoCaptchaLocation | null> {
        clearErrors()

        // 1. Local Validation - no network request required.
        if (!departmentCode.value) errors.departement = 'Le département est obligatoire.'

        const lat = parseCoordinate(latitude.value)
        const lon = parseCoordinate(longitude.value)
        if (lat === null) {
            errors.latitude = isBlank(latitude.value)
                ? 'La latitude est obligatoire.'
                : 'La latitude doit être un nombre valide.'
        }
        if (lon === null) {
            errors.longitude = isBlank(longitude.value)
                ? 'La longitude est obligatoire.'
                : 'La longitude doit être un nombre valide.'
        }

        if (zipcode.value) {
            const prefix = zipcodePrefix(departmentCode.value);
            if (!isValidZipcode(zipcode.value)) {
                errors.zipcode = 'Le code postal doit comporter exactement 5 chiffres.'
            } else if (departmentCode.value && !zipcode.value.startsWith(prefix)) {
                errors.zipcode = `Le code postal doit commencer par ${prefix}.`
            }
        }

        if (hasErrors() || lat === null || lon === null) return null

        // 2. Geographic validation using the selected department geometry
        try {
            const communes = await fetchDepartmentCommunes(departmentCode.value);
            const [minLon, minLat, maxLon, maxLat] = turf.bbox(communes);

            if (lat < minLat || lat > maxLat) {
                errors.latitude = `La latitude doit être entre ${fmt(minLat)} et ${fmt(maxLat)}.`
            }

            if (lon < minLon || lon > maxLon) {
                errors.longitude = `La longitude doit être entre ${fmt(minLon)} et ${fmt(maxLon)}.`
            }

            if (hasErrors()) return null

            // Find the actual commune rather than relying only on the department's bounding box.
            const feature = findCommuneAt(
                communes,
                [lon, lat]
            );

            if (!feature) {
                errors.location = 'Ces coordonnées ne se trouvent pas dans le département choisi.'
                return null
            }

            // Reuse commune properties from th GeoJSON feature when possible, falling back to
            // reverse geocoding when necessary.
            const commune = await resolveCommune(
                [lon, lat],
                feature,
            );
            if (!commune) {
                errors.location = 'Aucune commune trouvée à ces coordonnées.'
                return null
            }

            const location = buildLocation(
                [lon, lat],
                commune,
                zipcode.value,
            );

            // Complete the postal-code field when it was left empty.
            zipcode.value = location.zipcode

            return location
        } catch {
            errors.location = 'Erreur réseau : vérification impossible, réessayez.'
            return null
        }
    }

    return {
        departmentCode, departmentOptions,
        latitude, longitude, zipcode,
        latitudePlaceholder, longitudePlaceholder,
        errors, validate, reset,
    }
}