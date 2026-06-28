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

const PAGE_SIZE = 12;

export default function DiscoverClient({ users, userPp, modePp, friendIds, allRooms, lobbyExtras, canSendDm, defaultStarRange }: Props) {
  const [filters, setFilters] = useState<Filters>({
    q: '', mode: '', country: '', language: '', rankMin: '', rankMax: '', accountAge: '', showAll: false,
  });
  const [page, setPage] = useState(1);
  const [anyDifficulty, setAnyDifficulty] = useState(false);

  function setFiltersAndReset(f: Filters) {
    setFilters(f);
    setPage(1);
  }

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



  const MODES = [
    { id: 'osu', label: 'osu!' },
    { id: 'taiko', label: 'Taiko' },
    { id: 'fruits', label: 'Catch' },
    { id: 'mania', label: 'Mania' },
  ];

  return (
    <>
      <div className="mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-0.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
          </span>
          Live lobbies
          <span className="text-sm font-normal text-gray-500">{currentStarRange}</span>
          <RefreshButton />
        </h2>

        {/* Subtitle + filters on the same line */}
        <div className="flex items-center justify-between ml-5">
          <p className="text-xs text-gray-600">Hosts within your skill level towards top</p>
          <div className="flex flex-wrap items-center gap-2">
            {MODES.map(m => (
              <button
                key={m.id}
                onClick={() => { setFilters(f => ({ ...f, mode: f.mode === m.id ? '' : m.id })); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filters.mode === m.id ? 'bg-pink-500 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                {m.label}
              </button>
            ))}

            <div className="w-px h-5 bg-gray-700 mx-1" />

            <button
              onClick={() => setAnyDifficulty(v => !v)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                anyDifficulty ? 'bg-purple-500 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              Any difficulty
            </button>
          </div>
        </div>
      </div>

      {lobbyExtras}
      <LiveLobbiesClient
        rooms={allRooms}
        mode={filters.mode}
        userPp={effectivePp}
        canSendDm={canSendDm}
        anyDifficulty={anyDifficulty}
      />

      {/* Members section */}
      <div className="border-t border-white/5 pt-8 mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-0.5">
          <svg className="w-4 h-4 text-pink-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          osu!friends members
          {filtered.length > 0 && (
            <span className="text-sm font-normal text-gray-500">— {filtered.length} players</span>
          )}
        </h2>
        <div className="flex items-center justify-between ml-6 mb-4">
          <p className="text-xs text-gray-600 shrink-0 mr-4">
            {filters.showAll || !!(filters.country || filters.language || filters.rankMin || filters.rankMax || filters.accountAge)
              ? 'Filtered from all registered members'
              : userPp != null
                ? 'Sorted by online status · filtered to your avg pp'
                : 'All registered osu!friends members'}
          </p>
          <DiscoverFilters filters={filters} onChange={setFiltersAndReset} />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-500 text-lg mb-2">No players found.</p>
          <p className="text-gray-600 text-sm mt-1">
            {userPp == null
              ? 'Sign in with osu! to find players near your level.'
              : 'Try adjusting your filters or browse all members.'}
          </p>
        </div>
      ) : (() => {
        const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
        const pageUsers = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
        return (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {pageUsers.map(user => (
                <UserCard key={user.id} user={user} isOsuFriend={friendSet.has(user.osuId)} activeMode={filters.mode || null} canSendDm={canSendDm} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-1.5 mt-8">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 rounded-lg text-sm bg-gray-800 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  ←
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                  <button
                    key={n}
                    onClick={() => setPage(n)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                      n === page ? 'bg-pink-500 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
                    }`}
                  >
                    {n}
                  </button>
                ))}
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 rounded-lg text-sm bg-gray-800 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  →
                </button>
              </div>
            )}
          </>
        );
      })()}
    </>
  );
}
