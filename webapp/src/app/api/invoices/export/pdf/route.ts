import { NextRequest } from "next/server";
import { ZodError } from "zod";
import { requireAuth } from "@/lib/api/require-auth";
import { apiError, apiUnauthorized } from "@/lib/api/response";
import { invoiceService } from "@/services/invoice.service";
import { exportInvoicesSchema } from "@/validations/invoice.schema";
import { buildInvoicePdfBuffer, buildInvoicePdfFilename } from "@/lib/export/invoice-pdf";

/**
 * Tải trực tiếp file PDF hóa đơn (1 hoặc nhiều hóa đơn, mỗi hóa đơn 1 trang) — thay cho luồng
 * mở tab in cũ. Áp dụng cùng cơ chế "ids đã chọn" hoặc "filter toàn bộ kết quả lọc" như Excel (SRS BR-7).
 */
export async function POST(request: NextRequest) {
  const session = await requireAuth();
  if (!session) return apiUnauthorized();

  try {
    const body = await request.json();
    const input = exportInvoicesSchema.parse(body);

    const invoices =
      input.ids && input.ids.length > 0
        ? await invoiceService.getManyByIds(input.ids)
        : await invoiceService.listAllMatching({
            customerName: input.filter?.customerName,
            customerId: input.filter?.customerId,
            month: input.filter?.month,
            status: input.filter?.status ?? "all",
            zalo: input.filter?.zalo ?? "all",
            stationId: input.filter?.stationId,
          });

    if (invoices.length === 0) {
      return apiError("Không có hóa đơn nào để xuất PDF", 400);
    }

    const buffer = await buildInvoicePdfBuffer(invoices);
    const fileName = buildInvoicePdfFilename(invoices);

    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return apiError("Dữ liệu không hợp lệ", 400, error.flatten());
    }
    console.error("[POST /api/invoices/export/pdf]", error);
    return apiError("Có lỗi xảy ra, vui lòng thử lại", 500);
  }
}
