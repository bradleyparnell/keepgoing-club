import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const ADMIN_EMAIL = 'brad@genierocket.com';

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
}

interface Stats {
  total: number;
  thisWeek: number;
  thisMonth: number;
}

export default function AdminPage() {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, thisWeek: 0, thisMonth: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isAdmin = user?.email === ADMIN_EMAIL;

  useEffect(() => {
    if (!isAdmin) return;
    loadData();
  }, [isAdmin]);

  async function loadData() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      setProfiles(data || []);
      setStats({
        total: data?.length || 0,
        thisWeek: data?.filter(p => new Date(p.created_at) > weekAgo).length || 0,
        thisMonth: data?.filter(p => new Date(p.created_at) > monthAgo).length || 0,
      });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🚫</div>
          <p className="text-zinc-400">Access denied.</p>
          <a href="/" className="text-orange-500 text-sm mt-4 inline-block hover:text-orange-400">
            ← Back to app
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-orange-500 tracking-widest uppercase">Admin</h1>
            <p className="text-zinc-500 text-sm mt-1">Keep Going — User Dashboard</p>
          </div>
          <a href="/" className="text-zinc-500 text-sm hover:text-zinc-300 transition-colors">
            ← Back to app
          </a>
        </div>

        {loading && (
          <div className="text-zinc-500 text-center py-20">Loading...</div>
        )}

        {error && (
          <div className="bg-orange-900/30 border border-orange-800 rounded-lg p-4 mb-6 text-orange-400 text-sm">
            {error} — Make sure you've run the profiles SQL setup in Supabase.
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              {[
                { label: 'Total Users', value: stats.total },
                { label: 'Last 7 Days', value: stats.thisWeek },
                { label: 'Last 30 Days', value: stats.thisMonth },
              ].map(s => (
                <div key={s.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-center">
                  <div className="text-4xl font-bold text-orange-500 mb-1">{s.value}</div>
                  <div className="text-zinc-500 text-sm uppercase tracking-wide">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Recent Signups */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
                <h2 className="font-semibold text-zinc-200">Recent Signups</h2>
                <span className="text-zinc-600 text-xs">{profiles.length} total</span>
              </div>
              {profiles.length === 0 ? (
                <div className="px-6 py-10 text-center text-zinc-600 text-sm">No users yet.</div>
              ) : (
                <div className="divide-y divide-zinc-800">
                  {profiles.map(p => (
                    <div key={p.id} className="px-6 py-3 flex items-center justify-between hover:bg-zinc-800/40 transition-colors">
                      <div>
                        <div className="text-zinc-200 text-sm">{p.email}</div>
                        {p.full_name && (
                          <div className="text-zinc-500 text-xs">{p.full_name}</div>
                        )}
                      </div>
                      <div className="text-zinc-600 text-xs">
                        {new Date(p.created_at).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric'
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={loadData}
              className="mt-6 text-zinc-600 hover:text-zinc-400 text-sm transition-colors"
            >
              ↻ Refresh
            </button>
          </>
        )}
      </div>
    </div>
  );
}
