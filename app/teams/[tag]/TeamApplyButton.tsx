'use client';

import { useState } from 'react';

interface Props {
  teamTag: string;
  existingStatus: string | null;
}

export default function TeamApplyButton({ teamTag, existingStatus }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(existingStatus);

  if (status) {
    return (
      <div className="bg-gray-900/60 border border-white/10 rounded-2xl p-5 text-center">
        <p className={`text-sm font-medium ${status === 'ACCEPTED' ? 'text-green-400' : status === 'DECLINED' ? 'text-red-400' : 'text-pink-400'}`}>
          {status === 'ACCEPTED' ? 'Application accepted ✓' : status === 'DECLINED' ? 'Application declined' : 'Application sent — pending review'}
        </p>
      </div>
    );
  }

  async function handleApply() {
    if (!message.trim()) return;
    setLoading(true);
    const res = await fetch(`/api/teams/${encodeURIComponent(teamTag)}/apply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    });
    setLoading(false);
    if (res.ok) {
      setStatus('PENDING');
      setShowForm(false);
    }
  }

  if (showForm) {
    return (
      <div className="bg-gray-900/60 border border-white/10 rounded-2xl p-5">
        <h3 className="text-white font-semibold mb-3 text-sm">Apply to join</h3>
        <textarea
          className="w-full bg-gray-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 resize-none focus:outline-none focus:border-pink-500/50"
          rows={4}
          placeholder="Tell them about yourself — your playstyle, availability, why you want to join..."
          value={message}
          onChange={e => setMessage(e.target.value)}
        />
        <div className="flex gap-2 mt-3">
          <button
            onClick={handleApply}
            disabled={loading || !message.trim()}
            className="flex-1 py-2 bg-pink-500 hover:bg-pink-600 disabled:opacity-40 rounded-full text-sm font-medium transition-colors"
          >
            {loading ? 'Sending...' : 'Send application'}
          </button>
          <button
            onClick={() => setShowForm(false)}
            className="px-4 py-2 text-gray-400 hover:text-white text-sm transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowForm(true)}
      className="w-full py-3 border-2 border-pink-500 text-pink-400 hover:bg-pink-500/10 rounded-2xl font-medium transition-colors"
    >
      Apply to join
    </button>
  );
}
