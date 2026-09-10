import { prisma } from "@/lib/db/prisma";
import type {
  ICustomerRepository,
  CustomerListQuery,
  CreateCustomerInput,
  UpdateCustomerInput,
  CreateMeterInput,
  UpdateMeterInput,
} from "@/domain/repositories/customer.repository.interface";
import type {
  CustomerEntity,
  MeterEntity,
  PagedResult,
  UpdateStatus,
} from "@/domain/entities/customer.entity";
import type { Prisma } from "@/generated/prisma/client";

function computeUpdateStatus(meters: { startNum: bigint; endNum: bigint }[]): UpdateStatus {
  if (meters.length === 0) return "not-applicable";
  return meters.every((m) => m.endNum !== m.startNum) ? "updated" : "not-updated";
}

function toMeterEntity(m: {
  id: string;
  code: number;
  name: string;
  customerId: string;
  transformerStationId: string;
  startNum: bigint;
  endNum: bigint;
  description: string | null;
  isDeleted: boolean;
  transformerStation?: { name: string } | null;
}): MeterEntity {
  return {
    id: m.id,
    code: m.code,
    name: m.name,
    customerId: m.customerId,
    transformerStationId: m.transformerStationId,
    transformerStationName: m.transformerStation?.name,
    startNum: m.startNum,
    endNum: m.endNum,
    description: m.description,
    isDeleted: m.isDeleted,
    isUpdated: m.endNum !== m.startNum,
  };
}

/**
 * Triển khai ICustomerRepository bằng Prisma.
 *
 * Ghi chú hiệu năng: search/filter theo "Tổng đồng hồ" và "Đã cập nhật?" là các giá trị
 * suy diễn (derived) từ dữ liệu ElectricityMeters, không phải cột vật lý trên Customers,
 * nên được lọc ở tầng ứng dụng sau khi lấy dữ liệu từ DB (dữ liệu thực tế ~500 khách hàng,
 * lọc trong bộ nhớ là tức thời — xem SRS NFR-2). Nếu dữ liệu tăng lên rất lớn trong tương
 * lai, có thể tối ưu bằng raw SQL/materialized view.
 */
