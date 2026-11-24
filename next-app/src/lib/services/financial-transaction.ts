import "server-only";

import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

// PostgreSQL may abort a serializable write when another writer commits first.
// Retry the whole transaction so every balance is read from a fresh snapshot.
export async function financialTransaction<T>(work: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await db.$transaction(work, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 30_000 });
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2034" || attempt >= 4) throw error;
    }
  }
}
