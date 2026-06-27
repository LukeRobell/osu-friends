'use client';

import CountrySelect from './CountrySelect';

export const LANGUAGES: { name: string; flag: string }[] = [
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


export interface Filters {
  q: string;
  mode: string;
  country: string;
  language: string;
  rankMin: string;
  rankMax: string;
  showAll: boolean;
}

interface Props {
  filters: Filters;
  onChange: (f: Filters) => void;
}

export default function DiscoverFilters({ filters, onChange }: Props) {
  function set(patch: Partial<Filters>) {
    onChange({ ...filters, ...patch });
  }

  const activeFilters = [filters.country, filters.language, filters.rankMin, filters.rankMax].filter(Boolean).length;

  return (
    <div className="space-y-3 mb-8">
      {/* Search bar */}
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
        </svg>
        <input
          type="text"
          placeholder="Search by username..."
          value={filters.q}
          onChange={e => set({ q: e.target.value })}
          className="w-full bg-gray-900/60 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-pink-500/50"
        />
      </div>

      {/* Filter row */}
      <div className="flex flex-wrap items-center gap-2">
        <CountrySelect value={filters.country} onChange={country => set({ country })} />

        <select
          value={filters.language}
          onChange={e => set({ language: e.target.value })}
          className={`bg-gray-800 border rounded-lg px-3 py-1.5 text-sm focus:outline-none ${
            filters.language ? 'border-pink-500/50 text-pink-400' : 'border-transparent text-gray-400'
          }`}
        >
          <option value="">💬 Any language</option>
          {LANGUAGES.map(l => (
            <option key={l.name} value={l.name}>{l.flag} {l.name}</option>
          ))}
        </select>

        <div className="flex items-center gap-1">
          <input
            type="number"
            placeholder="Rank min"
            value={filters.rankMin}
            onChange={e => set({ rankMin: e.target.value })}
            className={`w-28 bg-gray-800 border rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-600 focus:outline-none ${
              filters.rankMin ? 'border-pink-500/50' : 'border-transparent'
            }`}
          />
          <span className="text-gray-600 text-sm">–</span>
          <input
            type="number"
            placeholder="Rank max"
            value={filters.rankMax}
            onChange={e => set({ rankMax: e.target.value })}
            className={`w-28 bg-gray-800 border rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-600 focus:outline-none ${
              filters.rankMax ? 'border-pink-500/50' : 'border-transparent'
            }`}
          />
        </div>

        <div className="w-px h-5 bg-gray-700 mx-1" />

        <button
          onClick={() => set({ showAll: !filters.showAll })}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            filters.showAll ? 'bg-purple-500 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
          }`}
        >
          All members
        </button>

        {activeFilters > 0 && (
          <button
            onClick={() => set({ country: '', language: '', rankMin: '', rankMax: '' })}
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors ml-1"
          >
            Clear filters ({activeFilters})
          </button>
        )}
      </div>
    </div>
  );
}
