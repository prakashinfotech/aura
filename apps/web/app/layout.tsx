import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@aura/ui";
import { Providers } from "@/components/providers";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env["NEXT_PUBLIC_APP_URL"] ?? "https://localhost:3000"),
  title: {
    default: "Aura — Fashion Online Shopping",
    template: "%s | Aura",
  },
  description:
    "Shop the latest fashion for men, women, and kids. Free delivery on orders over ₹499.",
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: "Aura",
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <body className="flex min-h-screen flex-col bg-[var(--background)] text-[var(--foreground)] antialiased">
        <Providers>
          <Header />
          <main className="flex-1 pb-[var(--bottom-nav-height)] md:pb-0">
            {children}
          </main>
          <Footer />
          <MobileBottomNav />
          <Toaster position="bottom-center" richColors closeButton />
        </Providers>
      </body>
    </html>
  );
}
