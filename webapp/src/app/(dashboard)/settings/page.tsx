import { configService } from "@/services/config.service";
import { SettingsForms } from "@/app/(dashboard)/settings/SettingsForms";

export default async function SettingsPage() {
  const [price, invoiceInfo] = await Promise.all([
    configService.getPrice(),
    configService.getInvoiceExportInfo(),
  ]);

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-5">
        <h1 className="text-xl font-semibold text-foreground">Cấu hình</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Thiết lập giá điện mặc định và thông tin hiển thị trên hóa đơn xuất ra.
        </p>
      </div>
      <SettingsForms initialPrice={price} initialInvoiceInfo={invoiceInfo} />
    </div>
  );
}
