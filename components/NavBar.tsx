'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useSession, signIn, signOut } from 'next-auth/react';
import NotificationBell from './NotificationBell';

export default function NavBar() {
  const { data: session } = useSession();

  return (
    <nav className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="text-pink-400 font-bold text-xl">
          osu!friends
        </Link>

        <div className="flex items-center gap-6">
          <Link href="/discover" className="text-gray-400 hover:text-white text-sm transition-colors">
            Discover
          </Link>

          {session ? (
            <div className="flex items-center gap-3">
              <NotificationBell />
              <Link
                href={`/profile/${encodeURIComponent(session.user.username)}`}
                className="flex items-center gap-2 text-sm hover:text-pink-400 transition-colors"
              >
                {session.user.avatarUrl && (
                  <Image
                    src={session.user.avatarUrl}
                    alt={session.user.username}
                    width={28}
                    height={28}
                    className="rounded-full"
                  />
                )}
                <span>{session.user.username}</span>
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="text-gray-500 hover:text-gray-300 text-sm transition-colors"
              >
                Sign out
              </button>
            </div>
          ) : (
            <button
              onClick={() => signIn('osu')}
              className="px-3 py-1.5 bg-pink-500 hover:bg-pink-600 rounded-lg text-sm font-medium transition-colors"
            >
              Sign in
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
