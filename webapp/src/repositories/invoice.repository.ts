import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@/generated/prisma/client";
import {
  INVOICE_STATUS,
  computeInvoiceStatus,
  type InvoiceEntity,
  type InvoiceStatus,
} from "@/domain/entities/invoice.entity";
import type {
  IInvoiceRepository,
  InvoiceListQuery,
  UpdateInvoiceInput,
  GenerateInvoicesInput,
  GenerateInvoicesResult,
  ExistingInvoiceCustomer,
} from "@/domain/repositories/invoice.repository.interface";
import type { PagedResult } from "@/domain/entities/customer.entity";

const STATUS_FILTER_MAP: Record<string, InvoiceStatus> = {
  unpaid: INVOICE_STATUS.UNPAID,
  paid: INVOICE_STATUS.PAID,
  partial: INVOICE_STATUS.PARTIAL,
};

const INVOICE_INCLUDE = {
  customer: { select: { code: true, name: true, phone: true, isHasZalo: true } },
  details: {
    where: { isDeleted: false },
    include: {
      electricityMeter: {
        select: { name: true, transformerStation: { select: { name: true } } },
      },
    },
  },
} satisfies Prisma.InvoiceInclude;

type InvoiceRow = Prisma.InvoiceGetPayload<{ include: typeof INVOICE_INCLUDE }>;

function computeStationName(names: string[]): string {
  const unique = Array.from(new Set(names));
  if (unique.length === 0) return "-";
  if (unique.length === 1) return unique[0];
  return "Nhiều trạm";
}

/**
 * Map bản ghi Prisma sang InvoiceEntity, tính động Consumption/Amount/TotalAmount (SRS 3.2.4/3.2.5).
 * Áp dụng luôn quy tắc "hóa đơn 0 đồng ⇒ Đã thanh toán" ở tầng đọc dữ liệu (SRS FR-4.2) để hiển thị
 * đúng ngay cả với các bản ghi cũ mà cột `Status` vật lý chưa được cập nhật hồi tố.
 */
function toInvoiceEntity(row: InvoiceRow): InvoiceEntity {
  const details = row.details.map((d) => {
    const consumption = Number(d.endNum - d.startNum);
    // VND không có đơn vị lẻ — làm tròn về đồng nguyên ngay tại nguồn để tránh sai số dấu phẩy
    // động lan sang các phép so sánh/tổng hợp phía sau (SRS: đối chiếu tính tiền tuyệt đối).
    const amount = Math.round(consumption * d.unitPrice);
    return {
      id: d.id,
      electricityMeterId: d.electricityMeterId,
      electricityMeterName: d.electricityMeter.name,
      transformerStationName: d.electricityMeter.transformerStation.name,
      startNum: d.startNum,
      endNum: d.endNum,
      unitPrice: d.unitPrice,
      consumption,
      amount,
    };
  });
  const totalAmount = details.reduce((sum, d) => sum + d.amount, 0);
  const status = totalAmount <= 0 ? INVOICE_STATUS.PAID : (row.status as InvoiceStatus);

  return {
    id: row.id,
    code: row.code,
    month: row.month,
    customerId: row.customerId,
    customerCode: row.customer.code,
    customerName: row.customer.name,
    customerPhone: row.customer.phone,
    customerHasZalo: row.customer.isHasZalo,
    stationName: computeStationName(details.map((d) => d.transformerStationName)),
    totalAmountPaid: row.totalAmountPaid,
    totalAmount,
    status,
    note: row.note,
    createdAt: row.createdAt,
    details,
  };
}

/**
 * Triển khai IInvoiceRepository bằng Prisma.
 *
 * Ghi chú hiệu năng/toàn vẹn: lọc theo Trạng thái (status) được thực hiện ở tầng ứng dụng
 * (sau khi tính TotalAmount động) thay vì lọc thẳng cột `status` trong SQL, để đảm bảo quy
 * tắc "hóa đơn 0 đồng ⇒ Đã thanh toán" (FR-4.2) luôn đúng kể cả với dữ liệu cũ. Ở quy mô dữ
 * liệu hiện tại (~3600 hóa đơn — xem SRS NFR-2) việc này vẫn đáp ứng tốt hiệu năng.
 */
export class InvoiceRepository implements IInvoiceRepository {
  private buildWhere(
    query: Omit<InvoiceListQuery, "page" | "pageSize" | "status">,
  ): Prisma.InvoiceWhereInput {
    const where: Prisma.InvoiceWhereInput = { isDeleted: false };
    if (query.month) where.month = query.month;
    if (query.customerId) where.customerId = query.customerId;

    const customerWhere: Prisma.CustomerWhereInput = {};
    if (query.customerName) customerWhere.name = { contains: query.customerName };
    if (query.zalo === "yes") customerWhere.isHasZalo = true;
    if (query.zalo === "no") customerWhere.isHasZalo = false;
    if (Object.keys(customerWhere).length > 0) where.customer = customerWhere;

    if (query.stationId) {
      where.details = {
        some: { isDeleted: false, electricityMeter: { transformerStationId: query.stationId } },
      };
    }
    return where;
  }

