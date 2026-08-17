"use client";

import * as React from "react";
import { Suspense } from "react";
import { AuthModal } from "./auth-modal";

interface AuthModalContextValue {
  openAuth: () => void;
}

const AuthModalContext = React.createContext<AuthModalContextValue>({
  openAuth: () => {},
});

export function useAuthModal() {
  return React.useContext(AuthModalContext);
}

export function AuthModalProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);

  return (
    <AuthModalContext.Provider value={{ openAuth: () => setOpen(true) }}>
      {children}
      <Suspense>
        <AuthModal open={open} onClose={() => setOpen(false)} />
      </Suspense>
    </AuthModalContext.Provider>
  );
}
