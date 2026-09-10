/**
 * Domain entities — plain TypeScript types describing core business objects,
 * independent from the Prisma/DB layer (Clean Architecture: Domain layer).
 */

export type UpdateStatus = "updated" | "not-updated" | "not-applicable";

export interface MeterEntity {
  id: string;
  code: number;
  name: string;
  customerId: string;
  transformerStationId: string;
  transformerStationName?: string;
  startNum: bigint;
  endNum: bigint;
  description: string | null;
  isDeleted: boolean;
  /** Đã ghi số mới (EndNum !== StartNum) hay chưa — xem SRS BR-2 */
  isUpdated: boolean;
}

export interface CustomerEntity {
  id: string;
  code: number;
  name: string;
  description: string | null;
  phone: string;
  isHasZalo: boolean;
  isDeleted: boolean;
  createdAt: Date | null;
  lastModified: Date | null;
  meterCount: number;
  /** true chỉ khi TẤT CẢ đồng hồ đã cập nhật; "not-applicable" khi 0 đồng hồ — xem SRS BR-2 */
  updateStatus: UpdateStatus;
  meters?: MeterEntity[];
}

export interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
