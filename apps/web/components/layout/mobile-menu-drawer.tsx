"use client";

import * as React from "react";
import Link from "next/link";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@aura/ui/sheet";

interface MobileMenuDrawerProps {
  open: boolean;
  onClose: () => void;
  links: { label: string; href: string }[];
}

export function MobileMenuDrawer({ open, onClose, links }: MobileMenuDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="left">
        <SheetHeader>
          <SheetTitle>
            <span className="text-xl font-bold text-[var(--secondary)]">Aura</span>
          </SheetTitle>
        </SheetHeader>
        <nav className="mt-2 flex flex-col">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={onClose}
              className="flex items-center justify-between border-b border-[var(--border)] px-4 py-4 text-sm font-medium text-[var(--foreground)] hover:text-[var(--brand)]"
            >
              {link.label}
              <span className="text-[var(--foreground-subtle)]">›</span>
            </Link>
          ))}
          <div className="mt-4 border-t border-[var(--border)] px-4 py-4">
            {["Track Order", "Returns", "Help", "Insider"].map((item) => (
              <div key={item} className="py-2 text-sm text-[var(--foreground-muted)]">
                {item}
              </div>
            ))}
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
