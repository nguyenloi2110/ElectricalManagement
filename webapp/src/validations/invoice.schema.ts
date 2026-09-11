import { z } from "zod";

export const updateInvoiceSchema = z.object({
  // VND không có đơn vị lẻ — bắt buộc số nguyên để tránh sai số dấu phẩy động khi so sánh với TotalAmount.
  totalAmountPaid: z.coerce.number().int("Tiền đã nộp phải là số nguyên (đồng)").min(0, "Tiền đã nộp không được âm"),
  note: z.string().trim().optional().nullable(),
});

export const batchDeleteInvoicesSchema = z.object({
  ids: z.array(z.string().trim().min(1)).min(1, "Vui lòng chọn ít nhất 1 hóa đơn"),
});

export const generateInvoicesSchema = z.object({
  customerIds: z.array(z.string().trim().min(1)).min(1, "Vui lòng chọn ít nhất 1 khách hàng"),
  month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Tháng phải theo định dạng yyyy-MM hợp lệ"),
  unitPrice: z.coerce.number().min(0, "Giá điện không được âm").optional(),
  useDefaultPrice: z.boolean().default(true),
  confirmOverwrite: z.boolean().default(false),
});

export const exportInvoicesSchema = z.object({
  ids: z.array(z.string().trim().min(1)).optional(),
  filter: z
    .object({
      customerName: z.string().trim().optional(),
      customerId: z.string().trim().optional(),
      month: z.string().trim().optional(),
      status: z.enum(["all", "paid", "unpaid", "partial"]).optional(),
      zalo: z.enum(["all", "yes", "no"]).optional(),
      stationId: z.string().trim().optional(),
    })
    .optional(),
});

export type UpdateInvoiceInputDto = z.infer<typeof updateInvoiceSchema>;
export type GenerateInvoicesInputDto = z.infer<typeof generateInvoicesSchema>;
export type ExportInvoicesInputDto = z.infer<typeof exportInvoicesSchema>;
