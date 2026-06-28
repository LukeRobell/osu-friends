'use client';

import { useState } from 'react';
import OsuFriendCard, { OsuFriendData } from './OsuFriendCard';

const INITIAL_LIMIT = 5;

export default function OsuFriendsClient({ friends }: { friends: OsuFriendData[] }) {
  const [expanded, setExpanded] = useState(false);

  const visible = expanded ? friends : friends.slice(0, INITIAL_LIMIT);
  const hidden = friends.length - INITIAL_LIMIT;

  return (
    <>
      <div className="flex flex-col gap-2">
        {visible.map(friend => (
          <OsuFriendCard key={friend.osuId} friend={friend} />
        ))}
      </div>
      {friends.length > INITIAL_LIMIT && (
        <button
          onClick={() => setExpanded(e => !e)}
          className="mt-3 text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          {expanded ? 'Show less' : `See ${hidden} more friend${hidden !== 1 ? 's' : ''}`}
        </button>
      )}
    </>
  );
}
