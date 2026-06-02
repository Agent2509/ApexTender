"use client";

import { useState, useCallback, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import {
  LayoutDashboard,
  Table2,
  FileInput,
  Wrench,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Bid Matrix", href: "/projects", icon: Table2 },
  { label: "Document Ingestion", href: "/projects", icon: FileInput },
  { label: "System Configuration", href: "/settings", icon: Wrench },
] as const;

function NavLink({
  item,
  active,
  collapsed = false,
  onClick,
}: {
  item: (typeof navItems)[number];
  active: boolean;
  collapsed?: boolean;
  onClick?: () => void;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onClick}
      title={collapsed ? item.label : undefined}
      className={`group flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium transition-colors ${
        active
          ? "bg-zinc-800 text-white"
          : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/60"
      }`}
    >
      <Icon
        className={`w-4 h-4 flex-shrink-0 ${
          active ? "text-zinc-200" : "text-zinc-600 group-hover:text-zinc-400"
        }`}
      />
      {!collapsed && <span>{item.label}</span>}
    </Link>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isActive = useCallback(
    (href: string) => {
      if (href === "/dashboard") return pathname === "/dashboard";
      return pathname.startsWith(href);
    },
    [pathname]
  );

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen]);

  const sidebarContent = (isMobile: boolean) => (
    <>
      <nav className={`flex-1 ${isMobile ? "py-3 px-3" : "py-2 px-2"} space-y-0.5 overflow-y-auto`}>
        <p className="px-3 pt-2 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
          Navigation
        </p>
        {navItems.map((item) => (
          <NavLink
            key={item.label}
            item={item}
            active={isActive(item.href)}
            collapsed={!isMobile && collapsed}
            onClick={isMobile ? () => setDrawerOpen(false) : undefined}
          />
        ))}
      </nav>

      <div className="p-2 border-t border-zinc-800 space-y-1">
        {!isMobile && (
          <button
            onClick={() => setCollapsed((p) => !p)}
            className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-md text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800/60 transition text-xs"
          >
            {collapsed ? (
              <ChevronRight className="w-3.5 h-3.5" />
            ) : (
              <>
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Collapse</span>
              </>
            )}
          </button>
        )}
        <div className={`flex items-center ${collapsed && !isMobile ? "justify-center" : "px-3"} py-1.5`}>
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* ── MOBILE TOP BAR ────────────────────────────────── */}
      <header className="lg:hidden fixed top-0 inset-x-0 z-50 h-14 flex items-center justify-between px-4 bg-[#09090b] border-b border-zinc-800">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-zinc-800 flex items-center justify-center">
            <span className="text-white font-bold text-xs">AT</span>
          </div>
          <span className="text-sm font-semibold text-white tracking-tight">
            APEX TENDER
          </span>
        </Link>
        <button
          onClick={() => setDrawerOpen(true)}
          className="p-2 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
        >
          <Menu className="w-5 h-5" />
        </button>
      </header>

      {/* ── MOBILE DRAWER ─────────────────────────────────── */}
      {drawerOpen && (
        <>
          <div
            onClick={() => setDrawerOpen(false)}
            className="lg:hidden fixed inset-0 z-[60] bg-black/70"
          />
          <aside className="lg:hidden fixed top-0 left-0 bottom-0 z-[70] w-64 flex flex-col bg-[#09090b] border-r border-zinc-800">
            <div className="h-14 flex items-center justify-between px-4 border-b border-zinc-800">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-7 h-7 rounded bg-zinc-800 flex items-center justify-center">
                  <span className="text-white font-bold text-xs">AT</span>
                </div>
                <span className="text-sm font-semibold text-white tracking-tight">
                  APEX TENDER
                </span>
              </Link>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {sidebarContent(true)}
          </aside>
        </>
      )}

      {/* ── DESKTOP SIDEBAR ───────────────────────────────── */}
      <aside
        className={`hidden lg:flex flex-col bg-[#09090b] border-r border-zinc-800 transition-all duration-200 ${
          collapsed ? "w-14" : "w-56"
        } h-screen flex-shrink-0`}
      >
        <div className="h-12 flex items-center px-3 border-b border-zinc-800">
          <Link href="/" className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded bg-zinc-800 flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-xs">AT</span>
            </div>
            {!collapsed && (
              <span className="text-sm font-semibold text-white tracking-tight truncate">
                APEX TENDER
              </span>
            )}
          </Link>
        </div>
        {sidebarContent(false)}
      </aside>
    </>
  );
}
