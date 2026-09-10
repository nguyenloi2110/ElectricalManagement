"use client";

import { useState, type FormEvent } from "react";
import { Loader2, Zap, Receipt } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormLabel } from "@/components/form-label";
import type {
  ElectricityMeterPriceConfig,
  InvoiceExportInfoConfig,
} from "@/domain/entities/config.entity";

const INVOICE_INFO_FIELDS: Array<{
  key: keyof InvoiceExportInfoConfig;
  label: string;
  placeholder: string;
}> = [
  { key: "ProjectOwner", label: "Chủ đầu tư", placeholder: "VD: Võ Văn Duẩn" },
  { key: "BankAccountNumber", label: "Số tài khoản ngân hàng", placeholder: "VD: 88316789" },
  { key: "BankName", label: "Tên ngân hàng", placeholder: "VD: Vietinbank" },
  { key: "AccountHolderName", label: "Tên chủ tài khoản ngân hàng", placeholder: "VD: NGUYEN VAN A" },
  { key: "CustomerServicePhone", label: "Số chăm sóc khách hàng", placeholder: "Nhập số điện thoại (vd: 0987xxxxxx)" },
  { key: "CashierName", label: "Thu ngân", placeholder: "VD: Nguyễn Văn A" },
];

export function SettingsForms({
  initialPrice,
  initialInvoiceInfo,
}: {
  initialPrice: ElectricityMeterPriceConfig;
  initialInvoiceInfo: InvoiceExportInfoConfig;
}) {
  const [price, setPrice] = useState(initialPrice);
  const [invoiceInfo, setInvoiceInfo] = useState(initialInvoiceInfo);
  const [savingPrice, setSavingPrice] = useState(false);
  const [savingInvoiceInfo, setSavingInvoiceInfo] = useState(false);

  async function savePrice(event: FormEvent) {
    event.preventDefault();
    setSavingPrice(true);
    try {
      const res = await fetch("/api/config/price", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(price),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message ?? "Cập nhật thất bại");
      toast.success("Đã cập nhật giá điện");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Có lỗi xảy ra");
    } finally {
      setSavingPrice(false);
    }
  }

  async function saveInvoiceInfo(event: FormEvent) {
    event.preventDefault();
    setSavingInvoiceInfo(true);
    try {
      const res = await fetch("/api/config/invoice-info", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invoiceInfo),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message ?? "Cập nhật thất bại");
      toast.success("Đã cập nhật thông tin xuất hóa đơn");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Có lỗi xảy ra");
    } finally {
      setSavingInvoiceInfo(false);
    }
  }

  return (
    <Tabs defaultValue="price" orientation="vertical" className="flex-row items-start gap-6">
      <TabsList className="w-56 shrink-0 flex-col items-stretch gap-1 bg-transparent p-0">
        <TabsTrigger
          value="price"
          className="justify-start gap-2 rounded-lg border border-transparent px-3 py-2 text-left data-active:border-border data-active:bg-card data-active:shadow-sm"
        >
          <Zap className="h-4 w-4" />
          Giá điện
        </TabsTrigger>
        <TabsTrigger
          value="invoice-info"
          className="justify-start gap-2 rounded-lg border border-transparent px-3 py-2 text-left data-active:border-border data-active:bg-card data-active:shadow-sm"
        >
          <Receipt className="h-4 w-4" />
          Thông tin xuất hóa đơn
        </TabsTrigger>
      </TabsList>

      <div className="min-w-0 flex-1">
        <TabsContent value="price" className="mt-0">
          <Card className="p-6">
            <h2 className="mb-1 text-sm font-semibold text-foreground">Giá điện</h2>
            <p className="mb-5 text-sm text-muted-foreground">
              Đơn giá mặc định áp dụng khi tạo hóa đơn mới.
            </p>
            <form onSubmit={savePrice} className="max-w-xs space-y-4">
              <div className="space-y-1.5">
                <FormLabel required htmlFor="unit-price">Giá điện (đ/kWh)</FormLabel>
                <Input
                  id="unit-price"
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="Nhập giá điện (đ/kWh)"
                  value={price.UnitPrice}
                  onChange={(e) => setPrice({ UnitPrice: Number(e.target.value) })}
                />
              </div>
              <Button type="submit" disabled={savingPrice}>
                {savingPrice && <Loader2 className="h-4 w-4 animate-spin" />}
                Cập nhật
              </Button>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="invoice-info" className="mt-0">
          <Card className="p-6">
            <h2 className="mb-1 text-sm font-semibold text-foreground">Thông tin xuất hóa đơn</h2>
            <p className="mb-5 text-sm text-muted-foreground">
              Thông tin này sẽ được nhúng vào file hóa đơn khi xuất Word/Excel.
            </p>
            <form onSubmit={saveInvoiceInfo} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                {INVOICE_INFO_FIELDS.map((field) => (
                  <div key={field.key} className="space-y-1.5">
                    <FormLabel required htmlFor={field.key}>{field.label}</FormLabel>
                    <Input
                      id={field.key}
                      value={invoiceInfo[field.key]}
                      placeholder={field.placeholder}
                      onChange={(e) =>
                        setInvoiceInfo((prev) => ({ ...prev, [field.key]: e.target.value }))
                      }
                    />
                  </div>
                ))}
              </div>
              <Button type="submit" disabled={savingInvoiceInfo}>
                {savingInvoiceInfo && <Loader2 className="h-4 w-4 animate-spin" />}
                Cập nhật
              </Button>
            </form>
          </Card>
        </TabsContent>
      </div>
    </Tabs>
  );
}