export class CustomerRepository implements ICustomerRepository {
  async findManyPaged(query: CustomerListQuery): Promise<PagedResult<CustomerEntity>> {
    const { page, pageSize, search, zalo, updated } = query;

    const where: Prisma.CustomerWhereInput = { isDeleted: false };
    if (zalo === "yes") where.isHasZalo = true;
    if (zalo === "no") where.isHasZalo = false;

    const rows = await prisma.customer.findMany({
      where,
      include: {
        meters: { where: { isDeleted: false }, select: { startNum: true, endNum: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    let mapped: CustomerEntity[] = rows.map((c) => ({
      id: c.id,
      code: c.code,
      name: c.name,
      description: c.description,
      phone: c.phone,
      isHasZalo: c.isHasZalo,
      isDeleted: c.isDeleted,
      createdAt: c.createdAt,
      lastModified: c.lastModified,
      meterCount: c.meters.length,
      updateStatus: computeUpdateStatus(c.meters),
    }));

    const term = search?.trim();
    if (term) {
      const lower = term.toLowerCase();
      const asNumber = Number(term);
      const isNumeric = term !== "" && !Number.isNaN(asNumber);
      mapped = mapped.filter(
        (c) =>
          c.name.toLowerCase().includes(lower) ||
          (c.description ?? "").toLowerCase().includes(lower) ||
          c.phone.toLowerCase().includes(lower) ||
          (isNumeric && c.meterCount === asNumber),
      );
    }

    if (updated === "updated") {
      mapped = mapped.filter((c) => c.updateStatus === "updated");
    } else if (updated === "not-updated") {
      mapped = mapped.filter((c) => c.updateStatus !== "updated");
    }

    const total = mapped.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const start = (page - 1) * pageSize;
    const items = mapped.slice(start, start + pageSize);

    return { items, total, page, pageSize, totalPages };
  }

  async findByIdWithMeters(id: string): Promise<CustomerEntity | null> {
    const c = await prisma.customer.findFirst({
      where: { id, isDeleted: false },
      include: {
        meters: {
          where: { isDeleted: false },
          include: { transformerStation: { select: { name: true } } },
          orderBy: { code: "asc" },
        },
      },
    });
    if (!c) return null;

    return {
      id: c.id,
      code: c.code,
      name: c.name,
      description: c.description,
      phone: c.phone,
      isHasZalo: c.isHasZalo,
      isDeleted: c.isDeleted,
      createdAt: c.createdAt,
      lastModified: c.lastModified,
      meterCount: c.meters.length,
      updateStatus: computeUpdateStatus(c.meters),
      meters: c.meters.map(toMeterEntity),
    };
  }

  async create(input: CreateCustomerInput): Promise<CustomerEntity> {
    const now = new Date();
    const created = await prisma.customer.create({
      data: {
        name: input.name,
        phone: input.phone,
        description: input.description ?? null,
        isHasZalo: input.isHasZalo,
        createdAt: now,
        lastModified: now,
        meters: input.meters?.length
          ? {
              create: input.meters.map((m) => ({
                name: m.name,
                transformerStationId: m.transformerStationId,
                startNum: m.startNum,
                endNum: m.endNum,
                description: m.description ?? null,
                createdAt: now,
                lastModified: now,
              })),
            }
          : undefined,
      },
      include: { meters: true },
    });

    return {
      id: created.id,
      code: created.code,
      name: created.name,
      description: created.description,
      phone: created.phone,
      isHasZalo: created.isHasZalo,
      isDeleted: created.isDeleted,
      createdAt: created.createdAt,
      lastModified: created.lastModified,
      meterCount: created.meters.length,
      updateStatus: computeUpdateStatus(created.meters),
    };
  }

  async update(id: string, input: UpdateCustomerInput): Promise<CustomerEntity> {
    const updated = await prisma.customer.update({
      where: { id },
      data: {
        name: input.name,
        phone: input.phone,
        description: input.description ?? null,
        isHasZalo: input.isHasZalo,
        lastModified: new Date(),
      },
      include: { meters: { where: { isDeleted: false } } },
    });

    return {
      id: updated.id,
      code: updated.code,
      name: updated.name,
      description: updated.description,
      phone: updated.phone,
      isHasZalo: updated.isHasZalo,
      isDeleted: updated.isDeleted,
      createdAt: updated.createdAt,
      lastModified: updated.lastModified,
      meterCount: updated.meters.length,
      updateStatus: computeUpdateStatus(updated.meters),
    };
  }

  async softDeleteMany(ids: string[]): Promise<number> {
    const result = await prisma.$transaction(async (tx) => {
      await tx.electricityMeter.updateMany({
        where: { customerId: { in: ids } },
        data: { isDeleted: true },
      });
      return tx.customer.updateMany({
        where: { id: { in: ids } },
        data: { isDeleted: true },
      });
    });
    return result.count;
  }

  async addMeter(customerId: string, input: CreateMeterInput): Promise<MeterEntity> {
    const now = new Date();
    const meter = await prisma.electricityMeter.create({
      data: {
        customerId,
        transformerStationId: input.transformerStationId,
        name: input.name,
        startNum: input.startNum,
        endNum: input.endNum,
        description: input.description ?? null,
        createdAt: now,
        lastModified: now,
      },
      include: { transformerStation: { select: { name: true } } },
    });
    return toMeterEntity(meter);
  }

  async updateMeter(meterId: string, input: UpdateMeterInput): Promise<MeterEntity> {
    // Validation ở tầng Zod chỉ so sánh endNum/startNum khi CẢ HAI cùng có mặt trong payload —
    // khi client chỉ gửi 1 trong 2 trường (partial update), phải tự đối chiếu với giá trị đang
    // lưu trong DB tại đây để không bao giờ lưu được endNum < startNum (điện năng tiêu thụ âm).
    if (input.startNum !== undefined || input.endNum !== undefined) {
      const current = await prisma.electricityMeter.findUniqueOrThrow({
        where: { id: meterId },
        select: { startNum: true, endNum: true },
      });
      const nextStartNum = input.startNum ?? current.startNum;
      const nextEndNum = input.endNum ?? current.endNum;
      if (nextEndNum < nextStartNum) {
        throw new Error("END_NUM_LESS_THAN_START_NUM");
      }
    }

    const meter = await prisma.electricityMeter.update({
      where: { id: meterId },
      data: {
        name: input.name,
        transformerStationId: input.transformerStationId,
        startNum: input.startNum,
        endNum: input.endNum,
        description: input.description,
        lastModified: new Date(),
      },
      include: { transformerStation: { select: { name: true } } },
    });
    return toMeterEntity(meter);
  }

  async softDeleteMeter(meterId: string): Promise<void> {
    await prisma.electricityMeter.update({
      where: { id: meterId },
      data: { isDeleted: true },
    });
  }

  async getStats() {
    const rows = await prisma.customer.findMany({
      where: { isDeleted: false },
      select: {
        isHasZalo: true,
        meters: { where: { isDeleted: false }, select: { startNum: true, endNum: true } },
      },
    });

    let updated = 0;
    let hasZalo = 0;
    for (const c of rows) {
      if (c.isHasZalo) hasZalo += 1;
      if (computeUpdateStatus(c.meters) === "updated") updated += 1;
    }

    return { total: rows.length, updated, notUpdated: rows.length - updated, hasZalo };
  }
}

export const customerRepository = new CustomerRepository();
