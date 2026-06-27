'use client';

import { useMemo, useState } from 'react';
import { User } from '@prisma/client';
import UserCard from '@/components/UserCard';
import LiveLobbiesClient from '@/components/LiveLobbiesClient';
import { ProcessedRoom } from '@/components/LiveLobbyCard';
import RefreshButton from '@/components/RefreshButton';
import { starRange } from '@/lib/stars';
import DiscoverFilters from './DiscoverFilters';

interface Filters {
  q: string;
  mode: string;
  country: string;
  language: string;
  rankMin: string;
  rankMax: string;
  accountAge: string;
  showAll: boolean;
}

interface ModePp {
  osu: number | null;
  taiko: number | null;
  fruits: number | null;
  mania: number | null;
}

interface Props {
  users: User[];
  userPp: number | null;
  modePp: ModePp;
  friendIds: number[];
  allRooms: ProcessedRoom[];
  lobbyExtras: React.ReactNode;
  canSendDm: boolean;
  defaultStarRange: string;
}

export default function DiscoverClient({ users, userPp, modePp, friendIds, allRooms, lobbyExtras, canSendDm, defaultStarRange }: Props) {
  const [filters, setFilters] = useState<Filters>({
    q: '', mode: '', country: '', language: '', rankMin: '', rankMax: '', accountAge: '', showAll: false,
  });

  const friendSet = useMemo(() => new Set(friendIds), [friendIds]);

  const effectivePp = (
    filters.mode === 'taiko'  ? modePp.taiko  :
    filters.mode === 'fruits' ? modePp.fruits :
    filters.mode === 'mania'  ? modePp.mania  :
    modePp.osu
  ) ?? userPp;

  const currentStarRange = effectivePp != null ? starRange(effectivePp) : defaultStarRange;

  const ppWindow = userPp != null ? Math.max(20, Math.round(userPp * 0.15)) : null;
  const ppMin = userPp != null && ppWindow != null ? userPp - ppWindow : null;
  const ppMax = userPp != null && ppWindow != null ? userPp + ppWindow : null;

  const filtered = useMemo(() => {
    const hasExplicit = !!(filters.q || filters.country || filters.language || filters.rankMin || filters.rankMax || filters.accountAge);

    return users.filter(u => {
      if (filters.q && !u.username.toLowerCase().includes(filters.q.toLowerCase())) return false;
      if (filters.country && u.countryCode !== filters.country) return false;
      if (filters.language && !(u.languages ?? []).includes(filters.language)) return false;
      if (filters.rankMin) {
        if (u.globalRank == null || u.globalRank < Number(filters.rankMin)) return false;
      }
      if (filters.rankMax) {
        if (u.globalRank == null || u.globalRank > Number(filters.rankMax)) return false;
      }
      if (filters.accountAge) {
        if (!u.osuJoinDate) return false;
        const ageYears = (Date.now() - new Date(u.osuJoinDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25);
        if (filters.accountAge === '<1' && ageYears >= 1) return false;
        if (filters.accountAge === '1'  && (ageYears < 1 || ageYears >= 5)) return false;
        if (filters.accountAge === '5'  && ageYears < 5)  return false;
        if (filters.accountAge === '10' && ageYears < 10) return false;
        if (filters.accountAge === '15' && ageYears < 15) return false;
      }
      if (!filters.showAll && !hasExplicit && ppMin != null && ppMax != null) {
        if (u.pp == null || u.pp < ppMin || u.pp > ppMax) return false;
      }
      return true;
    });
  }, [users, filters, ppMin, ppMax]);

  const title = filters.q
    ? `Results for "${filters.q}"`
    : filters.showAll || !!(filters.country || filters.language || filters.rankMin || filters.rankMax || filters.accountAge)
      ? 'All osu!friends members'
      : 'osu!friends members near your skill level';

  const MODES = [
    { id: 'osu', label: 'osu!' },
    { id: 'taiko', label: 'Taiko' },
    { id: 'fruits', label: 'Catch' },
    { id: 'mania', label: 'Mania' },
  ];

  return (
    <>
      <div className="mb-3">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
          </span>
          Live lobbies
          <span className="text-sm font-normal text-gray-500">{currentStarRange}</span>
          <RefreshButton />
        </h2>
        <p className="text-xs text-gray-600 mt-0.5 ml-5">Hosts within your skill level towards top</p>
      </div>

      {/* Mode filter — instant client-side, no page reload */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {MODES.map(m => (
          <button
            key={m.id}
            onClick={() => setFilters(f => ({ ...f, mode: f.mode === m.id ? '' : m.id }))}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filters.mode === m.id ? 'bg-pink-500 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {lobbyExtras}
      <LiveLobbiesClient
        rooms={allRooms}
        mode={filters.mode}
        userPp={effectivePp}
        canSendDm={canSendDm}
      />

      {/* Members section */}
      <p className="text-gray-400 mb-4">
        {title}
        {filtered.length > 0 && (
          <span className="ml-2 text-gray-500 text-sm">— {filtered.length} players</span>
        )}
      </p>

      <DiscoverFilters filters={filters} onChange={setFilters} />

      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-500 text-lg mb-2">No players found.</p>
          <p className="text-gray-600 text-sm mt-1">
            {userPp == null
              ? 'Sign in with osu! to find players near your level.'
              : 'Try adjusting your filters or browse all members.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(user => (
            <UserCard key={user.id} user={user} isOsuFriend={friendSet.has(user.osuId)} activeMode={filters.mode || null} />
          ))}
        </div>
      )}
    </>
  );
}
