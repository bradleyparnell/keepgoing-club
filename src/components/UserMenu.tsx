import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function UserMenu() {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (btnRef.current && btnRef.current.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleToggle = () => {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPos({ x: r.right + 12, y: r.top });
    }
    setOpen(v => !v);
  };

  const avatar = user?.user_metadata?.avatar_url;
  const initials = user?.user_metadata?.full_name
    ? user.user_metadata.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : user?.email?.[0].toUpperCase() ?? '?';

  const dropdown = open ? (
    <div
      style={{ position: 'fixed', left: pos.x, top: pos.y, zIndex: 9999 }}
      className="w-56 bg-zinc-800 border border-zinc-600 rounded-xl shadow-2xl overflow-hidden ring-1 ring-white/10"
    >
      <div className="px-4 py-3 border-b border-zinc-700">
        <p className="text-white text-sm font-semibold truncate">
          {user?.user_metadata?.full_name || 'Brick layer'}
        </p>
        <p className="text-zinc-400 text-xs truncate">{user?.email}</p>
      </div>
      <button
        onClick={() => { setOpen(false); signOut(); }}
        className="w-full flex items-center gap-2 px-4 py-3 text-zinc-300 hover:text-white hover:bg-zinc-700 transition-colors text-sm"
      >
        <LogOut size={14} />
        Sign out
      </button>
    </div>
  ) : null;

  return (
    <>
      <button
        ref={btnRef}
        onClick={handleToggle}
        className="w-9 h-9 rounded-full overflow-hidden border-2 border-zinc-600 hover:border-orange-500 transition-colors flex items-center justify-center bg-zinc-700"
        title="Account"
      >
        {avatar
          ? <img src={avatar} alt="avatar" className="w-full h-full object-cover" />
          : <span className="text-sm font-black text-orange-400">{initials}</span>
        }
      </button>
      {typeof document !== 'undefined' && createPortal(dropdown, document.body)}
    </>
  );
}
