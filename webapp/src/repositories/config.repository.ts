import { prisma } from "@/lib/db/prisma";
import type { IConfigRepository } from "@/domain/repositories/config.repository.interface";

export class ConfigRepository implements IConfigRepository {
  async getValue<T>(key: string): Promise<T | null> {
    const row = await prisma.config.findUnique({ where: { key } });
    if (!row) return null;
    return JSON.parse(row.value) as T;
  }

  async setValue<T>(key: string, value: T): Promise<void> {
    const json = JSON.stringify(value);
    await prisma.config.upsert({
      where: { key },
      create: { key, value: json },
      update: { value: json },
    });
  }
}

export const configRepository = new ConfigRepository();
