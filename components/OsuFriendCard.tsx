'use client';

import { useState } from 'react';
import Image from 'next/image';
import AskToJoinButton from './AskToJoinButton';
import ProfileModal, { ModalUser } from './ProfileModal';

export interface OsuFriendData {
  osuId: number;
  username: string;
  avatarUrl: string;
  pp: number | null;
  globalRank: number | null;
  countryCode: string;
  countryRank: number | null;
  preferredModes: string[];
  teamId: string | null;
  teamName: string | null;
  teamTag: string | null;
  teamFlagUrl: string | null;
  inRoom: { id: number; name: string } | null;
}

export default function OsuFriendCard({ friend }: { friend: OsuFriendData }) {
  const [showModal, setShowModal] = useState(false);

  const modalUser: ModalUser = {
    osuId: friend.osuId,
    username: friend.username,
    avatarUrl: friend.avatarUrl,
    countryCode: friend.countryCode,
    globalRank: friend.globalRank,
    countryRank: friend.countryRank,
    pp: friend.pp,
    preferredModes: friend.preferredModes,
    teamId: friend.teamId,
    teamName: friend.teamName,
    teamTag: friend.teamTag,
    teamFlagUrl: friend.teamFlagUrl,
    isOnline: false,
  };

  return (
    <>
      <div className="bg-gray-800 rounded-xl p-3 flex items-center gap-3">
        <button onClick={() => setShowModal(true)} className="flex-shrink-0">
          <Image
            src={friend.avatarUrl}
            alt={friend.username}
            width={44}
            height={44}
            className="rounded-full hover:ring-2 ring-pink-500 transition"
          />
        </button>
        <div className="min-w-0 flex-1">
          <button onClick={() => setShowModal(true)} className="text-left w-full">
            <p className="font-medium text-sm truncate hover:text-pink-300 transition-colors">{friend.username}</p>
          </button>
          <p className="text-xs text-gray-400">
            {friend.globalRank != null && `#${friend.globalRank.toLocaleString()} · `}
            {friend.pp != null ? `${Math.round(friend.pp)}pp` : '—'}
          </p>
          {friend.inRoom && (
            <p className="text-xs text-purple-400 truncate mt-0.5" title={friend.inRoom.name}>
              In lobby: {friend.inRoom.name}
            </p>
          )}
        </div>
        {friend.inRoom && (
          <AskToJoinButton
            targetId={friend.osuId}
            targetUsername={friend.username}
            roomName={friend.inRoom.name}
            variant="friend"
          />
        )}
      </div>

      {showModal && <ProfileModal user={modalUser} onClose={() => setShowModal(false)} />}
    </>
  );
}
