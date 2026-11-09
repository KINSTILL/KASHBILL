import { readdir, readFile, writeFile, unlink } from 'node:fs/promises';
import path from 'node:path';
import { prisma } from './_helpers';
import { encryptBuffer } from '@/lib/uploads/crypto';

const UPLOADS_DIR = process.env.UPLOADS_DIR ?? path.join(process.cwd(), 'uploads');

async function main() {
  const files = await readdir(UPLOADS_DIR).catch(() => []);
  const toMigrate = files.filter(
    (f) => (f.endsWith('.png') || f.endsWith('.jpg')) && !f.endsWith('.enc')
  );

  if (toMigrate.length === 0) {
    console.log('✅ Aucun fichier à migrer');
    await prisma.$disconnect();
    return;
  }

  console.log(`📦 ${toMigrate.length} fichier(s) à chiffrer :`);
  for (const f of toMigrate) console.log(`   - ${f}`);

  const confirmed = process.argv.includes('--yes');
  if (!confirmed) {
    console.log('⚠️  Relancer avec --yes pour confirmer');
    await prisma.$disconnect();
    process.exit(0);
  }

  let migrated = 0;
  let failed = 0;

  for (const filename of toMigrate) {
    try {
      const plain = await readFile(path.join(UPLOADS_DIR, filename));
      const encrypted = encryptBuffer(plain);
      const newFilename = `${filename}.enc`;
      await writeFile(path.join(UPLOADS_DIR, newFilename), encrypted);
      await unlink(path.join(UPLOADS_DIR, filename));

      // Update DB URLs (logo, signature, stamp sur User)
      const oldUrl = `/api/uploads/${filename}`;
      const newUrl = `/api/uploads/${newFilename}`;
      await prisma.user.updateMany({ where: { logoUrl: oldUrl }, data: { logoUrl: newUrl } });
      await prisma.user.updateMany({ where: { signatureUrl: oldUrl }, data: { signatureUrl: newUrl } });
      await prisma.user.updateMany({ where: { stampUrl: oldUrl }, data: { stampUrl: newUrl } });

      migrated++;
      console.log(`   ✅ ${filename} → ${newFilename}`);
    } catch (e) {
      failed++;
      console.error(`   ❌ ${filename} : ${e instanceof Error ? e.message : 'erreur'}`);
    }
  }

  // Audit log
  try {
    await prisma.auditLog.create({
      data: {
        actorId: null,
        action: 'cli_uploads_encrypted',
        meta: { migrated, failed, total: toMigrate.length, source: 'cli' },
      },
    });
  } catch {
    // non-blocking
  }

  console.log(`\n✅ ${migrated}/${toMigrate.length} fichier(s) chiffré(s), ${failed} échec(s)`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
