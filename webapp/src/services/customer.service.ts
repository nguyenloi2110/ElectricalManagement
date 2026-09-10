import { customerRepository } from "@/repositories/customer.repository";
import type {
  CustomerListQuery,
  ZaloFilter,
  UpdatedFilter,
} from "@/domain/repositories/customer.repository.interface";
import type { CreateCustomerInputDto, UpdateCustomerInputDto, AddMeterInputDto, UpdateMeterInputDto } from "@/validations/customer.schema";

export const CUSTOMERS_PAGE_SIZE = 50;

function parsePage(value: string | null): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 1;
}

function parseZaloFilter(value: string | null): ZaloFilter {
  return value === "yes" || value === "no" ? value : "all";
}

function parseUpdatedFilter(value: string | null): UpdatedFilter {
  return value === "updated" || value === "not-updated" ? value : "all";
}

export class CustomerService {
  /** Xây dựng CustomerListQuery từ query string của request (FR-2.2). */
  buildListQuery(searchParams: URLSearchParams): CustomerListQuery {
    return {
      page: parsePage(searchParams.get("page")),
      pageSize: CUSTOMERS_PAGE_SIZE,
      search: searchParams.get("search")?.trim() || undefined,
      zalo: parseZaloFilter(searchParams.get("zalo")),
      updated: parseUpdatedFilter(searchParams.get("updated")),
    };
  }

  async list(query: CustomerListQuery) {
    return customerRepository.findManyPaged(query);
  }

  async getStats() {
    return customerRepository.getStats();
  }

  async getById(id: string) {
    return customerRepository.findByIdWithMeters(id);
  }

  async create(input: CreateCustomerInputDto) {
    return customerRepository.create({
      name: input.name,
      phone: input.phone,
      description: input.description,
      isHasZalo: input.isHasZalo,
      meters: input.meters?.map((m) => ({
        name: m.name,
        transformerStationId: m.transformerStationId,
        startNum: BigInt(m.startNum),
        endNum: BigInt(m.endNum),
        description: m.description,
      })),
    });
  }

  async update(id: string, input: UpdateCustomerInputDto) {
    return customerRepository.update(id, input);
  }

  async softDeleteMany(ids: string[]) {
    return customerRepository.softDeleteMany(ids);
  }

  async addMeter(customerId: string, input: AddMeterInputDto) {
    return customerRepository.addMeter(customerId, {
      name: input.name,
      transformerStationId: input.transformerStationId,
      startNum: BigInt(input.startNum),
      endNum: BigInt(input.endNum),
      description: input.description,
    });
  }

  async updateMeter(meterId: string, input: UpdateMeterInputDto) {
    return customerRepository.updateMeter(meterId, {
      name: input.name,
      transformerStationId: input.transformerStationId,
      startNum: input.startNum !== undefined ? BigInt(input.startNum) : undefined,
      endNum: input.endNum !== undefined ? BigInt(input.endNum) : undefined,
      description: input.description,
    });
  }

  async softDeleteMeter(meterId: string) {
    return customerRepository.softDeleteMeter(meterId);
  }
}

export const customerService = new CustomerService();
