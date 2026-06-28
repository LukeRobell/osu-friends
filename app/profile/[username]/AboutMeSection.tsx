'use client';

import { useState } from 'react';

// Minimal safe markdown renderer — bold, italic, links, line breaks
function renderMarkdown(text: string) {
  const paragraphs = text.trim().split(/\n\n+/);
  return paragraphs.map((para, pi) => {
    const lines = para.split('\n');
    const content = lines.flatMap((line, li) => {
      const nodes = parseInline(line, `${pi}-${li}`);
      return li < lines.length - 1 ? [...nodes, <br key={`br-${pi}-${li}`} />] : nodes;
    });
    return <p key={pi} className={pi < paragraphs.length - 1 ? 'mb-3' : ''}>{content}</p>;
  });
}

function parseInline(text: string, prefix: string) {
  const nodes: React.ReactNode[] = [];
  const re = /(\*\*(.+?)\*\*)|(\*(.+?)\*)|\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    if (m[1])      nodes.push(<strong key={`${prefix}-${m.index}`}>{m[2]}</strong>);
    else if (m[3]) nodes.push(<em key={`${prefix}-${m.index}`}>{m[4]}</em>);
    else           nodes.push(<a key={`${prefix}-${m.index}`} href={m[6]} target="_blank" rel="noopener noreferrer" className="text-pink-400 hover:text-pink-300 underline">{m[5]}</a>);
    last = m.index + m[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

interface Props {
  initial: string | null;
  isOwn: boolean;
}

export default function AboutMeSection({ initial, isOwn }: Props) {
  const [value, setValue] = useState(initial ?? '');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setSaving(true);
    const res = await fetch('/api/user/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ aboutMe: value }),
    });
    setSaving(false);
    if (res.ok) { setSaved(true); setEditing(false); }
  }

  if (!isOwn && !value) return null;

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-2">
        <p className="text-gray-400 text-sm">About me</p>
        {isOwn && !editing && (
          <button
            onClick={() => { setEditing(true); setSaved(false); }}
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            {value ? 'Edit' : '+ Add'}
          </button>
        )}
      </div>

      {editing ? (
        <div>
          <textarea
            value={value}
            onChange={e => setValue(e.target.value)}
            maxLength={2000}
            rows={5}
            placeholder="Tell others about yourself... **bold**, *italic*, [links](https://...) supported"
            className="w-full bg-gray-800 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-pink-500/50 resize-none"
          />
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-600">{value.length}/2000 · **bold** *italic* [text](url)</span>
            <div className="flex gap-2">
              <button
                onClick={() => { setEditing(false); setValue(initial ?? ''); }}
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
        </div>
      ) : value ? (
        <div className="text-gray-300 text-sm leading-relaxed">
          {renderMarkdown(value)}
        </div>
      ) : isOwn ? (
        <p className="text-gray-600 text-sm italic">No bio yet — click Edit to add one.</p>
      ) : null}

      {saved && !editing && (
        <p className="text-xs text-green-400 mt-1">Saved ✓</p>
      )}
    </div>
  );
}
