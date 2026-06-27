'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { countryFlagUrl } from '@/lib/osu-api';

interface Member {
  username: string;
  avatarUrl: string;
  countryCode: string;
  createdAt: string;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)   return 'just now';
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export default function RecentMembersFeed() {
  const [members, setMembers] = useState<Member[]>([]);
  const [index, setIndex]     = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    fetch('/api/recent-members')
      .then(r => r.json())
      .then(setMembers)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (members.length === 0) return;
    const id = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex(i => (i + 1) % members.length);
        setVisible(true);
      }, 400);
    }, 3500);
    return () => clearInterval(id);
  }, [members]);

  if (members.length === 0) return null;

  const m = members[index];

  return (
    <div className="fixed bottom-6 left-6 z-40 pointer-events-none select-none">
      <div
        className="flex items-center gap-2.5 px-3 py-2 bg-gray-900/70 backdrop-blur-md border border-white/10 rounded-2xl shadow-xl"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(6px)',
          transition: 'opacity 0.35s ease, transform 0.35s ease',
          maxWidth: '220px',
        }}
      >
        {/* Live dot */}
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-pink-500" />
        </span>

        <Image
          src={m.avatarUrl}
          alt={m.username}
          width={28}
          height={28}
          className="rounded-full shrink-0"
          unoptimized
        />

        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-white text-xs font-medium truncate">{m.username}</span>
            {m.countryCode && (
              <Image
                src={countryFlagUrl(m.countryCode)}
                alt={m.countryCode}
                width={14}
                height={10}
                className="rounded-sm opacity-80 shrink-0"
                unoptimized
              />
            )}
          </div>
          <p className="text-gray-500 text-[10px] leading-tight">joined {timeAgo(m.createdAt)}</p>
        </div>
      </div>
    </div>
  );
}
