import { requireAuth } from "@/lib/api/require-auth";
import { apiOk, apiError, apiUnauthorized } from "@/lib/api/response";
import { transformerStationRepository } from "@/repositories/transformer-station.repository";

/** Danh mục trạm biến áp — dùng cho dropdown khi thêm/sửa đồng hồ (SRS 3.2.2). */
export async function GET() {
  const session = await requireAuth();
  if (!session) return apiUnauthorized();

  try {
    const stations = await transformerStationRepository.findAllActive();
    return apiOk(stations);
  } catch (error) {
    console.error("[GET /api/transformer-stations]", error);
    return apiError("Có lỗi xảy ra, vui lòng thử lại", 500);
  }
}
