"use client";

import { useState, useCallback, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import {
  LayoutDashboard,
  MessageSquareText,
  FolderKanban,
  CreditCard,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/* ------------------------------------------------------------------ */
/*  Nav configuration                                                  */
/* ------------------------------------------------------------------ */
const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "AI Workspace", href: "/projects", icon: MessageSquareText },
  { label: "Projects", href: "/projects", icon: FolderKanban },
  { label: "Billing", href: "/billing", icon: CreditCard },
  { label: "Settings", href: "/settings", icon: Settings },
] as const;

/* ------------------------------------------------------------------ */
/*  Shared NavLink component                                           */
/* ------------------------------------------------------------------ */
interface NavLinkProps {
  item: (typeof navItems)[number];
  active: boolean;
  collapsed?: boolean;
  onClick?: () => void;
}

function NavLink({ item, active, collapsed = false, onClick }: NavLinkProps) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onClick}
      title={collapsed ? item.label : undefined}
      className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
        active
          ? "bg-amethyst-500/10 text-amethyst-400 border border-amethyst-500/20"
          : "text-zinc-500 hover:text-zinc-200 hover:bg-white/5 border border-transparent"
      }`}
    >
      <Icon
        className={`w-[18px] h-[18px] flex-shrink-0 ${
          active
            ? "text-amethyst-400"
            : "text-zinc-600 group-hover:text-zinc-300"
        }`}
      />
      {!collapsed && <span>{item.label}</span>}
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/*  Logo                                                               */
/* ------------------------------------------------------------------ */
function Logo({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2 min-w-0">
      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amethyst-600 to-amethyst-800 flex items-center justify-center flex-shrink-0">
        <span className="text-white font-black text-sm">A</span>
      </div>
      {!collapsed && (
        <span className="text-base font-bold text-white tracking-tighter truncate">
          APEX TENDER
        </span>
      )}
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/*  Sidebar (default export)                                           */
/* ------------------------------------------------------------------ */
export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isActive = useCallback(
    (href: string) => {
      if (href === "/dashboard") return pathname === "/dashboard";
      return pathname.startsWith(href);
    },
    [pathname],
  );

  /* Close drawer on route change */
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  /* Lock body scroll when drawer is open */
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  return (
    <>
      {/* ============================================================ */}
      {/*  MOBILE / TABLET TOP BAR  (<1024px)                          */}
      {/* ============================================================ */}
      <header className="lg:hidden fixed top-0 inset-x-0 z-50 h-14 flex items-center justify-between px-4 bg-zinc-950/90 backdrop-blur-md border-b border-white/5">
        <Logo />
        <button
          onClick={() => setDrawerOpen(true)}
          aria-label="Open navigation"
          className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition"
        >
          <Menu className="w-5 h-5" />
        </button>
      </header>

      {/* ============================================================ */}
      {/*  MOBILE DRAWER  (AnimatePresence)                            */}
      {/* ============================================================ */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="sidebar-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setDrawerOpen(false)}
              className="lg:hidden fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
            />

            {/* Drawer panel */}
            <motion.aside
              key="sidebar-drawer"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="lg:hidden fixed top-0 left-0 bottom-0 z-[70] w-72 flex flex-col bg-zinc-950 border-r border-white/5"
            >
              {/* Drawer header */}
              <div className="h-14 flex items-center justify-between px-5 border-b border-white/5">
                <Logo />
                <button
                  onClick={() => setDrawerOpen(false)}
                  aria-label="Close navigation"
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer nav */}
              <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
                {navItems.map((item) => (
                  <NavLink
                    key={item.label}
                    item={item}
                    active={isActive(item.href)}
                    onClick={() => setDrawerOpen(false)}
                  />
                ))}
              </nav>

              {/* Drawer bottom */}
              <div className="p-3 border-t border-white/5">
                <div className="flex items-center px-2 py-2">
                  <UserButton afterSignOutUrl="/" />
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ============================================================ */}
      {/*  DESKTOP SIDEBAR  (>=1024px)                                 */}
      {/* ============================================================ */}
      <aside
        className={`hidden lg:flex flex-col bg-zinc-950 relative transition-all duration-300 ease-in-out ${
          collapsed ? "w-16" : "w-64"
        } h-screen flex-shrink-0`}
      >
        {/* Amethyst gradient right‑border (razor-thin 1px) */}
        <div
          aria-hidden
          className="absolute top-0 right-0 bottom-0 w-px"
          style={{
            background:
              "linear-gradient(to bottom, transparent, #a855f7, transparent)",
          }}
        />

        {/* Logo */}
        <div className="h-16 flex items-center px-5 border-b border-white/5">
          <Logo collapsed={collapsed} />
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.label}
              item={item}
              active={isActive(item.href)}
              collapsed={collapsed}
            />
          ))}
        </nav>

        {/* Bottom section */}
        <div className="p-3 border-t border-white/5 space-y-2">
          {/* Collapse toggle */}
          <button
            onClick={() => setCollapsed((prev) => !prev)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-zinc-600 hover:text-zinc-300 hover:bg-white/5 transition text-xs"
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4" />
                <span>Collapse</span>
              </>
            )}
          </button>

          {/* User button */}
          <div
            className={`flex items-center ${
              collapsed ? "justify-center" : "px-2"
            } py-2`}
          >
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </aside>
    </>
  );
}
