import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api/require-auth";
import { apiOk, apiError, apiUnauthorized } from "@/lib/api/response";
import { invoiceService } from "@/services/invoice.service";
import { serializeInvoice } from "@/lib/api/serialize";

export async function GET(request: NextRequest) {
  const session = await requireAuth();
  if (!session) return apiUnauthorized();

  try {
    const query = invoiceService.buildListQuery(request.nextUrl.searchParams);
    const result = await invoiceService.list(query);

    return apiOk({
      ...result,
      items: result.items.map(serializeInvoice),
    });
  } catch (error) {
    console.error("[GET /api/invoices]", error);
    return apiError("Có lỗi xảy ra, vui lòng thử lại", 500);
  }
}
