import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const prismaClient = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  datasourceUrl: process.env.DATABASE_URL + '?journal_mode=DELETE&synchronous=FULL',
})

// Garantir que SQLite usa journal_mode DELETE (sem WAL) para durabilidade
// PRAGMA retorna resultados no SQLite, entao usar $queryRawUnsafe (nao $executeRawUnsafe)
prismaClient.$queryRawUnsafe('PRAGMA journal_mode=DELETE;').catch(() => {})
prismaClient.$queryRawUnsafe('PRAGMA synchronous=FULL;').catch(() => {})

export const db = globalForPrisma.prisma ?? prismaClient

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
