import { NextRequest } from "next/server";
import { ZodError } from "zod";
import { requireAuth } from "@/lib/api/require-auth";
import { apiOk, apiError, apiUnauthorized } from "@/lib/api/response";
import { customerService } from "@/services/customer.service";
import { updateMeterSchema } from "@/validations/customer.schema";
import { serializeMeter } from "@/lib/api/serialize";

type RouteContext = { params: Promise<{ id: string; meterId: string }> };

/** Sửa đồng hồ điện (bao gồm ghi "Số cuối" hàng kỳ) — xem SRS FR-2.3. */
export async function PUT(request: NextRequest, { params }: RouteContext) {
  const session = await requireAuth();
  if (!session) return apiUnauthorized();

  const { meterId } = await params;
  try {
    const body = await request.json();
    const input = updateMeterSchema.parse(body);
    const meter = await customerService.updateMeter(meterId, input);
    return apiOk(serializeMeter(meter));
  } catch (error) {
    if (error instanceof ZodError) {
      return apiError("Dữ liệu không hợp lệ", 400, error.flatten());
    }
    if (error instanceof Error && error.message === "END_NUM_LESS_THAN_START_NUM") {
      return apiError("Số cuối phải lớn hơn hoặc bằng số đầu", 400);
    }
    console.error("[PUT /api/customers/:id/meters/:meterId]", error);
    return apiError("Có lỗi xảy ra, vui lòng thử lại", 500);
  }
}

/** Xóa mềm đồng hồ điện (yêu cầu xác nhận ở phía UI) — xem SRS FR-2.3. */
export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const session = await requireAuth();
  if (!session) return apiUnauthorized();

  const { meterId } = await params;
  try {
    await customerService.softDeleteMeter(meterId);
    return apiOk({ message: "Đã xóa đồng hồ" });
  } catch (error) {
    console.error("[DELETE /api/customers/:id/meters/:meterId]", error);
    return apiError("Có lỗi xảy ra, vui lòng thử lại", 500);
  }
}
