import { getCurrentSession } from "@/lib/auth/session";
import type { SessionPayload } from "@/lib/auth/jwt";

/**
 * Bảo vệ Route Handler ở tầng API (bổ sung cho middleware — defense in depth).
 * Trả về session hợp lệ hoặc `null` nếu chưa đăng nhập/token hết hạn.
 * Không kiểm tra role/permission vì hệ thống chỉ có 1 cấp tài khoản (SRS BR-11).
 */
export async function requireAuth(): Promise<SessionPayload | null> {
  return getCurrentSession();
}
