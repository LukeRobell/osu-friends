import { prisma } from '@/lib/prisma';
import { countryFlagUrl } from '@/lib/osu-api';
import Image from 'next/image';
import Link from 'next/link';

interface Props {
  searchParams: { tab?: string };
}

const TABS = [
  { id: 'players', label: 'Players' },
  { id: 'rivals',  label: 'Rivals' },
  { id: 'teams',   label: 'Teams' },
];

export default async function LeaderboardPage({ searchParams }: Props) {
  const tab = searchParams.tab ?? 'players';

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-white mb-2">Leaderboard</h1>
      <p className="text-gray-500 text-sm mb-8">
        Rankings across the osu!friends community.
      </p>

      {/* Tabs */}
      <div className="flex gap-1 mb-8 bg-gray-900/60 border border-white/10 rounded-xl p-1 w-fit">
        {TABS.map((t) => (
          <Link
            key={t.id}
            href={`/leaderboard?tab=${t.id}`}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t.id
                ? 'bg-pink-500 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {tab === 'players' && <PlayersTab />}
      {tab === 'rivals'  && <RivalsTab />}
      {tab === 'teams'   && <TeamsTab />}
    </div>
  );
}

async function PlayersTab() {
  const players = await prisma.user.findMany({
    where: { isRegistered: true, pp: { not: null } },
    orderBy: { pp: 'desc' },
    take: 100,
    select: {
      osuId: true,
      username: true,
      avatarUrl: true,
      countryCode: true,
      pp: true,
      globalRank: true,
    },
  });

  return (
    <div className="bg-gray-900/60 border border-white/10 rounded-2xl overflow-hidden">
      <div className="grid grid-cols-[48px_1fr_120px_120px] text-xs text-gray-500 uppercase tracking-wider px-6 py-3 border-b border-white/5">
        <span>#</span>
        <span>Player</span>
        <span className="text-right">Avg PP</span>
        <span className="text-right">Global Rank</span>
      </div>
      {players.map((p, i) => (
        <Link
          key={p.osuId}
          href={`/profile/${encodeURIComponent(p.username)}`}
          className="grid grid-cols-[48px_1fr_120px_120px] items-center px-6 py-3 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors"
        >
          <span className={`text-sm font-bold ${i < 3 ? 'text-pink-400' : 'text-gray-600'}`}>
            {i + 1}
          </span>
          <div className="flex items-center gap-3">
            <Image
              src={p.avatarUrl}
              alt={p.username}
              width={32}
              height={32}
              className="rounded-full"
              unoptimized
            />
            <span className="text-white text-sm font-medium">{p.username}</span>
            {p.countryCode && (
              <Image
                src={countryFlagUrl(p.countryCode)}
                alt={p.countryCode}
                width={18}
                height={13}
                className="rounded-sm opacity-80"
                unoptimized
              />
            )}
          </div>
          <span className="text-right text-gray-300 text-sm">
            {p.pp ? `${Math.round(p.pp)}pp` : '—'}
          </span>
          <span className="text-right text-gray-500 text-sm">
            {p.globalRank ? `#${p.globalRank.toLocaleString()}` : '—'}
          </span>
        </Link>
      ))}
    </div>
  );
}

async function RivalsTab() {
  const grouped = await prisma.snipeChallenge.groupBy({
    by: ['watcherId'],
    where: { status: 'SNIPED' },
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
    take: 100,
  });

  if (grouped.length === 0) {
    return (
      <div className="bg-gray-900/60 border border-white/10 rounded-2xl p-12 text-center">
        <p className="text-gray-500 mb-1">No snipes yet.</p>
        <p className="text-gray-600 text-sm">Set a rival, get notified when they score, go beat it.</p>
      </div>
    );
  }

  const userIds = grouped.map((g) => g.watcherId);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: {
      id: true,
      osuId: true,
      username: true,
      avatarUrl: true,
      countryCode: true,
      rival: { select: { username: true } },
    },
  });

  const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

  const rows = grouped
    .map((g) => ({ ...userMap[g.watcherId], snipes: g._count.id }))
    .filter((r) => r.username);

  return (
    <div className="bg-gray-900/60 border border-white/10 rounded-2xl overflow-hidden">
      <div className="grid grid-cols-[48px_1fr_120px_160px] text-xs text-gray-500 uppercase tracking-wider px-6 py-3 border-b border-white/5">
        <span>#</span>
        <span>Player</span>
        <span className="text-right">Snipes 🎯</span>
        <span className="text-right">Current Rival</span>
      </div>
      {rows.map((r, i) => (
        <Link
          key={r.osuId}
          href={`/profile/${encodeURIComponent(r.username)}`}
          className="grid grid-cols-[48px_1fr_120px_160px] items-center px-6 py-3 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors"
        >
          <span className={`text-sm font-bold ${i < 3 ? 'text-pink-400' : 'text-gray-600'}`}>
            {i + 1}
          </span>
          <div className="flex items-center gap-3">
            <Image
              src={r.avatarUrl}
              alt={r.username}
              width={32}
              height={32}
              className="rounded-full"
              unoptimized
            />
            <span className="text-white text-sm font-medium">{r.username}</span>
            {r.countryCode && (
              <Image
                src={countryFlagUrl(r.countryCode)}
                alt={r.countryCode}
                width={18}
                height={13}
                className="rounded-sm opacity-80"
                unoptimized
              />
            )}
          </div>
          <span className="text-right text-pink-400 text-sm font-semibold">
            {r.snipes} 🎯
          </span>
          <span className="text-right text-gray-500 text-sm">
            {r.rival?.username ?? '—'}
          </span>
        </Link>
      ))}
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
