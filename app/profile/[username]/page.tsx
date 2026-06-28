import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import SyncButton from '@/components/SyncButton';
import TournamentOptIn from '@/components/TournamentOptIn';
import TeamBadge from '@/components/TeamBadge';
import RivalButton from '@/components/RivalButton';
import OsuFriends from './OsuFriends';
import RivalSection from './RivalSection';
import LanguagePicker from './LanguagePicker';
import AboutMeSection from './AboutMeSection';
import MapStylePicker from './MapStylePicker';
import PlaySchedulePicker from './PlaySchedulePicker';
import SocialLinks from './SocialLinks';
import DiscordCopyButton from './DiscordCopyButton';
import ProfileStats from './ProfileStats';

const LANG_CODE: Record<string, string> = {
  English: 'GB', Japanese: 'JP', Korean: 'KR', Chinese: 'CN',
  Portuguese: 'BR', Russian: 'RU', Spanish: 'ES', French: 'FR',
  German: 'DE', Polish: 'PL', Indonesian: 'ID', Thai: 'TH',
  Vietnamese: 'VN', Turkish: 'TR', Arabic: 'SA', Italian: 'IT',
  Dutch: 'NL', Swedish: 'SE', Finnish: 'FI', Norwegian: 'NO',
  Filipino: 'PH', Malay: 'MY',
};
import { countryFlagUrl } from '@/lib/osu-api';

interface Props {
  params: { username: string };
}

