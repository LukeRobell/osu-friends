'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { countryFlagUrl } from '@/lib/osu-api';

const LANGUAGES: { name: string; code: string }[] = [
  { name: 'English',    code: 'GB' },
  { name: 'Japanese',   code: 'JP' },
  { name: 'Korean',     code: 'KR' },
  { name: 'Chinese',    code: 'CN' },
  { name: 'Portuguese', code: 'BR' },
  { name: 'Russian',    code: 'RU' },
  { name: 'Spanish',    code: 'ES' },
  { name: 'French',     code: 'FR' },
  { name: 'German',     code: 'DE' },
  { name: 'Polish',     code: 'PL' },
  { name: 'Indonesian', code: 'ID' },
  { name: 'Thai',       code: 'TH' },
  { name: 'Vietnamese', code: 'VN' },
  { name: 'Turkish',    code: 'TR' },
  { name: 'Arabic',     code: 'SA' },
  { name: 'Italian',    code: 'IT' },
  { name: 'Dutch',      code: 'NL' },
  { name: 'Swedish',    code: 'SE' },
  { name: 'Finnish',    code: 'FI' },
  { name: 'Norwegian',  code: 'NO' },
  { name: 'Filipino',   code: 'PH' },
  { name: 'Malay',      code: 'MY' },
];

interface Props {
  value: string;
  onChange: (lang: string) => void;
}

export default function LanguageSelect({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const selected = LANGUAGES.find(l => l.name === value);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-2 bg-gray-800 border rounded-lg px-3 py-1.5 text-sm focus:outline-none transition-colors ${
          value ? 'border-pink-500/50 text-pink-400' : 'border-transparent text-gray-400 hover:text-white'
        }`}
      >
        {selected ? (
          <Image src={countryFlagUrl(selected.code)} alt={selected.code} width={16} height={12} className="rounded-sm" unoptimized />
        ) : (
          <span>💬</span>
        )}
        <span>{selected ? selected.name : 'Any language'}</span>
        <svg className="w-3 h-3 opacity-50 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1.5 w-48 bg-gray-900 border border-white/10 rounded-xl shadow-2xl z-20 overflow-hidden">
          <div className="overflow-y-scroll p-1.5" style={{ maxHeight: '280px' }}>
            <button
              onClick={() => { onChange(''); setOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-sm text-left transition-colors ${
                !value ? 'bg-pink-500/20 text-pink-300' : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <span>💬</span>
              <span>Any language</span>
              {!value && <span className="ml-auto text-pink-400 text-xs">✓</span>}
            </button>
            {LANGUAGES.map(l => (
              <button
                key={l.name}
                onClick={() => { onChange(l.name); setOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-sm text-left transition-colors ${
                  value === l.name ? 'bg-pink-500/20 text-pink-300' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Image src={countryFlagUrl(l.code)} alt={l.code} width={18} height={13} className="rounded-sm shrink-0" unoptimized />
                <span>{l.name}</span>
                {value === l.name && <span className="ml-auto text-pink-400 text-xs">✓</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
