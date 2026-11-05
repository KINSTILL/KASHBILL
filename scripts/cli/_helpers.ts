import { PrismaClient } from '@prisma/client';
import { createInterface } from 'node:readline';

export const prisma = new PrismaClient();

export async function confirm(prompt: string): Promise<boolean> {
  if (process.argv.includes('--yes')) return true;
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(`${prompt} [y/N] `, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase() === 'y');
    });
  });
}

export async function audit(action: string, meta: Record<string, unknown>): Promise<void> {
  await prisma.auditLog.create({
    data: {
      actorId: null,
      targetId: null,
      action,
      meta: { ...meta, source: 'cli', hostname: process.env.HOSTNAME },
    },
  });
}

export function fail(msg: string): never {
  console.error(`❌ ${msg}`);
  process.exit(1);
}

export function ok(msg: string): void {
  console.log(`✅ ${msg}`);
}

