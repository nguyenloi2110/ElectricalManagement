"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  BadgeCheck,
  Banknote,
  CircleDollarSign,
  Clock,
  Gauge,
  Split,
  Wallet,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/empty-state";
import { cn, formatCurrency } from "@/lib/utils";

interface MonthlyStatistics {
  month: string;
  paidCount: number;
  partialCount: number;
  unpaidCount: number;
  invoiceCount: number;
  totalAmount: number;
  totalCollected: number;
  totalOutstanding: number;
  totalConsumptionKwh: number;
}

interface CollectionRow {
  stationId?: string;
  customerId?: string;
  stationName?: string;
  customerName?: string;
  customerPhone?: string;
  invoiceCount: number;
  totalAmount: number;
  totalCollected: number;
  totalOutstanding: number;
}

function currentMonthValue(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

const CARD_DEFS = [
  { key: "paidCount" as const, label: "Đã thanh toán", icon: BadgeCheck, iconClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400", isCurrency: false },
  { key: "partialCount" as const, label: "Thanh toán 1 phần", icon: Split, iconClass: "bg-sky-500/10 text-sky-600 dark:text-sky-400", isCurrency: false },
  { key: "unpaidCount" as const, label: "Chưa thanh toán", icon: Clock, iconClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400", isCurrency: false },
  { key: "totalAmount" as const, label: "Tổng tiền", icon: CircleDollarSign, iconClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400", isCurrency: true },
  { key: "totalCollected" as const, label: "Tổng tiền đã thu", icon: Wallet, iconClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400", isCurrency: true },
  { key: "totalOutstanding" as const, label: "Tổng tiền chưa thu", icon: Banknote, iconClass: "bg-red-500/10 text-red-600 dark:text-red-400", isCurrency: true },
  { key: "totalConsumptionKwh" as const, label: "Tổng sản lượng tiêu thụ (kWh)", icon: Gauge, iconClass: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400", isCurrency: false },
];

export function ReportsClient() {
  const [month, setMonth] = useState(currentMonthValue());
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<MonthlyStatistics | null>(null);
  const [byStation, setByStation] = useState<CollectionRow[]>([]);
  const [byCustomer, setByCustomer] = useState<CollectionRow[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/statistics?month=${month}`);
        const json = await res.json();
        if (!cancelled) {
          if (json.success) {
            setSummary(json.data.summary);
            setByStation(json.data.byStation);
            setByCustomer(json.data.byCustomer);
          } else {
            toast.error(json.message ?? "Không thể tải thống kê");
          }
        }
      } catch {
        if (!cancelled) toast.error("Không thể kết nối máy chủ");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [month]);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <label htmlFor="stats-month" className="text-sm font-medium text-foreground">
          Chọn tháng:
        </label>
        <Input
          id="stats-month"
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="w-40"
        />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {CARD_DEFS.map(({ key, label, icon: Icon, iconClass, isCurrency }) => (
          <Card key={key} className="gap-2 p-4 shadow-none">
            <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", iconClass)}>
              <Icon className="h-4.5 w-4.5" />
            </div>
            <div>
              {loading || !summary ? (
                <Skeleton className="h-7 w-20" />
              ) : (
                <p className="text-2xl font-semibold tracking-tight text-foreground">
                  {isCurrency ? formatCurrency(summary[key]) : summary[key]}
                </p>
              )}
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="station">
        <TabsList variant="line">
          <TabsTrigger value="station">Theo trạm biến áp</TabsTrigger>
          <TabsTrigger value="customer">Theo khách hàng</TabsTrigger>
        </TabsList>

        <TabsContent value="station" className="mt-3">
          <CollectionTable
            rows={byStation}
            loading={loading}
            nameHeader="Trạm biến áp"
            getName={(r) => r.stationName ?? "-"}
            getKey={(r) => r.stationId ?? r.stationName ?? ""}
          />
        </TabsContent>
        <TabsContent value="customer" className="mt-3">
          <CollectionTable
            rows={byCustomer}
            loading={loading}
            nameHeader="Khách hàng"
            getName={(r) => `${r.customerName ?? "-"}${r.customerPhone ? ` — ${r.customerPhone}` : ""}`}
            getKey={(r) => r.customerId ?? r.customerName ?? ""}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CollectionTable({
  rows,
  loading,
  nameHeader,
  getName,
  getKey,
}: {
  rows: CollectionRow[];
  loading: boolean;
  nameHeader: string;
  getName: (row: CollectionRow) => string;
  getKey: (row: CollectionRow) => string;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-card shadow-sm dark:border-neutral-800">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/60 hover:bg-muted/60">
            <TableHead className="text-xs font-semibold text-muted-foreground uppercase">{nameHeader}</TableHead>
            <TableHead className="text-xs font-semibold text-muted-foreground uppercase">Số hóa đơn</TableHead>
            <TableHead className="text-right text-xs font-semibold text-muted-foreground uppercase">Tổng tiền</TableHead>
            <TableHead className="text-right text-xs font-semibold text-muted-foreground uppercase">Đã thu</TableHead>
            <TableHead className="text-right text-xs font-semibold text-muted-foreground uppercase">Còn nợ</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                <TableCell><Skeleton className="h-4 w-10" /></TableCell>
                <TableCell><Skeleton className="ml-auto h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="ml-auto h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="ml-auto h-4 w-24" /></TableCell>
              </TableRow>
            ))
          ) : rows.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={5} className="p-0">
                <EmptyState icon={Wallet} title="Chưa có dữ liệu hóa đơn trong tháng này" />
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow key={getKey(row)}>
                <TableCell className="font-medium text-foreground">{getName(row)}</TableCell>
                <TableCell className="text-muted-foreground">{row.invoiceCount}</TableCell>
                <TableCell className="text-right text-foreground">{formatCurrency(row.totalAmount)}</TableCell>
                <TableCell className="text-right text-emerald-600 dark:text-emerald-400">{formatCurrency(row.totalCollected)}</TableCell>
                <TableCell className="text-right text-red-600 dark:text-red-400">{formatCurrency(row.totalOutstanding)}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
