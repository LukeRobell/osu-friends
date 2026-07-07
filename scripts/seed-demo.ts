/**
 * Demo seed — populates the DB with realistic fake players for portfolio showcase.
 * Run: npm run db:seed
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const now = Date.now();
const ago = (ms: number) => new Date(now - ms);
const hr  = 3_600_000;
const day = 86_400_000;

// ─── Player roster ────────────────────────────────────────────────────────────
const PLAYERS = [
  // ── Elite ──
  {
    osuId: 7562902, username: 'mrekk',
    pp: 16847, globalRank: 1, countryRank: 1, countryCode: 'AU',
    taikoPp: null,  taikoGlobalRank: null,
    catchPp: null,  catchGlobalRank: null,
    maniaPp: null,  maniaGlobalRank: null,
    preferredModes: ['osu'],
    languages: ['en'], aboutMe: 'No.1 — always looking for a worthy rival.',
    twitchUsername: 'mrekk', discordUsername: 'mrekk#0001',
    mapStyles: ['streams', 'aim'], playSchedule: ['evenings', 'weekends'],
  },
  {
    osuId: 4787150, username: 'Vaxei',
    pp: 14302, globalRank: 3, countryRank: 1, countryCode: 'US',
    taikoPp: null,  taikoGlobalRank: null,
    catchPp: null,  catchGlobalRank: null,
    maniaPp: null,  maniaGlobalRank: null,
    preferredModes: ['osu'],
    languages: ['en'], aboutMe: 'Top US player. Stream main. Snipe me if you dare.',
    twitchUsername: 'vaxei', discordUsername: 'Vaxei#1337',
    mapStyles: ['streams', 'speed'], playSchedule: ['afternoons', 'evenings'],
  },
  // ── High ──
  {
    osuId: 3533958, username: 'fieryrage',
    pp: 9845, globalRank: 28, countryRank: 3, countryCode: 'US',
    taikoPp: 7210, taikoGlobalRank: 44,
    catchPp: null,  catchGlobalRank: null,
    maniaPp: null,  maniaGlobalRank: null,
    preferredModes: ['osu', 'taiko'],
    languages: ['en'], aboutMe: 'Aim player. Love a good snipe challenge.',
    twitchUsername: 'fieryrage', discordUsername: null,
    mapStyles: ['aim', 'tech'], playSchedule: ['evenings'],
  },
  {
    osuId: 8253128, username: 'Tekkito',
    pp: 8734, globalRank: 67, countryRank: 8, countryCode: 'US',
    taikoPp: 5890, taikoGlobalRank: 121,
    catchPp: null,  catchGlobalRank: null,
    maniaPp: null,  maniaGlobalRank: null,
    preferredModes: ['osu', 'taiko'],
    languages: ['en'], aboutMe: 'Speed + tech. Always grinding.',
    twitchUsername: null, discordUsername: 'Tekkito#4820',
    mapStyles: ['speed', 'tech'], playSchedule: ['afternoons', 'evenings', 'weekends'],
  },
  {
    osuId: 11443437, username: 'Karcher',
    pp: 7621, globalRank: 134, countryRank: 4, countryCode: 'DE',
    taikoPp: null,  taikoGlobalRank: null,
    catchPp: 6102, catchGlobalRank: 89,
    maniaPp: null,  maniaGlobalRank: null,
    preferredModes: ['osu', 'fruits'],
    languages: ['de', 'en'], aboutMe: 'German consistency player. Looking for EU rivals.',
    twitchUsername: null, discordUsername: 'Karcher#2291',
    mapStyles: ['consistency', 'aim'], playSchedule: ['evenings', 'weekends'],
  },
  {
    osuId: 9224078, username: 'FlyingTuna',
    pp: 6234, globalRank: 398, countryRank: 5, countryCode: 'KR',
    taikoPp: 8943, taikoGlobalRank: 18,
    catchPp: null,  catchGlobalRank: null,
    maniaPp: null,  maniaGlobalRank: null,
    preferredModes: ['osu', 'taiko'],
    languages: ['ko', 'en'], aboutMe: 'KR player. Taiko main on weekends.',
    twitchUsername: 'flyingtuna', discordUsername: null,
    mapStyles: ['aim', 'reading'], playSchedule: ['weekends'],
  },
  // ── Mid-high ──
  {
    osuId: 4908650, username: 'im a fancy lad',
    pp: 4821, globalRank: 1247, countryRank: 87, countryCode: 'CA',
    taikoPp: null,  taikoGlobalRank: null,
    catchPp: 3740, catchGlobalRank: 612,
    maniaPp: null,  maniaGlobalRank: null,
    preferredModes: ['osu', 'fruits'],
    languages: ['en', 'fr'], aboutMe: 'Canadian tech enjoyer. Will always accept a snipe.',
    twitchUsername: null, discordUsername: 'fancy#0420',
    mapStyles: ['tech', 'reading'], playSchedule: ['evenings', 'weekends'],
  },
  {
    osuId: 3717598, username: 'xootynator',
    pp: 3912, globalRank: 2891, countryRank: 42, countryCode: 'US',
    taikoPp: null,  taikoGlobalRank: null,
    catchPp: null,  catchGlobalRank: null,
    maniaPp: 4102, maniaGlobalRank: 387,
    preferredModes: ['osu', 'mania'],
    languages: ['en'], aboutMe: 'Marathon player. Low AR gang.',
    twitchUsername: 'xootynator', discordUsername: 'xooty#1111',
    mapStyles: ['reading', 'streams'], playSchedule: ['afternoons'],
  },
  {
    osuId: 2204413, username: 'Spare',
    pp: 3104, globalRank: 5234, countryRank: 78, countryCode: 'GB',
    taikoPp: null,  taikoGlobalRank: null,
    catchPp: null,  catchGlobalRank: null,
    maniaPp: 3567, maniaGlobalRank: 821,
    preferredModes: ['osu', 'mania'],
    languages: ['en'], aboutMe: 'UK player. Push/pull tech is my thing.',
    twitchUsername: null, discordUsername: 'Spare#8822',
    mapStyles: ['tech', 'aim'], playSchedule: ['evenings', 'weekends'],
  },
  {
    osuId: 1720120, username: 'lain',
    pp: 2847, globalRank: 7821, countryRank: 94, countryCode: 'DE',
    taikoPp: null,  taikoGlobalRank: null,
    catchPp: 2431, catchGlobalRank: 1820,
    maniaPp: null,  maniaGlobalRank: null,
    preferredModes: ['osu', 'fruits'],
    languages: ['de', 'en'], aboutMe: 'Fullscreen windowed. Aspire grinder.',
    twitchUsername: null, discordUsername: 'lain#2934',
    mapStyles: ['reading', 'aim'], playSchedule: ['evenings'],
  },
  // ── Mid ──
  {
    osuId: 9269034, username: 'Akolibed',
    pp: 2103, globalRank: 14521, countryRank: 23, countryCode: 'UA',
    taikoPp: null,  taikoGlobalRank: null,
    catchPp: null,  catchGlobalRank: null,
    maniaPp: 1987, maniaGlobalRank: 4210,
    preferredModes: ['osu', 'mania'],
    languages: ['uk', 'en'], aboutMe: 'UA streamer. Love finding new rivals at my rank.',
    twitchUsername: 'akolibed', discordUsername: 'Akolibed#5501',
    mapStyles: ['streams', 'speed'], playSchedule: ['mornings', 'evenings'],
  },
  {
    osuId: 17167778, username: 'cheetoblast',
    pp: 1847, globalRank: 21034, countryRank: 89, countryCode: 'CA',
    taikoPp: 1620, taikoGlobalRank: 6830,
    catchPp: null,  catchGlobalRank: null,
    maniaPp: null,  maniaGlobalRank: null,
    preferredModes: ['osu', 'taiko'],
    languages: ['en'], aboutMe: 'Casually trying to hit 2k pp.',
    twitchUsername: null, discordUsername: 'cheetoblast#3389',
    mapStyles: ['aim', 'speed'], playSchedule: ['weekends'],
  },
  // ── Entry ──
  {
    osuId: 1437786, username: 'worst hr player',
    pp: 1432, globalRank: 34521, countryRank: 267, countryCode: 'US',
    taikoPp: null,  taikoGlobalRank: null,
    catchPp: 1180, catchGlobalRank: 8920,
    maniaPp: null,  maniaGlobalRank: null,
    preferredModes: ['osu', 'fruits'],
    languages: ['en'], aboutMe: 'The name is self-explanatory. HR arc.',
    twitchUsername: null, discordUsername: null,
    mapStyles: ['aim'], playSchedule: ['evenings', 'weekends'],
  },
  {
    osuId: 7512553, username: 'Utami',
    pp: 987, globalRank: 67234, countryRank: 12, countryCode: 'ID',
    taikoPp: null,  taikoGlobalRank: null,
    catchPp: null,  catchGlobalRank: null,
    maniaPp: 1102, maniaGlobalRank: 14230,
    preferredModes: ['osu', 'mania'],
    languages: ['id', 'en'], aboutMe: 'ID player sub 1k pp grinding every night.',
    twitchUsername: null, discordUsername: 'Utami#7711',
    mapStyles: ['consistency', 'aim'], playSchedule: ['evenings'],
  },
  {
    osuId: 2927048, username: 'EEEEEEEEEEEEEEE',
    pp: 623, globalRank: 145789, countryRank: 4521, countryCode: 'JP',
    taikoPp: 2140, taikoGlobalRank: 3102,
    catchPp: null,  catchGlobalRank: null,
    maniaPp: null,  maniaGlobalRank: null,
    preferredModes: ['osu', 'taiko'],
    languages: ['ja'], aboutMe: 'JP. Beat saber refugee. Taiko secretly my main.',
    twitchUsername: null, discordUsername: null,
    mapStyles: ['streams'], playSchedule: ['weekends'],
  },
] as const;

// ─── Rival pairs ──────────────────────────────────────────────────────────────
const RIVAL_PAIRS: [string, string][] = [
  ['mrekk',          'Vaxei'],
  ['fieryrage',      'Tekkito'],
  ['Karcher',        'lain'],
  ['im a fancy lad', 'xootynator'],
  ['Spare',          'Akolibed'],
  ['cheetoblast',    'worst hr player'],
];

// ─── OPEN snipe challenges (in-progress, not yet sniped) ─────────────────────
const OPEN_SNIPES = [
  {
    watcher: 'mrekk', rival: 'Vaxei',
    osuScoreId: '4201337001', beatmapId: '3698781', beatmapsetId: '1818068',
    mapTitle: 'Sidetracked Day', mapVersion: "Vaxei's Extra",
    targetPp: 892.4, createdAt: ago(8 * hr),
  },
  {
    watcher: 'fieryrage', rival: 'Tekkito',
    osuScoreId: '4201337002', beatmapId: '2709801', beatmapsetId: '1300348',
    mapTitle: 'GHOST', mapVersion: 'EX EX',
    targetPp: 743.1, createdAt: ago(26 * hr),
  },
  {
    watcher: 'Karcher', rival: 'lain',
    osuScoreId: '4201337003', beatmapId: '2153393', beatmapsetId: '1014936',
    mapTitle: 'The Pretender', mapVersion: 'Extreme',
    targetPp: 612.7, createdAt: ago(51 * hr),
  },
  {
    watcher: 'im a fancy lad', rival: 'xootynator',
    osuScoreId: '4201337004', beatmapId: '3546085', beatmapsetId: '1713000',
    mapTitle: 'Ame no Meruhen', mapVersion: 'Rain',
    targetPp: 428.3, createdAt: ago(4 * hr),
  },
];

// ─── SNIPED challenges (completed THIS month — drives Rivals leaderboard) ──────
// snipedAt must be >= start of current month; use hours so they're always current
const SNIPED_SNIPES = [
  // mrekk sniped Vaxei 3×
  {
    watcher: 'mrekk', rival: 'Vaxei',
    osuScoreId: '9001001', beatmapId: '3698782', beatmapsetId: '1818068',
    mapTitle: 'Freedom Dive', mapVersion: 'FOUR DIMENSIONS',
    targetPp: 878.2, createdAt: ago(72 * hr), snipedAt: ago(58 * hr),
  },
  {
    watcher: 'mrekk', rival: 'Vaxei',
    osuScoreId: '9001002', beatmapId: '129891', beatmapsetId: '42158',
    mapTitle: 'Blue Zenith', mapVersion: "ktgster's Extreme",
    targetPp: 845.6, createdAt: ago(48 * hr), snipedAt: ago(36 * hr),
  },
  {
    watcher: 'mrekk', rival: 'Vaxei',
    osuScoreId: '9001003', beatmapId: '2757309', beatmapsetId: '1322181',
    mapTitle: 'Kaguya', mapVersion: 'Lunatic',
    targetPp: 901.3, createdAt: ago(20 * hr), snipedAt: ago(10 * hr),
  },
  // Spare sniped Akolibed 2×
  {
    watcher: 'Spare', rival: 'Akolibed',
    osuScoreId: '9001004', beatmapId: '2872932', beatmapsetId: '1234567',
    mapTitle: 'Camellia Compilation', mapVersion: 'Extra',
    targetPp: 387.1, createdAt: ago(60 * hr), snipedAt: ago(44 * hr),
  },
  {
    watcher: 'Spare', rival: 'Akolibed',
    osuScoreId: '9001005', beatmapId: '1983456', beatmapsetId: '987654',
    mapTitle: 'Uta', mapVersion: 'Insane',
    targetPp: 412.8, createdAt: ago(30 * hr), snipedAt: ago(18 * hr),
  },
  // fieryrage sniped Tekkito 2×
  {
    watcher: 'fieryrage', rival: 'Tekkito',
    osuScoreId: '9001006', beatmapId: '2918234', beatmapsetId: '1450000',
    mapTitle: 'Onegai Ranking', mapVersion: 'EX',
    targetPp: 698.4, createdAt: ago(66 * hr), snipedAt: ago(50 * hr),
  },
  {
    watcher: 'fieryrage', rival: 'Tekkito',
    osuScoreId: '9001007', beatmapId: '3012345', beatmapsetId: '1560000',
    mapTitle: 'Haitai', mapVersion: 'Extreme',
    targetPp: 721.9, createdAt: ago(24 * hr), snipedAt: ago(12 * hr),
  },
  // cheetoblast sniped worst hr player 1×
  {
    watcher: 'cheetoblast', rival: 'worst hr player',
    osuScoreId: '9001008', beatmapId: '2345678', beatmapsetId: '1100000',
    mapTitle: 'xi - Blue Zenith', mapVersion: 'Hard',
    targetPp: 289.5, createdAt: ago(40 * hr), snipedAt: ago(28 * hr),
  },
  // Karcher sniped lain 1×
  {
    watcher: 'Karcher', rival: 'lain',
    osuScoreId: '9001009', beatmapId: '1876543', beatmapsetId: '890000',
    mapTitle: 'Muse Dash', mapVersion: 'Extra',
    targetPp: 543.2, createdAt: ago(52 * hr), snipedAt: ago(38 * hr),
  },
];

// ─── Main ─────────────────────────────────────────────────────────────────────
async function seed() {
  console.log('Wiping existing data...');
  await prisma.$transaction([
    prisma.snipeChallenge.deleteMany(),
    prisma.teamApplication.deleteMany(),
    prisma.teamProfile.deleteMany(),
    prisma.notification.deleteMany(),
    prisma.rivalNotifiedPlay.deleteMany(),
    prisma.lobbyDm.deleteMany(),
    prisma.tournamentParticipant.deleteMany(),
    prisma.tournament.deleteMany(),
    prisma.rivalRequest.deleteMany(),
    prisma.friendRequest.deleteMany(),
    prisma.userRival.deleteMany(),
    prisma.playSession.deleteMany(),
    prisma.botToken.deleteMany(),
    prisma.user.deleteMany(),
  ]);
  console.log('Wiped.\n');

  // 1. Users
  console.log('Creating users...');
  const created: Record<string, string> = {};
  for (const p of PLAYERS) {
    const user = await prisma.user.create({
      data: {
        osuId:           p.osuId,
        username:        p.username,
        avatarUrl:       `https://a.ppy.sh/${p.osuId}`,
        pp:              p.pp,
        globalRank:      p.globalRank,
        countryRank:     p.countryRank,
        countryCode:     p.countryCode,
        taikoPp:         p.taikoPp,
        taikoGlobalRank: p.taikoGlobalRank,
        catchPp:         p.catchPp,
        catchGlobalRank: p.catchGlobalRank,
        maniaPp:         p.maniaPp,
        maniaGlobalRank: p.maniaGlobalRank,
        preferredModes:  [...p.preferredModes],
        languages:       [...p.languages],
        aboutMe:         p.aboutMe,
        twitchUsername:  p.twitchUsername ?? null,
        discordUsername: p.discordUsername ?? null,
        mapStyles:       [...p.mapStyles],
        playSchedule:    [...p.playSchedule],
        isRegistered:    true,
        createdAt:       new Date(now - Math.random() * 7 * day),
      },
    });
    created[p.username] = user.id;
    const modes = [p.pp && 'osu', p.taikoPp && 'taiko', p.catchPp && 'catch', p.maniaPp && 'mania']
      .filter(Boolean).join('/');
    console.log(`  ✓ ${p.username} (${p.pp}pp${modes !== 'osu' ? ` · ${modes}` : ''})`);
  }

  // 2. Rivals
  console.log('\nCreating rivals...');
  for (const [a, b] of RIVAL_PAIRS) {
    await prisma.userRival.createMany({
      data: [
        { userId: created[a], rivalId: created[b] },
        { userId: created[b], rivalId: created[a] },
      ],
      skipDuplicates: true,
    });
    console.log(`  ✓ ${a} ↔ ${b}`);
  }

  // 3. Open snipes
  console.log('\nCreating open snipe challenges...');
  for (const s of OPEN_SNIPES) {
    await prisma.snipeChallenge.create({
      data: {
        watcherId:    created[s.watcher],
        rivalId:      created[s.rival],
        osuScoreId:   s.osuScoreId,
        beatmapId:    s.beatmapId,
        beatmapsetId: s.beatmapsetId,
        mapTitle:     s.mapTitle,
        mapVersion:   s.mapVersion,
        targetPp:     s.targetPp,
        gameMode:     'osu',
        status:       'OPEN',
        createdAt:    s.createdAt,
      },
    });
    await prisma.notification.create({
      data: {
        userId:    created[s.watcher],
        type:      'RIVAL_PLAY',
        title:     `${s.rival} hit ${Math.round(s.targetPp)}pp on ${s.mapTitle}`,
        body:      `You have 7 days to beat ${s.targetPp.toFixed(1)}pp.`,
        link:      `/profile/${s.rival}`,
        read:      false,
        createdAt: s.createdAt,
      },
    });
    console.log(`  ✓ OPEN  ${s.watcher} vs ${s.rival} — ${s.mapTitle}`);
  }

  // 4. Sniped challenges (drives Rivals leaderboard)
  console.log('\nCreating sniped challenges (Rivals leaderboard)...');
  for (const s of SNIPED_SNIPES) {
    await prisma.snipeChallenge.create({
      data: {
        watcherId:    created[s.watcher],
        rivalId:      created[s.rival],
        osuScoreId:   s.osuScoreId,
        beatmapId:    s.beatmapId,
        beatmapsetId: s.beatmapsetId,
        mapTitle:     s.mapTitle,
        mapVersion:   s.mapVersion,
        targetPp:     s.targetPp,
        gameMode:     'osu',
        status:       'SNIPED',
        createdAt:    s.createdAt,
        snipedAt:     s.snipedAt,
      },
    });
    console.log(`  ✓ SNIPED ${s.watcher} → ${s.rival} — ${s.mapTitle}`);
  }

  // 5. Pending rival requests
  console.log('\nCreating pending rival requests...');
  const pendingRequests: [string, string][] = [
    ['Spare',     'Karcher'],
    ['Utami',     'EEEEEEEEEEEEEEE'],
    ['Akolibed',  'cheetoblast'],
  ];
  for (const [from, to] of pendingRequests) {
    await prisma.rivalRequest.create({
      data: { fromUserId: created[from], toUserId: created[to], gameMode: 'osu', status: 'PENDING' },
    });
    await prisma.notification.create({
      data: {
        userId: created[to], type: 'RIVAL_REQUEST',
        title:  `${from} wants to be your rival`,
        body:   `You're close in pp. Accept to start competing.`,
        link:   `/profile/${from}`, read: false,
      },
    });
    console.log(`  ✓ ${from} → ${to}`);
  }

  // 6. Team + application
  console.log('\nCreating team...');
  await prisma.teamProfile.create({
    data: {
      teamOsuId:       '47914',
      name:            'osu!friends Demo Team',
      tag:             'DEMO',
      flagUrl:         'https://osu-friends.vercel.app/osufriends-logo-addfriend.svg',
      description:     'The official osu!friends community team. We compete together, snipe each other, and actually have fun.',
      isRecruiting:    true,
      ppMin:           2000,
      ppMax:           10000,
      modes:           ['osu'],
      discordUrl:      'https://discord.gg/osufriends',
      claimedByUserId: created['mrekk'],
    },
  });
  await prisma.teamApplication.create({
    data: {
      teamOsuId: '47914',
      userId:    created['Akolibed'],
      message:   'Would love to join! I stream aim maps and grind every evening. Currently at 2103pp and rising.',
      status:    'PENDING',
    },
  });
  await prisma.notification.create({
    data: {
      userId: created['mrekk'], type: 'TEAM_APPLICATION',
      title:  'Akolibed applied to DEMO',
      body:   'Review their application in team management.',
      link:   '/teams/manage', read: false,
    },
  });
  console.log('  ✓ Team DEMO + 1 pending application');

  const totalSnipes = OPEN_SNIPES.length + SNIPED_SNIPES.length;
  console.log(`\n✅ Seed complete!`);
  console.log(`   ${PLAYERS.length} users | ${RIVAL_PAIRS.length * 2} rival links | ${totalSnipes} snipe challenges (${SNIPED_SNIPES.length} sniped) | notifications`);
  console.log(`\nLeaderboard tabs populated:`);
  console.log(`   Players → osu! (15), Taiko (6), Catch (5), Mania (5)`);
  console.log(`   Rivals  → mrekk×3, fieryrage×2, Spare×2, Karcher×1, cheetoblast×1`);
}

seed()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
