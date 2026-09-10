import { ReportsClient } from "@/app/(dashboard)/reports/ReportsClient";

export default function ReportsPage() {
  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold text-foreground">Thống kê</h1>
      <p className="mb-4 text-sm text-muted-foreground">
        Tổng hợp số liệu thu tiền điện theo tháng: số hóa đơn theo trạng thái, tổng doanh thu, tiền
        đã thu/còn nợ và sản lượng tiêu thụ.
      </p>
      <ReportsClient />
    </div>
  );
}
