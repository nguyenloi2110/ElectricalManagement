import { StatusBadge } from "@/components/status-badge";
import { INVOICE_STATUS } from "@/domain/entities/invoice.entity";

/** Badge trạng thái thanh toán hóa đơn — màu theo SRS FR-4.1 (vàng/xanh lá/cam-sky). */
export function InvoiceStatusBadge({ status }: { status: number }) {
  if (status === INVOICE_STATUS.PAID) {
    return <StatusBadge tone="success">Đã thanh toán</StatusBadge>;
  }
  if (status === INVOICE_STATUS.PARTIAL) {
    return <StatusBadge tone="info">Thanh toán một phần</StatusBadge>;
  }
  return <StatusBadge tone="warning">Chưa thanh toán</StatusBadge>;
}
