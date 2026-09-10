/**
 * Chuyển số tiền (VND) sang chữ tiếng Việt — dùng cho dòng "Số tiền bằng chữ" trên hóa đơn in
 * (đúng placeholder `@wordOfTotalAmount` trong mẫu `Html.Invoice` — xem SRS mục 3.2.7).
 */

const DIGITS = [
  "không",
  "một",
  "hai",
  "ba",
  "bốn",
  "năm",
  "sáu",
  "bảy",
  "tám",
  "chín",
];

function readThreeDigits(n: number, isFirstGroup: boolean): string {
  const hundred = Math.floor(n / 100);
  const ten = Math.floor((n % 100) / 10);
  const unit = n % 10;
  const parts: string[] = [];

  if (hundred > 0 || !isFirstGroup) {
    parts.push(DIGITS[hundred], "trăm");
  }

  if (ten === 0) {
    if (hundred > 0 || !isFirstGroup) {
      if (unit > 0) parts.push("lẻ");
    }
  } else if (ten === 1) {
    parts.push("mười");
  } else {
    parts.push(DIGITS[ten], "mươi");
  }

  if (unit > 0) {
    if (ten > 1 && unit === 1) parts.push("mốt");
    else if (ten >= 1 && unit === 5) parts.push("lăm");
    else if (ten >= 1 && unit === 4) parts.push("tư");
    else parts.push(DIGITS[unit]);
  }

  return parts.join(" ");
}

/** Chuyển một số nguyên không âm sang chữ tiếng Việt (không kèm đơn vị tiền tệ). */
export function numberToVietnameseWords(value: number): string {
  const n = Math.floor(Math.abs(value));
  if (n === 0) return "không";

  const groups: number[] = [];
  let rest = n;
  while (rest > 0) {
    groups.unshift(rest % 1000);
    rest = Math.floor(rest / 1000);
  }

  const groupUnits = ["", "nghìn", "triệu", "tỷ", "nghìn tỷ", "triệu tỷ"];
  const words: string[] = [];

  groups.forEach((group, index) => {
    if (group === 0) return;
    const groupIndexFromEnd = groups.length - 1 - index;
    const isFirstNonZeroGroup = words.length === 0;
    const text = readThreeDigits(group, isFirstNonZeroGroup);
    words.push(groupUnits[groupIndexFromEnd] ? `${text} ${groupUnits[groupIndexFromEnd]}` : text);
  });

  return words.join(" ").replace(/\s+/g, " ").trim();
}

/** Chuyển số tiền VND sang chữ đầy đủ, viết hoa chữ cái đầu, kèm hậu tố "đồng". */
export function amountToVietnameseWords(amount: number): string {
  const words = numberToVietnameseWords(amount);
  const capitalized = words.charAt(0).toUpperCase() + words.slice(1);
  return `${capitalized} đồng`;
}
