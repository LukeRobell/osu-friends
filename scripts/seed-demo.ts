/**
 * Demo seed — populates the DB with realistic fake players for portfolio showcase.
 * Run: npm run db:seed
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ─── Player roster ────────────────────────────────────────────────────────────
// Using real osu! player IDs so avatars load from a.ppy.sh
const PLAYERS = [
  // ── Elite bracket ──
  {
    osuId: 7562902, username: 'mrekk',
    pp: 16847, globalRank: 1, countryRank: 1, countryCode: 'AU',
    languages: ['en'], aboutMe: 'No.1 — always looking for a worthy rival.',
    twitchUsername: 'mrekk', discordUsername: 'mrekk#0001',
    mapStyles: ['streams', 'aim'], playSchedule: ['evenings', 'weekends'],
  },
  {
    osuId: 4787150, username: 'Vaxei',
    pp: 14302, globalRank: 3, countryRank: 1, countryCode: 'US',
    languages: ['en'], aboutMe: 'Top US player. Stream main. snipe me if you dare.',
    twitchUsername: 'vaxei', discordUsername: 'Vaxei#1337',
    mapStyles: ['streams', 'speed'], playSchedule: ['afternoons', 'evenings'],
  },
  // ── High bracket ──
  {
    osuId: 3533958, username: 'fieryrage',
    pp: 9845, globalRank: 28, countryRank: 3, countryCode: 'US',
    languages: ['en'], aboutMe: 'Aim player. love a good snipe challenge.',
    twitchUsername: 'fieryrage', discordUsername: null,
    mapStyles: ['aim', 'tech'], playSchedule: ['evenings'],
  },
  {
    osuId: 8253128, username: 'Tekkito',
    pp: 8734, globalRank: 67, countryRank: 8, countryCode: 'US',
    languages: ['en'], aboutMe: 'Speed + tech. Always grinding.',
    twitchUsername: null, discordUsername: 'Tekkito#4820',
    mapStyles: ['speed', 'tech'], playSchedule: ['afternoons', 'evenings', 'weekends'],
  },
  {
    osuId: 11443437, username: 'Karcher',
    pp: 7621, globalRank: 134, countryRank: 4, countryCode: 'DE',
    languages: ['de', 'en'], aboutMe: 'German consistency player. Looking for EU rivals.',
    twitchUsername: null, discordUsername: 'Karcher#2291',
    mapStyles: ['consistency', 'aim'], playSchedule: ['evenings', 'weekends'],
  },
  {
    osuId: 9224078, username: 'FlyingTuna',
    pp: 6234, globalRank: 398, countryRank: 5, countryCode: 'KR',
    languages: ['ko', 'en'], aboutMe: 'KR player. Very online on weekends.',
    twitchUsername: 'flyingtuna', discordUsername: null,
    mapStyles: ['aim', 'reading'], playSchedule: ['weekends'],
  },
  // ── Mid-high bracket ──
  {
    osuId: 4908650, username: 'im a fancy lad',
    pp: 4821, globalRank: 1247, countryRank: 87, countryCode: 'CA',
    languages: ['en', 'fr'], aboutMe: 'Canadian tech enjoyer. Will always accept a snipe.',
    twitchUsername: null, discordUsername: 'fancy#0420',
    mapStyles: ['tech', 'reading'], playSchedule: ['evenings', 'weekends'],
  },
  {
    osuId: 3717598, username: 'xootynator',
    pp: 3912, globalRank: 2891, countryRank: 42, countryCode: 'US',
    languages: ['en'], aboutMe: 'Marathon player. Low approach rate gang.',
    twitchUsername: 'xootynator', discordUsername: 'xooty#1111',
    mapStyles: ['reading', 'streams'], playSchedule: ['afternoons'],
  },
  {
    osuId: 2204413, username: 'Spare',
    pp: 3104, globalRank: 5234, countryRank: 78, countryCode: 'GB',
    languages: ['en'], aboutMe: 'UK player. Push/pull tech is my thing.',
    twitchUsername: null, discordUsername: 'Spare#8822',
    mapStyles: ['tech', 'aim'], playSchedule: ['evenings', 'weekends'],
  },
  {
    osuId: 1720120, username: 'lain',
    pp: 2847, globalRank: 7821, countryRank: 94, countryCode: 'DE',
    languages: ['de', 'en'], aboutMe: 'Fullscreen windowed. Aspire grinder.',
    twitchUsername: null, discordUsername: 'lain#2934',
    mapStyles: ['reading', 'aim'], playSchedule: ['evenings'],
  },
  // ── Mid bracket ──
  {
    osuId: 9269034, username: 'Akolibed',
    pp: 2103, globalRank: 14521, countryRank: 23, countryCode: 'UA',
    languages: ['uk', 'en'], aboutMe: 'UA streamer. Love finding new rivals at my rank.',
    twitchUsername: 'akolibed', discordUsername: 'Akolibed#5501',
    mapStyles: ['streams', 'speed'], playSchedule: ['mornings', 'evenings'],
  },
  {
    osuId: 17167778, username: 'cheetoblast',
    pp: 1847, globalRank: 21034, countryRank: 89, countryCode: 'CA',
    languages: ['en'], aboutMe: 'Casually trying to hit 2k pp.',
    twitchUsername: null, discordUsername: 'cheetoblast#3389',
    mapStyles: ['aim', 'speed'], playSchedule: ['weekends'],
  },
  // ── Entry bracket ──
  {
    osuId: 1437786, username: 'worst hr player',
    pp: 1432, globalRank: 34521, countryRank: 267, countryCode: 'US',
    languages: ['en'], aboutMe: 'The name is self-explanatory. HR arc.',
    twitchUsername: null, discordUsername: null,
    mapStyles: ['aim'], playSchedule: ['evenings', 'weekends'],
  },
  {
    osuId: 7512553, username: 'Utami',
    pp: 987, globalRank: 67234, countryRank: 12, countryCode: 'ID',
    languages: ['id', 'en'], aboutMe: 'ID player sub 1k pp grinding every night.',
    twitchUsername: null, discordUsername: 'Utami#7711',
    mapStyles: ['consistency', 'aim'], playSchedule: ['evenings'],
  },
  {
    osuId: 2927048, username: 'EEEEEEEEEEEEEEE',
    pp: 623, globalRank: 145789, countryRank: 4521, countryCode: 'JP',
    languages: ['ja'], aboutMe: 'JP. Beat saber refugee.',
    twitchUsername: null, discordUsername: null,
    mapStyles: ['streams'], playSchedule: ['weekends'],
  },
] as const;

// ─── Rival pairs (userId → rivalId by username) ───────────────────────────────
const RIVAL_PAIRS: [string, string][] = [
  ['mrekk',            'Vaxei'],
  ['fieryrage',        'Tekkito'],
  ['Karcher',          'lain'],
  ['im a fancy lad',   'xootynator'],
  ['Spare',            'Akolibed'],
  ['cheetoblast',      'worst hr player'],
];

// ─── Snipe challenges (watcher, rival, fake score data) ──────────────────────
const SNIPE_CHALLENGES = [
  {
    watcher: 'mrekk', rival: 'Vaxei',
    osuScoreId: '4201337001', beatmapId: '3698781', beatmapsetId: '1818068',
    mapTitle: 'Sidetracked Day', mapVersion: 'Vaxei\'s Extra',
    targetPp: 892.4, gameMode: 'osu',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8), // 8h ago
  },
  {
    watcher: 'fieryrage', rival: 'Tekkito',
    osuScoreId: '4201337002', beatmapId: '2709801', beatmapsetId: '1300348',
    mapTitle: 'GHOST', mapVersion: 'EX EX',
    targetPp: 743.1, gameMode: 'osu',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 26), // 26h ago
  },
  {
    watcher: 'Karcher', rival: 'lain',
    osuScoreId: '4201337003', beatmapId: '2153393', beatmapsetId: '1014936',
    mapTitle: 'The Pretender', mapVersion: 'Extreme',
    targetPp: 612.7, gameMode: 'osu',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 51), // 51h ago
  },
  {
    watcher: 'im a fancy lad', rival: 'xootynator',
    osuScoreId: '4201337004', beatmapId: '3546085', beatmapsetId: '1713000',
    mapTitle: 'Ame no Meruhen', mapVersion: 'Rain',
    targetPp: 428.3, gameMode: 'osu',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4h ago
  },
];

// ─── Main ─────────────────────────────────────────────────────────────────────
async function seed() {
  console.log('Seeding demo database...\n');

  // 1. Create users
  console.log('Creating users...');
  const created: Record<string, string> = {}; // username → db id

  for (const p of PLAYERS) {
    const user = await prisma.user.create({
      data: {
        osuId:          p.osuId,
        username:       p.username,
        avatarUrl:      `https://a.ppy.sh/${p.osuId}`,
        pp:             p.pp,
        globalRank:     p.globalRank,
        countryRank:    p.countryRank,
        countryCode:    p.countryCode,
        languages:      [...p.languages],
        aboutMe:        p.aboutMe,
        twitchUsername: p.twitchUsername ?? null,
        discordUsername:p.discordUsername ?? null,
        mapStyles:      [...p.mapStyles],
        playSchedule:   [...p.playSchedule],
        preferredModes: ['osu'],
        isRegistered:   true,
        createdAt:      new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 7),
      },
    });
    created[p.username] = user.id;
    console.log(`  ✓ ${p.username} (${p.pp}pp)`);
  }

  // 2. Create rival relationships (bidirectional)
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

  // 3. Create snipe challenges
  console.log('\nCreating snipe challenges...');
  for (const s of SNIPE_CHALLENGES) {
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
        gameMode:     s.gameMode,
        status:       'OPEN',
        createdAt:    s.createdAt,
      },
    });
    console.log(`  ✓ ${s.watcher} watching ${s.rival}'s ${s.mapTitle} (${s.targetPp}pp)`);
  }

  // 4. Create notifications for snipe watchers
  console.log('\nCreating notifications...');
  for (const s of SNIPE_CHALLENGES) {
    await prisma.notification.create({
      data: {
        userId:    created[s.watcher],
        type:      'RIVAL_PLAY',
        title:     `${s.rival} hit ${Math.round(s.targetPp)}pp on ${s.mapTitle}`,
        body:      `You have 7 days to snipe this score. Can you beat ${s.targetPp.toFixed(1)}pp?`,
        link:      `/profile/${s.rival}`,
        read:      false,
        createdAt: s.createdAt,
      },
    });
  }

  // 5. A few rival requests (pending)
  console.log('\nCreating pending rival requests...');
  const pendingRequests: [string, string][] = [
    ['Spare',     'Karcher'],
    ['Utami',     'EEEEEEEEEEEEEEE'],
    ['Akolibed',  'cheetoblast'],
  ];
  for (const [from, to] of pendingRequests) {
    await prisma.rivalRequest.create({
      data: {
        fromUserId: created[from],
        toUserId:   created[to],
        gameMode:   'osu',
        status:     'PENDING',
      },
    });
    await prisma.notification.create({
      data: {
        userId: created[to],
        type:   'RIVAL_REQUEST',
        title:  `${from} wants to be your rival`,
        body:   `You're close in pp. Accept to start competing.`,
        link:   `/profile/${from}`,
        read:   false,
      },
    });
    console.log(`  ✓ ${from} → ${to} (pending)`);
  }

  // 6. Demo team profile
  console.log('\nCreating team profile...');
  await prisma.teamProfile.create({
    data: {
      teamOsuId:      '47914',
      name:           'osu!friends Demo Team',
      tag:            'DEMO',
      flagUrl:        'https://www.osufriends.com/osufriends-logo-addfriend.svg',
      description:    'The official osu!friends community team. We compete together, snipe each other, and actually have fun.',
      isRecruiting:   true,
      ppMin:          2000,
      ppMax:          10000,
      modes:          ['osu'],
      discordUrl:     'https://discord.gg/osufriends',
      claimedByUserId: created['mrekk'],
    },
  });

  // 7. A pending team application
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
      userId: created['mrekk'],
      type:   'TEAM_APPLICATION',
      title:  'Akolibed applied to DEMO',
      body:   'Review their application in team management.',
      link:   '/teams/manage',
      read:   false,
    },
  });
  console.log('  ✓ Team DEMO + 1 pending application');

  console.log('\n✅ Demo seed complete!');
  console.log(`   ${PLAYERS.length} users | ${RIVAL_PAIRS.length * 2} rival links | ${SNIPE_CHALLENGES.length} snipe challenges | 7 notifications`);
}

seed()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
