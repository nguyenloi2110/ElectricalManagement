import { NextRequest } from "next/server";
import { ZodError } from "zod";
import { requireAuth } from "@/lib/api/require-auth";
import { apiError, apiUnauthorized } from "@/lib/api/response";
import { invoiceService } from "@/services/invoice.service";
import { exportInvoicesSchema } from "@/validations/invoice.schema";
import { buildInvoiceExcelWorkbook } from "@/lib/export/invoice-excel";
import { currentDateStamp, currentTimeStamp } from "@/lib/export/filename";

/**
 * Xuất Excel danh sách hóa đơn — phản ánh đúng tập dữ liệu đang search/filter (SRS BR-7):
 * body có thể truyền `ids[]` (đã chọn cụ thể) hoặc `filter` (áp dụng cho toàn bộ kết quả lọc,
 * kể cả các trang chưa hiển thị).
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
      return apiError("Không có hóa đơn nào để xuất", 400);
    }

    const buffer = await buildInvoiceExcelWorkbook(invoices);
    const fileName = `HoaDon_${currentDateStamp()}_${currentTimeStamp()}.xlsx`;

    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return apiError("Dữ liệu không hợp lệ", 400, error.flatten());
    }
    console.error("[POST /api/invoices/export/excel]", error);
    return apiError("Có lỗi xảy ra, vui lòng thử lại", 500);
  }
}
