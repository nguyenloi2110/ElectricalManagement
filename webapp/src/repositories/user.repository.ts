import { prisma } from "@/lib/db/prisma";
import type { IUserRepository } from "@/domain/repositories/config.repository.interface";

export class UserRepository implements IUserRepository {
  async findByPhoneNumber(phoneNumber: string) {
    return prisma.user.findUnique({
      where: { phoneNumber },
      select: { id: true, phoneNumber: true, passwordHash: true, isActive: true },
    });
  }
}

export const userRepository = new UserRepository();
