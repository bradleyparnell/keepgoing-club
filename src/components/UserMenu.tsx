import React, { useState, useRef, useEffect } from 'react';
import { LogOut, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function UserMenu() {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const initials = user?.user_metadata?.full_name
    ? user.user_metadata.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : user?.email?.[0].toUpperCase() ?? '?';

  const avatar = user?.user_metadata?.avatar_url;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-8 h-8 rounded-full overflow-hidden border border-zinc-700 hover:border-amber-600 transition-colors flex items-center justify-center bg-zinc-800"
      >
        {avatar
          ? <img src={avatar} alt="avatar" className="w-full h-full object-cover" />
          : <span className="text-xs font-bold text-amber-500">{initials}</span>
        }
      </button>

      {open && (
        <div className="absolute left-full bottom-0 ml-3 w-56 bg-zinc-800 border border-zinc-600 rounded-xl shadow-2xl z-50 overflow-hidden ring-1 ring-white/10">
          <div className="px-4 py-3 border-b border-zinc-800">
            <p className="text-white text-sm font-semibold truncate">
              {user?.user_metadata?.full_name || 'Brick layer'}
            </p>
            <p className="text-zinc-500 text-xs truncate">{user?.email}</p>
          </div>
          <button
            onClick={signOut}
            className="w-full flex items-center gap-2 px-4 py-3 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors text-sm"
          >
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
