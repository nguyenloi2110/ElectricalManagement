"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LogOut, Monitor, Moon, Receipt, BarChart3, Settings2, Sun, Users } from "lucide-react";
import { useTheme } from "next-themes";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { ConfirmDialog } from "@/components/confirm-dialog";

type CustomerHit = { id: string; name: string; phone: string };

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const { setTheme } = useTheme();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CustomerHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const openRef = useRef(open);
  useEffect(() => {
    openRef.current = open;
  }, [open]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!openRef.current);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onOpenChange]);

  useEffect(() => {
    if (!query.trim()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResults([]);
      return;
    }
    setSearching(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/customers?search=${encodeURIComponent(query.trim())}&page=1`);
        const json = await res.json();
        if (json.success) setResults(json.data.items.slice(0, 5));
      } finally {
        setSearching(false);
      }
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  function go(href: string) {
    onOpenChange(false);
    router.push(href);
  }

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      toast.success("Đã đăng xuất");
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  return (
    <>
      <CommandDialog
        open={open}
        onOpenChange={onOpenChange}
        title="Tìm kiếm nhanh"
        description="Tìm khách hàng, chuyển trang hoặc đổi giao diện"
      >
        <Command shouldFilter={false}>
          <CommandInput
            value={query}
            onValueChange={setQuery}
            placeholder="Tìm khách hàng, chuyển trang, đổi giao diện..."
          />
          <CommandList>
            {query.trim() && !searching && results.length === 0 && (
              <CommandEmpty>Không tìm thấy khách hàng phù hợp</CommandEmpty>
            )}

            {results.length > 0 && (
              <>
                <CommandGroup heading="Khách hàng">
                  {results.map((c) => (
                    <CommandItem key={c.id} value={c.name} onSelect={() => go(`/customers?q=${encodeURIComponent(c.name)}`)}>
                      <Users className="h-4 w-4" />
                      <span>{c.name}</span>
                      <span className="ml-auto text-xs text-muted-foreground">{c.phone}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
                <CommandSeparator />
              </>
            )}

            <CommandGroup heading="Điều hướng">
              <CommandItem value="Khách hàng" onSelect={() => go("/customers")}>
                <Users className="h-4 w-4" />
                Danh sách khách hàng
              </CommandItem>
              <CommandItem value="Hóa đơn" onSelect={() => go("/invoices")}>
                <Receipt className="h-4 w-4" />
                Quản lý hóa đơn điện
              </CommandItem>
              <CommandItem value="Thống kê" onSelect={() => go("/reports")}>
                <BarChart3 className="h-4 w-4" />
                Thống kê theo tháng
              </CommandItem>
              <CommandItem value="Cấu hình" onSelect={() => go("/settings")}>
                <Settings2 className="h-4 w-4" />
                Cấu hình hệ thống
              </CommandItem>
            </CommandGroup>

            <CommandSeparator />

            <CommandGroup heading="Giao diện">
              <CommandItem value="Sáng" onSelect={() => { setTheme("light"); onOpenChange(false); }}>
                <Sun className="h-4 w-4" />
                Giao diện sáng
              </CommandItem>
              <CommandItem value="Tối" onSelect={() => { setTheme("dark"); onOpenChange(false); }}>
                <Moon className="h-4 w-4" />
                Giao diện tối
              </CommandItem>
              <CommandItem value="Hệ thống" onSelect={() => { setTheme("system"); onOpenChange(false); }}>
                <Monitor className="h-4 w-4" />
                Theo hệ thống
              </CommandItem>
            </CommandGroup>

            <CommandSeparator />

            <CommandGroup heading="Tài khoản">
              <CommandItem
                value="Đăng xuất"
                onSelect={() => {
                  onOpenChange(false);
                  setLogoutOpen(true);
                }}
              >
                <LogOut className="h-4 w-4" />
                Đăng xuất
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>

      <ConfirmDialog
        open={logoutOpen}
        onOpenChange={setLogoutOpen}
        title="Xác nhận đăng xuất"
        description="Bạn có chắc chắn muốn thoát khỏi phiên làm việc hiện tại?"
        cancelLabel="Hủy bỏ"
        confirmLabel="Đăng xuất"
        tone="danger"
        loading={loggingOut}
        onConfirm={handleLogout}
      />
    </>
  );
}
