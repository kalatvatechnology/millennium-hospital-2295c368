import { supabase } from "@/integrations/supabase/client";

export async function logAction(input: {
  action: string;
  entityTable?: string;
  entityId?: string | null;
  summary?: string;
  metadata?: Record<string, unknown>;
}) {
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) return;
  await supabase.from("audit_logs").insert({
    actor_id: user.id,
    actor_email: user.email ?? null,
    action: input.action,
    entity_table: input.entityTable ?? null,
    entity_id: input.entityId ?? null,
    summary: input.summary ?? null,
    metadata: (input.metadata ?? {}) as never,
  });
}
