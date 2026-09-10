"use client";

import { DialogContent } from "@/components/ui/dialog";

interface GuardedDialogContentProps extends React.ComponentProps<typeof DialogContent> {
  /**
   * true khi form bên trong đang có thay đổi chưa lưu — khi đó phím Esc cũng bị chặn.
   * Click ra ngoài (backdrop) luôn bị chặn bất kể dirty, người dùng chỉ có thể đóng bằng
   * nút Hủy hoặc nút X.
   */
  dirty?: boolean;
}

/** DialogContent chuẩn hoá: chống mất dữ liệu do lỡ tay click ra ngoài modal. */
export function GuardedDialogContent({
  dirty = false,
  onPointerDownOutside,
  onEscapeKeyDown,
  ...props
}: GuardedDialogContentProps) {
  return (
    <DialogContent
      onPointerDownOutside={(event) => {
        event.preventDefault();
        onPointerDownOutside?.(event);
      }}
      onEscapeKeyDown={(event) => {
        if (dirty) event.preventDefault();
        onEscapeKeyDown?.(event);
      }}
      {...props}
    />
  );
}
