// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client';

// Додаємо цей рядок, щоб уникнути багаторазового створення екземпляра PrismaClient
// у режимі розробки (Next.js Hot Module Replacement).
declare global {
  var prisma: PrismaClient | undefined;
}

let prisma: PrismaClient;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  if (!global.prisma) {
    global.prisma = new PrismaClient();
  }
  prisma = global.prisma;
}

export default prisma;