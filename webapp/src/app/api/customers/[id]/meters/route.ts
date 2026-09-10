import { NextRequest } from "next/server";
import { ZodError } from "zod";
import { requireAuth } from "@/lib/api/require-auth";
import { apiOk, apiError, apiUnauthorized } from "@/lib/api/response";
import { customerService } from "@/services/customer.service";
import { addMeterSchema } from "@/validations/customer.schema";
import { serializeMeter } from "@/lib/api/serialize";

type RouteContext = { params: Promise<{ id: string }> };

/** Thêm mới 1 đồng hồ điện cho khách hàng — xem SRS FR-2.3. */
export async function POST(request: NextRequest, { params }: RouteContext) {
  const session = await requireAuth();
  if (!session) return apiUnauthorized();

  const { id } = await params;
  try {
    const body = await request.json();
    const input = addMeterSchema.parse(body);
    const meter = await customerService.addMeter(id, input);
    return apiOk(serializeMeter(meter), 201);
  } catch (error) {
    if (error instanceof ZodError) {
      return apiError("Dữ liệu không hợp lệ", 400, error.flatten());
    }
    console.error("[POST /api/customers/:id/meters]", error);
    return apiError("Có lỗi xảy ra, vui lòng thử lại", 500);
  }
}