  private async fetchAllMapped(
    query: Omit<InvoiceListQuery, "page" | "pageSize">,
  ): Promise<InvoiceEntity[]> {
    const where = this.buildWhere(query);
    const rows = await prisma.invoice.findMany({
      where,
      include: INVOICE_INCLUDE,
      orderBy: { createdAt: "desc" },
    });
    let items = rows.map(toInvoiceEntity);
    if (query.status && query.status !== "all") {
      const target = STATUS_FILTER_MAP[query.status];
      items = items.filter((i) => i.status === target);
    }
    return items;
  }

  async findManyPaged(query: InvoiceListQuery): Promise<PagedResult<InvoiceEntity>> {
    const all = await this.fetchAllMapped(query);
    const total = all.length;
    const start = (query.page - 1) * query.pageSize;
    const items = all.slice(start, start + query.pageSize);
    return {
      items,
      total,
      page: query.page,
      pageSize: query.pageSize,
      totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
    };
  }

  async findAllMatching(query: Omit<InvoiceListQuery, "page" | "pageSize">): Promise<InvoiceEntity[]> {
    return this.fetchAllMapped(query);
  }

  async findByIdWithDetails(id: string): Promise<InvoiceEntity | null> {
    const row = await prisma.invoice.findFirst({
      where: { id, isDeleted: false },
      include: INVOICE_INCLUDE,
    });
    return row ? toInvoiceEntity(row) : null;
  }

  async findManyByIdsWithDetails(ids: string[]): Promise<InvoiceEntity[]> {
    const rows = await prisma.invoice.findMany({
      where: { id: { in: ids }, isDeleted: false },
      include: INVOICE_INCLUDE,
      orderBy: { createdAt: "desc" },
    });
    return rows.map(toInvoiceEntity);
  }

  async update(id: string, input: UpdateInvoiceInput): Promise<InvoiceEntity> {
    const existing = await this.findByIdWithDetails(id);
    if (!existing) throw new Error("NOT_FOUND");

    const status = computeInvoiceStatus(existing.totalAmount, input.totalAmountPaid);
    const row = await prisma.invoice.update({
      where: { id },
      data: {
        totalAmountPaid: input.totalAmountPaid,
        note: input.note ?? null,
        status,
        lastModified: new Date(),
      },
      include: INVOICE_INCLUDE,
    });
    return toInvoiceEntity(row);
  }

  async softDeleteMany(ids: string[]): Promise<number> {
    const result = await prisma.$transaction(async (tx) => {
      await tx.invoiceDetail.updateMany({
        where: { invoiceId: { in: ids } },
        data: { isDeleted: true },
      });
      return tx.invoice.updateMany({
        where: { id: { in: ids } },
        data: { isDeleted: true },
      });
    });
    return result.count;
  }

  async findExistingForMonth(customerIds: string[], month: string): Promise<ExistingInvoiceCustomer[]> {
    const rows = await prisma.invoice.findMany({
      where: { customerId: { in: customerIds }, month, isDeleted: false },
      select: { customerId: true, customer: { select: { name: true } } },
    });
    return rows.map((r) => ({ customerId: r.customerId, customerName: r.customer.name }));
  }

  async generate(input: GenerateInvoicesInput, overwrite: boolean): Promise<GenerateInvoicesResult> {
    const { customerIds, month, unitPrice } = input;

    return prisma.$transaction(
      async (tx) => {
        if (overwrite) {
          const existing = await tx.invoice.findMany({
            where: { customerId: { in: customerIds }, month, isDeleted: false },
            select: { id: true },
          });
          const existingIds = existing.map((e) => e.id);
          if (existingIds.length > 0) {
            await tx.invoiceDetail.updateMany({
              where: { invoiceId: { in: existingIds } },
              data: { isDeleted: true },
            });
            await tx.invoice.updateMany({
              where: { id: { in: existingIds } },
              data: { isDeleted: true },
            });
          }
        }

        const customers = await tx.customer.findMany({
          where: { id: { in: customerIds }, isDeleted: false },
          select: {
            id: true,
            name: true,
            meters: { where: { isDeleted: false }, select: { id: true, startNum: true, endNum: true } },
          },
        });

        const skippedNoMeters: GenerateInvoicesResult["skippedNoMeters"] = [];
        const skippedInvalidMeters: GenerateInvoicesResult["skippedInvalidMeters"] = [];
        let created = 0;

        for (const customer of customers) {
          if (customer.meters.length === 0) {
            skippedNoMeters.push({ customerId: customer.id, customerName: customer.name });
            continue;
          }

          // Phòng thủ sâu: không tin tưởng tuyệt đối dữ liệu đồng hồ đã lưu, chặn sản lượng âm trước khi tạo hóa đơn.
          if (customer.meters.some((m) => m.endNum < m.startNum)) {
            skippedInvalidMeters.push({ customerId: customer.id, customerName: customer.name });
            continue;
          }

          let totalAmount = 0;
          const detailInputs = customer.meters.map((m) => {
            const consumption = Number(m.endNum - m.startNum);
            // Làm tròn về đồng nguyên tại nguồn — xem ghi chú tương tự trong toInvoiceEntity().
            const amount = Math.round(consumption * unitPrice);
            totalAmount += amount;
            return { electricityMeterId: m.id, startNum: m.startNum, endNum: m.endNum };
          });

          const status = computeInvoiceStatus(totalAmount, 0);
          const now = new Date();

          await tx.invoice.create({
            data: {
              month,
              customerId: customer.id,
              totalAmountPaid: 0,
              status,
              createdAt: now,
              lastModified: now,
              details: {
                create: detailInputs.map((d) => ({
                  electricityMeterId: d.electricityMeterId,
                  startNum: d.startNum,
                  endNum: d.endNum,
                  unitPrice,
                  createdAt: now,
                  lastModified: now,
                })),
              },
            },
          });

          for (const m of customer.meters) {
            await tx.electricityMeter.update({ where: { id: m.id }, data: { startNum: m.endNum } });
          }

          created += 1;
        }

        return { created, skippedNoMeters, skippedInvalidMeters };
      },
      { timeout: 30_000 },
    );
  }

