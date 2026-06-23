// One-time cleanup: removes all non-registered (seeded) users from the DB.
// Run: npx tsx scripts/cleanup.ts
import { readFileSync } from 'fs';
import { join } from 'path';
import { PrismaClient } from '@prisma/client';

function loadEnv(filename: string) {
  try {
    for (const line of readFileSync(join(process.cwd(), filename), 'utf-8').split('\n')) {
      const t = line.trim();
      if (!t || t.startsWith('#')) continue;
      const eq = t.indexOf('=');
      if (eq === -1) continue;
      const key = t.slice(0, eq).trim();
      const val = t.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
      if (!(key in process.env)) process.env[key] = val;
    }
  } catch {}
}
loadEnv('.env.local');
loadEnv('.env');

const prisma = new PrismaClient();

async function main() {
  const before = await prisma.user.count();
  const { count } = await prisma.user.deleteMany({ where: { isRegistered: false } });
  console.log(`Removed ${count} seeded players. ${before} → ${before - count} users remain.`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
