import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../src/generated/prisma/client";
import { hashPassword } from "../src/lib/auth/password";

const DEFAULT_ADMIN_PHONE = "0836848779";
const DEFAULT_ADMIN_PASSWORD = "DuanHuong@011101";

function buildClient() {
  const url = new URL(process.env.DATABASE_URL!);
  const adapter = new PrismaMariaDb({
    host: url.hostname,
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\//, ""),
  });
  return new PrismaClient({ adapter });
}

/** Tạo sẵn tài khoản admin mặc định theo SRS FR-1 (SĐT + mật khẩu đã hash). */
async function main() {
  const prisma = buildClient();

  const existing = await prisma.user.findUnique({ where: { phoneNumber: DEFAULT_ADMIN_PHONE } });
  if (existing) {
    console.log(`User ${DEFAULT_ADMIN_PHONE} already exists, skipping seed.`);
  } else {
    const passwordHash = await hashPassword(DEFAULT_ADMIN_PASSWORD);
    await prisma.user.create({
      data: { phoneNumber: DEFAULT_ADMIN_PHONE, passwordHash, isActive: true },
    });
    console.log(`Seeded default admin user: ${DEFAULT_ADMIN_PHONE}`);
  }

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
