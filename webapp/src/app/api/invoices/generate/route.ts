import { NextRequest } from "next/server";
import { ZodError } from "zod";
import { requireAuth } from "@/lib/api/require-auth";
import { apiOk, apiError, apiUnauthorized } from "@/lib/api/response";
import { invoiceService } from "@/services/invoice.service";
import { generateInvoicesSchema } from "@/validations/invoice.schema";

/**
 * Tạo hóa đơn hàng loạt theo tháng (SRS FR-2.5). Nếu có khách hàng đã có hóa đơn tháng đó và
 * chưa xác nhận ghi đè, trả về `needsConfirmation: true` để FE hiển thị AlertDialog (BR-5).
 */
export async function POST(request: NextRequest) {
  const session = await requireAuth();
  if (!session) return apiUnauthorized();

  try {
    const body = await request.json();
    const input = generateInvoicesSchema.parse(body);

    if (!input.useDefaultPrice && input.unitPrice === undefined) {
      return apiError("Vui lòng nhập giá điện hoặc chọn dùng giá mặc định", 400);
    }

    const result = await invoiceService.generate(input);
    return apiOk(result);
  } catch (error) {
    if (error instanceof ZodError) {
      return apiError("Dữ liệu không hợp lệ", 400, error.flatten());
    }
    console.error("[POST /api/invoices/generate]", error);
    return apiError("Có lỗi xảy ra, vui lòng thử lại", 500);
  }
}
