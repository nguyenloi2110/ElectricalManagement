import { prisma } from "@/lib/db/prisma";
import type { ITransformerStationRepository } from "@/domain/repositories/config.repository.interface";

export class TransformerStationRepository implements ITransformerStationRepository {
  async findAllActive() {
    return prisma.transformerStation.findMany({
      where: { isDeleted: false },
      select: { id: true, name: true, code: true },
      orderBy: { code: "asc" },
    });
  }
}

export const transformerStationRepository = new TransformerStationRepository();
