import { requireAuth } from "@/lib/api/require-auth";
import { apiOk, apiError, apiUnauthorized } from "@/lib/api/response";
import { customerService } from "@/services/customer.service";

/** Số liệu tổng quan cho các stat cards trên trang Khách hàng. */
export async function GET() {
  const session = await requireAuth();
  if (!session) return apiUnauthorized();

  try {
    const stats = await customerService.getStats();
    return apiOk(stats);
  } catch (error) {
    console.error("[GET /api/customers/stats]", error);
    return apiError("Có lỗi xảy ra, vui lòng thử lại", 500);
  }
}
