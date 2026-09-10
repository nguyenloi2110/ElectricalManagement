import { z } from "zod";

export const electricityMeterPriceSchema = z.object({
  UnitPrice: z.coerce.number().positive("Giá điện phải lớn hơn 0"),
});

export const invoiceExportInfoSchema = z.object({
  ProjectOwner: z.string().trim().min(1, "Vui lòng nhập chủ đầu tư"),
  BankAccountNumber: z.string().trim().min(1, "Vui lòng nhập số tài khoản ngân hàng"),
  BankName: z.string().trim().min(1, "Vui lòng nhập tên ngân hàng"),
  AccountHolderName: z.string().trim().min(1, "Vui lòng nhập tên chủ tài khoản"),
  CustomerServicePhone: z.string().trim().min(1, "Vui lòng nhập số chăm sóc khách hàng"),
  CashierName: z.string().trim().min(1, "Vui lòng nhập tên thu ngân"),
});

export type ElectricityMeterPriceDto = z.infer<typeof electricityMeterPriceSchema>;
export type InvoiceExportInfoDto = z.infer<typeof invoiceExportInfoSchema>;
