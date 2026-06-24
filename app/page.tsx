'use client';

import { signIn, signOut, useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef } from 'react';

// Replace with your own video ID before going live
const BG_VIDEO_ID = 'dQw4w9WgXcQ';

export default function Home() {
  const { data: session, status } = useSession();
  const seeded = useRef(false);

  useEffect(() => {
    if (session?.user?.globalRank && !seeded.current) {
      seeded.current = true;
      fetch('/api/seed', { method: 'POST' })
        .then((r) => r.json())
        .then((d) => console.log('[seed] result:', d))
        .catch(console.error);
    }
  }, [session]);

  if (status === 'loading') {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </main>
    );
  }

  return (
    <>
      {/* Full-screen background video */}
      <div className="fixed inset-0 -z-10 overflow-hidden bg-black">
        <iframe
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{ width: '177.78vh', height: '100vh', minWidth: '100vw', minHeight: '56.25vw' }}
          src={`https://www.youtube.com/embed/${BG_VIDEO_ID}?autoplay=1&mute=1&loop=1&controls=0&disablekb=1&fs=0&iv_load_policy=3&rel=0&playlist=${BG_VIDEO_ID}`}
          allow="autoplay; encrypted-media"
          title="background"
        />
        {/* Dim overlay */}
        <div className="absolute inset-0 bg-black/65" />
      </div>

      <main className="min-h-screen flex flex-col items-center justify-center gap-8 px-4">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-pink-400 mb-2">osu!friends</h1>
          <p className="text-gray-300 text-lg">find osu! players at your level who play when you do</p>
        </div>

        {session ? (
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-3">
              {session.user.avatarUrl && (
                <Image
                  src={session.user.avatarUrl}
                  alt={session.user.username}
                  width={48}
                  height={48}
                  className="rounded-full"
                />
              )}
              <div>
                <p className="font-semibold">{session.user.username}</p>
                <p className="text-gray-400 text-sm">
                  #{session.user.globalRank?.toLocaleString() ?? 'unranked'}
                  {' · '}
                  {session.user.countryCode}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Link
                href={`/profile/${encodeURIComponent(session.user.username)}`}
                className="px-4 py-2 bg-pink-500 hover:bg-pink-600 rounded-lg font-medium transition-colors"
              >
                My Profile
              </Link>
              <button
                onClick={() => signOut()}
                className="px-4 py-2 bg-gray-800/80 hover:bg-gray-700 rounded-lg font-medium transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => signIn('osu')}
            className="px-8 py-3 bg-pink-500 hover:bg-pink-600 rounded-lg font-semibold text-lg transition-colors"
          >
            Sign in with osu!
          </button>
        )}
      </main>
    </>
  );
}
