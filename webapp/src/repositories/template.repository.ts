import { prisma } from "@/lib/db/prisma";
import type { ITemplateRepository } from "@/domain/repositories/template.repository.interface";

/** Đọc mẫu HTML xuất hóa đơn từ bảng `Templates` — xem SRS mục 3.2.7. */
export class TemplateRepository implements ITemplateRepository {
  async getByKey(key: string): Promise<string | null> {
    const row = await prisma.template.findUnique({ where: { key } });
    return row?.value ?? null;
  }
}

export const templateRepository = new TemplateRepository();
