import { NextRequest } from "next/server";
import { ZodError } from "zod";
import { requireAuth } from "@/lib/api/require-auth";
import { apiOk, apiError, apiUnauthorized, apiNotFound } from "@/lib/api/response";
import { invoiceService } from "@/services/invoice.service";
import { updateInvoiceSchema } from "@/validations/invoice.schema";
import { serializeInvoice } from "@/lib/api/serialize";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const session = await requireAuth();
  if (!session) return apiUnauthorized();

  const { id } = await params;
  try {
    const invoice = await invoiceService.getById(id);
    if (!invoice) return apiNotFound("Không tìm thấy hóa đơn");

    return apiOk(serializeInvoice(invoice));
  } catch (error) {
    console.error("[GET /api/invoices/:id]", error);
    return apiError("Có lỗi xảy ra, vui lòng thử lại", 500);
  }
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  const session = await requireAuth();
  if (!session) return apiUnauthorized();

  const { id } = await params;
  try {
    const body = await request.json();
    const input = updateInvoiceSchema.parse(body);
    const updated = await invoiceService.update(id, input);
    if (!updated) return apiNotFound("Không tìm thấy hóa đơn");
    return apiOk(serializeInvoice(updated));
  } catch (error) {
    if (error instanceof ZodError) {
      return apiError("Dữ liệu không hợp lệ", 400, error.flatten());
    }
    if (error instanceof Error && error.message === "TOTAL_AMOUNT_PAID_EXCEEDS_TOTAL") {
      return apiError("Tiền đã nộp không được vượt quá tổng tiền hóa đơn", 400);
    }
    console.error("[PUT /api/invoices/:id]", error);
    return apiError("Có lỗi xảy ra, vui lòng thử lại", 500);
  }
}
