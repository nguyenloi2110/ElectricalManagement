import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type StatusTone = "success" | "warning" | "info" | "danger" | "neutral";

const TONE_CLASSES: Record<StatusTone, string> = {
  success: "border-transparent bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400",
  warning: "border-transparent bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400",
  info: "border-transparent bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-400",
  danger: "border-transparent bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-400",
  neutral: "border-transparent bg-slate-100 text-slate-600 dark:bg-neutral-800 dark:text-neutral-400",
};

/** Pill badge dùng chung cho các trạng thái nghiệp vụ (Zalo, Đã cập nhật, Thanh toán...). */
export function StatusBadge({
  tone,
  className,
  children,
}: {
  tone: StatusTone;
  className?: string;
  children: React.ReactNode;
}) {
  return <Badge className={cn(TONE_CLASSES[tone], className)}>{children}</Badge>;
}
