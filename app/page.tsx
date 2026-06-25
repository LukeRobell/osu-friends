'use client';

import { signIn, signOut, useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

// Swap this path once the compressed file is in /public
const VIDEO_SRC = '/osufriendshome.mp4';

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
        .then((r) => r.json())
        .then((d) => console.log('[seed] result:', d))
        .catch(console.error);
    }
  }, [session]);

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    if (isMuted) {
      video.muted = false;
      video.volume = volume / 100;
    } else {
      video.muted = true;
    }
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (v: number) => {
    setVolume(v);
    if (videoRef.current) videoRef.current.volume = v / 100;
  };

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
      <div className="fixed inset-0 -z-10 overflow-hidden bg-gray-950">
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src={VIDEO_SRC} type="video/mp4" />
        </video>
        {/* Dim overlay — matches app bg-gray-950 (#030712) */}
        <div className="absolute inset-0 bg-gray-950/75" />
      </div>

      <MuteButton isMuted={isMuted} volume={volume} onToggle={toggleMute} onVolumeChange={handleVolumeChange} />

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
