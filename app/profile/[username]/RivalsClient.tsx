'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import RivalCompareCard, { type RivalCardData } from './RivalCompareCard';

interface PendingRequest {
  id: string;
  fromUsername: string;
  fromAvatarUrl: string;
  fromPp: number | null;
  fromGlobalRank: number | null;
}

export default function RivalsClient({
  initialCards,
  pendingRequests: initialPending,
}: {
  initialCards: RivalCardData[];
  pendingRequests: PendingRequest[];
}) {
  const [cards, setCards] = useState(initialCards);
  const [pending, setPending] = useState(initialPending);

  function removeRival(rivalUserId: string) {
    setCards(prev => prev.filter(c => c.rivalUserId !== rivalUserId));
  }

  async function acceptRequest(requestId: string) {
    const res = await fetch(`/api/rival/request/${requestId}/accept`, { method: 'POST' });
    if (res.ok) window.location.reload();
  }

  async function declineRequest(requestId: string) {
    const res = await fetch(`/api/rival/request/${requestId}/decline`, { method: 'POST' });
    if (res.ok) setPending(prev => prev.filter(r => r.id !== requestId));
  }

  if (cards.length === 0 && pending.length === 0) return null;

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <p className="text-gray-400 text-sm">⚔️ Rivals</p>
        {cards.length > 0 && (
          <span className="text-xs text-gray-600">{cards.length}/3</span>
        )}
      </div>

      {cards.length > 0 && (
        <div className="flex flex-col gap-3">
          {cards.map(card => (
            <RivalCompareCard key={card.rivalUserId} data={card} onRemove={removeRival} />
          ))}
        </div>
      )}

      {pending.length > 0 && (
        <div className={cards.length > 0 ? 'mt-4' : ''}>
          {cards.length > 0 && (
            <p className="text-gray-500 text-xs mb-2 uppercase tracking-wider">Incoming challenges</p>
          )}
          <div className="flex flex-col gap-2">
            {pending.map(req => (
              <div key={req.id} className="bg-gray-900/60 border border-white/10 rounded-xl p-3 flex items-center gap-3">
                <Image
                  src={req.fromAvatarUrl}
                  alt={req.fromUsername}
                  width={40}
                  height={40}
                  className="rounded-full flex-shrink-0"
                  unoptimized
                />
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/profile/${encodeURIComponent(req.fromUsername)}`}
                    className="text-sm font-medium hover:text-pink-300 transition-colors"
                  >
                    {req.fromUsername}
                  </Link>
                  <p className="text-xs text-gray-500">
                    {req.fromGlobalRank != null && `#${req.fromGlobalRank.toLocaleString()} · `}
                    {req.fromPp != null ? `${Math.round(req.fromPp)}pp` : '—'}
                  </p>
                  <p className="text-xs text-yellow-400 mt-0.5">wants to be your rival</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => acceptRequest(req.id)}
                    className="px-3 py-1.5 bg-pink-500 hover:bg-pink-600 rounded-lg text-xs font-medium transition-colors"
                  >
                    Accept ⚔️
                  </button>
                  <button
                    onClick={() => declineRequest(req.id)}
                    className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs font-medium transition-colors"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
