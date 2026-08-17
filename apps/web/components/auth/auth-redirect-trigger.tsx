"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuthModal } from "./auth-modal-provider";

export function AuthRedirectTrigger() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { openAuth } = useAuthModal();

  React.useEffect(() => {
    if (searchParams.get("login") === "1") {
      openAuth();
      const params = new URLSearchParams(searchParams.toString());
      params.delete("login");
      const next = params.get("next") ?? "";
      params.delete("next");
      const qs = params.toString();
      router.replace(`/${qs ? `?${qs}` : ""}`, { scroll: false });
    }
  }, [searchParams, openAuth, router]);

  return null;
}
