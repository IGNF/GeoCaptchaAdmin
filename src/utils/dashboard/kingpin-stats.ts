import type { Session } from "@/services/session-service";

/** Statistics of one GeoCaptcha (challenge), computed from its sessions. */
export interface KingpinStat {
    name: string;
    attempts: number;
    successes: number;
    /** Success percentage, with one decimal. */
    successRate: number;
    /** Mean duration of the successful attempts, in seconds, with one decimal. */
    avgTime: number;
}

export type StatTag = "all" | "success" | "failed";
export type StatSortKey = "name" | "successRate" | "attempts";
export type SortOrder = "asc" | "desc";

/**
 * Thresholds of the "Réussis" and "Échoués" tag filters.
 * They are not aligned with the gauge color steps (60 / 75 / 85), see `utils/gauge.ts`.
 */
export const SUCCESS_FILTER_ABOVE = 70;
export const FAILED_FILTER_AT_MOST = 50;

const oneDecimal = (value: number): number => Number(value.toFixed(1));

/**
 * Groups sessions by challenge name and computes the statistics of each group.
 * Sessions without a challenge name are ignored.
 *
 * @param sessions - The sessions to analyze.
 * @returns One entry per challenge name.
 */
export function computeKingpinStats(sessions: Session[]): KingpinStat[] {
    const groups = new Map<string, {
        attempts: number;
        successes: number;
        totalTime: number;
    }>();

    for (const session of sessions) {
        const name = session?.captcha?.challenge?.name;
        if (!name) continue;

        const group = groups.get(name) ?? {
            attempts: 0,
            successes: 0,
            totalTime: 0,
        };
        group.attempts++;

        if (session.success) {
            group.successes++;
            if (session.begin && session.end) {
                const seconds = (
                    new Date(session.end).getTime() -
                    new Date(session.begin).getTime()
                ) / 1000;
                if (seconds > 0) group.totalTime += seconds;
            }
        }
        groups.set(name, group);
    }

    return Array.from(groups, ([name, {
        attempts,
        successes,
        totalTime,
    }]) => ({
        name,
        attempts,
        successes,
        successRate: oneDecimal((successes / attempts) * 100),
        avgTime: successes > 0 ? oneDecimal(totalTime / successes) : 0,
    }));
}

/**
 * Keeps the stats whose name contains the query and that match the tag.
 *
 * @param stats - The stats to filter.
 * @param query - Text searched in the name, case-insensitive. Blank means no search.
 * @param tag - `'success'` keeps rates above {@link SUCCESS_FILTER_ABOVE}, `'failed'` keeps
 * rates at or below {@link FAILED_FILTER_AT_MOST}, `'all'` keeps everything.
 */
export function filterStats(
    stats: KingpinStat[],
    query: string,
    tag: StatTag,
): KingpinStat[] {
    const needle = query.trim().toLowerCase();
    return stats.filter((stat) => {
        if (needle && !stat.name.toLowerCase().includes(needle)) return false;
        if (tag === "success") return stat.successRate > SUCCESS_FILTER_ABOVE;
        if (tag === "failed") return stat.successRate <= FAILED_FILTER_AT_MOST;
        return true;
    });
}

/**
 * Returns a sorted copy of the stats.
 *
 * @param stats - The stats to sort. Not modified.
 * @param key - Field to sort by. `'name'` uses locale-aware string comparison.
 * @param order - Sort direction.
 */
export function sortStats(
    stats: KingpinStat[],
    key: StatSortKey,
    order: SortOrder,
): KingpinStat[] {
    const direction = order === "asc" ? 1 : -1;
    return [...stats].sort((a, b) =>
        key === "name" ? direction * a.name.localeCompare(b.name) : direction * (a[key] - b[key]),
    );
}