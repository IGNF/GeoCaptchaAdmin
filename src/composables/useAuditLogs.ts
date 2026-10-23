import { computed, ref, watch } from "vue";
import type { AuditLog } from "@/utils/dashboard/audit";

/** Audit service, to re-enable together with the calls below. */
//import { auditService } from '@/services/audit-service';

/**
 * Audit log entries with a route filter and paging state for a data table.
 *
 * @returns
 * - `logs`: all entries.
 * - `filterRoute`: route to keep, `''` for all.
 * - `routeOptions`: the distinct routes, as select options.
 * - `rows`: the entries to display, newest first, as table rows.
 * - `currentPage`, `rowsPerPage`: paging state to bind to the table (`currentPage` is 0-based).
 * - `load`, `clearFilters`, `clearAll`: actions.
 *
 * @remarks The audit service is currently disabled, so `logs` stays empty until it is re-enabled.
 */
export function useAuditLogs() {
    const logs = ref<AuditLog[]>([]);
    const filterRoute = ref("");
    const currentPage = ref(0);
    const rowsPerPage = ref(10);

    const routeOptions = computed(() =>
        Array.from(new Set(logs.value.map((log) => log.route)), (route) => ({
            value: route,
            text: route,
        })),
    );

    const rows = computed(() =>
        logs.value
            .filter((log) => !filterRoute.value || log.route === filterRoute.value) // returns a copy
            .sort((a, b) => b.rawTimestamp.getTime() - a.rawTimestamp.getTime())
            .map(({ action, route, description, timestamp }) => ({
                action,
                route,
                description,
                timestamp,
            })),
    );

    /** Loads the entries from the audit service. */
    function load() {
        // logs.value = auditService.getLogs();
    }

    function clearFilters() {
        filterRoute.value = "";
        currentPage.value = 0;
    }

    /** Deletes every entry, then records that it happened. */
    function clearAll() {
        // auditService.clearLogs();
        const now = new Date();
        logs.value = [
            {
                action: "INFO",
                route: "audit",
                description: "Tous les logs ont été supprimés",
                timestamp: now.toLocaleString(),
                rawTimestamp: now,
            },
        ];
        currentPage.value = 0;
    }

    watch(filterRoute, () => {
        currentPage.value = 0;
    });

    return { logs, filterRoute, routeOptions, rows, currentPage, rowsPerPage, load, clearFilters, clearAll };
}