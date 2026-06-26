'use client';

import { useState } from 'react';

const LANGUAGES = [
  'English', 'Japanese', 'Korean', 'Chinese', 'Portuguese', 'Russian',
  'Spanish', 'French', 'German', 'Polish', 'Indonesian', 'Thai',
  'Vietnamese', 'Turkish', 'Arabic', 'Italian', 'Dutch', 'Swedish',
  'Finnish', 'Norwegian', 'Filipino', 'Malay',
];

export default function LanguagePicker({ initial }: { initial: string[] }) {
  const [selected, setSelected] = useState<string[]>(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function toggle(lang: string) {
    setSelected(s =>
      s.includes(lang) ? s.filter(x => x !== lang) : [...s, lang]
    );
    setSaved(false);
  }

  async function save() {
    setSaving(true);
    await fetch('/api/user/languages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ languages: selected }),
    });
    setSaving(false);
    setSaved(true);
  }

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-3">
        <p className="text-gray-400 text-sm">Languages</p>
        <button
          onClick={save}
          disabled={saving}
          className="text-xs text-pink-400 hover:text-pink-300 disabled:opacity-40 transition-colors"
        >
          {saving ? 'Saving...' : saved ? 'Saved ✓' : 'Save'}
        </button>
      </div>
      <div className="flex gap-2 flex-wrap">
        {LANGUAGES.map(lang => (
          <button
            key={lang}
            type="button"
            onClick={() => toggle(lang)}
            className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors ${
              selected.includes(lang)
                ? 'bg-pink-500/20 border-pink-500/50 text-pink-300'
                : 'border-white/10 text-gray-500 hover:text-white'
            }`}
          >
            {lang}
          </button>
        ))}
      </div>
    </div>
  );
}
