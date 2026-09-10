import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api/require-auth";
import { apiOk, apiError, apiUnauthorized } from "@/lib/api/response";
import { invoiceService } from "@/services/invoice.service";

/** Thống kê theo tháng — SRS FR-5. */
export async function GET(request: NextRequest) {
  const session = await requireAuth();
  if (!session) return apiUnauthorized();

  const month = request.nextUrl.searchParams.get("month")?.trim();
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return apiError("Vui lòng chọn tháng hợp lệ (yyyy-MM)", 400);
  }

  try {
    const [summary, byStation, byCustomer] = await Promise.all([
      invoiceService.getMonthlyStatistics(month),
      invoiceService.getStationCollectionSummary(month),
      invoiceService.getCustomerCollectionSummary(month),
    ]);

    return apiOk({ summary, byStation, byCustomer });
  } catch (error) {
    console.error("[GET /api/statistics]", error);
    return apiError("Có lỗi xảy ra, vui lòng thử lại", 500);
  }
}
