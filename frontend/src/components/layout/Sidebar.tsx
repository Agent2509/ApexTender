"use client";

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
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "AI Workspace", href: "/projects", icon: MessageSquareText },
  { label: "Projects", href: "/dashboard", icon: FolderKanban },
  { label: "Billing", href: "/billing", icon: CreditCard },
  { label: "Settings", href: "/settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    if (href === "/projects") return pathname.startsWith("/projects");
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={`relative flex flex-col bg-zinc-950 border-r border-white/5 transition-all duration-300 ease-in-out ${
        collapsed ? "w-[68px]" : "w-64"
      } h-screen flex-shrink-0`}
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-5 border-b border-white/5">
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
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                active
                  ? "bg-amethyst-500/10 text-amethyst-400 border border-amethyst-500/20"
                  : "text-zinc-500 hover:text-zinc-200 hover:bg-white/5 border border-transparent"
              }`}
              title={collapsed ? item.label : undefined}
            >
              <Icon className={`w-[18px] h-[18px] flex-shrink-0 ${
                active ? "text-amethyst-400" : "text-zinc-600 group-hover:text-zinc-300"
              }`} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="p-3 border-t border-white/5 space-y-2">
        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-zinc-600 hover:text-zinc-300 hover:bg-white/5 transition text-xs"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <><ChevronLeft className="w-4 h-4" /><span>Collapse</span></>}
        </button>
        {/* User */}
        <div className={`flex items-center ${ collapsed ? 'justify-center' : 'px-2'} py-2`}>
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>
    </aside>
  );
}
