'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import TeamBadge from './TeamBadge';
import { countryFlagUrl } from '@/lib/osu-api';

const modeLabels: Record<string, string> = {
  osu: 'osu!',
  taiko: 'Taiko',
  fruits: 'Catch',
  mania: 'Mania',
};

export interface ModalUser {
  osuId: number;
  username: string;
  avatarUrl: string;
  countryCode: string;
  globalRank: number | null;
  countryRank: number | null;
  pp: number | null;
  preferredModes: string[];
  teamId: string | null;
  teamName: string | null;
  teamTag: string | null;
  teamFlagUrl: string | null;
  isOnline: boolean;
}

export default function ProfileModal({ user, onClose }: { user: ModalUser; onClose: () => void }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-gray-900 rounded-2xl p-6 max-w-sm w-full z-10 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors text-lg leading-none"
        >
          ✕
        </button>

        {/* Header */}
        <div className="flex items-center gap-4 mb-5">
          <div className="relative flex-shrink-0">
            <Image
              src={user.avatarUrl}
              alt={user.username}
              width={72}
              height={72}
              className="rounded-full"
            />
            {user.isOnline && (
              <span className="absolute bottom-0.5 right-0.5 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-green-500 border-2 border-gray-900" />
              </span>
            )}
          </div>
          <div className="min-w-0">
            <h2 className="text-xl font-bold truncate">{user.username}</h2>
            <div className="flex items-center gap-2 mt-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={countryFlagUrl(user.countryCode)} alt={user.countryCode} width={18} height={13} className="rounded-sm" />
              <span className="text-gray-400 text-xs">{user.countryCode}</span>
              {user.teamId && user.teamTag && user.teamName && (
                <TeamBadge teamId={user.teamId} teamTag={user.teamTag} teamName={user.teamName} teamFlagUrl={user.teamFlagUrl} />
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-gray-800 rounded-xl p-3 text-center">
            <p className="text-gray-400 text-xs mb-0.5">Global</p>
            <p className="text-sm font-bold text-pink-400">
              {user.globalRank != null ? `#${user.globalRank.toLocaleString()}` : '—'}
            </p>
          </div>
          <div className="bg-gray-800 rounded-xl p-3 text-center">
            <p className="text-gray-400 text-xs mb-0.5">Country</p>
            <p className="text-sm font-bold text-purple-400">
              {user.countryRank != null ? `#${user.countryRank.toLocaleString()}` : '—'}
            </p>
          </div>
          <div className="bg-gray-800 rounded-xl p-3 text-center">
            <p className="text-gray-400 text-xs mb-0.5">Avg Play</p>
            <p className="text-sm font-bold text-white">
              {user.pp != null ? `${Math.round(user.pp).toLocaleString()}pp` : '—'}
            </p>
          </div>
        </div>

        {/* Preferred modes */}
        {user.preferredModes.length > 0 && (
          <div className="flex gap-1.5 flex-wrap mb-5">
            {user.preferredModes.map(mode => (
              <span key={mode} className="px-2.5 py-0.5 bg-pink-500/20 text-pink-300 rounded-full text-xs font-medium">
                {modeLabels[mode] ?? mode}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Link
            href={`/profile/${encodeURIComponent(user.username)}`}
            className="flex-1 text-center py-2 bg-pink-500 hover:bg-pink-600 rounded-lg text-sm font-medium transition-colors"
          >
            View profile
          </Link>
          <a
            href={`https://osu.ppy.sh/users/${user.osuId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 text-center py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium transition-colors"
          >
            osu! profile ↗
          </a>
        </div>
      </div>
    </div>
  );
}
