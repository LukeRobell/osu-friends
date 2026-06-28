'use client';

import { useState } from 'react';

const TIME_SLOTS = [
  { id: 'morning',   label: 'Morning',    startHour: 6,  endHour: 12, sub: '6am–noon' },
  { id: 'afternoon', label: 'Afternoon',  startHour: 12, endHour: 18, sub: 'noon–6pm' },
  { id: 'evening',   label: 'Evening',    startHour: 18, endHour: 24, sub: '6pm–midnight' },
  { id: 'latenight', label: 'Late night', startHour: 0,  endHour: 6,  sub: 'midnight–6am' },
];

const DAY_GROUPS = [
  { id: 'weekday', label: 'Weekdays' },
  { id: 'weekend', label: 'Weekends' },
];

function slotKey(day: string, time: string) { return `${day}-${time}`; }

// Returns timezone offset in hours relative to UTC, DST-aware
function getTzOffsetHours(tz: string): number {
  const now = new Date();
  const tzDate  = new Date(now.toLocaleString('en-US', { timeZone: tz }));
  const utcDate = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
  return Math.round((tzDate.getTime() - utcDate.getTime()) / 3600000);
}

function convertHour(hour: number, fromTz: string, toTz: string): number {
  const diff = getTzOffsetHours(toTz) - getTzOffsetHours(fromTz);
  return ((hour + diff) % 24 + 24) % 24;
}

function fmt(h: number): string {
  const n = ((h % 24) + 24) % 24;
  if (n === 0)  return '12am';
  if (n === 12) return '12pm';
  return n < 12 ? `${n}am` : `${n - 12}pm`;
}

interface Props {
  initial: string[];
  isOwn: boolean;
  ownerTimezone?: string | null;
}

export default function PlaySchedulePicker({ initial, isOwn, ownerTimezone }: Props) {
  const [selected, setSelected] = useState<string[]>(initial);
  const [editing, setEditing]   = useState(false);
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);

  function toggle(day: string, time: string) {
    const k = slotKey(day, time);
    setSelected(s => s.includes(k) ? s.filter(x => x !== k) : [...s, k]);
    setSaved(false);
  }

  async function save() {
    setSaving(true);
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const res = await fetch('/api/user/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playSchedule: selected, timezone: tz }),
    });
    setSaving(false);
    if (res.ok) { setSaved(true); setEditing(false); }
  }

  if (!isOwn && selected.length === 0) return null;

  // Viewer's local timezone
  const viewerTz  = typeof window !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : null;
  const fromTz    = ownerTimezone ?? null;
  const showConv  = !isOwn && fromTz && viewerTz && fromTz !== viewerTz;

  // Group selected slots by day for display
  const byDay: Record<string, string[]> = {};
  for (const slot of selected) {
    const [day, time] = slot.split('-');
    if (!byDay[day]) byDay[day] = [];
    byDay[day].push(time);
  }

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
          {/* 2-column grid: time labels | Weekdays | Weekends */}
          <div className="grid gap-1 text-sm" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
            <div />
            {DAY_GROUPS.map(d => (
              <div key={d.id} className="text-center text-gray-400 font-medium pb-1">{d.label}</div>
            ))}
            {TIME_SLOTS.map(t => (
              <div key={t.id} className="contents">
                <div className="flex flex-col justify-center pr-2 py-1">
                  <span className="text-gray-300 text-xs">{t.label}</span>
                  <span className="text-gray-600 text-xs">{t.sub}</span>
                </div>
                {DAY_GROUPS.map(d => {
                  const k = slotKey(d.id, t.id);
                  const active = selected.includes(k);
                  return (
                    <button
                      key={k}
                      onClick={() => toggle(d.id, t.id)}
                      className={`h-9 rounded-lg transition-colors text-xs font-medium ${
                        active
                          ? 'bg-pink-500/20 border border-pink-500/40 text-pink-300'
                          : 'bg-gray-800 border border-transparent text-gray-600 hover:bg-gray-700 hover:text-gray-400'
                      }`}
                    >
                      {active ? '✓' : ''}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-600 mt-2">Times will be shown in your local timezone ({Intl.DateTimeFormat().resolvedOptions().timeZone}) to viewers.</p>
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
        <div className="space-y-1.5">
          {DAY_GROUPS.filter(d => byDay[d.id]?.length).map(d => {
            const times = byDay[d.id];
            return (
              <div key={d.id} className="text-sm">
                <span className="text-gray-400">{d.label}: </span>
                {times.map((tid, i) => {
                  const slot = TIME_SLOTS.find(t => t.id === tid);
                  if (!slot) return null;
                  return (
                    <span key={tid}>
                      {i > 0 && <span className="text-gray-600"> · </span>}
                      <span className="text-gray-300">{slot.label}</span>
                      {showConv && (
                        <span className="text-gray-500 text-xs ml-1">
                          ({fmt(convertHour(slot.startHour, fromTz!, viewerTz!))}–{fmt(convertHour(slot.endHour === 24 ? 0 : slot.endHour, fromTz!, viewerTz!))} your time)
                        </span>
                      )}
                    </span>
                  );
                })}
              </div>
            );
          })}
          {showConv && (
            <p className="text-xs text-gray-600 mt-1">Owner in {fromTz} · you in {viewerTz}</p>
          )}
        </div>
      ) : isOwn ? (
        <p className="text-gray-600 text-sm italic">Not set — click Edit to add your schedule.</p>
      ) : null}

      {saved && !editing && (
        <p className="text-xs text-green-400 mt-1">Saved ✓</p>
      )}
    </div>
  );
}
