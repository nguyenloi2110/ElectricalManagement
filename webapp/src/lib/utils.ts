export { cn } from "cn";

export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return "";
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatCurrency(value: number): string {
  return `${new Intl.NumberFormat("vi-VN").format(Math.round(value))} đ`;
}


