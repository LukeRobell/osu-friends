import Image from 'next/image';
import AskToJoinButton from './AskToJoinButton';

export interface OsuFriendData {
  osuId: number;
  username: string;
  avatarUrl: string;
  pp: number | null;
  globalRank: number | null;
  inRoom: { id: number; name: string } | null;
}

export default function OsuFriendCard({ friend }: { friend: OsuFriendData }) {
  return (
    <div className="bg-gray-800 rounded-xl p-3 flex items-center gap-3">
      <Image
        src={friend.avatarUrl}
        alt={friend.username}
        width={44}
        height={44}
        className="rounded-full flex-shrink-0"
      />
      <div className="min-w-0 flex-1">
        <p className="font-medium text-sm truncate">{friend.username}</p>
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
  );
}
