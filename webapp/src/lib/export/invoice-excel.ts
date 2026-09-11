import ExcelJS from "exceljs";
import { INVOICE_STATUS, type InvoiceEntity } from "@/domain/entities/invoice.entity";

function statusLabel(status: number): string {
  if (status === INVOICE_STATUS.PAID) return "Đã thanh toán";
  if (status === INVOICE_STATUS.PARTIAL) return "Thanh toán một phần";
  return "Chưa thanh toán";
}

const CURRENCY_FORMAT = '#,##0 "đ"';
const THIN_BORDER: Partial<ExcelJS.Borders> = {
  top: { style: "thin", color: { argb: "FFCBD5E1" } },
  left: { style: "thin", color: { argb: "FFCBD5E1" } },
  bottom: { style: "thin", color: { argb: "FFCBD5E1" } },
  right: { style: "thin", color: { argb: "FFCBD5E1" } },
};

/** Xuất danh sách hóa đơn ra file Excel (.xlsx) — cột/format tham chiếu mẫu trong Document-SRS, có bổ sung Font/Border/Total row chuẩn chỉnh. */
export async function buildInvoiceExcelWorkbook(invoices: InvoiceEntity[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "duanhuongelectric";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Danh sách hóa đơn", {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  sheet.columns = [
    { header: "STT", key: "stt", width: 6 },
    { header: "Tên khách hàng", key: "customerName", width: 30 },
    { header: "Điện thoại", key: "phone", width: 15 },
    { header: "Tháng", key: "month", width: 10 },
    { header: "Trạm", key: "station", width: 18 },
    { header: "Trạng thái", key: "status", width: 20 },
    { header: "Tiền đã đóng", key: "paid", width: 16 },
    { header: "Tổng tiền", key: "total", width: 16 },
    { header: "Ngày tạo", key: "createdAt", width: 18 },
  ];

  invoices.forEach((inv, index) => {
    sheet.addRow({
      stt: index + 1,
      customerName: inv.customerName,
      phone: inv.customerPhone,
      month: inv.month,
      station: inv.stationName,
      status: statusLabel(inv.status),
      paid: inv.totalAmountPaid,
      total: inv.totalAmount,
      createdAt: inv.createdAt ? new Date(inv.createdAt) : null,
    });
  });

  sheet.getColumn("paid").numFmt = CURRENCY_FORMAT;
  sheet.getColumn("total").numFmt = CURRENCY_FORMAT;
  sheet.getColumn("paid").alignment = { horizontal: "right" };
  sheet.getColumn("total").alignment = { horizontal: "right" };
  sheet.getColumn("createdAt").numFmt = "dd/mm/yyyy hh:mm";
  sheet.getColumn("stt").alignment = { horizontal: "center" };
  sheet.getColumn("month").alignment = { horizontal: "center" };
  sheet.getColumn("status").alignment = { horizontal: "center" };

  // Style header LAST — ExcelJS's `column.xxx = value` setters overwrite that property
  // on every existing cell in the column (including row 1), so applying header style
  // before the column-level numFmt/alignment above caused inconsistent header formatting.
  const headerRow = sheet.getRow(1);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, name: "Calibri", size: 11 };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2563EB" } };
    cell.alignment = { vertical: "middle", horizontal: "center" };
  });
  headerRow.height = 22;

  for (let r = 1; r <= invoices.length + 1; r++) {
    sheet.getRow(r).eachCell({ includeEmpty: true }, (cell) => {
      cell.border = THIN_BORDER;
      if (r > 1) cell.font = { name: "Calibri", size: 11 };
    });
  }

  const totalPaid = invoices.reduce((s, i) => s + i.totalAmountPaid, 0);
  const totalAmount = invoices.reduce((s, i) => s + i.totalAmount, 0);
  const totalRow = sheet.addRow({
    customerName: `Tổng cộng (${invoices.length} hóa đơn)`,
    paid: totalPaid,
    total: totalAmount,
  });
  totalRow.eachCell({ includeEmpty: true }, (cell) => {
    cell.font = { bold: true, name: "Calibri", size: 11 };
    cell.border = THIN_BORDER;
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } };
  });
  totalRow.getCell("paid").numFmt = CURRENCY_FORMAT;
  totalRow.getCell("total").numFmt = CURRENCY_FORMAT;
  sheet.mergeCells(`B${totalRow.number}:F${totalRow.number}`);

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}
