'use client';

import React from 'react';
import { signIn, useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import RecentMembersFeed from '@/components/RecentMembersFeed';

const VIDEO_SRC = '/osufriendshome.mp4';

const FOUNDERS = [
  {
    name: 'Luke',
    osuUsername: 'Sinzuna',
    osuUrl: 'https://osu.ppy.sh/users/4639609',
    avatar: 'https://a.ppy.sh/4639609',
    twitchUrl: 'https://www.twitch.tv/innergrind',
    twitchHandle: 'innergrind',
  },
  {
    name: 'Melvin',
    osuUsername: 'Merutaa',
    osuUrl: 'https://osu.ppy.sh/users/6683351',
    avatar: 'https://a.ppy.sh/6683351',
    twitchUrl: 'https://www.twitch.tv/merutaa',
    twitchHandle: 'merutaa',
  },
];

const FEATURES: { title: string; body: string; icon: React.ReactNode; highlight?: boolean }[] = [
  {
    title: 'Skill-matched players',
    body: 'We use your average top-play pp — not account pp — to find players within ±15% of your skill level.',
    icon: (
      <svg className="w-6 h-6 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    title: 'Live lobby finder',
    body: 'Browse real-time multiplayer rooms filtered to your star rating, with skill-matched hosts surfaced to the top.',
    icon: (
      <svg className="w-6 h-6 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728M12 12h.01M8.464 15.536a5 5 0 010-7.072m7.072 0a5 5 0 010 7.072" />
      </svg>
    ),
  },
  {
    title: 'Rival system & snipes',
    body: 'Pick up to 3 rivals and choose your mode — osu!, Taiko, Catch, or Mania. When one of them posts a significant play, you get an osu! in-game DM and 7 days to beat their score. Head-to-head cards on your profile track rank, pp, and monthly snipes. Top snipers climb a monthly leaderboard.',
    icon: (
      <svg className="w-6 h-6 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" />
      </svg>
    ),
    highlight: true,
  },
  {
    title: '4v4 tournaments',
    body: 'Opt in and get auto-matched with 7 players at your level for a daily 4v4 tournament. Scheduling is handled for you.',
    icon: (
      <svg className="w-6 h-6 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
      </svg>
    ),
  },
];

const STEPS = [
  {
    n: '01',
    title: 'Sign in with osu!',
    body: 'One click. We read your rank, pp, and preferred mode from the osu! API — nothing to fill out.',
  },
  {
    n: '02',
    title: 'See players at your level',
    body: 'Your feed instantly shows members within ±15% of your skill, online first. Live lobbies at your star rating appear above.',
  },
  {
    n: '03',
    title: 'Play together',
    body: 'Join a lobby, DM the host, or challenge up to 3 rivals. When a rival posts a big play you get an osu! DM — beat their score within 7 days to snipe them. Opt into a daily 4v4 tournament and let us handle the scheduling.',
  },
];

interface MuteButtonProps {
  isMuted: boolean;
  volume: number;
  onToggle: () => void;
  onVolumeChange: (v: number) => void;
}

function MuteButton({ isMuted, volume, onToggle, onVolumeChange }: MuteButtonProps) {
  const trackStyle = {
    background: `linear-gradient(to right, #ec4899 ${volume}%, rgba(255,255,255,0.15) ${volume}%)`,
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-3 py-2.5 bg-gray-900/70 hover:bg-gray-900/90 backdrop-blur-md border border-white/10 hover:border-pink-500/50 rounded-full transition-all duration-300 group">
      <button onClick={onToggle} className="flex-shrink-0 focus:outline-none">
        <svg viewBox="0 0 24 24" className="w-5 h-5 text-gray-300 group-hover:text-pink-400 transition-colors duration-300" fill="currentColor">
          <path d="M13 3.586L7.707 8H4a1 1 0 00-1 1v6a1 1 0 001 1h3.707L13 20.414V3.586z" />
          {isMuted && (
            <path d="M16.293 9.293a1 1 0 011.414 1.414L16.414 12l1.293 1.293a1 1 0 01-1.414 1.414L15 13.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 12l-1.293-1.293a1 1 0 011.414-1.414L15 10.586l1.293-1.293z" />
          )}
        </svg>
      </button>
      {!isMuted && (
        <>
          <input
            type="range"
            min={0}
            max={100}
            value={volume}
            onChange={e => onVolumeChange(Number(e.target.value))}
            className="volume-slider w-20"
            style={trackStyle}
          />
          <div className="flex items-end gap-0.5 h-3.5 pr-0.5">
            <span className="w-[3px] rounded-full bg-pink-400" style={{ height: '40%', animation: 'volumeBar 0.9s ease-in-out infinite 0s', opacity: volume / 100 }} />
            <span className="w-[3px] rounded-full bg-pink-400" style={{ height: '70%', animation: 'volumeBar 0.9s ease-in-out infinite 0.2s', opacity: volume / 100 }} />
            <span className="w-[3px] rounded-full bg-pink-400" style={{ height: '50%', animation: 'volumeBar 0.9s ease-in-out infinite 0.1s', opacity: volume / 100 }} />
          </div>
        </>
      )}
    </div>
  );
}

export default function Home() {
  const { data: session, status } = useSession();
  const seeded = useRef(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [volume, setVolume] = useState(80);

  useEffect(() => {
    if (session?.user?.globalRank && !seeded.current) {
      seeded.current = true;
      fetch('/api/seed', { method: 'POST' })
        .then(r => r.json())
        .then(d => console.log('[seed]', d))
        .catch(console.error);
    }
  }, [session]);

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    if (isMuted) { video.muted = false; video.volume = volume / 100; }
    else { video.muted = true; }
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (v: number) => {
    setVolume(v);
    if (videoRef.current) videoRef.current.volume = v / 100;
  };

  return (
    <>
      <MuteButton isMuted={isMuted} volume={volume} onToggle={toggleMute} onVolumeChange={handleVolumeChange} />
      <RecentMembersFeed />

      {/* ── HERO ───────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center gap-8 px-4 text-center overflow-hidden pb-32">
        {/* Video background — scoped to hero only */}
        <div className="absolute inset-0 bg-gray-950">
          <video ref={videoRef} autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover">
            <source src={VIDEO_SRC} type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gray-950/75" />
        </div>

        <div className="relative z-10">
          {/* Wordmark: icon + text side-by-side, matching original logo layout */}
          <div className="flex items-center justify-center gap-5 mb-6">
            <Image src="/osufriends-icon.svg" alt="osu!friends" width={140} height={140} priority />
            <h1 className="text-6xl sm:text-8xl font-black leading-none" style={{ fontFamily: 'var(--font-nunito)' }}>
              <span className="text-pink-400">osu!</span><span className="text-white">friends</span>
            </h1>
          </div>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Find your people. Let&apos;s build the community this game deserves.
          </p>
        </div>

        <div className="relative z-10 mt-6">
        {status !== 'loading' && (
          session ? (
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center gap-3">
                {session.user.avatarUrl && (
                  <Image src={session.user.avatarUrl} alt={session.user.username} width={44} height={44} className="rounded-full" />
                )}
                <div className="text-left">
                  <p className="text-white font-semibold">{session.user.username}</p>
                  <p className="text-gray-400 text-sm">
                    {session.user.globalRank ? `#${session.user.globalRank.toLocaleString()}` : 'Unranked'}
                    {session.user.countryCode ? ` · ${session.user.countryCode}` : ''}
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <Link href={`/profile/${encodeURIComponent(session.user.username)}`} className="px-6 py-2.5 border border-pink-500 text-pink-400 hover:bg-pink-500/10 rounded-full font-medium transition-colors">
                  My Profile
                </Link>
                <a
                  href="https://discord.gg/cmUedUxJWU"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-6 py-2.5 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 rounded-full font-medium transition-colors"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                  </svg>
                  Join the Discord
                </a>
              </div>
            </div>
          ) : (
            <button
              onClick={() => signIn('osu')}
              className="px-10 py-3.5 border-2 border-pink-500 text-pink-400 hover:bg-pink-500/10 rounded-full font-semibold text-lg transition-colors"
            >
              Sign in with osu!
            </button>
          )
        )}
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-gray-600 text-xs z-10">
          <svg className="w-5 h-5 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </section>

      {/* ── FEATURES ───────────────────────────────────── */}
      <section className="bg-gray-950 py-28 px-4 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-bold text-white mb-3">The game looks simple. The community isn&apos;t.</h2>
            <p className="text-gray-400 text-lg max-w-xl mx-auto">
              osu! already has everything a great community needs. We built the infrastructure to make it happen.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className={`bg-gray-900/60 backdrop-blur-sm border rounded-2xl p-6 transition-all duration-300 group relative ${
                  f.highlight
                    ? 'border-pink-500/40 hover:border-pink-500/70'
                    : 'border-white/10 hover:border-pink-500/30'
                }`}
              >
                {f.highlight && (
                  <span className="absolute top-4 right-4 text-xs font-medium text-pink-400 bg-pink-500/10 border border-pink-500/20 px-2.5 py-0.5 rounded-full">
                    Updated
                  </span>
                )}
                <div className="mb-4">{f.icon}</div>
                <h3 className="text-lg font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ───────────────────────────────── */}
      <section className="bg-gray-950 py-28 px-4 border-t border-white/5">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-3">Get started in 30 seconds</h2>
            <p className="text-gray-400 text-lg">Your osu! account is all you need</p>
          </div>
          <div className="flex flex-col gap-12">
            {STEPS.map((s) => (
              <div key={s.n} className="flex gap-8 items-start">
                <span className="text-5xl font-bold text-white/10 leading-none min-w-[64px] text-right tabular-nums">{s.n}</span>
                <div className="pt-1">
                  <h3 className="text-xl font-semibold text-white mb-2">{s.title}</h3>
                  <p className="text-gray-400 leading-relaxed">{s.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOUNDERS ───────────────────────────────────── */}
      <section className="bg-gray-950 py-28 px-4 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-bold text-white mb-3">Meet the co-founders</h2>
          </div>

          {/* Founders photo */}
          <div className="relative w-full max-w-2xl mx-auto mb-10 rounded-3xl overflow-hidden border border-white/10">
            <Image
              src="/founders.png"
              alt="Luke and Melvin"
              width={800}
              height={500}
              className="w-full object-cover"
              priority
            />
          </div>

          {/* Story */}
          <p className="text-gray-300 text-lg text-center max-w-2xl mx-auto mb-12 leading-relaxed">
            It sounds ridiculous from the outside. Two guys ended up in the same osu! lobby in the summer of 2015,
            started hopping on Skype calls to play together, and somehow became best friends. They built a whole
            circle of people they&apos;d never met in real life — and finally, in 2021, they did.
            If you&apos;ve played osu!, you already know this story. The community runs deeper than anyone outside
            it can believe. osu!friends exists to make that the rule, not the lucky exception.
          </p>

          {/* Founder cards */}
          <div className="flex justify-center gap-5 flex-wrap">
            {FOUNDERS.map((f) => (
              <div
                key={f.name}
                className="flex items-center gap-4 bg-gray-900/60 backdrop-blur-sm border border-white/10 rounded-2xl px-6 py-4 hover:border-pink-500/30 transition-all duration-300"
              >
                <Image
                  src={f.avatar}
                  alt={f.osuUsername}
                  width={52}
                  height={52}
                  className="rounded-full"
                  unoptimized
                />
                <div>
                  <p className="font-semibold text-white">{f.name}</p>
                  <p className="text-sm text-gray-400 mb-2">{f.osuUsername}</p>
                  <div className="flex gap-3">
                    <a
                      href={f.osuUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-pink-400 hover:text-pink-300 transition-colors font-medium"
                    >
                      osu! ↗
                    </a>
                    <a
                      href={f.twitchUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-purple-400 hover:text-purple-300 transition-colors font-medium"
                    >
                      Twitch ↗
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────── */}
      <section className="bg-gray-950 py-32 px-4 border-t border-white/5 text-center">
        <div className="max-w-lg mx-auto">
          <h2 className="text-4xl font-bold text-white mb-4">Ready to find your people?</h2>
          <p className="text-gray-400 text-lg mb-10">The community is already here. Come play.</p>
          {status !== 'loading' && (
            session ? (
              <Link
                href="/discover"
                className="inline-block px-12 py-4 bg-pink-500 hover:bg-pink-600 rounded-full font-semibold text-xl transition-colors shadow-lg shadow-pink-500/20"
              >
                Go to Discover →
              </Link>
            ) : (
              <button
                onClick={() => signIn('osu')}
                className="px-12 py-4 bg-pink-500 hover:bg-pink-600 rounded-full font-semibold text-xl transition-colors shadow-lg shadow-pink-500/20"
              >
                Sign in with osu!
              </button>
            )
          )}
        </div>
      </section>
    </>
  );
}
