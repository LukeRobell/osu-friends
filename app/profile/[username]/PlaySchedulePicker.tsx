'use client';

import { useState } from 'react';

const TIME_SLOTS = [
  { id: 'morning',   label: 'Morning',    sub: '6am – noon' },
  { id: 'afternoon', label: 'Afternoon',  sub: 'noon – 6pm' },
  { id: 'evening',   label: 'Evening',    sub: '6pm – midnight' },
  { id: 'latenight', label: 'Late night', sub: 'midnight+' },
];

const DAY_GROUPS = [
  { id: 'weekday', label: 'Weekdays' },
  { id: 'weekend', label: 'Weekends' },
];

function key(day: string, time: string) { return `${day}-${time}`; }

function formatSchedule(slots: string[]): string {
  if (slots.length === 0) return '';
  const byDay: Record<string, string[]> = {};
  for (const s of slots) {
    const [day, time] = s.split('-');
    if (!byDay[day]) byDay[day] = [];
    const label = TIME_SLOTS.find(t => t.id === time)?.label ?? time;
    byDay[day].push(label);
  }
  return Object.entries(byDay)
    .map(([day, times]) => {
      const dayLabel = DAY_GROUPS.find(d => d.id === day)?.label ?? day;
      return `${dayLabel}: ${times.join(', ')}`;
    })
    .join(' · ');
}

interface Props {
  initial: string[];
  isOwn: boolean;
}

export default function PlaySchedulePicker({ initial, isOwn }: Props) {
  const [selected, setSelected] = useState<string[]>(initial);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function toggle(day: string, time: string) {
    const k = key(day, time);
    setSelected(s => s.includes(k) ? s.filter(x => x !== k) : [...s, k]);
    setSaved(false);
  }

  async function save() {
    setSaving(true);
    await fetch('/api/user/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playSchedule: selected }),
    });
    setSaving(false);
    setSaved(true);
    setEditing(false);
  }

  if (!isOwn && selected.length === 0) return null;

  const summary = formatSchedule(selected);

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-2">
        <p className="text-gray-400 text-sm">Usually plays</p>
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
          <div className="grid grid-cols-3 gap-1 text-sm">
            {/* Header row */}
            <div />
            {DAY_GROUPS.map(d => (
              <div key={d.id} className="text-center text-gray-400 font-medium pb-1">{d.label}</div>
            ))}
            {/* Time slot rows */}
            {TIME_SLOTS.map(t => (
              <>
                <div key={`label-${t.id}`} className="flex flex-col justify-center pr-2">
                  <span className="text-gray-300">{t.label}</span>
                  <span className="text-gray-600 text-xs">{t.sub}</span>
                </div>
                {DAY_GROUPS.map(d => {
                  const k = key(d.id, t.id);
                  const active = selected.includes(k);
                  return (
                    <button
                      key={k}
                      onClick={() => toggle(d.id, t.id)}
                      className={`h-10 rounded-lg transition-colors ${
                        active
                          ? 'bg-pink-500/20 border border-pink-500/40 text-pink-300'
                          : 'bg-gray-800 border border-transparent text-gray-600 hover:bg-gray-700 hover:text-gray-400'
                      }`}
                    >
                      {active ? '✓' : ''}
                    </button>
                  );
                })}
              </>
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
        <p className="text-gray-300 text-sm">{summary}</p>
      ) : isOwn ? (
        <p className="text-gray-600 text-sm italic">Not set — click Edit to add your schedule.</p>
      ) : null}

      {saved && !editing && (
        <p className="text-xs text-green-400 mt-1">Saved ✓</p>
      )}
    </div>
  );
}
