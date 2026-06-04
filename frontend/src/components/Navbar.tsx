"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ArrowRight } from "lucide-react";

const navLinks = [
  { label: "Features", href: "/#features" },
  { label: "Pricing", href: "/pricing" },
  { label: "Docs", href: "/#docs" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <header className="sticky top-0 z-50 h-14 border-b border-zinc-800 bg-[#09090b]/80 backdrop-blur-xl">
      <div className="max-w-5xl mx-auto h-full flex items-center justify-between px-6 md:px-10">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 flex-shrink-0">
          <div className="w-7 h-7 rounded bg-gradient-to-br from-amethyst-600 to-amethyst-700 flex items-center justify-center">
            <span className="text-white font-bold text-xs">AT</span>
          </div>
          <span className="text-sm font-semibold text-white tracking-tight">
            APEX TENDER
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-sm text-zinc-400 hover:text-white transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/sign-in"
            className="text-sm text-zinc-400 hover:text-white transition-colors"
          >
            Sign In
          </Link>
          <Link href="/dashboard">
            <button className="group flex items-center gap-2 px-4 py-1.5 text-xs font-medium text-white bg-amethyst-700 hover:bg-amethyst-600 rounded-md transition">
              Open Workspace
              <ArrowRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
            </button>
          </Link>
        </nav>

        {/* Mobile Toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          aria-label="Toggle navigation menu"
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <Menu className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <>
          {/* Backdrop */}
          <div
            className="md:hidden fixed inset-0 top-14 z-40 bg-black/60"
            onClick={() => setMobileOpen(false)}
          />

          {/* Panel */}
          <nav className="md:hidden fixed top-14 inset-x-0 z-50 bg-[#09090b] border-b border-zinc-800 shadow-2xl">
            <div className="max-w-5xl mx-auto px-6 py-4 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="block px-3 py-2.5 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-colors"
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/sign-in"
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2.5 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-colors"
              >
                Sign In
              </Link>
              <div className="pt-3 border-t border-zinc-800">
                <Link href="/dashboard" onClick={() => setMobileOpen(false)}>
                  <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-amethyst-700 hover:bg-amethyst-600 rounded-lg transition">
                    Open Workspace
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </Link>
              </div>
            </div>
          </nav>
        </>
      )}
    </header>
  );
}
