import { z } from "zod";

/** Zod schema cho 1 đồng hồ điện (dùng chung khi tạo mới trong form khách hàng và khi thêm/sửa riêng lẻ). */
export const meterSchema = z.object({
  name: z.string().trim().min(1, "Tên đồng hồ không được để trống"),
  transformerStationId: z.string().trim().min(1, "Vui lòng chọn trạm biến áp"),
  startNum: z.coerce.number().int("Số đầu phải là số nguyên").min(0, "Số đầu không được âm"),
  endNum: z.coerce.number().int("Số cuối phải là số nguyên").min(0, "Số cuối không được âm"),
  description: z.string().trim().optional().nullable(),
}).refine((data) => data.endNum >= data.startNum, {
  message: "Số cuối phải lớn hơn hoặc bằng số đầu",
  path: ["endNum"],
});

export const createCustomerSchema = z.object({
  name: z.string().trim().min(1, "Tên khách hàng không được để trống"),
  phone: z.string().trim().min(1, "Số điện thoại không được để trống"),
  description: z.string().trim().optional().nullable(),
  isHasZalo: z.boolean().default(false),
  meters: z.array(meterSchema).optional().default([]),
});

export const updateCustomerSchema = z.object({
  name: z.string().trim().min(1, "Tên khách hàng không được để trống"),
  phone: z.string().trim().min(1, "Số điện thoại không được để trống"),
  description: z.string().trim().optional().nullable(),
  isHasZalo: z.boolean().default(false),
});

export const batchDeleteSchema = z.object({
  ids: z.array(z.string().trim().min(1)).min(1, "Vui lòng chọn ít nhất 1 khách hàng"),
});

export const addMeterSchema = meterSchema;

export const updateMeterSchema = z.object({
  name: z.string().trim().min(1).optional(),
  transformerStationId: z.string().trim().min(1).optional(),
  startNum: z.coerce.number().int().min(0).optional(),
  endNum: z.coerce.number().int().min(0).optional(),
  description: z.string().trim().optional().nullable(),
}).refine(
  (data) => data.startNum === undefined || data.endNum === undefined || data.endNum >= data.startNum,
  { message: "Số cuối phải lớn hơn hoặc bằng số đầu", path: ["endNum"] },
);

export type CreateCustomerInputDto = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInputDto = z.infer<typeof updateCustomerSchema>;
export type AddMeterInputDto = z.infer<typeof addMeterSchema>;
export type UpdateMeterInputDto = z.infer<typeof updateMeterSchema>;
