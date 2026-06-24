'use client';

import { useState } from 'react';
import Image from 'next/image';
import { User } from '@prisma/client';
import ProfileModal, { ModalUser } from './ProfileModal';

const modeLabels: Record<string, string> = {
  osu: 'osu!',
  taiko: 'Taiko',
  fruits: 'Catch',
  mania: 'Mania',
};

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 86400 * 30) return `${Math.floor(seconds / 86400)}d ago`;
  return `${Math.floor(seconds / (86400 * 30))}mo ago`;
}

export default function UserCard({ user, isOsuFriend = false }: { user: User; isOsuFriend?: boolean }) {
  const [showModal, setShowModal] = useState(false);

  const modalUser: ModalUser = {
    osuId: user.osuId,
    username: user.username,
    avatarUrl: user.avatarUrl,
    countryCode: user.countryCode,
    globalRank: user.globalRank,
    countryRank: (user as any).countryRank ?? null,
    pp: user.pp,
    preferredModes: user.preferredModes,
    teamId: (user as any).teamId ?? null,
    teamName: (user as any).teamName ?? null,
    teamTag: (user as any).teamTag ?? null,
    teamFlagUrl: (user as any).teamFlagUrl ?? null,
    isOnline: user.isOnline,
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="w-full text-left bg-gray-900 hover:bg-gray-800 rounded-xl p-4 flex items-center gap-4 transition-colors cursor-pointer"
      >
        <div className="relative flex-shrink-0">
          <Image
            src={user.avatarUrl}
            alt={user.username}
            width={56}
            height={56}
            className="rounded-full"
          />
          {user.isOnline && (
            <span className="absolute bottom-0 right-0 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-green-500 border-2 border-gray-900" />
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="font-semibold truncate">{user.username}</p>
            {isOsuFriend && (
              <span className="text-xs px-1.5 py-0.5 bg-cyan-500/30 text-cyan-300 rounded-full flex-shrink-0">
                osu! friend
              </span>
            )}
          </div>
          <p className="text-gray-400 text-sm">
            {user.countryCode}
            {user.globalRank != null && (
              <span> · #{user.globalRank.toLocaleString()}</span>
            )}
            {user.pp != null && (
              <span> · {Math.round(user.pp).toLocaleString()}pp</span>
            )}
          </p>
          <div className="flex items-center justify-between mt-1.5">
            {user.preferredModes.length > 0 && (
              <div className="flex gap-1 flex-wrap">
                {user.preferredModes.map((mode: string) => (
                  <span
                    key={mode}
                    className="px-2 py-0.5 bg-gray-700 text-gray-300 rounded-full text-xs"
                  >
                    {modeLabels[mode] ?? mode}
                  </span>
                ))}
              </div>
            )}
            {user.lastSeen && (
              <span className={`text-xs ml-auto ${user.isOnline ? 'text-green-400' : 'text-gray-500'}`}>
                {user.isOnline ? 'Online now' : timeAgo(new Date(user.lastSeen))}
              </span>
            )}
          </div>
        </div>
      </button>

      {showModal && <ProfileModal user={modalUser} onClose={() => setShowModal(false)} />}
    </>
  );
}
