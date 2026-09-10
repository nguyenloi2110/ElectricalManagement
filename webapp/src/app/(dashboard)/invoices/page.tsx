import { transformerStationRepository } from "@/repositories/transformer-station.repository";
import { InvoiceListClient } from "@/app/(dashboard)/invoices/InvoiceListClient";

export default async function InvoicesPage() {
  const stations = await transformerStationRepository.findAllActive();

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold text-foreground">Quản lý hóa đơn điện</h1>
      <p className="mb-4 text-sm text-muted-foreground">
        Danh sách hóa đơn tiền điện theo tháng. Tìm kiếm, lọc theo trạng thái/trạm, cập nhật tiền
        đã nộp, xuất Excel hoặc in hóa đơn.
      </p>
      <InvoiceListClient stations={stations} />
    </div>
  );
}
