import type {
  InvoiceEntity,
  MonthlyStatistics,
  StationCollectionSummary,
  CustomerCollectionSummary,
} from "@/domain/entities/invoice.entity";
import type { PagedResult } from "@/domain/entities/customer.entity";

export type InvoiceStatusFilter = "all" | "paid" | "unpaid" | "partial";
export type InvoiceZaloFilter = "all" | "yes" | "no";

export interface InvoiceListQuery {
  page: number;
  pageSize: number;
  customerName?: string;
  /** Lọc theo đúng 1 khách hàng cụ thể (chọn từ combobox tìm kiếm tên/SĐT) — ưu tiên hơn `customerName`. */
  customerId?: string;
  month?: string;
  status?: InvoiceStatusFilter;
  zalo?: InvoiceZaloFilter;
  stationId?: string;
}

export interface UpdateInvoiceInput {
  totalAmountPaid: number;
  note?: string | null;
}

export interface GenerateInvoicesInput {
  customerIds: string[];
  month: string;
  unitPrice: number;
}

export interface GenerateInvoicesResult {
  created: number;
  skippedNoMeters: Array<{ customerId: string; customerName: string }>;
}

export interface ExistingInvoiceCustomer {
  customerId: string;
  customerName: string;
}

/** Cổng (port) truy vấn dữ liệu hóa đơn — tầng domain, được tầng repository triển khai. */
export interface IInvoiceRepository {
  findManyPaged(query: InvoiceListQuery): Promise<PagedResult<InvoiceEntity>>;
  /** Toàn bộ hóa đơn khớp filter hiện tại (không phân trang) — dùng khi xuất file "chọn tất cả" (SRS BR-7). */
  findAllMatching(query: Omit<InvoiceListQuery, "page" | "pageSize">): Promise<InvoiceEntity[]>;
  findByIdWithDetails(id: string): Promise<InvoiceEntity | null>;
  findManyByIdsWithDetails(ids: string[]): Promise<InvoiceEntity[]>;
  update(id: string, input: UpdateInvoiceInput): Promise<InvoiceEntity>;
  softDeleteMany(ids: string[]): Promise<number>;
  findExistingForMonth(customerIds: string[], month: string): Promise<ExistingInvoiceCustomer[]>;
  generate(input: GenerateInvoicesInput, overwrite: boolean): Promise<GenerateInvoicesResult>;
  getMonthlyStatistics(month: string): Promise<MonthlyStatistics>;
  getStationCollectionSummary(month: string): Promise<StationCollectionSummary[]>;
  getCustomerCollectionSummary(month: string): Promise<CustomerCollectionSummary[]>;
}
