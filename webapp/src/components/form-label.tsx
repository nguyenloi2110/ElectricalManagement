import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/** Label chuẩn cho form, tự thêm dấu (*) đỏ khi trường bắt buộc — dùng đồng nhất trên toàn bộ form. */
export function FormLabel({
  required,
  className,
  children,
  ...props
}: React.ComponentProps<typeof Label> & { required?: boolean }) {
  return (
    <Label className={cn(className)} {...props}>
      {children}
      {required && <span className="text-red-500">*</span>}
    </Label>
  );
}
