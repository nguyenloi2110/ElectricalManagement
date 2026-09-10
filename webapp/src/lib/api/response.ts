import { NextResponse } from "next/server";

export function apiOk<T>(data: T, init?: number) {
  return NextResponse.json({ success: true, data }, { status: init ?? 200 });
}

export function apiError(message: string, status = 400, details?: unknown) {
  return NextResponse.json({ success: false, message, details }, { status });
}

export function apiUnauthorized(message = "Chưa đăng nhập hoặc phiên đã hết hạn") {
  return apiError(message, 401);
}

export function apiNotFound(message = "Không tìm thấy dữ liệu") {
  return apiError(message, 404);
}
