'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';

declare global {
  interface Window {
    Twitch?: {
      ext: {
        onAuthorized: (cb: (auth: { token: string }) => void) => void;
        configuration: {
          broadcaster?: { version: string; content: string };
          set: (segment: string, version: string, content: string) => void;
          onChanged: (cb: () => void) => void;
        };
      };
    };
  }
}

export default function TwitchConfig() {
  const [username, setUsername] = useState('');
  const [saved, setSaved] = useState(false);
  const [ready, setReady] = useState(false);

  // Script is loaded via <Script strategy="beforeInteractive"> so window.Twitch.ext
  // is available synchronously before this effect runs
  useEffect(() => {
    const tryReadConfig = () => {
      const raw = window.Twitch?.ext?.configuration?.broadcaster?.content;
      if (raw) {
        try { setUsername(JSON.parse(raw).username ?? ''); } catch {}
      }
    };
    tryReadConfig();
    window.Twitch?.ext?.configuration?.onChanged(tryReadConfig);
    window.Twitch?.ext?.onAuthorized(tryReadConfig);
    setReady(true);
  }, []);

  function save() {
    if (!username.trim()) return;
    window.Twitch?.ext?.configuration?.set('broadcaster', '1', JSON.stringify({ username: username.trim() }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <>
    <Script src="https://extension-files.twitch.tv/helper/v1/twitch-ext.min.js" strategy="beforeInteractive" />
    <div style={{ backgroundColor: '#0d0d12', minHeight: '100vh', padding: 20, fontFamily: 'sans-serif', color: 'white' }}>
      <div style={{ maxWidth: 340 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <span style={{ color: '#ec4899', fontSize: 18 }}>⚔</span>
          <span style={{ fontSize: 15, fontWeight: 600, color: '#f3f4f6' }}>osu!friends configuration</span>
        </div>

        <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 16, lineHeight: 1.5 }}>
          Enter your osu!friends username to show your rival cards in the Twitch panel.
        </p>

        <label style={{ fontSize: 11, color: '#9ca3af', display: 'block', marginBottom: 6 }}>
          osu!friends username
        </label>
        <input
          type="text"
          value={username}
          onChange={e => { setUsername(e.target.value); setSaved(false); }}
          placeholder="your username"
          disabled={!ready}
          style={{
            width: '100%',
            padding: '8px 12px',
            backgroundColor: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8,
            color: '#f3f4f6',
            fontSize: 13,
            outline: 'none',
            boxSizing: 'border-box',
          }}
          onKeyDown={e => { if (e.key === 'Enter') save(); }}
        />

        <button
          onClick={save}
          disabled={!ready || !username.trim()}
          style={{
            marginTop: 12,
            width: '100%',
            padding: '9px 0',
            backgroundColor: saved ? '#059669' : '#ec4899',
            border: 'none',
            borderRadius: 8,
            color: 'white',
            fontSize: 13,
            fontWeight: 600,
            cursor: ready && username.trim() ? 'pointer' : 'not-allowed',
            opacity: !ready || !username.trim() ? 0.5 : 1,
            transition: 'background-color 0.2s',
          }}
        >
          {saved ? 'Saved!' : 'Save'}
        </button>

        {!ready && (
          <p style={{ fontSize: 11, color: '#4b5563', marginTop: 12, textAlign: 'center' }}>
            Loading Twitch context…
          </p>
        )}
      </div>
    </div>
    </>
  );
}
