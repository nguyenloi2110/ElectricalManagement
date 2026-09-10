import pdfMake from "pdfmake";
import type { TDocumentDefinitions, Content } from "pdfmake/interfaces";
import path from "node:path";
import { configService } from "@/services/config.service";
import { amountToVietnameseWords } from "@/lib/export/currency-words";
import { currentDateStamp, currentTimeStamp } from "@/lib/export/filename";
import type { InvoiceEntity } from "@/domain/entities/invoice.entity";

// Font .ttf được copy sẵn vào public/fonts (xem README/memory) thay vì require.resolve() trực tiếp
// vào node_modules/pdfmake — tránh để Turbopack cố bundle file .ttf như một module JS.
const FONTS_DIR = path.join(process.cwd(), "public", "fonts");
const FONTS = {
  Roboto: {
    normal: path.join(FONTS_DIR, "Roboto-Regular.ttf"),
    bold: path.join(FONTS_DIR, "Roboto-Medium.ttf"),
    italics: path.join(FONTS_DIR, "Roboto-Italic.ttf"),
    bolditalics: path.join(FONTS_DIR, "Roboto-MediumItalic.ttf"),
  },
};

let policiesConfigured = false;
function configurePdfMakePolicies() {
  if (policiesConfigured) return;
  pdfMake.setFonts(FONTS);
  // Chỉ đọc font cục bộ đã khai báo ở trên, không truy cập URL/file ngoài ý muốn.
  pdfMake.setUrlAccessPolicy(() => false);
  pdfMake.setLocalAccessPolicy(() => true);
  policiesConfigured = true;
}

function formatNumber(n: number): string {
  return new Intl.NumberFormat("vi-VN").format(Math.round(n));
}

function buildInvoiceContent(
  invoice: InvoiceEntity,
  invoiceInfo: {
    ProjectOwner: string;
    BankAccountNumber: string;
    BankName: string;
    AccountHolderName: string;
    CustomerServicePhone: string;
    CashierName: string;
  },
  isFirst: boolean,
): Content {
  const unitPrice = invoice.details?.[0]?.unitPrice ?? 0;

  const tableBody = [
    [
      { text: "Tên ĐH", bold: true, fontSize: 13 },
      { text: "Trạm", bold: true, fontSize: 13 },
      { text: "Số Mới", bold: true, fontSize: 13 },
      { text: "Số Cũ", bold: true, fontSize: 13 },
      { text: "Điện Năng TT", bold: true, fontSize: 13 },
      { text: "Thành Tiền", bold: true, fontSize: 13 },
    ],
    ...(invoice.details ?? []).map((d) => [
      { text: d.electricityMeterName, alignment: "center" as const },
      { text: d.transformerStationName, alignment: "center" as const },
      { text: formatNumber(Number(d.endNum)), alignment: "center" as const },
      { text: formatNumber(Number(d.startNum)), alignment: "center" as const },
      { text: formatNumber(d.consumption), alignment: "center" as const },
      { text: formatNumber(d.amount), alignment: "right" as const },
    ]),
    [
      { text: "Tổng số tiền thanh toán", bold: true, colSpan: 5, alignment: "left" as const },
      { text: "" },
      { text: "" },
      { text: "" },
      { text: "" },
      { text: formatNumber(invoice.totalAmount), bold: true, alignment: "right" as const },
    ],
  ];

  const innerStack: Content[] = [
    { text: "BIÊN NHẬN THANH TOÁN TIỀN ĐIỆN", style: "title" },
    { text: `Trạm biến áp: ${invoice.stationName}`, style: "subtitle" },
    { text: `Tháng: ${invoice.month}`, alignment: "center", fontSize: 13, margin: [0, 0, 0, 16] },
    {
      text: [
        { text: "Tên khách hàng: ", bold: true },
        invoice.customerName,
        "\n",
        { text: "Số điện thoại: ", bold: true },
        invoice.customerPhone,
      ],
      fontSize: 13,
      margin: [0, 0, 0, 16],
    },
    { text: `Chủ Đầu Tư: ${invoiceInfo.ProjectOwner}`, bold: true, fontSize: 13, margin: [0, 0, 0, 16] },
    {
      text: [
        { text: "Stk nhận thanh toán: ", bold: true },
        `${invoiceInfo.BankAccountNumber} - ${invoiceInfo.BankName} - ${invoiceInfo.AccountHolderName}`,
      ],
      fontSize: 13,
      margin: [0, 0, 0, 16],
    },
    { text: `Giá Điện: ${formatNumber(unitPrice)} đồng/kWh`, bold: true, fontSize: 13, margin: [0, 0, 0, 16] },
    {
      // 2 cột đầu (Tên ĐH/Trạm) dùng "*" để tự co giãn lấp đầy phần rộng còn lại — tận dụng cơ chế
      // chia đều width có sẵn của pdfmake (luôn đúng bằng bề rộng khả dụng thực tế, không cần tự
      // tính tay dễ sai số) — 4 cột số liệu còn lại đặt width cố định đủ rộng để tiêu đề KHÔNG bị
      // xuống dòng (lỗi cũ: "auto" tự co theo nội dung khiến "Số Mới"/"Điện Năng TT" bị dồn hẹp,
      // 2 bên trông lệch nhau rõ rệt so với 2 cột "*" bên trái).
      table: {
        headerRows: 1,
        widths: ["*", "*", 48, 48, 65, 78],
        body: tableBody,
      },
      layout: {
        hLineWidth: () => 1,
        vLineWidth: () => 1,
        hLineColor: () => "black",
        vLineColor: () => "black",
        paddingLeft: () => 8,
        paddingRight: () => 8,
        paddingTop: () => 6,
        paddingBottom: () => 6,
      },
      fontSize: 13,
      margin: [0, 0, 0, 20],
    },
    {
      text: [
        { text: "Số tiền bằng chữ: ", bold: true },
        amountToVietnameseWords(invoice.totalAmount),
      ],
      fontSize: 13,
      margin: [0, 0, 0, 16],
    },
    {
      text: `Lưu ý: biên nhận này là xác thực khách hàng đã thanh toán tiền điện. Nếu cần liên hệ dịch vụ điện, Quý khách vui lòng gọi số: ${invoiceInfo.CustomerServicePhone}`,
      fontSize: 12,
      margin: [0, 0, 0, 24],
    },
    { text: [{ text: "Nhân Viên Thu Tiền: ", bold: true }, invoiceInfo.CashierName], fontSize: 13, alignment: "right" },
  ];

  // Bọc toàn bộ nội dung trong 1 bảng 1 ô với viền 2px đen, khớp mẫu HTML gốc
  // (`border: 2px solid #000; padding: 20px` bao quanh toàn bộ biên nhận).
  // Trở lại quy tắc mỗi hóa đơn 1 trang (theo yêu cầu) — cỡ chữ/khoảng cách được phóng to ở trên
  // để nội dung choán đầy và dễ đọc hơn trên trang, thay vì dồn nhiều hóa đơn chung 1 trang.
  return {
    table: { widths: ["*"], body: [[{ stack: innerStack, margin: [24, 24, 24, 24] }]] },
    layout: {
      hLineWidth: () => 2,
      vLineWidth: () => 2,
      hLineColor: () => "black",
      vLineColor: () => "black",
    },
    pageBreak: isFirst ? undefined : "before",
  };
}

