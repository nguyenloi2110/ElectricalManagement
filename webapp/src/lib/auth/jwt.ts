import { SignJWT, jwtVerify } from "jose";

/**
 * Ký & xác thực JWT bằng thuật toán HS256 (jose — chạy được cả Node.js runtime lẫn Edge
 * runtime của Next.js middleware). Xem SRS FR-1/NFR-1 — đăng nhập bắt buộc phát hành token.
 */

export interface SessionPayload {
  sub: string;
  phoneNumber: string;
}

function getSecretKey() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not set. Check your .env file.");
  }
  return new TextEncoder().encode(secret);
}

export async function signSessionToken(payload: SessionPayload): Promise<string> {
  const expiresIn = process.env.JWT_EXPIRES_IN ?? "1d";
  return new SignJWT({ phoneNumber: payload.phoneNumber })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(getSecretKey());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (typeof payload.sub !== "string" || typeof payload.phoneNumber !== "string") {
      return null;
    }
    return { sub: payload.sub, phoneNumber: payload.phoneNumber };
  } catch {
    return null;
  }
}
