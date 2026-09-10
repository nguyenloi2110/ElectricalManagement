import { NextRequest } from "next/server";
import { ZodError } from "zod";
import { requireAuth } from "@/lib/api/require-auth";
import { apiOk, apiError, apiUnauthorized, apiNotFound } from "@/lib/api/response";
import { customerService } from "@/services/customer.service";
import { updateCustomerSchema } from "@/validations/customer.schema";
import { serializeCustomer } from "@/lib/api/serialize";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const session = await requireAuth();
  if (!session) return apiUnauthorized();

  const { id } = await params;
  try {
    const customer = await customerService.getById(id);
    if (!customer) return apiNotFound("Không tìm thấy khách hàng");

    return apiOk(serializeCustomer(customer));
  } catch (error) {
    console.error("[GET /api/customers/:id]", error);
    return apiError("Có lỗi xảy ra, vui lòng thử lại", 500);
  }
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  const session = await requireAuth();
  if (!session) return apiUnauthorized();

  const { id } = await params;
  try {
    const body = await request.json();
    const input = updateCustomerSchema.parse(body);
    const updated = await customerService.update(id, input);
    return apiOk(serializeCustomer(updated));
  } catch (error) {
    if (error instanceof ZodError) {
      return apiError("Dữ liệu không hợp lệ", 400, error.flatten());
    }
    console.error("[PUT /api/customers/:id]", error);
    return apiError("Có lỗi xảy ra, vui lòng thử lại", 500);
  }
}
