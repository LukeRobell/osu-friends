import { prisma } from '../lib/prisma';
import { fetchUserProfile, fetchUserAvgTopPp } from '../lib/osu-api';

async function main() {
  const users = await prisma.user.findMany({
    where: { isRegistered: true },
    select: { id: true, osuId: true, username: true },
    orderBy: { pp: 'desc' },
  });

  console.log(`Backfilling mode stats for ${users.length} users...\n`);

  let ok = 0, fail = 0;

  for (const user of users) {
    try {
      const [osuProfile, taikoProfile, catchProfile, maniaProfile,
             osuPp, taikoPp, catchPp, maniaPp] = await Promise.all([
        fetchUserProfile(user.osuId, 'osu').catch(() => null),
        fetchUserProfile(user.osuId, 'taiko').catch(() => null),
        fetchUserProfile(user.osuId, 'fruits').catch(() => null),
        fetchUserProfile(user.osuId, 'mania').catch(() => null),
        fetchUserAvgTopPp(user.osuId, 'osu').catch(() => null),
        fetchUserAvgTopPp(user.osuId, 'taiko').catch(() => null),
        fetchUserAvgTopPp(user.osuId, 'fruits').catch(() => null),
        fetchUserAvgTopPp(user.osuId, 'mania').catch(() => null),
      ]);

      await prisma.user.update({
        where: { id: user.id },
        data: {
          ...(osuPp != null          && { pp:              osuPp }),
          ...(osuProfile?.globalRank  && { globalRank:      osuProfile.globalRank }),
          ...(osuProfile?.countryRank && { countryRank:     osuProfile.countryRank }),
          taikoPp:         taikoPp          ?? null,
          taikoGlobalRank: taikoProfile?.globalRank ?? null,
          catchPp:         catchPp           ?? null,
          catchGlobalRank: catchProfile?.globalRank  ?? null,
          maniaPp:         maniaPp           ?? null,
          maniaGlobalRank: maniaProfile?.globalRank  ?? null,
        },
      });

      const parts = [
        osuPp   != null ? `osu:${Math.round(osuPp)}pp`   : null,
        taikoPp != null ? `taiko:${Math.round(taikoPp)}pp` : null,
        catchPp != null ? `catch:${Math.round(catchPp)}pp` : null,
        maniaPp != null ? `mania:${Math.round(maniaPp)}pp` : null,
      ].filter(Boolean).join('  ');

      console.log(`✓ ${user.username.padEnd(20)} ${parts}`);
      ok++;
    } catch (err) {
      console.error(`✗ ${user.username}: ${err}`);
      fail++;
    }

    // Small delay to stay well under osu! API rate limits
    await new Promise(r => setTimeout(r, 150));
  }

  console.log(`\nDone — ${ok} updated, ${fail} failed.`);
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
