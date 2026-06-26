'use client';

import { useEffect, useRef, useState } from 'react';

const LANGUAGES: { name: string; flag: string }[] = [
  { name: 'English',    flag: '🇬🇧' },
  { name: 'Japanese',   flag: '🇯🇵' },
  { name: 'Korean',     flag: '🇰🇷' },
  { name: 'Chinese',    flag: '🇨🇳' },
  { name: 'Portuguese', flag: '🇧🇷' },
  { name: 'Russian',    flag: '🇷🇺' },
  { name: 'Spanish',    flag: '🇪🇸' },
  { name: 'French',     flag: '🇫🇷' },
  { name: 'German',     flag: '🇩🇪' },
  { name: 'Polish',     flag: '🇵🇱' },
  { name: 'Indonesian', flag: '🇮🇩' },
  { name: 'Thai',       flag: '🇹🇭' },
  { name: 'Vietnamese', flag: '🇻🇳' },
  { name: 'Turkish',    flag: '🇹🇷' },
  { name: 'Arabic',     flag: '🇸🇦' },
  { name: 'Italian',    flag: '🇮🇹' },
  { name: 'Dutch',      flag: '🇳🇱' },
  { name: 'Swedish',    flag: '🇸🇪' },
  { name: 'Finnish',    flag: '🇫🇮' },
  { name: 'Norwegian',  flag: '🇳🇴' },
  { name: 'Filipino',   flag: '🇵🇭' },
  { name: 'Malay',      flag: '🇲🇾' },
];

const flagMap = Object.fromEntries(LANGUAGES.map(l => [l.name, l.flag]));

export default function LanguagePicker({ initial }: { initial: string[] }) {
  const [selected, setSelected] = useState<string[]>(initial);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function toggle(lang: string) {
    setSelected(s => s.includes(lang) ? s.filter(x => x !== lang) : [...s, lang]);
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
    setOpen(false);
  }

  return (
    <div className="mt-5" ref={ref}>
      <div className="flex items-center gap-2 flex-wrap">
        <p className="text-gray-400 text-sm shrink-0">Languages</p>

        {/* Selected chips */}
        {selected.map(lang => (
          <button
            key={lang}
            onClick={() => toggle(lang)}
            title="Click to remove"
            className="flex items-center gap-1 px-2 py-0.5 bg-pink-500/15 border border-pink-500/30 text-pink-300 rounded-full text-xs hover:bg-pink-500/25 transition-colors"
          >
            <span>{flagMap[lang] ?? ''}</span>
            <span>{lang}</span>
            <span className="text-pink-400/60 ml-0.5">×</span>
          </button>
        ))}

        {/* Add button */}
        <div className="relative">
          <button
            onClick={() => setOpen(o => !o)}
            className="flex items-center gap-1 px-2 py-0.5 border border-white/10 text-gray-500 hover:text-white hover:border-white/20 rounded-full text-xs transition-colors"
          >
            <span>+</span>
            <span>{selected.length === 0 ? 'Add language' : 'Edit'}</span>
          </button>

          {open && (
            <div className="absolute left-0 top-full mt-1.5 w-56 bg-gray-900 border border-white/10 rounded-xl shadow-2xl z-20 p-2 flex flex-col max-h-72">
              <div className="grid grid-cols-1 gap-0.5 overflow-y-auto flex-1 min-h-0">
                {LANGUAGES.map(l => (
                  <button
                    key={l.name}
                    onClick={() => toggle(l.name)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-left transition-colors ${
                      selected.includes(l.name)
                        ? 'bg-pink-500/20 text-pink-300'
                        : 'text-gray-400 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <span className="text-base">{l.flag}</span>
                    <span>{l.name}</span>
                    {selected.includes(l.name) && <span className="ml-auto text-pink-400 text-xs">✓</span>}
                  </button>
                ))}
              </div>
              <div className="border-t border-white/10 mt-2 pt-2">
                <button
                  onClick={save}
                  disabled={saving}
                  className="w-full py-1.5 bg-pink-500 hover:bg-pink-600 disabled:opacity-40 rounded-lg text-sm font-medium transition-colors"
                >
                  {saving ? 'Saving...' : saved ? 'Saved ✓' : 'Save'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
