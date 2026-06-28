'use client';

import { useState } from 'react';
import OsuFriendCard, { OsuFriendData } from './OsuFriendCard';

const PAGE_SIZE = 5;

export default function OsuFriendsClient({ friends }: { friends: OsuFriendData[] }) {
  const [page, setPage] = useState(1);

  const totalPages = Math.ceil(friends.length / PAGE_SIZE);
  const visible = friends.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <>
      <div className="flex flex-col gap-2">
        {visible.map(friend => (
          <OsuFriendCard key={friend.osuId} friend={friend} />
        ))}
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-4">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-2.5 py-1.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            ←
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
            <button
              key={n}
              onClick={() => setPage(n)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                n === page ? 'bg-pink-500 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              {n}
            </button>
          ))}
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-2.5 py-1.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            →
          </button>
        </div>
      )}
    </>
  );
}
