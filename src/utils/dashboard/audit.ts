export type AuditAction = "CREATE" | "UPDATE" | "DELETE" | "ERROR" | "NAVIGATE" | "INFO";

/** One entry of the audit log. */
export interface AuditLog {
    action: AuditAction;
    route: string;
    description: string;
    /** Display string, in the user's locale. */
    timestamp: string;
    /** Used for sorting. */
    rawTimestamp: Date;
}

export type AuditBadgeType = "success" | "info" | "error" | "warning" | "new";

const BADGE_TYPES: Record<AuditAction, AuditBadgeType | undefined> = {
    CREATE: "success",
    UPDATE: "info",
    DELETE: "error",
    ERROR: "warning",
    NAVIGATE: "new",
    INFO: undefined, // neutral badge
};

/**
 * Maps an audit action to the `DsfrBadge` type that represents it.
 *
 * @param action - The action of a log entry.
 * @returns The badge type, or `undefined` (neutral badge) for unknown or informational actions.
 */
export function auditBadgeType(action: unknown): AuditBadgeType | undefined {
    return BADGE_TYPES[action as AuditAction];
}