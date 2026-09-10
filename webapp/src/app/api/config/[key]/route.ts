import { NextRequest } from "next/server";
import { ZodError } from "zod";
import { requireAuth } from "@/lib/api/require-auth";
import { apiOk, apiError, apiUnauthorized, apiNotFound } from "@/lib/api/response";
import { configService } from "@/services/config.service";
import { electricityMeterPriceSchema, invoiceExportInfoSchema } from "@/validations/config.schema";

type RouteContext = { params: Promise<{ key: string }> };

const SUPPORTED_KEYS = ["price", "invoice-info"] as const;

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const session = await requireAuth();
  if (!session) return apiUnauthorized();

  const { key } = await params;
  try {
    if (key === "price") {
      return apiOk(await configService.getPrice());
    }
    if (key === "invoice-info") {
      return apiOk(await configService.getInvoiceExportInfo());
    }
    return apiNotFound(`Cấu hình "${key}" không tồn tại`);
  } catch (error) {
    console.error("[GET /api/config/:key]", error);
    return apiError("Có lỗi xảy ra, vui lòng thử lại", 500);
  }
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  const session = await requireAuth();
  if (!session) return apiUnauthorized();

  const { key } = await params;
  if (!SUPPORTED_KEYS.includes(key as (typeof SUPPORTED_KEYS)[number])) {
    return apiNotFound(`Cấu hình "${key}" không tồn tại`);
  }

  try {
    const body = await request.json();
    if (key === "price") {
      const input = electricityMeterPriceSchema.parse(body);
      await configService.setPrice(input);
      return apiOk(input);
    }

    const input = invoiceExportInfoSchema.parse(body);
    await configService.setInvoiceExportInfo(input);
    return apiOk(input);
  } catch (error) {
    if (error instanceof ZodError) {
      return apiError("Dữ liệu không hợp lệ", 400, error.flatten());
    }
    console.error("[PUT /api/config/:key]", error);
    return apiError("Có lỗi xảy ra, vui lòng thử lại", 500);
  }
}
