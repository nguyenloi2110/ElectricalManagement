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
import { Switch } from "@/components/ui/switch";
import { ConfirmDialog } from "@/components/confirm-dialog";

function currentMonthValue(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

interface GenerateInvoiceDialogProps {
  customerIds: string[];
  onClose: () => void;
  onGenerated: () => void;
}

/** Modal "Xuất hóa đơn" hàng loạt theo tháng cho các khách hàng đã chọn — xem SRS FR-2.5. */
export function GenerateInvoiceDialog({ customerIds, onClose, onGenerated }: GenerateInvoiceDialogProps) {
  const [month, setMonth] = useState(currentMonthValue());
  const [useDefaultPrice, setUseDefaultPrice] = useState(true);
  const [unitPrice, setUnitPrice] = useState("0");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmState, setConfirmState] = useState<{ existingCount: number; totalCount: number } | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/config/price");
      const json = await res.json();
      if (json.success) setUnitPrice(String(json.data.UnitPrice));
    })();
  }, []);

  async function submit(confirmOverwrite: boolean) {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/invoices/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerIds,
          month,
          unitPrice: useDefaultPrice ? undefined : Number(unitPrice),
          useDefaultPrice,
          confirmOverwrite,
        }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.message ?? "Có lỗi xảy ra");
        return;
      }
      if (json.data.needsConfirmation) {
        setConfirmState({ existingCount: json.data.existingCount, totalCount: json.data.totalCount });
        return;
      }
      const skipped = (json.data.skippedNoMeters ?? []) as Array<{ customerName: string }>;
      toast.success(`Đã tạo ${json.data.created} hóa đơn tháng ${month}`);
      if (skipped.length > 0) {
        toast.warning(`Bỏ qua ${skipped.length} khách hàng chưa có đồng hồ điện`);
      }
      onGenerated();
    } catch {
      setError("Không thể kết nối máy chủ");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Dialog open onOpenChange={(open) => !open && onClose()}>
        <GuardedDialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              Xuất hóa đơn ({customerIds.length} khách hàng)
            </DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit(false);
            }}
            className="space-y-4"
          >
            {error && (
              <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
                {error}
              </p>
            )}
            <div className="space-y-1.5">
              <FormLabel required htmlFor="generate-month">Tháng</FormLabel>
              <Input
                id="generate-month"
                type="month"
                required
                value={month}
                onChange={(e) => setMonth(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <FormLabel required htmlFor="generate-price">Giá điện (đ/kWh)</FormLabel>
              <Input
                id="generate-price"
                type="number"
                min={0}
                step="0.01"
                disabled={useDefaultPrice}
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                placeholder="Nhập giá điện (đ/kWh)"
              />
            </div>
            <label className="flex items-center gap-2.5 text-sm text-foreground">
              <Switch checked={useDefaultPrice} onCheckedChange={setUseDefaultPrice} />
              Sử dụng giá mặc định theo cấu hình hệ thống
            </label>

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Hủy
                </Button>
              </DialogClose>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Xuất hóa đơn
              </Button>
            </DialogFooter>
          </form>
        </GuardedDialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmState !== null}
        onOpenChange={(open) => !open && setConfirmState(null)}
        title="Đã tồn tại hóa đơn tháng này"
        description={`Đã có ${confirmState?.existingCount ?? 0}/${confirmState?.totalCount ?? 0} khách hàng có hóa đơn tháng ${month}. Bạn có muốn thay thế các hóa đơn này?`}
        confirmLabel="Có, thay thế"
        cancelLabel="Không"
        tone="danger"
        loading={saving}
        onConfirm={() => {
          setConfirmState(null);
          submit(true);
        }}
      />
    </>
  );
}
