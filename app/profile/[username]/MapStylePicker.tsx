'use client';

import { useState } from 'react';

const ALL_STYLES = [
  'Jumps', 'Streams', 'Tech / Precision', 'High BPM', 'Aim training',
  'Speed maps', 'Farm maps', 'Sight-reading',
  'Metal / Rock', 'Electronic / Techno', 'Anime / Weeb', 'No anime please',
  'Loved / Unranked', 'Doubles',
];

interface Props {
  initial: string[];
  isOwn: boolean;
}

export default function MapStylePicker({ initial, isOwn }: Props) {
  const [selected, setSelected] = useState<string[]>(initial);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function toggle(style: string) {
    setSelected(s => s.includes(style) ? s.filter(x => x !== style) : [...s, style]);
    setSaved(false);
  }

  async function save() {
    setSaving(true);
    const res = await fetch('/api/user/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mapStyles: selected }),
    });
    setSaving(false);
    if (res.ok) { setSaved(true); setEditing(false); }
  }

  if (!isOwn && selected.length === 0) return null;

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-2">
        <p className="text-gray-400 text-sm">Preferred maps</p>
        {isOwn && !editing && (
          <button
            onClick={() => { setEditing(true); setSaved(false); }}
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            {selected.length > 0 ? 'Edit' : '+ Add'}
          </button>
        )}
      </div>

      {editing ? (
        <div>
          <div className="flex flex-wrap gap-2">
            {ALL_STYLES.map(style => (
              <button
                key={style}
                onClick={() => toggle(style)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  selected.includes(style)
                    ? 'bg-pink-500/20 border border-pink-500/40 text-pink-300'
                    : 'bg-gray-800 border border-transparent text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                {style}
              </button>
            ))}
          </div>
          <div className="flex justify-end gap-2 mt-3">
            <button
              onClick={() => { setEditing(false); setSelected(initial); }}
              className="px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="px-4 py-1.5 bg-pink-500 hover:bg-pink-600 disabled:opacity-40 rounded-lg text-sm font-medium transition-colors"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      ) : selected.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {selected.map(style => (
            <span
              key={style}
              className="px-3 py-1 bg-gray-800 border border-white/10 text-gray-300 rounded-full text-sm"
            >
              {style}
            </span>
          ))}
        </div>
      ) : isOwn ? (
        <p className="text-gray-600 text-sm italic">No map styles set — click Edit to add some.</p>
      ) : null}

      {saved && !editing && (
        <p className="text-xs text-green-400 mt-1">Saved ✓</p>
      )}
    </div>
  );
}
