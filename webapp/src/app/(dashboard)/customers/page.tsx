import { Suspense } from "react";
import { transformerStationRepository } from "@/repositories/transformer-station.repository";
import { CustomerListClient } from "@/app/(dashboard)/customers/CustomerListClient";

export default async function CustomersPage() {
  const stations = await transformerStationRepository.findAllActive();

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold text-foreground">Quản lý khách hàng</h1>
      <p className="mb-4 text-sm text-muted-foreground">
        Tất cả các dữ liệu khách hàng sẽ được hiển thị ở đây. Bạn có thể thêm, sửa, xóa khách
        hàng và tìm kiếm theo tên, mô tả, điện thoại và tổng đồng hồ.
      </p>
      <Suspense fallback={null}>
        <CustomerListClient stations={stations} />
      </Suspense>
    </div>
  );
}

