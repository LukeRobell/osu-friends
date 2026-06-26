'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface Application {
  id: string;
  message: string;
  createdAt: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
  user: {
    username: string;
    avatarUrl: string;
    pp: number | null;
    globalRank: number | null;
  };
}

interface Props {
  applications: Application[];
  tag: string;
}

export default function ApplicationsList({ applications: initial, tag }: Props) {
  const [apps, setApps] = useState(initial);
  const [loading, setLoading] = useState<string | null>(null);

  async function respond(id: string, status: 'ACCEPTED' | 'DECLINED') {
    setLoading(id);
    await fetch(`/api/teams/${encodeURIComponent(tag)}/applications/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    setApps(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    setLoading(null);
  }

  const pending  = apps.filter(a => a.status === 'PENDING');
  const resolved = apps.filter(a => a.status !== 'PENDING');

  if (apps.length === 0) {
    return (
      <p className="text-gray-500 text-sm">No applications yet.</p>
    );
  }

  return (
    <div className="space-y-3">
      {pending.map(app => (
        <div key={app.id} className="bg-gray-900/60 border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <Image
              src={app.user.avatarUrl}
              alt={app.user.username}
              width={36}
              height={36}
              className="rounded-full"
              unoptimized
            />
            <div>
              <Link
                href={`/profile/${encodeURIComponent(app.user.username)}`}
                className="text-white font-medium hover:text-pink-400 transition-colors"
              >
                {app.user.username}
              </Link>
              <p className="text-gray-500 text-xs">
                {app.user.pp != null ? `${Math.round(app.user.pp)}pp` : '—'}
                {app.user.globalRank != null ? ` · #${app.user.globalRank.toLocaleString()}` : ''}
              </p>
            </div>
            <span className="ml-auto text-gray-600 text-xs">
              {new Date(app.createdAt).toLocaleDateString()}
            </span>
          </div>
          <p className="text-gray-300 text-sm bg-white/5 rounded-lg px-3 py-2 mb-3">
            {app.message}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => respond(app.id, 'ACCEPTED')}
              disabled={loading === app.id}
              className="flex-1 py-1.5 bg-pink-500 hover:bg-pink-600 disabled:opacity-40 rounded-lg text-sm font-medium transition-colors"
            >
              {loading === app.id ? '...' : 'Accept'}
            </button>
            <button
              onClick={() => respond(app.id, 'DECLINED')}
              disabled={loading === app.id}
              className="flex-1 py-1.5 bg-white/5 hover:bg-white/10 disabled:opacity-40 border border-white/10 rounded-lg text-sm text-gray-400 transition-colors"
            >
              Decline
            </button>
          </div>
        </div>
      ))}

      {resolved.length > 0 && (
        <div className="space-y-2 mt-4">
          <p className="text-gray-600 text-xs uppercase tracking-wider">Previously reviewed</p>
          {resolved.map(app => (
            <div key={app.id} className="flex items-center gap-3 px-4 py-2.5 bg-gray-900/40 border border-white/5 rounded-xl opacity-60">
              <Image
                src={app.user.avatarUrl}
                alt={app.user.username}
                width={28}
                height={28}
                className="rounded-full"
                unoptimized
              />
              <Link
                href={`/profile/${encodeURIComponent(app.user.username)}`}
                className="text-gray-400 text-sm hover:text-white transition-colors"
              >
                {app.user.username}
              </Link>
              <span className={`ml-auto text-xs font-medium ${app.status === 'ACCEPTED' ? 'text-green-400' : 'text-red-400'}`}>
                {app.status === 'ACCEPTED' ? 'Accepted' : 'Declined'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
