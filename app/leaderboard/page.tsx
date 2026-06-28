import { prisma } from '@/lib/prisma';
import { countryFlagUrl } from '@/lib/osu-api';
import Image from 'next/image';
import Link from 'next/link';
import { Suspense } from 'react';
import ModeFilter from './ModeFilter';

interface Props {
  searchParams: { tab?: string; mode?: string };
}

const TABS = [
  { id: 'players', label: 'Players' },
  { id: 'rivals',  label: 'Rivals' },
  { id: 'teams',   label: 'Teams' },
];

const MODE_LABELS: Record<string, string> = {
  osu: 'osu!', taiko: 'Taiko', fruits: 'Catch', mania: 'Mania',
};

export default async function LeaderboardPage({ searchParams }: Props) {
  const tab  = searchParams.tab  ?? 'players';
  const mode = searchParams.mode ?? 'osu';

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-white mb-2">Leaderboard</h1>
      <p className="text-gray-500 text-sm mb-8">
        Rankings across the osu!friends community.
      </p>

      {/* Main tabs */}
      <div className="flex gap-1 mb-6 bg-gray-900/60 border border-white/10 rounded-xl p-1 w-fit">
        {TABS.map((t) => (
          <Link
            key={t.id}
            href={`/leaderboard?tab=${t.id}&mode=${mode}`}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t.id ? 'bg-pink-500 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {/* Mode filter — only shown on Players tab */}
      {tab === 'players' && (
        <Suspense fallback={null}>
          <ModeFilter />
        </Suspense>
      )}

      {tab === 'players' && <PlayersTab mode={mode} />}
      {tab === 'rivals'  && <RivalsTab />}
      {tab === 'teams'   && <TeamsTab />}
    </div>
  );
}

type ModeKey = 'osu' | 'taiko' | 'fruits' | 'mania';

const PP_FIELD: Record<ModeKey, 'pp' | 'taikoPp' | 'catchPp' | 'maniaPp'> = {
  osu:    'pp',
  taiko:  'taikoPp',
  fruits: 'catchPp',
  mania:  'maniaPp',
};

const RANK_FIELD: Record<ModeKey, 'globalRank' | 'taikoGlobalRank' | 'catchGlobalRank' | 'maniaGlobalRank'> = {
  osu:    'globalRank',
  taiko:  'taikoGlobalRank',
  fruits: 'catchGlobalRank',
  mania:  'maniaGlobalRank',
};

async function PlayersTab({ mode }: { mode: string }) {
  const m = (Object.keys(PP_FIELD).includes(mode) ? mode : 'osu') as ModeKey;
  const ppField   = PP_FIELD[m];
  const rankField = RANK_FIELD[m];

  const players = await prisma.user.findMany({
    where: { isRegistered: true, [ppField]: { not: null } },
    orderBy: { [ppField]: 'desc' },
    take: 100,
    select: {
      osuId: true,
      username: true,
      avatarUrl: true,
      countryCode: true,
      pp: true,
      globalRank: true,
      taikoPp: true,
      taikoGlobalRank: true,
      catchPp: true,
      catchGlobalRank: true,
      maniaPp: true,
      maniaGlobalRank: true,
    },
  });

  if (players.length === 0) {
    return (
      <div className="bg-gray-900/60 border border-white/10 rounded-2xl p-12 text-center">
        <p className="text-gray-500">No {MODE_LABELS[m] ?? m} players synced yet.</p>
        <p className="text-gray-600 text-sm mt-1">Players need to sync their account to appear here.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900/60 border border-white/10 rounded-2xl overflow-hidden">
      <div className="grid grid-cols-[48px_1fr_120px_120px] text-xs text-gray-500 uppercase tracking-wider px-6 py-3 border-b border-white/5">
        <span>#</span>
        <span>Player</span>
        <span className="text-right">Avg PP</span>
        <span className="text-right">Global Rank</span>
      </div>
      {players.map((p, i) => {
        const pp   = p[ppField]   as number | null;
        const rank = p[rankField] as number | null;
        return (
          <Link
            key={p.osuId}
            href={`/profile/${encodeURIComponent(p.username)}`}
            className="grid grid-cols-[48px_1fr_120px_120px] items-center px-6 py-3 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors"
          >
            <span className={`text-sm font-bold ${i < 3 ? 'text-pink-400' : 'text-gray-600'}`}>
              {i + 1}
            </span>
            <div className="flex items-center gap-3">
              <Image src={p.avatarUrl} alt={p.username} width={32} height={32} className="rounded-full" unoptimized />
              <span className="text-white text-sm font-medium">{p.username}</span>
              {p.countryCode && (
                <Image src={countryFlagUrl(p.countryCode)} alt={p.countryCode} width={18} height={13} className="rounded-sm opacity-80" unoptimized />
              )}
            </div>
            <span className="text-right text-gray-300 text-sm">
              {pp != null ? `${Math.round(pp)}pp` : '—'}
            </span>
            <span className="text-right text-gray-500 text-sm">
              {rank != null ? `#${rank.toLocaleString()}` : '—'}
            </span>
          </Link>
        );
      })}
    </div>
  );
}

async function RivalsTab() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const monthLabel = now.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  const resetLabel = nextMonth.toLocaleString('en-US', { month: 'long', day: 'numeric' });

  // Group by (watcher, rival) pair — we want snipes against a single rival
  const grouped = await prisma.snipeChallenge.groupBy({
    by: ['watcherId', 'rivalId'],
    where: { status: 'SNIPED', snipedAt: { gte: startOfMonth } },
    _count: { id: true },
  });

  // For each watcher, keep only their best rival (most snipes against one person)
  const bestPerWatcher = new Map<string, { rivalId: string; count: number }>();
  for (const row of grouped) {
    const existing = bestPerWatcher.get(row.watcherId);
    if (!existing || row._count.id > existing.count) {
      bestPerWatcher.set(row.watcherId, { rivalId: row.rivalId, count: row._count.id });
    }
  }

  if (bestPerWatcher.size === 0) {
    return (
      <div className="bg-gray-900/60 border border-white/10 rounded-2xl p-12 text-center">
        <p className="text-gray-500 mb-1">No snipes yet this month.</p>
        <p className="text-gray-600 text-sm">Set a rival, get notified when they score, go beat it.</p>
      </div>
    );
  }

  const sorted = Array.from(bestPerWatcher.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 100);

  const allUserIds = Array.from(new Set([...sorted.map(([w]) => w), ...sorted.map(([, { rivalId }]) => rivalId)]));
  const users = await prisma.user.findMany({
    where: { id: { in: allUserIds } },
    select: { id: true, osuId: true, username: true, avatarUrl: true, countryCode: true },
  });

  const userMap = Object.fromEntries(users.map((u) => [u.id, u]));
  const rows = sorted
    .map(([watcherId, { rivalId, count }]) => ({
      ...userMap[watcherId],
      snipes: count,
      rivalName: userMap[rivalId]?.username ?? '?',
    }))
    .filter((r) => r.username);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-gray-400">{monthLabel}</p>
        <p className="text-xs text-gray-600">Resets {resetLabel}</p>
      </div>
    <div className="bg-gray-900/60 border border-white/10 rounded-2xl overflow-hidden">
      <div className="grid grid-cols-[48px_1fr_120px_160px] text-xs text-gray-500 uppercase tracking-wider px-6 py-3 border-b border-white/5">
        <span>#</span><span>Player</span>
        <span className="text-right">Snipes 🎯</span>
        <span className="text-right">Current Rival</span>
      </div>
      {rows.map((r, i) => (
        <Link
          key={r.osuId}
          href={`/profile/${encodeURIComponent(r.username)}`}
          className="grid grid-cols-[48px_1fr_120px_160px] items-center px-6 py-3 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors"
        >
          <span className={`text-sm font-bold ${i < 3 ? 'text-pink-400' : 'text-gray-600'}`}>{i + 1}</span>
          <div className="flex items-center gap-3">
            <Image src={r.avatarUrl} alt={r.username} width={32} height={32} className="rounded-full" unoptimized />
            <span className="text-white text-sm font-medium">{r.username}</span>
            {r.countryCode && (
              <Image src={countryFlagUrl(r.countryCode)} alt={r.countryCode} width={18} height={13} className="rounded-sm opacity-80" unoptimized />
            )}
          </div>
          <span className="text-right text-pink-400 text-sm font-semibold">{r.snipes} 🎯</span>
          <span className="text-right text-gray-500 text-sm">{r.rivalName ?? '—'}</span>
        </Link>
      ))}
    </div>
    </div>
  );
}

function TeamsTab() {
  return (
    <div className="bg-gray-900/60 border border-white/10 rounded-2xl p-14 text-center">
      <p className="text-4xl mb-4">🏆</p>
      <h3 className="text-white font-semibold text-lg mb-2">Team leaderboard coming soon</h3>
      <p className="text-gray-500 text-sm max-w-sm mx-auto">
        Team MMR launches with the team finder — win tournaments as a team, climb the ranks together.
      </p>
    </div>
  );
}
