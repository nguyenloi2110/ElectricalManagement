/**
 * Domain entities cho module Hóa đơn — xem SRS mục 3.2.4/3.2.5, FR-4.
 */

/** 0 = Chưa thanh toán, 1 = Đã thanh toán, 2 = Thanh toán một phần — xem SRS BR-3. */
export const INVOICE_STATUS = {
  UNPAID: 0,
  PAID: 1,
  PARTIAL: 2,
} as const;

export type InvoiceStatus = (typeof INVOICE_STATUS)[keyof typeof INVOICE_STATUS];

export interface InvoiceDetailEntity {
  id: string;
  electricityMeterId: string;
  electricityMeterName: string;
  transformerStationName: string;
  startNum: bigint;
  endNum: bigint;
  unitPrice: number;
  /** Điện năng tiêu thụ = EndNum - StartNum (tính động — SRS 3.2.5). */
  consumption: number;
  /** Thành tiền = Điện năng tiêu thụ × Đơn giá (tính động). */
  amount: number;
}

export interface InvoiceEntity {
  id: string;
  code: number;
  month: string;
  customerId: string;
  customerCode: number;
  customerName: string;
  customerPhone: string;
  customerHasZalo: boolean;
  /** Tên trạm nếu mọi đồng hồ cùng 1 trạm, "Nhiều trạm" nếu khác trạm — xem SRS mục 3 giả định #3. */
  stationName: string;
  totalAmountPaid: number;
  /** Tổng tiền hóa đơn — luôn tính động từ SUM(details.amount), không lưu cột riêng (SRS 3.2.4). */
  totalAmount: number;
  status: InvoiceStatus;
  note: string | null;
  createdAt: Date | null;
  details?: InvoiceDetailEntity[];
}

/**
 * Quy tắc tự động tính trạng thái thanh toán — SRS BR-3/BR-4/FR-4.2/FR-4.3.
 * Tách riêng thành pure function để dễ unit test (SRS NFR-5).
 *
 * VND không có đơn vị lẻ (hào/xu) nên làm tròn về đồng nguyên trước khi so sánh — tránh sai số
 * dấu phẩy động (vd. 0.1 + 0.2 !== 0.3 trong IEEE754) khiến hóa đơn đã nộp đủ tiền vẫn bị coi
 * là "thanh toán một phần" do lệch nhau một phần rất nhỏ của 1 đồng.
 */
export function computeInvoiceStatus(totalAmount: number, totalAmountPaid: number): InvoiceStatus {
  const total = Math.round(totalAmount);
  const paid = Math.round(totalAmountPaid);
  if (total <= 0) return INVOICE_STATUS.PAID;
  if (paid <= 0) return INVOICE_STATUS.UNPAID;
  if (paid >= total) return INVOICE_STATUS.PAID;
  return INVOICE_STATUS.PARTIAL;
}

export interface MonthlyStatistics {
  month: string;
  paidCount: number;
  partialCount: number;
  unpaidCount: number;
  invoiceCount: number;
  /** Tổng TotalAmount (tính động) của toàn bộ hóa đơn trong tháng — SRS FR-5. */
  totalAmount: number;
  /** Σ TotalAmount (Status=Paid) + Σ TotalAmountPaid (Status=Partial) — SRS FR-5. */
  totalCollected: number;
  /** Σ TotalAmount (Status=Unpaid) + Σ (TotalAmount - TotalAmountPaid) (Status=Partial) — SRS FR-5. */
  totalOutstanding: number;
  totalConsumptionKwh: number;
}

export interface StationCollectionSummary {
  stationId: string;
  stationName: string;
  invoiceCount: number;
  totalAmount: number;
  totalCollected: number;
  totalOutstanding: number;
}

export interface CustomerCollectionSummary {
  customerId: string;
  customerName: string;
  customerPhone: string;
  invoiceCount: number;
  totalAmount: number;
  totalCollected: number;
  totalOutstanding: number;
}
