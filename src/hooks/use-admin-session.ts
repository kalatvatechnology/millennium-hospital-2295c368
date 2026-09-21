import { useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { isRole, permissionsForRoles, type Permission, type Role } from "@/lib/permissions";
import { backendFeatures } from "@/lib/data/backend";

type Profile = { id: string; full_name: string | null; email: string | null; doctor_id: string | null };

export function useAdminSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      if (!next) {
        setRoles([]);
        setProfile(null);
        setLoading(false);
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (!data.session) setLoading(false);
    });
    return () => subscription.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return;
    let active = true;
    setLoading(true);
    void (async () => {
      const rolePromise = (supabase as any).from("user_roles").select("role").eq("user_id", session.user.id);
      const profilePromise = backendFeatures.profiles
        ? supabase.from("profiles").select("id, full_name, email, doctor_id").eq("id", session.user.id).maybeSingle()
        : Promise.resolve({ data: null, error: null });
      const [roleResult, profileResult] = await Promise.all([rolePromise, profilePromise]);
      if (!active) return;
      setRoles((roleResult.data ?? []).map((row: { role: unknown }) => row.role).filter(isRole));
      setProfile(profileResult.data ?? null);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [session]);

  const permissions = useMemo(() => permissionsForRoles(roles), [roles]);

  return {
    session,
    profile,
    roles,
    loading,
    isStaff: roles.length > 0,
    can: (permission: Permission) => permissions.has(permission),
    signOut: () => supabase.auth.signOut(),
  };
}
