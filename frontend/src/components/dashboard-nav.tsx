"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FileText, Upload, Settings, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Bid Matrix", href: "/dashboard/matrix", icon: FileText },
  { name: "Document Ingestion", href: "/dashboard/ingestion", icon: Upload },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function DashboardNav({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const Logo = () => (
    <div className="flex items-center space-x-2">
      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary font-bold text-primary-foreground">
        AT
      </div>
      <span className="text-xl font-bold tracking-tight">ApexTender</span>
    </div>
  );

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-10 hidden w-64 flex-col border-r bg-card sm:flex">
        <div className="flex h-16 items-center border-b px-6">
          <Logo />
        </div>
        <nav className="flex flex-1 flex-col gap-2 p-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:text-primary",
                pathname === item.href
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="flex flex-col sm:pl-64">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 sm:px-6">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="sm:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
              <div className="flex h-16 items-center border-b px-6">
                <Logo />
              </div>
              <nav className="flex flex-col gap-2 p-4">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:text-primary",
                      pathname === item.href
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>

          <div className="flex flex-1 items-center justify-between sm:justify-end">
            <h1 className="text-lg font-semibold sm:hidden">
              {navItems.find((item) => item.href === pathname)?.name || "Dashboard"}
            </h1>
            <div className="hidden sm:block flex-1">
              <h1 className="text-lg font-semibold">
                {navItems.find((item) => item.href === pathname)?.name || "Dashboard"}
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
