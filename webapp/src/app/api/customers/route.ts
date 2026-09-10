import { NextRequest } from "next/server";
import { ZodError } from "zod";
import { requireAuth } from "@/lib/api/require-auth";
import { apiOk, apiError, apiUnauthorized } from "@/lib/api/response";
import { customerService } from "@/services/customer.service";
import { createCustomerSchema } from "@/validations/customer.schema";
import { serializeCustomer } from "@/lib/api/serialize";

export async function GET(request: NextRequest) {
  const session = await requireAuth();
  if (!session) return apiUnauthorized();

  try {
    const query = customerService.buildListQuery(request.nextUrl.searchParams);
    const result = await customerService.list(query);

    return apiOk({
      ...result,
      items: result.items.map(serializeCustomer),
    });
  } catch (error) {
    console.error("[GET /api/customers]", error);
    return apiError("Có lỗi xảy ra, vui lòng thử lại", 500);
  }
}

export async function POST(request: NextRequest) {
  const session = await requireAuth();
  if (!session) return apiUnauthorized();

  try {
    const body = await request.json();
    const input = createCustomerSchema.parse(body);
    const created = await customerService.create(input);
    return apiOk(serializeCustomer(created), 201);
  } catch (error) {
    if (error instanceof ZodError) {
      return apiError("Dữ liệu không hợp lệ", 400, error.flatten());
    }
    console.error("[POST /api/customers]", error);
    return apiError("Có lỗi xảy ra, vui lòng thử lại", 500);
  }
}
