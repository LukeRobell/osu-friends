'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const MODES = ['osu', 'taiko', 'catch', 'mania'];

interface Existing {
  description: string;
  isRecruiting: boolean;
  ppMin: number | null;
  ppMax: number | null;
  modes: string[];
  discordUrl: string | null;
}

interface Props {
  teamOsuId: string;
  teamName: string;
  teamTag: string;
  teamFlagUrl: string | null;
  existing: Existing | null;
}

export default function TeamForm({ teamOsuId, teamName, teamTag, teamFlagUrl, existing }: Props) {
  const router = useRouter();
  const [description, setDescription] = useState(existing?.description ?? '');
  const [isRecruiting, setIsRecruiting] = useState(existing?.isRecruiting ?? true);
  const [ppMin, setPpMin] = useState(existing?.ppMin != null ? String(existing.ppMin) : '');
  const [ppMax, setPpMax] = useState(existing?.ppMax != null ? String(existing.ppMax) : '');
  const [modes, setModes] = useState<string[]>(existing?.modes ?? ['osu']);
  const [discordUrl, setDiscordUrl] = useState(existing?.discordUrl ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function toggleMode(mode: string) {
    setModes(m => m.includes(mode) ? m.filter(x => x !== mode) : [...m, mode]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await fetch('/api/teams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        teamOsuId,
        teamName,
        teamTag,
        teamFlagUrl,
        description,
        isRecruiting,
        ppMin: ppMin ? Number(ppMin) : null,
        ppMax: ppMax ? Number(ppMax) : null,
        modes,
        discordUrl: discordUrl || null,
      }),
    });
    setLoading(false);
    if (res.ok) {
      router.push(`/teams/${encodeURIComponent(teamTag)}`);
    } else {
      const d = await res.json();
      setError(d.error ?? 'Something went wrong');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm text-gray-400 mb-1.5">About your team *</label>
        <textarea
          className="w-full bg-gray-900/60 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 resize-none focus:outline-none focus:border-pink-500/50"
          rows={5}
          placeholder="Describe your team — playstyle, goals, what you're looking for in members..."
          value={description}
          onChange={e => setDescription(e.target.value)}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1.5">Min PP (optional)</label>
          <input
            type="number"
            min="0"
            className="w-full bg-gray-900/60 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-pink-500/50"
            placeholder="e.g. 200"
            value={ppMin}
            onChange={e => setPpMin(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1.5">Max PP (optional)</label>
          <input
            type="number"
            min="0"
            className="w-full bg-gray-900/60 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-pink-500/50"
            placeholder="e.g. 600"
            value={ppMax}
            onChange={e => setPpMax(e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-2">Game modes</label>
        <div className="flex gap-2 flex-wrap">
          {MODES.map(mode => (
            <button
              key={mode}
              type="button"
              onClick={() => toggleMode(mode)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                modes.includes(mode)
                  ? 'bg-pink-500/20 border-pink-500/50 text-pink-400'
                  : 'border-white/10 text-gray-500 hover:text-white'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-1.5">Discord server URL (optional)</label>
        <input
          type="url"
          className="w-full bg-gray-900/60 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-pink-500/50"
          placeholder="https://discord.gg/..."
          value={discordUrl}
          onChange={e => setDiscordUrl(e.target.value)}
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setIsRecruiting(r => !r)}
          className={`relative w-10 h-6 rounded-full transition-colors ${isRecruiting ? 'bg-pink-500' : 'bg-gray-700'}`}
        >
          <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${isRecruiting ? 'translate-x-4' : ''}`} />
        </button>
        <span className="text-sm text-gray-300">Currently recruiting</span>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={loading || !description.trim()}
        className="w-full py-3 bg-pink-500 hover:bg-pink-600 disabled:opacity-40 rounded-full font-medium transition-colors"
      >
        {loading ? 'Saving...' : existing ? 'Save changes' : 'List my team'}
      </button>
    </form>
  );
}
