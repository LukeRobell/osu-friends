'use client';

import { useMemo, useState } from 'react';
import { User } from '@prisma/client';
import UserCard from '@/components/UserCard';
import DiscoverFilters from './DiscoverFilters';

interface Filters {
  q: string;
  mode: string;
  country: string;
  language: string;
  rankMin: string;
  rankMax: string;
  showAll: boolean;
}

interface Props {
  users: User[];
  userPp: number | null;
  friendIds: number[];
  lobbies: React.ReactNode;
  lobbiesHeading: React.ReactNode;
}

export default function DiscoverClient({ users, userPp, friendIds, lobbies, lobbiesHeading }: Props) {
  const [filters, setFilters] = useState<Filters>({
    q: '', mode: '', country: '', language: '', rankMin: '', rankMax: '', showAll: false,
  });

  const friendSet = useMemo(() => new Set(friendIds), [friendIds]);

  const ppWindow = userPp != null ? Math.max(20, Math.round(userPp * 0.15)) : null;
  const ppMin = userPp != null && ppWindow != null ? userPp - ppWindow : null;
  const ppMax = userPp != null && ppWindow != null ? userPp + ppWindow : null;

  const filtered = useMemo(() => {
    const hasExplicit = !!(filters.q || filters.country || filters.language || filters.rankMin || filters.rankMax);

    return users.filter(u => {
      if (filters.q && !u.username.toLowerCase().includes(filters.q.toLowerCase())) return false;
      if (filters.mode && !u.preferredModes.includes(filters.mode)) return false;
      if (filters.country && u.countryCode !== filters.country) return false;
      if (filters.language && !(u.languages ?? []).includes(filters.language)) return false;
      if (filters.rankMin) {
        if (u.globalRank == null || u.globalRank < Number(filters.rankMin)) return false;
      }
      if (filters.rankMax) {
        if (u.globalRank == null || u.globalRank > Number(filters.rankMax)) return false;
      }
      if (!filters.showAll && !hasExplicit && ppMin != null && ppMax != null) {
        if (u.pp == null || u.pp < ppMin || u.pp > ppMax) return false;
      }
      return true;
    });
  }, [users, filters, ppMin, ppMax]);

  const title = filters.q
    ? `Results for "${filters.q}"`
    : filters.showAll || !!(filters.country || filters.language || filters.rankMin || filters.rankMax)
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
      {lobbiesHeading}

      {/* Mode filter — between heading and lobby cards */}
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

      {lobbies}

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
            <UserCard key={user.id} user={user} isOsuFriend={friendSet.has(user.osuId)} />
          ))}
        </div>
      )}
    </>
  );
}
