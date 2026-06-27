'use client';

import { useMemo, useState, useEffect } from 'react';
import LiveLobbyCard, { ProcessedRoom } from './LiveLobbyCard';
import { ppToStars } from '@/lib/stars';

const MODE_LABELS: Record<string, string> = { osu: 'osu!', taiko: 'Taiko', fruits: 'Catch', mania: 'Mania' };
const PAGE_SIZE = 9;
const EMPTY_HEIGHT = 'min-h-[160px]';

interface Props {
  rooms: ProcessedRoom[];
  mode: string;
  userPp: number | null;
  canSendDm: boolean;
}

export default function LiveLobbiesClient({ rooms, mode, userPp, canSendDm }: Props) {
  const [page, setPage] = useState(1);

  // Reset to page 1 whenever the mode filter changes
  useEffect(() => { setPage(1); }, [mode]);

  const { sorted, noSkillMatch, noRoomsAtAll } = useMemo(() => {
    const targetStars = ppToStars(userPp ?? 0);

    const modeFiltered = mode ? rooms.filter(r => r.mode === mode) : rooms;

    if (modeFiltered.length === 0) {
      return { sorted: [], noSkillMatch: false, noRoomsAtAll: !!mode };
    }

    const starFiltered = modeFiltered.filter(r =>
      r.currentBeatmap?.stars != null &&
      Math.abs(r.currentBeatmap.stars - targetStars) <= 1.0
    );

    const noSkillMatch = starFiltered.length === 0;
    const candidates = noSkillMatch ? modeFiltered : starFiltered;

    const result = [...candidates].sort((a, b) => {
      const aStars = a.currentBeatmap?.stars ?? 0;
      const bStars = b.currentBeatmap?.stars ?? 0;
      const aDiff = Math.abs(aStars - targetStars);
      const bDiff = Math.abs(bStars - targetStars);
      if (Math.abs(aDiff - bDiff) > 0.05) return aDiff - bDiff;
      return (b.participantCount ?? 0) - (a.participantCount ?? 0);
    });

    return { sorted: result, noSkillMatch, noRoomsAtAll: false };
  }, [rooms, mode, userPp]);

  if (noRoomsAtAll) {
    const modeLabel = MODE_LABELS[mode] ?? mode;
    return (
      <div className={`mb-6 flex items-center justify-center ${EMPTY_HEIGHT}`}>
        <div className="inline-flex items-center gap-2.5 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300/80 text-sm whitespace-nowrap">
          <svg className="w-4 h-4 shrink-0 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
          No {modeLabel} lobbies on osu! right now — why not start one?
        </div>
      </div>
    );
  }

  if (sorted.length === 0) {
    return <div className={`mb-6 ${EMPTY_HEIGHT}`} />;
  }

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const pageRooms  = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="mb-6">
      {noSkillMatch && (
        <div className="flex justify-center mb-3">
          <div className="inline-flex items-center gap-2.5 px-4 py-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-300/80 text-sm whitespace-nowrap">
            <svg className="w-4 h-4 shrink-0 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            No lobbies near your skill level — showing all instead
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {pageRooms.map(room => (
          <LiveLobbyCard key={room.id} room={room} canSendDm={canSendDm} />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-6">
          <button
            onClick={() => setPage(p => p - 1)}
            disabled={page === 1}
            className="px-2.5 py-1.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            ←
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
            <button
              key={n}
              onClick={() => setPage(n)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                n === page
                  ? 'bg-pink-500 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              {n}
            </button>
          ))}
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={page === totalPages}
            className="px-2.5 py-1.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            →
          </button>
        </div>
      )}
    </div>
  );
}
