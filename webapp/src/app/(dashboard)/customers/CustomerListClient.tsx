"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { CustomerFormModal } from "@/app/(dashboard)/customers/CustomerFormModal";
import { CustomerStatsCards } from "@/app/(dashboard)/customers/CustomerStatsCards";
import { GenerateInvoiceDialog } from "@/app/(dashboard)/invoices/GenerateInvoiceDialog";

export type StationOption = { id: string; name: string; code: number };

export type CustomerDto = {
  id: string;
  code: number;
  name: string;
  description: string | null;
  phone: string;
  isHasZalo: boolean;
  isDeleted: boolean;
  createdAt: string | null;
  lastModified: string | null;
  meterCount: number;
  updateStatus: "updated" | "not-updated" | "not-applicable";
};

type ZaloFilter = "all" | "yes" | "no";
type UpdatedFilter = "all" | "updated" | "not-updated";

interface ListResponse {
  items: CustomerDto[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const SKELETON_ROWS = Array.from({ length: 8 });

export function CustomerListClient({ stations }: { stations: StationOption[] }) {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";
  const [searchInput, setSearchInput] = useState(initialQuery);
  const [search, setSearch] = useState(initialQuery);
  const [zalo, setZalo] = useState<ZaloFilter>("all");
  const [updated, setUpdated] = useState<UpdatedFilter>("all");
  const [page, setPage] = useState(1);

  const [data, setData] = useState<ListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [modalState, setModalState] = useState<{ mode: "create" } | { mode: "edit"; id: string } | null>(
    null,
  );
  const [pendingDelete, setPendingDelete] = useState<{ ids: string[]; label: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [statsRefreshKey, setStatsRefreshKey] = useState(0);
  const [exportInvoiceIds, setExportInvoiceIds] = useState<string[] | null>(null);

  useEffect(() => {
    const q = searchParams.get("q");
    if (q && q !== search) {
      // Sync from Command Palette deep link (?q=...); only fires once per distinct query value.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSearchInput(q);
      setSearch(q);
      setPage(1);
    }
    // Only react to changes in the URL's `q` param (e.g. Command Palette deep links), not local search state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      if (search) params.set("search", search);
      if (zalo !== "all") params.set("zalo", zalo);
      if (updated !== "all") params.set("updated", updated);

      const res = await fetch(`/api/customers?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
        setSelectedIds(new Set());
      } else {
        toast.error(json.message ?? "Không thể tải danh sách khách hàng");
      }
    } catch {
      toast.error("Không thể kết nối máy chủ");
    } finally {
      setLoading(false);
    }
  }, [page, search, zalo, updated]);

  useEffect(() => {
    // Data fetching effect: setState happens inside the async fetchList body, not synchronously.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchList();
  }, [fetchList]);

  function runSearch() {
    setPage(1);
    setSearch(searchInput.trim());
  }

  function toggleSelectAll(checked: boolean) {
    if (!data) return;
    setSelectedIds(checked ? new Set(data.items.map((c) => c.id)) : new Set());
  }

  function toggleSelectOne(id: string, checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function handleBulkExportInvoice() {
    if (selectedIds.size === 0) {
      toast.warning("Vui lòng chọn ít nhất 1 khách hàng");
      return;
    }
    setExportInvoiceIds(Array.from(selectedIds));
  }

  function handleBulkDelete() {
    if (selectedIds.size === 0) {
      toast.warning("Vui lòng chọn ít nhất 1 khách hàng");
      return;
    }
    setPendingDelete({ ids: Array.from(selectedIds), label: `${selectedIds.size} khách hàng đã chọn` });
  }

  function handleRowDelete(c: CustomerDto) {
    setPendingDelete({ ids: [c.id], label: `khách hàng "${c.name}"` });
  }

  async function handleConfirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/customers/batch-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: pendingDelete.ids }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`Đã xóa ${pendingDelete.label}`);
        setPendingDelete(null);
        setStatsRefreshKey((k) => k + 1);
        await fetchList();
      } else {
        toast.error(json.message ?? "Xóa khách hàng thất bại");
      }
    } catch {
      toast.error("Không thể kết nối máy chủ");
    } finally {
      setDeleting(false);
    }
  }

  const items = data?.items ?? [];
  const allSelected = items.length > 0 && items.every((c) => selectedIds.has(c.id));
  const someSelected = !allSelected && items.some((c) => selectedIds.has(c.id));

  const rangeText = useMemo(() => {
    if (!data || data.total === 0) return null;
    const start = (data.page - 1) * data.pageSize + 1;
    const end = Math.min(data.page * data.pageSize, data.total);
    return `Hiển thị ${start}-${end} trên tổng số ${data.total} khách hàng`;
  }, [data]);

  return (
    <div className="space-y-4">
      <CustomerStatsCards refreshKey={statsRefreshKey} />

      {/* Toolbar: search + filters + bulk actions + add new */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200/80 bg-card p-4 shadow-sm dark:border-neutral-800">
        <div className="flex min-w-60 flex-1 items-center gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && runSearch()}
              placeholder="Tìm theo tên, mô tả, điện thoại, tổng đồng hồ..."
              className="pl-9"
            />
          </div>
          <Button onClick={runSearch}>
            <Search className="h-4 w-4" />
            Tìm kiếm
          </Button>
        </div>

        <Select value={zalo} onValueChange={(v) => { setZalo(v as ZaloFilter); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-37.5">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Zalo: Tất cả</SelectItem>
            <SelectItem value="yes">Có Zalo</SelectItem>
            <SelectItem value="no">Không có Zalo</SelectItem>
          </SelectContent>
        </Select>

        <Select value={updated} onValueChange={(v) => { setUpdated(v as UpdatedFilter); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-45">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Cập nhật: Tất cả</SelectItem>
            <SelectItem value="updated">Đã cập nhật</SelectItem>
            <SelectItem value="not-updated">Chưa cập nhật</SelectItem>
          </SelectContent>
        </Select>

        <div className="ml-auto flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <MoreHorizontal className="h-4 w-4" />
                Thao tác hàng loạt
                {selectedIds.size > 0 && (
                  <span className="ml-1 rounded-full bg-blue-100 px-1.5 text-xs font-semibold text-blue-700 dark:bg-blue-950/50 dark:text-blue-400">
                    {selectedIds.size}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={handleBulkExportInvoice}>
                <FileText className="h-4 w-4" />
                Xuất hóa đơn
              </DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onSelect={handleBulkDelete}>
                <Trash2 className="h-4 w-4" />
                Xóa khách hàng
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button onClick={() => setModalState({ mode: "create" })}>
            <Plus className="h-4 w-4" />
            Thêm mới
          </Button>
        </div>
      </div>

      {/* Data table */}
      <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-card shadow-sm dark:border-neutral-800">
        <div className="max-h-[calc(100vh-320px)] min-h-[240px] overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-muted/60 shadow-[0_1px_0_0_theme(colors.border)]">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-10">
                  <Checkbox
                    checked={allSelected ? true : someSelected ? "indeterminate" : false}
                    onCheckedChange={(checked) => toggleSelectAll(checked === true)}
                    aria-label="Chọn tất cả"
                  />
                </TableHead>
                <TableHead className="w-12">STT</TableHead>
                <TableHead>Tên</TableHead>
                <TableHead>Mô tả</TableHead>
                <TableHead>Điện thoại</TableHead>
                <TableHead>Tổng đồng hồ</TableHead>
                <TableHead>Đã cập nhật?</TableHead>
                <TableHead>Zalo?</TableHead>
                <TableHead className="sticky right-0 bg-muted/60 text-right shadow-[inset_1px_0_0_0_theme(colors.slate.200)]">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                SKELETON_ROWS.map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-5" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-10" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-14 rounded-full" /></TableCell>
                    <TableCell className="sticky right-0 bg-card text-right shadow-[inset_1px_0_0_0_theme(colors.slate.200)]"><Skeleton className="ml-auto h-6 w-14" /></TableCell>
                  </TableRow>
                ))
              ) : items.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={9} className="p-0">
                    <EmptyState
                      icon={Users}
                      title="Không tìm thấy khách hàng nào"
                      description="Thử điều chỉnh bộ lọc/tìm kiếm hoặc thêm khách hàng mới."
                      actionLabel="Thêm khách hàng"
                      onAction={() => setModalState({ mode: "create" })}
                    />
                  </TableCell>
                </TableRow>
              ) : (
                items.map((c, index) => (
                  <TableRow key={c.id} data-state={selectedIds.has(c.id) ? "selected" : undefined}>
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.has(c.id)}
                        onCheckedChange={(checked) => toggleSelectOne(c.id, checked === true)}
                        aria-label={`Chọn ${c.name}`}
                      />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {(data!.page - 1) * data!.pageSize + index + 1}
                    </TableCell>
                    <TableCell className="font-medium text-blue-700 dark:text-blue-400">{c.name}</TableCell>
                    <TableCell className="max-w-[220px] truncate text-muted-foreground">
                      {c.description || "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{c.phone}</TableCell>
                    <TableCell className="text-muted-foreground">{c.meterCount}</TableCell>
                    <TableCell>
                      <UpdateStatusBadge status={c.updateStatus} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge tone={c.isHasZalo ? "success" : "neutral"}>
                        {c.isHasZalo ? "Có" : "Không"}
                      </StatusBadge>
                    </TableCell>
                    <TableCell className="sticky right-0 bg-card text-right shadow-[inset_1px_0_0_0_theme(colors.slate.200)]">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setModalState({ mode: "edit", id: c.id })}
                          className="text-blue-700 hover:bg-blue-50 hover:text-blue-800 dark:text-blue-400 dark:hover:bg-blue-950/40"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Sửa
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleRowDelete(c)}
                          aria-label={`Xóa ${c.name}`}
                          className="text-muted-foreground hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      {data && data.total > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
          <span>{rangeText}</span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
              Trước
            </Button>
            <span className="px-2 text-foreground">
              Trang {data.page}/{data.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= data.totalPages}
              onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
            >
              Sau
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {modalState && (
        <CustomerFormModal
          mode={modalState.mode}
          customerId={modalState.mode === "edit" ? modalState.id : undefined}
          stations={stations}
          onClose={() => setModalState(null)}
          onSaved={() => {
            setModalState(null);
            setStatsRefreshKey((k) => k + 1);
            fetchList();
          }}
        />
      )}

      {exportInvoiceIds && (
        <GenerateInvoiceDialog
          customerIds={exportInvoiceIds}
          onClose={() => setExportInvoiceIds(null)}
          onGenerated={() => setExportInvoiceIds(null)}
        />
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Xóa khách hàng"
        description={`Bạn có chắc chắn muốn xóa ${pendingDelete?.label ?? ""}? Hành động này không thể hoàn tác.`}
        loading={deleting}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}

function UpdateStatusBadge({ status }: { status: CustomerDto["updateStatus"] }) {
  if (status === "updated") {
    return <StatusBadge tone="success">Đã cập nhật</StatusBadge>;
  }
  if (status === "not-updated") {
    return <StatusBadge tone="warning">Chưa cập nhật</StatusBadge>;
  }
  return <span className="text-xs text-muted-foreground">—</span>;
}
