import Image from 'next/image';
import AskToJoinButton from './AskToJoinButton';

export interface ProcessedRoom {
  id: number;
  name: string;
  participantCount: number;
  host: { id: number; username: string } | null;
  recentParticipants: { id: number; username: string; avatarUrl: string; isOsufriend: boolean }[];
  currentBeatmap: {
    title: string;
    artist: string;
    version: string;
    stars: number | null;
    coverUrl: string;
  } | null;
  avgAccountPp: number | null;
  starDiff: number;
}

export default function LiveLobbyCard({ room, canSendDm }: { room: ProcessedRoom; canSendDm: boolean }) {
  const friendsInRoom = room.recentParticipants.filter(p => p.isOsufriend);

  return (
    <div className="bg-gray-900 rounded-xl overflow-hidden">
      {/* Beatmap cover strip */}
      <div className="relative h-16 overflow-hidden bg-gray-800">
        {room.currentBeatmap?.coverUrl && (
          <Image
            src={room.currentBeatmap.coverUrl}
            alt={room.currentBeatmap.title}
            fill
            className="object-cover opacity-30"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        )}
        <div className="absolute inset-0 flex items-center justify-between px-3">
          <div className="min-w-0 flex-1">
            {room.currentBeatmap ? (
              <>
                <p className="text-xs text-gray-200 truncate leading-tight">
                  {room.currentBeatmap.artist} — {room.currentBeatmap.title}
                </p>
                <p className="text-xs text-purple-400 truncate">[{room.currentBeatmap.version}]</p>
              </>
            ) : (
              <p className="text-xs text-gray-500">No map selected</p>
            )}
          </div>
          {room.currentBeatmap?.stars != null && (
            <span className="ml-2 flex-shrink-0 text-sm font-bold text-yellow-400">
              {room.currentBeatmap.stars.toFixed(1)}★
            </span>
          )}
        </div>
      </div>

      <div className="p-3">
        <p className="font-medium text-sm truncate mb-2" title={room.name}>
          {room.name}
        </p>

        {/* Participant avatars — osufriends get pink ring */}
        <div className="flex items-center gap-2 mb-2.5">
          <div className="flex -space-x-1.5">
            {room.recentParticipants.slice(0, 6).map(p => (
              <div
                key={p.id}
                title={p.username}
                className={`rounded-full ring-2 ${p.isOsufriend ? 'ring-pink-500' : 'ring-gray-700'}`}
              >
                <Image
                  src={p.avatarUrl}
                  alt={p.username}
                  width={22}
                  height={22}
                  className="rounded-full"
                />
              </div>
            ))}
          </div>
          {friendsInRoom.length > 0 && (
            <span className="text-xs text-pink-300">
              {friendsInRoom.length} friend{friendsInRoom.length !== 1 ? 's' : ''} here
            </span>
          )}
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">{room.participantCount} players</span>
          <div className="flex items-center gap-3">
            {canSendDm && room.host && (
              <AskToJoinButton
                targetId={room.host.id}
                targetUsername={room.host.username}
                roomName={room.name}
                variant="host"
              />
            )}
            <a
              href={`https://osu.ppy.sh/multiplayer/rooms/${room.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium text-pink-400 hover:text-pink-300 transition-colors"
            >
              View →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
