import type { CustomerEntity, MeterEntity, PagedResult } from "@/domain/entities/customer.entity";

export type ZaloFilter = "all" | "yes" | "no";
export type UpdatedFilter = "all" | "updated" | "not-updated";

export interface CustomerListQuery {
  page: number;
  pageSize: number;
  search?: string;
  zalo?: ZaloFilter;
  updated?: UpdatedFilter;
}

export interface CreateMeterInput {
  name: string;
  transformerStationId: string;
  startNum: bigint;
  endNum: bigint;
  description?: string | null;
}

export interface CreateCustomerInput {
  name: string;
  phone: string;
  description?: string | null;
  isHasZalo: boolean;
  meters?: CreateMeterInput[];
}

export interface UpdateCustomerInput {
  name: string;
  phone: string;
  description?: string | null;
  isHasZalo: boolean;
}

export interface UpdateMeterInput {
  name?: string;
  transformerStationId?: string;
  startNum?: bigint;
  endNum?: bigint;
  description?: string | null;
}

export interface CustomerStats {
  total: number;
  updated: number;
  notUpdated: number;
  hasZalo: number;
}

/** Cổng (port) truy vấn dữ liệu khách hàng — tầng domain, được tầng repository triển khai. */
export interface ICustomerRepository {
  findManyPaged(query: CustomerListQuery): Promise<PagedResult<CustomerEntity>>;
  findByIdWithMeters(id: string): Promise<CustomerEntity | null>;
  create(input: CreateCustomerInput): Promise<CustomerEntity>;
  update(id: string, input: UpdateCustomerInput): Promise<CustomerEntity>;
  softDeleteMany(ids: string[]): Promise<number>;
  addMeter(customerId: string, input: CreateMeterInput): Promise<MeterEntity>;
  updateMeter(meterId: string, input: UpdateMeterInput): Promise<MeterEntity>;
  softDeleteMeter(meterId: string): Promise<void>;
  getStats(): Promise<CustomerStats>;
}
