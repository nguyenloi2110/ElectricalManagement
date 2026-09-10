import { cookies } from "next/headers";
import { signSessionToken, verifySessionToken, type SessionPayload } from "@/lib/auth/jwt";

export const SESSION_COOKIE_NAME = "session_token";

function maxAgeFromExpiresIn(): number {
  const raw = process.env.JWT_EXPIRES_IN ?? "1d";
  const match = /^(\d+)([smhd])$/.exec(raw);
  if (!match) return 60 * 60 * 24; // fallback 1 day
  const value = Number(match[1]);
  const unit = match[2];
  const multiplier = { s: 1, m: 60, h: 3600, d: 86400 }[unit] ?? 86400;
  return value * multiplier;
}

/** Tạo token và ghi vào cookie httpOnly — gọi trong Route Handler khi đăng nhập thành công. */
export async function createSession(payload: SessionPayload): Promise<void> {
  const token = await signSessionToken(payload);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: maxAgeFromExpiresIn(),
  });
}

/** Xóa cookie phiên đăng nhập — dùng khi logout. */
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/** Đọc & xác thực phiên hiện tại từ cookie — dùng trong Server Component/Route Handler. */
export async function getCurrentSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}
