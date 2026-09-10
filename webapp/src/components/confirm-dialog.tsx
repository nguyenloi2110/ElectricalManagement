"use client";

import { Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** "danger" cho các thao tác xóa/không thể hoàn tác, "default" cho các xác nhận thông thường (vd. ghi đè). */
  tone?: "danger" | "default";
  loading?: boolean;
  onConfirm: () => void;
}

/** AlertDialog xác nhận dùng chung cho mọi thao tác Xóa / Ghi đè trong toàn bộ ứng dụng. */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Xóa",
  cancelLabel = "Hủy",
  tone = "danger",
  loading = false,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={(next) => !loading && onOpenChange(next)}>
      <AlertDialogContent onEscapeKeyDown={(event) => loading && event.preventDefault()}>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            onClick={(event) => {
              event.preventDefault();
              onConfirm();
            }}
            disabled={loading}
            className={cn(
              "gap-2 border-transparent text-white",
              tone === "danger"
                ? "bg-red-600 hover:bg-red-700 focus-visible:ring-red-500/30"
                : "bg-blue-600 hover:bg-blue-700 focus-visible:ring-blue-500/30",
            )}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