/** Sinh file PDF (.pdf) cho 1 hoặc nhiều hóa đơn — mỗi hóa đơn 1 trang, dùng font Roboto (hỗ trợ đầy đủ tiếng Việt). */
export async function buildInvoicePdfBuffer(invoices: InvoiceEntity[]): Promise<Buffer> {
  configurePdfMakePolicies();
  const invoiceInfo = await configService.getInvoiceExportInfo();

  const content: Content[] = invoices.map((invoice, index) =>
    buildInvoiceContent(invoice, invoiceInfo, index === 0),
  );

  const docDefinition: TDocumentDefinitions = {
    content,
    defaultStyle: { font: "Roboto", fontSize: 13 },
    styles: {
      title: { fontSize: 26, bold: true, alignment: "center", margin: [0, 0, 0, 10] },
      subtitle: { fontSize: 16, bold: true, alignment: "center", margin: [0, 0, 0, 10] },
    },
    pageMargins: [50, 60, 50, 60],
  };

  const pdfDoc = pdfMake.createPdf(docDefinition);
  return pdfDoc.getBuffer();
}

/**
 * Tên file PDF theo mẫu `HoaDon_[MãKháchHàng]_[ThángThanhToán]_[Giờ-Phút-Giây].pdf` (SRS + yêu cầu UX).
 * Luôn kèm giờ:phút:giây lúc xuất để phân biệt các lần xuất khác nhau trong cùng ngày, tránh trùng tên file.
 */
export function buildInvoicePdfFilename(invoices: InvoiceEntity[]): string {
  const time = currentTimeStamp();
  if (invoices.length === 1) {
    const [invoice] = invoices;
    const [year, month] = invoice.month.split("-");
    return `HoaDon_${invoice.customerCode}_${month}-${year}_${time}.pdf`;
  }
  return `HoaDon_${invoices.length}KhachHang_${currentDateStamp()}_${time}.pdf`;
}
