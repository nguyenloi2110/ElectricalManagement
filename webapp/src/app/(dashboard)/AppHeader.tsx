"use client";

import { useState } from "react";
import { Menu, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { NavList, SidebarBrand } from "@/app/(dashboard)/SidebarNav";
import { LogoutButton } from "@/app/(dashboard)/LogoutButton";
import { ThemeToggle } from "@/components/theme-toggle";
import { CommandPalette } from "@/components/command-palette";

export function AppHeader() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  return (
    <header className="flex items-center gap-3 border-b border-slate-200/60 bg-card px-4 py-3 md:px-6 dark:border-neutral-800">
      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Điều hướng</SheetTitle>
          </SheetHeader>
          <SidebarBrand />
          <NavList onNavigate={() => setMobileNavOpen(false)} />
        </SheetContent>
        <Button variant="ghost" size="icon-sm" className="md:hidden" onClick={() => setMobileNavOpen(true)}>
          <Menu className="h-4 w-4" />
        </Button>
      </Sheet>

      <button
        type="button"
        onClick={() => setPaletteOpen(true)}
        className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-slate-200/80 bg-muted/40 px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted/70 sm:max-w-sm dark:border-neutral-800"
      >
        <Search className="h-4 w-4 shrink-0" />
        <span className="truncate">Tìm kiếm khách hàng, trang...</span>
        <kbd className="ml-auto hidden shrink-0 rounded border border-slate-200/80 bg-card px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:inline dark:border-neutral-700">
          Ctrl K
        </kbd>
      </button>

      <div className="ml-auto flex shrink-0 items-center gap-2">
        <ThemeToggle />
        <span className="hidden text-sm text-muted-foreground sm:inline">Admin</span>
        <LogoutButton />
      </div>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </header>
  );
}
