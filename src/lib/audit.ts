/**
 * Compatibility shim only. The production database writes audit entries from
 * triggers, so frontend code must never insert into audit_logs directly.
 */
export async function logAction(input: {
  action: string;
  entityTable?: string;
  entityId?: string | null;
  summary?: string;
  metadata?: Record<string, unknown>;
}) {
  void input;
}
