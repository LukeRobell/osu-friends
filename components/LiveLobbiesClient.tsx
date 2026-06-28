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
  anyDifficulty?: boolean;
  onNotify?: (notice: { type: 'warn' | 'error'; text: string } | null) => void;
}

export default function LiveLobbiesClient({ rooms, mode, userPp, canSendDm, anyDifficulty = false, onNotify }: Props) {
  const [page, setPage] = useState(1);

  // Reset to page 1 whenever the mode or difficulty filter changes
  useEffect(() => { setPage(1); }, [mode, anyDifficulty]);

  const { sorted, noSkillMatch, noRoomsAtAll } = useMemo(() => {
    const targetStars = ppToStars(userPp ?? 0);

    const modeFiltered = mode ? rooms.filter(r => r.mode === mode) : rooms;

    if (modeFiltered.length === 0) {
      return { sorted: [], noSkillMatch: false, noRoomsAtAll: !!mode };
    }

    // Skip star filtering when "Any difficulty" is active
    if (anyDifficulty) {
      const result = [...modeFiltered].sort((a, b) => {
        // Public rooms always before private
        const privDiff = Number(a.isPrivate) - Number(b.isPrivate);
        if (privDiff !== 0) return privDiff;
        return (b.participantCount ?? 0) - (a.participantCount ?? 0);
      });
      return { sorted: result, noSkillMatch: false, noRoomsAtAll: false };
    }

    const starFiltered = modeFiltered.filter(r =>
      r.currentBeatmap?.stars != null &&
      Math.abs(r.currentBeatmap.stars - targetStars) <= 1.0
    );

    const noSkillMatch = starFiltered.length === 0;
    const candidates = noSkillMatch ? modeFiltered : starFiltered;

    const result = [...candidates].sort((a, b) => {
      // Public rooms always before private
      const privDiff = Number(a.isPrivate) - Number(b.isPrivate);
      if (privDiff !== 0) return privDiff;
      const aStars = a.currentBeatmap?.stars ?? 0;
      const bStars = b.currentBeatmap?.stars ?? 0;
      const aDiff = Math.abs(aStars - targetStars);
      const bDiff = Math.abs(bStars - targetStars);
      if (Math.abs(aDiff - bDiff) > 0.05) return aDiff - bDiff;
      return (b.participantCount ?? 0) - (a.participantCount ?? 0);
    });

    return { sorted: result, noSkillMatch, noRoomsAtAll: false };
  }, [rooms, mode, userPp, anyDifficulty]);

  useEffect(() => {
    if (!onNotify) return;
    if (noRoomsAtAll) {
      const modeLabel = MODE_LABELS[mode] ?? mode;
      onNotify({ type: 'error', text: `No ${modeLabel} lobbies on osu! right now` });
    } else if (noSkillMatch) {
      onNotify({ type: 'warn', text: 'No lobbies near your skill level — showing all' });
    } else {
      onNotify(null);
    }
  }, [noRoomsAtAll, noSkillMatch, mode, onNotify]);

  if (noRoomsAtAll || sorted.length === 0) {
    return <div className={`mb-6 ${EMPTY_HEIGHT}`} />;
  }

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const pageRooms  = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="mb-6">

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
