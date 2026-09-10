import { invoiceRepository } from "@/repositories/invoice.repository";
import { configService } from "@/services/config.service";
import type {
  InvoiceListQuery,
  InvoiceStatusFilter,
  InvoiceZaloFilter,
} from "@/domain/repositories/invoice.repository.interface";
import type { UpdateInvoiceInputDto } from "@/validations/invoice.schema";

export const INVOICES_PAGE_SIZE = 50;

function parsePage(value: string | null): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 1;
}

function parseStatusFilter(value: string | null): InvoiceStatusFilter {
  return value === "paid" || value === "unpaid" || value === "partial" ? value : "all";
}

function parseZaloFilter(value: string | null): InvoiceZaloFilter {
  return value === "yes" || value === "no" ? value : "all";
}

export interface GenerateInvoicesRequest {
  customerIds: string[];
  month: string;
  unitPrice?: number;
  useDefaultPrice: boolean;
  confirmOverwrite: boolean;
}

export class InvoiceService {
  buildListQuery(searchParams: URLSearchParams): InvoiceListQuery {
    return {
      page: parsePage(searchParams.get("page")),
      pageSize: INVOICES_PAGE_SIZE,
      customerName: searchParams.get("customerName")?.trim() || undefined,
      customerId: searchParams.get("customerId")?.trim() || undefined,
      month: searchParams.get("month")?.trim() || undefined,
      status: parseStatusFilter(searchParams.get("status")),
      zalo: parseZaloFilter(searchParams.get("zalo")),
      stationId: searchParams.get("stationId")?.trim() || undefined,
    };
  }

  async list(query: InvoiceListQuery) {
    return invoiceRepository.findManyPaged(query);
  }

  async listAllMatching(query: Omit<InvoiceListQuery, "page" | "pageSize">) {
    return invoiceRepository.findAllMatching(query);
  }

  async getById(id: string) {
    return invoiceRepository.findByIdWithDetails(id);
  }

  async getManyByIds(ids: string[]) {
    return invoiceRepository.findManyByIdsWithDetails(ids);
  }

  async update(id: string, input: UpdateInvoiceInputDto) {
    const invoice = await invoiceRepository.findByIdWithDetails(id);
    if (!invoice) return null;
    if (input.totalAmountPaid > invoice.totalAmount) {
      throw new Error("TOTAL_AMOUNT_PAID_EXCEEDS_TOTAL");
    }
    return invoiceRepository.update(id, {
      totalAmountPaid: input.totalAmountPaid,
      note: input.note,
    });
  }

  async softDeleteMany(ids: string[]) {
    return invoiceRepository.softDeleteMany(ids);
  }

  /**
   * Quy trình tạo hóa đơn hàng loạt (SRS FR-2.5): kiểm tra trùng tháng trước, nếu có khách hàng
   * đã có hóa đơn tháng đó mà chưa xác nhận ghi đè thì trả về danh sách cần xác nhận thay vì tạo luôn.
   */
  async generate(request: GenerateInvoicesRequest) {
    const unitPrice = request.useDefaultPrice
      ? (await configService.getPrice()).UnitPrice
      : (request.unitPrice ?? 0);

    const existing = await invoiceRepository.findExistingForMonth(request.customerIds, request.month);
    if (existing.length > 0 && !request.confirmOverwrite) {
      return {
        needsConfirmation: true as const,
        existingCount: existing.length,
        totalCount: request.customerIds.length,
        existingCustomerNames: existing.map((e) => e.customerName),
      };
    }

    const result = await invoiceRepository.generate(
      { customerIds: request.customerIds, month: request.month, unitPrice },
      existing.length > 0,
    );
    return { needsConfirmation: false as const, ...result };
  }

  async getMonthlyStatistics(month: string) {
    return invoiceRepository.getMonthlyStatistics(month);
  }

  async getStationCollectionSummary(month: string) {
    return invoiceRepository.getStationCollectionSummary(month);
  }

  async getCustomerCollectionSummary(month: string) {
    return invoiceRepository.getCustomerCollectionSummary(month);
  }
}

export const invoiceService = new InvoiceService();
