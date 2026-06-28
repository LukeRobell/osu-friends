'use client';

import CountrySelect from './CountrySelect';
import LanguageSelect from './LanguageSelect';

export interface Filters {
  q: string;
  mode: string;
  country: string;
  language: string;
  rankMin: string;
  rankMax: string;
  accountAge: string;
  showAll: boolean;
}

interface Props {
  filters: Filters;
  onChange: (f: Filters) => void;
}

const RANK_RANGES = [
  { label: 'Avg PP play',  value: '',        min: '',       max: '' },
  { label: '#1 – #10k',    value: '1-10k',   min: '1',      max: '10000' },
  { label: '#10k – #50k',  value: '10k-50k', min: '10000',  max: '50000' },
  { label: '#50k – #100k', value: '50k-100k',min: '50000',  max: '100000' },
  { label: '#100k+',       value: '100k+',   min: '100000', max: '' },
];

function rankRangeValue(rankMin: string, rankMax: string): string {
  return RANK_RANGES.find(r => r.min === rankMin && r.max === rankMax)?.value ?? '';
}

export default function DiscoverFilters({ filters, onChange }: Props) {
  function set(patch: Partial<Filters>) {
    onChange({ ...filters, ...patch });
  }

  function setRankRange(value: string) {
    const range = RANK_RANGES.find(r => r.value === value) ?? RANK_RANGES[0];
    set({ rankMin: range.min, rankMax: range.max });
  }

  const activeFilters = [
    filters.country, filters.language,
    filters.rankMin || filters.rankMax ? '1' : '',
    filters.accountAge,
  ].filter(Boolean).length;

  const selectClass = (active: boolean) =>
    `bg-gray-800 border rounded-lg px-3 py-1.5 text-sm focus:outline-none cursor-pointer transition-colors ${
      active ? 'border-pink-500/50 text-pink-400' : 'border-transparent text-gray-400'
    }`;

  return (
    <div className="flex items-center gap-2">
      {/* Compact search */}
      <div className="relative">
        <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500 shrink-0" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
        </svg>
        <input
          type="text"
          placeholder="Username"
          value={filters.q}
          onChange={e => set({ q: e.target.value })}
          className={`w-28 bg-gray-800 border rounded-lg pl-8 pr-3 py-1.5 text-sm text-white placeholder-gray-600 focus:outline-none transition-colors ${
            filters.q ? 'border-pink-500/50' : 'border-transparent'
          }`}
        />
      </div>

      <CountrySelect value={filters.country} onChange={country => set({ country })} />
      <LanguageSelect value={filters.language} onChange={language => set({ language })} />

      <select
        value={filters.accountAge}
        onChange={e => set({ accountAge: e.target.value })}
        className={selectClass(!!filters.accountAge)}
      >
        <option value="">📅 Any era</option>
        <option value="<1">Under 1 year</option>
        <option value="1">1–5 years</option>
        <option value="5">5+ years</option>
        <option value="10">10+ years</option>
        <option value="15">15+ years</option>
      </select>

      <select
        value={rankRangeValue(filters.rankMin, filters.rankMax)}
        onChange={e => setRankRange(e.target.value)}
        className={selectClass(!!(filters.rankMin || filters.rankMax))}
      >
        {RANK_RANGES.map(r => (
          <option key={r.value} value={r.value}>{r.label}</option>
        ))}
      </select>

      {activeFilters > 0 && (
        <button
          onClick={() => set({ country: '', language: '', rankMin: '', rankMax: '', accountAge: '' })}
          className="text-xs text-gray-500 hover:text-gray-300 transition-colors whitespace-nowrap"
        >
          Clear ({activeFilters})
        </button>
      )}
    </div>
  );
}
