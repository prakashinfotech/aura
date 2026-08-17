import { create } from "zustand";
import type { Session, User } from "@supabase/supabase-js";

interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  loyalty_points: number;
  tier: "bronze" | "silver" | "gold" | "platinum";
}

interface AuthStore {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  setSession: (session: Session | null) => void;
  setProfile: (profile: Profile | null) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  session: null,
  profile: null,
  isLoading: true,

  setSession: (session) =>
    set({ session, user: session?.user ?? null }),

  setProfile: (profile) => set({ profile }),

  setLoading: (isLoading) => set({ isLoading }),

  reset: () =>
    set({ user: null, session: null, profile: null, isLoading: false }),
}));
