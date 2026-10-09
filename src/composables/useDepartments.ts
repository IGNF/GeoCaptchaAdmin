import { computed, ref } from "vue";
import {
    fetchDepartments,
    type Department
} from "@/utils/geo/departments";

/**
 * List of departments loaded from the geographic API.
 *
 * The ref is shared by all instances of {@link useDepartments}.
 */
const departments = ref<Department[]>([]);
let loading: Promise<void> | null = null;

/**
 * Provides access to the list of French departments and options suitable for use in a selection
 * component.
 *
 * Department data is loaded lazily by calling {@link load}. The request is shared across all
 * instances of this composable, so concurrent calls do not trigger duplicate API requests.
 *
 * @returns The shared department list, loading promise, selection options and loader function.
 */
export function useDepartments() {
    /**
     * Loads the department list if it has not already been requested.
     *
     * Concurrent calls share the same inflight request. If the request fails, the cched promise is
     * cleared so that a subsequent call can retry.
     *
     * @returns A promise which resolves when the departments hacve loaded.
     * @throws {Error} If fetching the departments fails.
     */
    function load(): Promise<void> {
        loading ??= fetchDepartments()
            .then(list => { departments.value = list })
            .catch(err => { loading = null; throw err });
        return loading;
    }

    /**
     * Department options formatted for use in  selection component.
     *
     * Each option displays the department code followed by its name.
     */
    const options = computed(() =>
        departments.value.map(d => ({
            value: d.code,
            text: `${d.code} - ${d.nom}`
        }))
    );

    return { departments, options, load };
}