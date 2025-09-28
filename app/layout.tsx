import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";

import { Providers } from "./providers";
import "./globals.css";

import { cn } from "@/lib/utils";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Commerce Office Portal",
  description:
    "Modern Supabase + Next.js portal for Roblox Ro-State commerce operations.",
};

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/regulations", label: "Regulations" },
  { href: "/businesses", label: "Businesses" },
  { href: "/properties", label: "Properties" },
  { href: "/tipline", label: "Tipline" },
  { href: "/profile", label: "Profile" },
  { href: "/auth/link-accounts", label: "Link Accounts" },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-sans text-foreground antialiased",
          geistSans.variable,
          geistMono.variable,
        )}
      >
        <Providers>
          <div className="flex min-h-screen flex-col bg-background">
            <header className="border-b border-neutral-200 bg-white/80 backdrop-blur">
              <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4">
                <Link href="/" className="text-lg font-semibold tracking-tight">
                  Commerce Office Portal
                </Link>
                <nav className="flex items-center gap-4 text-sm font-medium text-neutral-600">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="transition-colors hover:text-neutral-900"
                    >
                      {link.label}
                    </Link>
                  ))}
                </nav>
              </div>
            </header>
            <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-8">
              {children}
            </main>
            <footer className="border-t border-neutral-200 bg-white/80">
              <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 text-xs text-neutral-500">
                <span>&copy; {new Date().getFullYear()} Commerce Office.</span>
                <span>Built with Next.js + Supabase</span>
              </div>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
