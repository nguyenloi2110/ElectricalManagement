import { NextRequest } from "next/server";
import { ZodError } from "zod";
import { loginSchema } from "@/validations/auth.schema";
import { authService } from "@/services/auth.service";
import { apiOk, apiError } from "@/lib/api/response";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phoneNumber, password } = loginSchema.parse(body);

    const result = await authService.login(phoneNumber, password);
    if (!result.ok) {
      return apiError(result.message, 401);
    }

    return apiOk({ message: "Đăng nhập thành công" });
  } catch (error) {
    if (error instanceof ZodError) {
      return apiError("Dữ liệu không hợp lệ", 400, error.flatten());
    }
    console.error("[POST /api/auth/login]", error);
    return apiError("Có lỗi xảy ra, vui lòng thử lại", 500);
  }
}