export default async function ProfilePage({ params }: Props) {
  // osu! treats spaces and underscores as equivalent in usernames.
  // The /me and /friends APIs may return different formats, so try both.
  const decoded = decodeURIComponent(params.username);
  const alt = decoded.includes(' ') ? decoded.replace(/ /g, '_') : decoded.replace(/_/g, ' ');

  const [user, session] = await Promise.all([
    prisma.user.findFirst({
      where: { username: { in: [decoded, alt], mode: 'insensitive' } },
    }),
    getServerSession(authOptions),
  ]);

  // Logged-in user visiting their own profile but not yet in the DB — show a recovery page
  if (!user) {
    const isOwn = session?.user?.username?.toLowerCase() === decoded.toLowerCase();
    if (isOwn) {
      return (
        <main className="min-h-screen flex items-center justify-center px-4">
          <div className="text-center max-w-sm">
            <p className="text-2xl font-bold mb-2">Setting up your profile...</p>
            <p className="text-gray-400 text-sm mb-6">
              Your account wasn&apos;t saved correctly on sign-in. Click below to fix it.
            </p>
            <SyncButton />
            <p className="text-gray-600 text-xs mt-4">
              If that doesn&apos;t work, sign out and sign back in.
            </p>
          </div>
        </main>
      );
    }
    notFound();
  }

  const isOwnProfile = session?.user?.osuId === user.osuId;
  const isLoggedIn = !!session?.user;

  const modeLabels: Record<string, string> = {
    osu: 'osu!',
    taiko: 'Taiko',
    fruits: 'Catch',
    mania: 'Mania',
  };

  return (
    <main className="min-h-screen px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Link href="/discover" className="text-gray-400 hover:text-white text-sm transition-colors">
            ← back
          </Link>
          <div className="flex items-center gap-2">
            {isOwnProfile && <SyncButton />}
            <a
              href={`https://osu.ppy.sh/users/${user.osuId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-pink-500 hover:bg-pink-600 rounded-lg text-sm font-medium transition-colors"
            >
              View osu! profile ↗
            </a>
          </div>
        </div>

        <div className="bg-gray-900 rounded-2xl p-8">
          <div className="flex items-start gap-6 mb-8">
            <Image
              src={user.avatarUrl}
              alt={user.username}
              width={96}
              height={96}
              className="rounded-full flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold">{user.username}</h1>
                {/* Social quick-links in header */}
                <div className="flex items-center gap-1.5 ml-auto">
                  {(user as any).twitchUsername && (
                    <a
                      href={`https://twitch.tv/${(user as any).twitchUsername}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={`Watch ${user.username} on Twitch`}
                      className="p-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 transition-colors"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z" />
                      </svg>
                    </a>
                  )}
                  {(user as any).discordUsername && (
                    <DiscordCopyButton username={(user as any).discordUsername} />
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 mt-1">
                <div className="flex items-center gap-1.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={countryFlagUrl(user.countryCode)} alt={user.countryCode} width={20} height={14} className="rounded-sm" />
                  <span className="text-gray-400 text-sm">{user.countryCode}</span>
                </div>
                {user.teamId && user.teamTag && user.teamName && (
                  <TeamBadge
                    teamId={user.teamId}
                    teamTag={user.teamTag}
                    teamName={user.teamName}
                    teamFlagUrl={user.teamFlagUrl ?? null}
                  />
                )}
              </div>
              {!isOwnProfile && isLoggedIn && (
                <div className="mt-3">
                  <RivalButton targetOsuId={user.osuId} />
                </div>
              )}
            </div>
          </div>

          <ProfileStats
            preferredMode={user.preferredModes?.[0] ?? 'osu'}
            globalRank={user.globalRank}
            countryRank={user.countryRank ?? null}
            countryCode={user.countryCode}
            pp={user.pp ?? null}
            taikoGlobalRank={(user as any).taikoGlobalRank ?? null}
            taikoPp={(user as any).taikoPp ?? null}
            catchGlobalRank={(user as any).catchGlobalRank ?? null}
            catchPp={(user as any).catchPp ?? null}
            maniaGlobalRank={(user as any).maniaGlobalRank ?? null}
            maniaPp={(user as any).maniaPp ?? null}
          />

          {user.preferredModes.length > 0 && (
            <div>
              <p className="text-gray-400 text-sm mb-3">Preferred Modes</p>
              <div className="flex gap-2 flex-wrap">
                {user.preferredModes.map((mode: string) => (
                  <span
                    key={mode}
                    className="px-3 py-1 bg-pink-500/20 text-pink-300 rounded-full text-sm font-medium"
                  >
                    {modeLabels[mode] ?? mode}
                  </span>
                ))}
              </div>
            </div>
          )}

          <AboutMeSection initial={(user as any).aboutMe ?? null} isOwn={isOwnProfile} />
          <MapStylePicker initial={(user as any).mapStyles ?? []} isOwn={isOwnProfile} />
          <PlaySchedulePicker
            initial={(user as any).playSchedule ?? []}
            isOwn={isOwnProfile}
            ownerTimezone={(user as any).timezone ?? null}
          />
          <Suspense fallback={null}>
            <SocialLinks
              initialDiscord={(user as any).discordUsername ?? null}
              initialTwitch={(user as any).twitchUsername ?? null}
              isOwn={isOwnProfile}
            />
          </Suspense>

          {!isOwnProfile && user.languages?.length > 0 && (
            <div className="mt-6">
              <p className="text-gray-400 text-sm mb-2">Languages</p>
              <div className="flex gap-1.5 flex-wrap">
                {user.languages.map((lang: string) => {
                  const code = LANG_CODE[lang];
                  return (
                    <span key={lang} className="flex items-center gap-1.5 px-2 py-0.5 border border-white/10 text-gray-300 rounded-full text-xs">
                      {code && <Image src={countryFlagUrl(code)} alt={code} width={14} height={10} className="rounded-sm" unoptimized />}
                      <span>{lang}</span>
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {isOwnProfile && (
            <>
              <LanguagePicker initial={user.languages ?? []} />
              <TournamentOptIn initialValue={user.tournamentOptIn} />
              <Suspense fallback={null}>
                <RivalSection userId={user.id} />
              </Suspense>
              <Suspense fallback={null}>
                <OsuFriends />
              </Suspense>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
