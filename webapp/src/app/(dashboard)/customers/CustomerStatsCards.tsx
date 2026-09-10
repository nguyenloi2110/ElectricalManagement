"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, MessageCircle, Users, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface Stats {
  total: number;
  updated: number;
  notUpdated: number;
  hasZalo: number;
}

const CARD_DEFS = [
  {
    key: "total" as const,
    label: "Tổng khách hàng",
    icon: Users,
    iconClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
  {
    key: "updated" as const,
    label: "Đã cập nhật đồng hồ",
    icon: CheckCircle2,
    iconClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  {
    key: "notUpdated" as const,
    label: "Chưa cập nhật đồng hồ",
    icon: AlertCircle,
    iconClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  {
    key: "hasZalo" as const,
    label: "Có Zalo",
    icon: MessageCircle,
    iconClass: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  },
];

/** Bento-style stat cards tổng quan cho trang Khách hàng. */
export function CustomerStatsCards({ refreshKey }: { refreshKey: number }) {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch("/api/customers/stats");
      const json = await res.json();
      if (!cancelled && json.success) setStats(json.data);
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {CARD_DEFS.map(({ key, label, icon: Icon, iconClass }) => (
        <Card key={key} className="gap-2 p-4 shadow-none">
          <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", iconClass)}>
            <Icon className="h-4.5 w-4.5" />
          </div>
          <div>
            {stats ? (
              <p className="text-2xl font-semibold tracking-tight text-foreground">{stats[key]}</p>
            ) : (
              <Skeleton className="h-7 w-12" />
            )}
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        </Card>
      ))}
    </div>
  );
}
