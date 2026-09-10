"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen, Receipt, BarChart3, Settings2, Users, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export const NAV_ITEMS = [
  { href: "/customers", label: "Khách hàng", icon: Users },
  { href: "/invoices", label: "Hóa đơn điện", icon: Receipt },
  { href: "/reports", label: "Thống kê", icon: BarChart3 },
  { href: "/settings", label: "Cấu hình", icon: Settings2 },
];

const COLLAPSE_STORAGE_KEY = "sidebar-collapsed";

export function SidebarBrand({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2 px-4 py-5", collapsed && "justify-center px-0")}>
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600">
        <Zap className="h-4 w-4 text-white" fill="currentColor" />
      </div>
      {!collapsed && <span className="text-base font-semibold tracking-wide text-foreground">SB Admin</span>}
    </div>
  );
}

export function NavList({ collapsed = false, onNavigate }: { collapsed?: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex-1 space-y-1 px-3">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname?.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            title={collapsed ? label : undefined}
            className={cn(
              "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-150",
              collapsed && "justify-center px-0",
              active
                ? "bg-slate-100 text-foreground dark:bg-neutral-800"
                : "text-muted-foreground hover:bg-slate-50 hover:text-foreground dark:hover:bg-neutral-900",
            )}
          >
            <Icon className="h-4 w-4 shrink-0 transition-transform duration-150 group-hover:scale-105" strokeWidth={1.75} />
            {!collapsed && label}
          </Link>
        );
      })}
    </nav>
  );
}

export function SidebarNav() {
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Hydration-safe read of the persisted collapse preference; setState here is intentional (one-time sync from localStorage).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    setCollapsed(localStorage.getItem(COLLAPSE_STORAGE_KEY) === "1");
  }, []);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(COLLAPSE_STORAGE_KEY, next ? "1" : "0");
      return next;
    });
  }

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-screen shrink-0 flex-col border-r border-slate-200/60 bg-card transition-[width] duration-200 md:flex dark:border-neutral-800",
        mounted && collapsed ? "w-16" : "w-60",
      )}
    >
      <SidebarBrand collapsed={mounted && collapsed} />
      <NavList collapsed={mounted && collapsed} />
      <div className="px-3 py-3">
        <button
          type="button"
          onClick={toggleCollapsed}
          title={collapsed ? "Mở rộng thanh bên" : "Thu gọn thanh bên"}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-slate-50 hover:text-foreground dark:hover:bg-neutral-900",
            collapsed && "justify-center px-0",
          )}
        >
          {collapsed ? <PanelLeftOpen className="h-4 w-4 shrink-0" strokeWidth={1.75} /> : <PanelLeftClose className="h-4 w-4 shrink-0" strokeWidth={1.75} />}
          {!collapsed && "Thu gọn"}
        </button>
      </div>
    </aside>
  );
}

