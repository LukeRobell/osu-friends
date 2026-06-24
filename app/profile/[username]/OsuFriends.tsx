import { getAccessToken } from '@/lib/auth-server';
import { fetchFriends, fetchActiveRooms } from '@/lib/osu-api';
import { prisma } from '@/lib/prisma';
import OsuFriendCard, { OsuFriendData } from '@/components/OsuFriendCard';

export default async function OsuFriends() {
  const accessToken = await getAccessToken();
  if (!accessToken) return null;

  const [friends, rooms] = await Promise.all([
    fetchFriends(accessToken).catch(() => []),
    fetchActiveRooms(50).catch(() => []),
  ]);

  if (friends.length === 0) return null;

  const friendIds = friends.map(f => f.id);
  const dbUsers = await prisma.user.findMany({
    where: { osuId: { in: friendIds }, isRegistered: true },
    select: {
      osuId: true,
      pp: true,
      globalRank: true,
      countryRank: true,
      countryCode: true,
      preferredModes: true,
      teamId: true,
      teamName: true,
      teamTag: true,
      teamFlagUrl: true,
    },
  });

  if (dbUsers.length === 0) return null;

  const dbMap = new Map(dbUsers.map(u => [u.osuId, u]));

  const participantRoomMap = new Map<number, { id: number; name: string }>();
  for (const room of rooms) {
    for (const p of (room.recent_participants ?? [])) {
      participantRoomMap.set(p.id as number, { id: room.id as number, name: room.name as string });
    }
  }

  const friendsOnApp: OsuFriendData[] = friends
    .filter(f => dbMap.has(f.id))
    .map(f => {
      const db = dbMap.get(f.id)!;
      return {
        osuId: f.id,
        username: f.username,
        avatarUrl: f.avatarUrl,
        pp: db.pp,
        globalRank: db.globalRank,
        countryRank: db.countryRank,
        countryCode: db.countryCode,
        preferredModes: db.preferredModes,
        teamId: db.teamId,
        teamName: db.teamName,
        teamTag: db.teamTag,
        teamFlagUrl: db.teamFlagUrl,
        inRoom: participantRoomMap.get(f.id) ?? null,
      };
    })
    .sort((a, b) => (b.inRoom ? 1 : 0) - (a.inRoom ? 1 : 0));

  if (friendsOnApp.length === 0) return null;

  return (
    <div className="mt-8">
      <p className="text-gray-400 text-sm mb-3">
        osu! friends on osu!friends
        <span className="ml-2 text-gray-500 text-xs">({friendsOnApp.length})</span>
      </p>
      <div className="flex flex-col gap-2">
        {friendsOnApp.map(friend => (
          <OsuFriendCard key={friend.osuId} friend={friend} />
        ))}
      </div>
    </div>
  );
}
