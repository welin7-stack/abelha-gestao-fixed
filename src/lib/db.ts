import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Em ambientes Next.js (Edge/Serverless), as variáveis de ambiente as vezes 
// não são injetadas no construtor se não forem passadas explicitamente no datasources.
const prismaClient = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'file:./db/custom.db',
    },
  },
})

export const db = globalForPrisma.prisma ?? prismaClient

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
