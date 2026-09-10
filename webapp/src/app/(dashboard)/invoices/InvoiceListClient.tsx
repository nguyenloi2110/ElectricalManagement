"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  MoreHorizontal,
  Pencil,
  FileText,
  Trash2,
  Receipt,
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
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
import { EmptyState } from "@/components/empty-state";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { InvoiceStatusBadge } from "@/app/(dashboard)/invoices/InvoiceStatusBadge";
import { InvoiceEditModal } from "@/app/(dashboard)/invoices/InvoiceEditModal";
import { CustomerFilterCombobox, type CustomerOption } from "@/app/(dashboard)/invoices/CustomerFilterCombobox";
import type { StationOption } from "@/app/(dashboard)/customers/CustomerListClient";
import { formatCurrency, formatDateTime } from "@/lib/utils";

export type InvoiceDetailDto = {
  id: string;
  electricityMeterId: string;
  electricityMeterName: string;
  transformerStationName: string;
  startNum: number;
  endNum: number;
  unitPrice: number;
  consumption: number;
  amount: number;
};

export type InvoiceDto = {
  id: string;
  code: number;
  month: string;
  customerId: string;
  customerCode: number;
  customerName: string;
  customerPhone: string;
  customerHasZalo: boolean;
  stationName: string;
  totalAmountPaid: number;
  totalAmount: number;
  status: 0 | 1 | 2;
  note: string | null;
  createdAt: string | null;
  details?: InvoiceDetailDto[];
};

type StatusFilter = "all" | "paid" | "unpaid" | "partial";
type ZaloFilter = "all" | "yes" | "no";

