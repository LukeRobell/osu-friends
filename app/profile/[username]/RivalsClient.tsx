'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import RivalCompareCard, { type RivalCardData } from './RivalCompareCard';

function EmbedRow({ label, value, copyKey, copiedKey, onCopy }: {
  label: string; value: string; copyKey: string;
  copiedKey: string | null; onCopy: (v: string, k: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-700 w-24 shrink-0">{label}</span>
      <code className="flex-1 text-xs bg-black/40 text-gray-400 rounded-lg px-2 py-1.5 truncate font-mono min-w-0">{value}</code>
      <button
        onClick={() => onCopy(value, copyKey)}
        className={`shrink-0 text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${
          copiedKey === copyKey
            ? 'border-emerald-500/50 text-emerald-400 bg-emerald-500/10'
            : 'border-gray-700 text-gray-500 hover:text-gray-300 hover:border-gray-500'
        }`}
      >
        {copiedKey === copyKey ? 'Copied!' : 'Copy'}
      </button>
    </div>
  );
}

interface PendingRequest {
  id: string;
  fromUsername: string;
  fromAvatarUrl: string;
  fromPp: number | null;
  fromGlobalRank: number | null;
}

export default function RivalsClient({
  username,
  initialCards,
  pendingRequests: initialPending,
}: {
  username: string;
  initialCards: RivalCardData[];
  pendingRequests: PendingRequest[];
}) {
  const [cards, setCards] = useState(initialCards);
  const [pending, setPending] = useState(initialPending);
  const [showEmbed, setShowEmbed] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const widgetUrl = `https://osufriends.com/api/widget/${encodeURIComponent(username)}`;
  const bbCode = `[img]${widgetUrl}[/img]`;
  const obsUrl = `https://osufriends.com/widget/${encodeURIComponent(username)}`;

  function copyText(text: string, key: string) {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  }

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
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <p className="text-gray-400 text-sm">⚔️ Rivals</p>
          {cards.length > 0 && (
            <span className="text-xs text-gray-600">{cards.length}/3</span>
          )}
        </div>
        {cards.length > 0 && (
          <button
            onClick={() => setShowEmbed(v => !v)}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
            </svg>
            Embed
          </button>
        )}
      </div>

      {showEmbed && (
        <div className="mb-3 bg-gray-900/60 border border-white/10 rounded-xl p-3 space-y-3">
          {/* osu! profile */}
          <div>
            <p className="text-xs text-gray-500 mb-1.5 font-medium">osu! profile</p>
            <EmbedRow label="BBCode" value={bbCode} copyKey="bbcode" copiedKey={copiedKey} onCopy={copyText} />
          </div>

          <div className="border-t border-white/5" />

          {/* Twitch */}
          <div>
            <p className="text-xs text-gray-500 mb-1.5 font-medium">Twitch</p>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Live panel (extension)</span>
                <span className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">Live</span>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                Install the <strong className="text-gray-400">osu!friends</strong> Twitch Extension on your channel dashboard, then enter your username in the extension config.
              </p>
              <EmbedRow label="Static image" value={widgetUrl} copyKey="url" copiedKey={copiedKey} onCopy={copyText} />
            </div>
          </div>

          <div className="border-t border-white/5" />

          {/* OBS */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs text-gray-500 font-medium">OBS overlay</p>
              <span className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">Live</span>
            </div>
            <EmbedRow label="Browser Source URL" value={obsUrl} copyKey="obs" copiedKey={copiedKey} onCopy={copyText} />
            <p className="text-xs text-gray-600 mt-1">Width: 380px · Height: ~290px per rival</p>
          </div>
        </div>
      )}

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
