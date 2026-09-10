"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Receipt } from "lucide-react";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { GuardedDialogContent } from "@/components/guarded-dialog-content";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormLabel } from "@/components/form-label";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { InvoiceStatusBadge } from "@/app/(dashboard)/invoices/InvoiceStatusBadge";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import type { InvoiceDto } from "@/app/(dashboard)/invoices/InvoiceListClient";

interface InvoiceEditModalProps {
  invoiceId: string;
  onClose: () => void;
  onSaved: () => void;
}

export function InvoiceEditModal({ invoiceId, onClose, onSaved }: InvoiceEditModalProps) {
  const [loading, setLoading] = useState(true);
  const [invoice, setInvoice] = useState<InvoiceDto | null>(null);
  const [totalAmountPaid, setTotalAmountPaid] = useState("0");
  const [note, setNote] = useState("");
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const res = await fetch(`/api/invoices/${invoiceId}`);
      const json = await res.json();
      if (!cancelled && json.success) {
        setInvoice(json.data);
        setTotalAmountPaid(String(json.data.totalAmountPaid));
        setNote(json.data.note ?? "");
      }
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [invoiceId]);

  function updatePaid(v: string) {
    setTotalAmountPaid(v);
    setDirty(true);
  }
  function updateNote(v: string) {
    setNote(v);
    setDirty(true);
  }

  async function handleSubmit() {
    if (!invoice) return;
    const paid = Math.round(Number(totalAmountPaid));
    if (!Number.isFinite(paid) || paid < 0) {
      setError("Tiền đã nộp không hợp lệ");
      return;
    }
    if (paid > invoice.totalAmount) {
      setError("Tiền đã nộp không được vượt quá tổng tiền hóa đơn");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/invoices/${invoiceId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ totalAmountPaid: paid, note: note.trim() || null }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.message ?? "Có lỗi xảy ra");
        return;
      }
      toast.success("Đã cập nhật hóa đơn");
      setDirty(false);
      onSaved();
    } catch {
      setError("Không thể kết nối máy chủ");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <GuardedDialogContent dirty={dirty} className="flex max-h-[85vh] w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-5xl">
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Xem/Cập nhật hóa đơn
          </DialogTitle>
        </DialogHeader>

        {loading || !invoice ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
            className="flex flex-1 flex-col overflow-hidden"
          >
            <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
              {error && (
                <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
                  {error}
                </p>
              )}

              <div className="grid gap-4 rounded-xl border border-border bg-muted/30 p-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground">Mã hóa đơn</p>
                  <p className="text-sm font-medium text-foreground">#{invoice.code}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Tháng</p>
                  <p className="text-sm font-medium text-foreground">{invoice.month}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Tên khách hàng</p>
                  <p className="text-sm font-medium text-foreground">{invoice.customerName}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Điện thoại</p>
                  <p className="text-sm font-medium text-foreground">{invoice.customerPhone}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Trạng thái</p>
                  <InvoiceStatusBadge status={invoice.status} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Ngày tạo</p>
                  <p className="text-sm font-medium text-foreground">{formatDateTime(invoice.createdAt)}</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <FormLabel required htmlFor="invoice-paid">Tiền đã nộp</FormLabel>
                  <Input
                    id="invoice-paid"
                    type="number"
                    min={0}
                    step="1"
                    value={totalAmountPaid}
                    onChange={(e) => updatePaid(e.target.value)}
                    placeholder="Nhập số tiền đã nộp"
                  />
                </div>
                <div className="space-y-1.5">
                  <FormLabel htmlFor="invoice-note">Ghi chú</FormLabel>
                  <Input
                    id="invoice-note"
                    value={note}
                    onChange={(e) => updateNote(e.target.value)}
                    placeholder="Nhập ghi chú (không bắt buộc)"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold text-foreground">Chi tiết chỉ số điện</p>
                <div className="overflow-hidden rounded-xl border border-border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/60 hover:bg-muted/60">
                        <TableHead className="text-xs font-semibold text-muted-foreground uppercase">Tên ĐH</TableHead>
                        <TableHead className="text-xs font-semibold text-muted-foreground uppercase">Trạm</TableHead>
                        <TableHead className="text-xs font-semibold text-muted-foreground uppercase">Số cũ</TableHead>
                        <TableHead className="text-xs font-semibold text-muted-foreground uppercase">Số mới</TableHead>
                        <TableHead className="text-xs font-semibold text-muted-foreground uppercase">Điện năng TT</TableHead>
                        <TableHead className="text-right text-xs font-semibold text-muted-foreground uppercase">Thành tiền</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(invoice.details ?? []).map((d) => (
                        <TableRow key={d.id}>
                          <TableCell className="font-medium text-foreground">{d.electricityMeterName}</TableCell>
                          <TableCell>{d.transformerStationName}</TableCell>
                          <TableCell>{d.startNum}</TableCell>
                          <TableCell>{d.endNum}</TableCell>
                          <TableCell>{d.consumption}</TableCell>
                          <TableCell className="text-right">{formatCurrency(d.amount)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                    <TableFooter>
                      <TableRow>
                        <TableCell colSpan={5} className="text-right font-semibold text-foreground">
                          Tổng tiền
                        </TableCell>
                        <TableCell className="text-right font-semibold text-foreground">
                          {formatCurrency(invoice.totalAmount)}
                        </TableCell>
                      </TableRow>
                    </TableFooter>
                  </Table>
                </div>
              </div>
            </div>

            <DialogFooter className="mx-0 mb-0 border-t px-6 py-4">
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Hủy
                </Button>
              </DialogClose>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Cập nhật
              </Button>
            </DialogFooter>
          </form>
        )}
      </GuardedDialogContent>
    </Dialog>
  );
}
