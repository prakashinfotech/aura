"use client";

import * as React from "react";
import { createClient } from "@aura/db/client";
import { useAuthStore } from "@/stores/auth-store";

export function useAuth() {
  const { user, session, profile, isLoading, setSession, setLoading } = useAuthStore();
  const supabase = React.useMemo(() => createClient(), []);

  React.useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase, setSession, setLoading]);

  async function signOut() {
    await supabase.auth.signOut();
    useAuthStore.getState().reset();
  }

  return { user, session, profile, isLoading, signOut };
}
