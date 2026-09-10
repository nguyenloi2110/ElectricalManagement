function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** Ngày hiện tại "yyyy-MM-dd" theo giờ local server (tránh lệch ngày do Date.toISOString() dùng UTC). */
export function currentDateStamp(date: Date = new Date()): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Giờ hiện tại "HH-mm-ss" — nối vào tên file xuất để phân biệt các lần xuất khác nhau trong cùng ngày. */
export function currentTimeStamp(date: Date = new Date()): string {
  return `${pad(date.getHours())}-${pad(date.getMinutes())}-${pad(date.getSeconds())}`;
}
