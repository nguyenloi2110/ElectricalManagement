import { NextRequest } from "next/server";
import { ZodError } from "zod";
import { requireAuth } from "@/lib/api/require-auth";
import { apiOk, apiError, apiUnauthorized } from "@/lib/api/response";
import { customerService } from "@/services/customer.service";
import { batchDeleteSchema } from "@/validations/customer.schema";

/** Xóa mềm 1/nhiều/toàn bộ khách hàng đã chọn — xem SRS FR-2.4. */
export async function POST(request: NextRequest) {
  const session = await requireAuth();
  if (!session) return apiUnauthorized();

  try {
    const body = await request.json();
    const { ids } = batchDeleteSchema.parse(body);
    const count = await customerService.softDeleteMany(ids);
    return apiOk({ deletedCount: count });
  } catch (error) {
    if (error instanceof ZodError) {
      return apiError("Dữ liệu không hợp lệ", 400, error.flatten());
    }
    console.error("[POST /api/customers/batch-delete]", error);
    return apiError("Có lỗi xảy ra, vui lòng thử lại", 500);
  }
}
