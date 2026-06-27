'use client';

import { useMemo } from 'react';
import LiveLobbyCard, { ProcessedRoom } from './LiveLobbyCard';
import { ppToStars } from '@/lib/stars';

const MODE_LABELS: Record<string, string> = { osu: 'osu!', taiko: 'Taiko', fruits: 'Catch', mania: 'Mania' };

interface Props {
  rooms: ProcessedRoom[];
  mode: string;
  userPp: number | null;
  canSendDm: boolean;
}

export default function LiveLobbiesClient({ rooms, mode, userPp, canSendDm }: Props) {
  const { display, noSkillMatch, noRoomsAtAll } = useMemo(() => {
    const targetStars = ppToStars(userPp ?? 0);

    const modeFiltered = mode
      ? rooms.filter(r => r.mode === mode)
      : rooms;

    if (modeFiltered.length === 0) {
      return { display: [], noSkillMatch: false, noRoomsAtAll: !!mode };
    }

    const starFiltered = modeFiltered.filter(r =>
      r.currentBeatmap?.stars != null &&
      Math.abs(r.currentBeatmap.stars - targetStars) <= 1.0
    );

    const noSkillMatch = starFiltered.length === 0;
    const candidates = noSkillMatch ? modeFiltered : starFiltered;

    const sorted = [...candidates].sort((a, b) => {
      const aStars = a.currentBeatmap?.stars ?? 0;
      const bStars = b.currentBeatmap?.stars ?? 0;
      const aDiff = Math.abs(aStars - targetStars);
      const bDiff = Math.abs(bStars - targetStars);
      if (Math.abs(aDiff - bDiff) > 0.05) return aDiff - bDiff;
      return (b.participantCount ?? 0) - (a.participantCount ?? 0);
    });

    return { display: sorted.slice(0, 9), noSkillMatch, noRoomsAtAll: false };
  }, [rooms, mode, userPp]);

  const bannerBase = 'flex items-center gap-2.5 mb-3 px-3.5 py-2.5 rounded-xl border text-sm max-w-xs';

  if (noRoomsAtAll) {
    const modeLabel = MODE_LABELS[mode] ?? mode;
    return (
      <div className="mb-10">
        <div className={`${bannerBase} bg-red-500/10 border-red-500/20 text-red-300/80`}>
          <svg className="w-4 h-4 shrink-0 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
          No {modeLabel} lobbies on osu! right now — why not start one?
        </div>
      </div>
    );
  }

  if (display.length === 0) return null;

  return (
    <div className="mb-10">
      {noSkillMatch && (
        <div className={`${bannerBase} bg-yellow-500/10 border-yellow-500/20 text-yellow-300/80`}>
          <svg className="w-4 h-4 shrink-0 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          No lobbies near your skill level — showing all instead
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {display.map(room => (
          <LiveLobbyCard key={room.id} room={room} canSendDm={canSendDm} />
        ))}
      </div>
    </div>
  );
}