  async getMonthlyStatistics(month: string) {
    const items = await this.fetchAllMapped({ month });
    let paidCount = 0;
    let partialCount = 0;
    let unpaidCount = 0;
    let totalAmount = 0;
    let totalCollected = 0;
    let totalOutstanding = 0;
    let totalConsumptionKwh = 0;

    for (const inv of items) {
      totalAmount += inv.totalAmount;
      totalConsumptionKwh += inv.details?.reduce((s, d) => s + d.consumption, 0) ?? 0;
      if (inv.status === INVOICE_STATUS.PAID) {
        paidCount += 1;
        totalCollected += inv.totalAmount;
      } else if (inv.status === INVOICE_STATUS.PARTIAL) {
        partialCount += 1;
        totalCollected += inv.totalAmountPaid;
        totalOutstanding += inv.totalAmount - inv.totalAmountPaid;
      } else {
        unpaidCount += 1;
        totalOutstanding += inv.totalAmount;
      }
    }

    return {
      month,
      paidCount,
      partialCount,
      unpaidCount,
      invoiceCount: items.length,
      totalAmount,
      totalCollected,
      totalOutstanding,
      totalConsumptionKwh,
    };
  }

  async getStationCollectionSummary(month: string) {
    const items = await this.fetchAllMapped({ month });
    const rows = await prisma.transformerStation.findMany({
      where: { isDeleted: false },
      select: { id: true, name: true },
    });
    const byName = new Map(rows.map((r) => [r.name, r.id]));

    const summary = new Map<
      string,
      { stationId: string; stationName: string; invoiceCount: number; totalAmount: number; totalCollected: number; totalOutstanding: number }
    >();

    for (const inv of items) {
      const key = inv.stationName;
      const entry = summary.get(key) ?? {
        stationId: byName.get(key) ?? key,
        stationName: key,
        invoiceCount: 0,
        totalAmount: 0,
        totalCollected: 0,
        totalOutstanding: 0,
      };
      entry.invoiceCount += 1;
      entry.totalAmount += inv.totalAmount;
      if (inv.status === INVOICE_STATUS.PAID) entry.totalCollected += inv.totalAmount;
      else if (inv.status === INVOICE_STATUS.PARTIAL) {
        entry.totalCollected += inv.totalAmountPaid;
        entry.totalOutstanding += inv.totalAmount - inv.totalAmountPaid;
      } else entry.totalOutstanding += inv.totalAmount;
      summary.set(key, entry);
    }

    return Array.from(summary.values()).sort((a, b) => b.totalAmount - a.totalAmount);
  }

  async getCustomerCollectionSummary(month: string) {
    const items = await this.fetchAllMapped({ month });
    const summary = new Map<
      string,
      { customerId: string; customerName: string; customerPhone: string; invoiceCount: number; totalAmount: number; totalCollected: number; totalOutstanding: number }
    >();

    for (const inv of items) {
      const entry = summary.get(inv.customerId) ?? {
        customerId: inv.customerId,
        customerName: inv.customerName,
        customerPhone: inv.customerPhone,
        invoiceCount: 0,
        totalAmount: 0,
        totalCollected: 0,
        totalOutstanding: 0,
      };
      entry.invoiceCount += 1;
      entry.totalAmount += inv.totalAmount;
      if (inv.status === INVOICE_STATUS.PAID) entry.totalCollected += inv.totalAmount;
      else if (inv.status === INVOICE_STATUS.PARTIAL) {
        entry.totalCollected += inv.totalAmountPaid;
        entry.totalOutstanding += inv.totalAmount - inv.totalAmountPaid;
      } else entry.totalOutstanding += inv.totalAmount;
      summary.set(inv.customerId, entry);
    }

    return Array.from(summary.values()).sort((a, b) => b.totalOutstanding - a.totalOutstanding);
  }
}

export const invoiceRepository = new InvoiceRepository();
