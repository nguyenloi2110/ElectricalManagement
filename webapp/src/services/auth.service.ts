import { userRepository } from "@/repositories/user.repository";
import { verifyPassword } from "@/lib/auth/password";
import { createSession, destroySession } from "@/lib/auth/session";

const INVALID_CREDENTIALS_MESSAGE = "Số điện thoại hoặc mật khẩu không đúng";
// Hash giả dùng để so sánh khi không tìm thấy user, giữ thời gian phản hồi ổn định (chống dò SĐT qua timing).
const DUMMY_PASSWORD_HASH = "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy";

export class AuthService {
  /** Xác thực bằng SĐT + mật khẩu, phát hành JWT session cookie khi thành công (SRS FR-1). */
  async login(phoneNumber: string, password: string): Promise<{ ok: true } | { ok: false; message: string }> {
    const user = await userRepository.findByPhoneNumber(phoneNumber);
    const isValidPassword = await verifyPassword(password, user?.passwordHash ?? DUMMY_PASSWORD_HASH);
    if (!user || !user.isActive || !isValidPassword) {
      return { ok: false, message: INVALID_CREDENTIALS_MESSAGE };
    }

    await createSession({ sub: user.id, phoneNumber: user.phoneNumber });
    return { ok: true };
  }

  async logout(): Promise<void> {
    await destroySession();
  }
}

export const authService = new AuthService();
