'use client';

import { useMemo } from 'react';
import LiveLobbyCard, { ProcessedRoom } from './LiveLobbyCard';
import { ppToStars } from '@/lib/osu-api';

interface Props {
  rooms: ProcessedRoom[];
  mode: string;
  userPp: number | null;
  canSendDm: boolean;
}

export default function LiveLobbiesClient({ rooms, mode, userPp, canSendDm }: Props) {
  const { display, noSkillMatch } = useMemo(() => {
    const targetStars = ppToStars(userPp ?? 0);

    const modeFiltered = mode
      ? rooms.filter(r => r.mode === mode)
      : rooms;

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

    return { display: sorted.slice(0, 9), noSkillMatch };
  }, [rooms, mode, userPp]);

  if (display.length === 0) return null;

  return (
    <div className="mb-10">
      {noSkillMatch && (
        <div className="flex items-center gap-2.5 mb-3 px-3.5 py-2.5 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-300/80 text-sm">
          <svg className="w-4 h-4 shrink-0 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          No lobbies found near your skill level — showing all active lobbies instead.
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
