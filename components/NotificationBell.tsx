'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

interface Notif {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  createdAt: string;
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function typeIcon(type: string): string {
  if (type === 'RIVAL_PLAY') return '⚔️';
  if (type === 'RIVAL_REQUEST') return '🤺';
  if (type === 'TOURNAMENT_INVITE') return '🏆';
  if (type === 'SNIPE') return '🎯';
  if (type === 'TEAM_APPLICATION') return '👥';
  return '🔔';
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notif[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  async function fetchNotifs() {
    const res = await fetch('/api/notifications');
    if (!res.ok) return;
    const d = await res.json();
    setNotifications(d.notifications ?? []);
    setUnread(d.unreadCount ?? 0);
  }

  useEffect(() => {
    fetchNotifs();
    const id = setInterval(fetchNotifs, 30_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  async function handleOpen() {
    setOpen(o => !o);
    if (!open && unread > 0) {
      await fetch('/api/notifications/read', { method: 'POST' });
      setUnread(0);
      setNotifications(n => n.map(x => ({ ...x, read: true })));
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={handleOpen}
        className="relative p-1.5 text-gray-400 hover:text-white transition-colors"
        aria-label="Notifications"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-0.5 bg-pink-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center leading-none">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-gray-900 border border-gray-800 rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-800">
            <p className="text-sm font-semibold">Notifications</p>
          </div>

          {notifications.length === 0 ? (
            <div className="px-4 py-6 text-center text-gray-500 text-sm">No notifications yet</div>
          ) : (
            <div className="max-h-80 overflow-y-auto">
              {notifications.map(n => {
                const inner = (
                  <div key={n.id} className={`px-4 py-3 hover:bg-gray-800 transition-colors border-b border-gray-800/60 last:border-0 ${!n.read ? 'bg-pink-500/5' : ''}`}>
                    <div className="flex gap-2.5 items-start">
                      <span className="text-base mt-0.5 flex-shrink-0">{typeIcon(n.type)}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium leading-snug">{n.title}</p>
                        {n.body && <p className="text-xs text-gray-400 mt-0.5 truncate">{n.body}</p>}
                        <p className="text-xs text-gray-600 mt-1">{timeAgo(n.createdAt)}</p>
                      </div>
                      {!n.read && <span className="w-2 h-2 rounded-full bg-pink-500 flex-shrink-0 mt-1.5" />}
                    </div>
                  </div>
                );

                if (n.link) {
                  return n.link.startsWith('/') ? (
                    <Link key={n.id} href={n.link} onClick={() => setOpen(false)}>
                      {inner}
                    </Link>
                  ) : (
                    <a key={n.id} href={n.link} target="_blank" rel="noopener noreferrer">
                      {inner}
                    </a>
                  );
                }
                return inner;
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
