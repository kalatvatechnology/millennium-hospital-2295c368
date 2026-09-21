import { useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Permission, Role } from "@/lib/permissions";
import { getStaffAccess, getStaffProfile } from "@/lib/data/staff-repository";

type Profile = { id: string; full_name: string | null; email: string | null; doctor_id: string | null };

export function useAdminSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Set<Permission>>(new Set());
  const [isStaff, setIsStaff] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      if (!next) {
        setRoles([]);
        setPermissions(new Set());
        setIsStaff(false);
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
      try {
        const [access, staffProfile] = await Promise.all([getStaffAccess(session.user.id), getStaffProfile(session.user.id)]);
        if (!active) return;
        setRoles(access.roles);
        setPermissions(access.permissions);
        setIsStaff(access.isStaff);
        setProfile(staffProfile ? { id: staffProfile.id, full_name: staffProfile.fullName, email: staffProfile.email, doctor_id: staffProfile.doctorId } : null);
        setError(null);
      } catch (nextError) {
        if (!active) return;
        setRoles([]);
        setPermissions(new Set());
        setIsStaff(false);
        setProfile(null);
        setError(nextError);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [session]);

  const can = useMemo(() => (permission: Permission) => permissions.has(permission), [permissions]);

  return {
    session,
    profile,
    roles,
    loading,
    error,
    isStaff,
    can,
    signOut: () => supabase.auth.signOut(),
  };
}