interface ListResponse {
  items: InvoiceDto[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const SKELETON_ROWS = Array.from({ length: 8 });

export function InvoiceListClient({ stations }: { stations: StationOption[] }) {
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerOption | null>(null);
  const [month, setMonth] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [zalo, setZalo] = useState<ZaloFilter>("all");
  const [stationId, setStationId] = useState("all");
  const [page, setPage] = useState(1);

  const [data, setData] = useState<ListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [exporting, setExporting] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{ ids: string[]; label: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const filterQuery = useMemo(
    () => ({
      customerId: selectedCustomer?.id || undefined,
      month: month || undefined,
      status,
      zalo,
      stationId: stationId === "all" ? undefined : stationId,
    }),
    [selectedCustomer, month, status, zalo, stationId],
  );

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      if (filterQuery.customerId) params.set("customerId", filterQuery.customerId);
      if (filterQuery.month) params.set("month", filterQuery.month);
      if (filterQuery.status !== "all") params.set("status", filterQuery.status);
      if (filterQuery.zalo !== "all") params.set("zalo", filterQuery.zalo);
      if (filterQuery.stationId) params.set("stationId", filterQuery.stationId);

      const res = await fetch(`/api/invoices?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
        setSelectedIds(new Set());
      } else {
        toast.error(json.message ?? "Không thể tải danh sách hóa đơn");
      }
    } catch {
      toast.error("Không thể kết nối máy chủ");
    } finally {
      setLoading(false);
    }
  }, [page, filterQuery]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchList();
  }, [fetchList]);

  function handleSelectCustomer(customer: CustomerOption | null) {
    setSelectedCustomer(customer);
    setPage(1);
  }

  function toggleSelectAll(checked: boolean) {
    if (!data) return;
    setSelectedIds(checked ? new Set(data.items.map((i) => i.id)) : new Set());
  }

  function toggleSelectOne(id: string, checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function handleRowDelete(inv: InvoiceDto) {
    setPendingDelete({ ids: [inv.id], label: `hóa đơn tháng ${inv.month} của "${inv.customerName}"` });
  }

  function handleBulkDelete() {
    if (selectedIds.size === 0) {
      toast.warning("Vui lòng chọn ít nhất 1 hóa đơn");
      return;
    }
    setPendingDelete({ ids: Array.from(selectedIds), label: `${selectedIds.size} hóa đơn đã chọn` });
  }

  async function handleConfirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/invoices/batch-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: pendingDelete.ids }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`Đã xóa ${pendingDelete.label}`);
        setPendingDelete(null);
        await fetchList();
      } else {
        toast.error(json.message ?? "Xóa hóa đơn thất bại");
      }
    } catch {
      toast.error("Không thể kết nối máy chủ");
    } finally {
      setDeleting(false);
    }
  }

  /** Tải file nhị phân (Excel/PDF) trả về từ API và kích hoạt download trên trình duyệt. */
  async function downloadInvoiceFile(
    endpoint: string,
    mode: "selected" | "all",
    fallbackFileName: string,
    failureMessage: string,
  ) {
    if (mode === "selected" && selectedIds.size === 0) {
      toast.warning("Vui lòng chọn ít nhất 1 hóa đơn");
      return;
    }
    setExporting(true);
    try {
      const body = mode === "selected" ? { ids: Array.from(selectedIds) } : { filter: filterQuery };
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        toast.error(json?.message ?? failureMessage);
        return;
      }
      const disposition = res.headers.get("Content-Disposition") ?? "";
      const fileName = disposition.match(/filename="([^"]+)"/)?.[1] ?? fallbackFileName;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      return fileName;
    } catch {
      toast.error("Không thể kết nối máy chủ");
    } finally {
      setExporting(false);
    }
  }

  async function handleExportExcel(mode: "selected" | "all") {
    const fileName = await downloadInvoiceFile(
      "/api/invoices/export/excel",
      mode,
      `HoaDon_${Date.now()}.xlsx`,
      "Xuất Excel thất bại",
    );
    if (fileName) toast.success("Đã xuất file Excel");
  }

  async function handleExportPdf(mode: "selected" | "all") {
    const fileName = await downloadInvoiceFile(
      "/api/invoices/export/pdf",
      mode,
      `HoaDon_${Date.now()}.pdf`,
      "Xuất PDF thất bại",
    );
    if (fileName) toast.success("Đã xuất file PDF");
  }



  const items = data?.items ?? [];
  const allSelected = items.length > 0 && items.every((i) => selectedIds.has(i.id));
  const someSelected = !allSelected && items.some((i) => selectedIds.has(i.id));

  const rangeText = useMemo(() => {
    if (!data || data.total === 0) return null;
    const start = (data.page - 1) * data.pageSize + 1;
    const end = Math.min(data.page * data.pageSize, data.total);
    return `Hiển thị ${start}-${end} trên tổng số ${data.total} hóa đơn`;
  }, [data]);

  return (
    <div className="space-y-4">
      {/* Toolbar: search + filters + bulk actions */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200/80 bg-card p-4 shadow-sm dark:border-neutral-800">
        <CustomerFilterCombobox selected={selectedCustomer} onSelect={handleSelectCustomer} />

        <Input
          type="month"
          value={month}
          onChange={(e) => {
            setMonth(e.target.value);
            setPage(1);
          }}
          className="w-full sm:w-40"
        />

        <Select value={status} onValueChange={(v) => { setStatus(v as StatusFilter); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Trạng thái: Tất cả</SelectItem>
            <SelectItem value="paid">Đã thanh toán</SelectItem>
            <SelectItem value="unpaid">Chưa thanh toán</SelectItem>
            <SelectItem value="partial">Thanh toán 1 phần</SelectItem>
          </SelectContent>
        </Select>

        <Select value={zalo} onValueChange={(v) => { setZalo(v as ZaloFilter); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Zalo: Tất cả</SelectItem>
            <SelectItem value="yes">Có Zalo</SelectItem>
            <SelectItem value="no">Không có Zalo</SelectItem>
          </SelectContent>
        </Select>

        <Select value={stationId} onValueChange={(v) => { setStationId(v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Trạm: Tất cả</SelectItem>
            {stations.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="ml-auto flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" disabled={exporting}>
                <MoreHorizontal className="h-4 w-4" />
                Thao tác hàng loạt
                {selectedIds.size > 0 && (
                  <span className="ml-1 rounded-full bg-blue-100 px-1.5 text-xs font-semibold text-blue-700 dark:bg-blue-950/50 dark:text-blue-400">
                    {selectedIds.size}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel>Mục đã chọn ({selectedIds.size})</DropdownMenuLabel>
              <DropdownMenuItem disabled={selectedIds.size === 0} onSelect={() => handleExportExcel("selected")}>
                <FileSpreadsheet className="h-4 w-4" />
                Xuất Excel
              </DropdownMenuItem>
              <DropdownMenuItem disabled={selectedIds.size === 0} onSelect={() => handleExportPdf("selected")}>
                <FileText className="h-4 w-4" />
                Xuất PDF
              </DropdownMenuItem>
              <DropdownMenuItem variant="destructive" disabled={selectedIds.size === 0} onSelect={handleBulkDelete}>
                <Trash2 className="h-4 w-4" />
                Xóa hóa đơn
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Toàn bộ kết quả đang lọc ({data?.total ?? 0})</DropdownMenuLabel>
              <DropdownMenuItem onSelect={() => handleExportExcel("all")}>
                <FileSpreadsheet className="h-4 w-4" />
                Xuất Excel
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => handleExportPdf("all")}>
                <FileText className="h-4 w-4" />
                Xuất PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Data table */}
      <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-card shadow-sm dark:border-neutral-800">
        <div className="max-h-[calc(100vh-320px)] min-h-60 overflow-auto">
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
                <TableHead>Tháng</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Zalo?</TableHead>
                <TableHead>Trạm</TableHead>
                <TableHead className="text-right">Tiền đã đóng</TableHead>
                <TableHead className="text-right">Tổng tiền</TableHead>
                <TableHead>Ngày tạo</TableHead>
                <TableHead className="sticky right-0 bg-muted/60 text-right shadow-[inset_1px_0_0_0_theme(colors.slate.200)]">
                  Hành động
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                SKELETON_ROWS.map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-5" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-14 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell className="sticky right-0 bg-card text-right shadow-[inset_1px_0_0_0_theme(colors.slate.200)]">
                      <Skeleton className="ml-auto h-6 w-14" />
                    </TableCell>
                  </TableRow>
                ))
              ) : items.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={11} className="p-0">
                    <EmptyState
                      icon={Receipt}
                      title="Không tìm thấy hóa đơn nào"
                      description="Thử điều chỉnh bộ lọc/tìm kiếm, hoặc tạo hóa đơn mới từ trang Khách hàng."
                    />
                  </TableCell>
                </TableRow>
              ) : (
                items.map((inv, index) => (
                  <TableRow key={inv.id} data-state={selectedIds.has(inv.id) ? "selected" : undefined}>
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.has(inv.id)}
                        onCheckedChange={(checked) => toggleSelectOne(inv.id, checked === true)}
                        aria-label={`Chọn hóa đơn ${inv.customerName}`}
                      />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {(data!.page - 1) * data!.pageSize + index + 1}
                    </TableCell>
                    <TableCell className="font-medium text-blue-700 dark:text-blue-400">{inv.customerName}</TableCell>
                    <TableCell className="text-muted-foreground">{inv.month}</TableCell>
                    <TableCell>
                      <InvoiceStatusBadge status={inv.status} />
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">{inv.customerHasZalo ? "Có" : "Không"}</span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{inv.stationName}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{formatCurrency(inv.totalAmountPaid)}</TableCell>
                    <TableCell className="text-right font-medium text-foreground">{formatCurrency(inv.totalAmount)}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDateTime(inv.createdAt)}</TableCell>
                    <TableCell className="sticky right-0 bg-card text-right shadow-[inset_1px_0_0_0_theme(colors.slate.200)]">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingId(inv.id)}
                          className="text-blue-700 hover:bg-blue-50 hover:text-blue-800 dark:text-blue-400 dark:hover:bg-blue-950/40"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Sửa
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleRowDelete(inv)}
                          aria-label={`Xóa hóa đơn ${inv.customerName}`}
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

      {editingId && (
        <InvoiceEditModal
          invoiceId={editingId}
          onClose={() => setEditingId(null)}
          onSaved={() => {
            setEditingId(null);
            fetchList();
          }}
        />
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Xóa hóa đơn"
        description={`Bạn có chắc chắn muốn xóa ${pendingDelete?.label ?? ""}? Hành động này không thể hoàn tác.`}
        loading={deleting}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
