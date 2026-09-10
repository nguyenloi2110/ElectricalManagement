import { z } from "zod";

export const loginSchema = z.object({
  phoneNumber: z.string().trim().min(1, "Số điện thoại không được để trống"),
  password: z.string().min(1, "Mật khẩu không được để trống"),
});

export type LoginInput = z.infer<typeof loginSchema>;
