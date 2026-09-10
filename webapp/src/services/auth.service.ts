import { userRepository } from "@/repositories/user.repository";
import { verifyPassword } from "@/lib/auth/password";
import { createSession, destroySession } from "@/lib/auth/session";

const INVALID_CREDENTIALS_MESSAGE = "Số điện thoại hoặc mật khẩu không đúng";

export class AuthService {
  /** Xác thực bằng SĐT + mật khẩu, phát hành JWT session cookie khi thành công (SRS FR-1). */
  async login(phoneNumber: string, password: string): Promise<{ ok: true } | { ok: false; message: string }> {
    const user = await userRepository.findByPhoneNumber(phoneNumber);
    if (!user || !user.isActive) {
      return { ok: false, message: INVALID_CREDENTIALS_MESSAGE };
    }

    const isValidPassword = await verifyPassword(password, user.passwordHash);
    if (!isValidPassword) {
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
