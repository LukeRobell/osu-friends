import { prisma } from '../lib/prisma';
import { fetchUserProfile } from '../lib/osu-api';

async function main() {
  const users = await prisma.user.findMany({
    where: { isRegistered: true, osuJoinDate: null },
    select: { id: true, osuId: true, username: true },
  });

  console.log(`Backfilling osu! join date for ${users.length} users...\n`);

  let ok = 0, fail = 0;

  for (const user of users) {
    try {
      const profile = await fetchUserProfile(user.osuId, 'osu').catch(() => null);
      if (!profile?.joinDate) {
        console.log(`- ${user.username.padEnd(20)} no join_date returned`);
        fail++;
      } else {
        await prisma.user.update({
          where: { id: user.id },
          data: { osuJoinDate: profile.joinDate },
        });
        console.log(`✓ ${user.username.padEnd(20)} joined ${profile.joinDate.toISOString().slice(0, 10)}`);
        ok++;
      }
    } catch (err) {
      console.error(`✗ ${user.username}: ${err}`);
      fail++;
    }

    await new Promise(r => setTimeout(r, 150));
  }

  console.log(`\nDone — ${ok} updated, ${fail} failed/missing.`);
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
