import { computed, ref, watch, type Ref } from "vue";
import {
    filterStats,
    sortStats,
    type KingpinStat,
    type SortOrder,
    type StatSortKey,
    type StatTag,
} from "@/utils/dashboard/kingpin-stats";

/**
 * Search, tag filter, sort and paging of a list of stats.
 *
 * @param stats - The stats to browse.
 * @param perPage - Number of items per page. Defaults to 9.
 * @returns
 * - `searchQuery`, `selectedTag`, `sortKey`, `sortOrder`: the view state, to bind to the controls.
 * - `currentPage`: 0-based index of the displayed page.
 * - `pageItems`: the stats of the displayed page.
 * - `pageCount`: number of pages, at least 1.
 * - `totalCount`: number of stats after filtering, before paging.
 * - `toggleSortOrder`: flips the sort direction.
 *
 * @remarks
 * Changing the search, the tag or the sort goes back to the first page. Changing the sort
 * key resets the direction to descending, as before.
 */
export function useStatsList(stats: Ref<KingpinStat[]>, perPage = 9) {
    const searchQuery = ref("");
    const selectedTag = ref<StatTag>("all");
    const sortKey = ref<StatSortKey>("name");
    const sortOrder = ref<SortOrder>("asc");
    const currentPage = ref(0);

    const visible = computed(() =>
        sortStats(
            filterStats(stats.value, searchQuery.value, selectedTag.value),
            sortKey.value,
            sortOrder.value,
        ),
    );
    const totalCount = computed(() => visible.value.length);
    const pageCount = computed(() => Math.max(1, Math.ceil(totalCount.value / perPage)));
    const pageItems = computed(() =>
        visible.value.slice(currentPage.value * perPage, (currentPage.value + 1) * perPage),
    );

    const toggleSortOrder = () => {
        sortOrder.value = sortOrder.value === "asc" ? "desc" : "asc";
    };

    watch([searchQuery, selectedTag, sortKey, sortOrder], () => {
        currentPage.value = 0;
    });
    watch(sortKey, () => {
        sortOrder.value = "desc";
    });
    // The stats can shrink (reload, rejection): never stay on a page that no longer exists
    watch(pageCount, (count) => {
        if (currentPage.value > count - 1) currentPage.value = count - 1;
    });

    return {
        searchQuery,
        selectedTag,
        sortKey,
        sortOrder,
        currentPage,
        pageItems,
        pageCount,
        totalCount,
        toggleSortOrder,
    };
}