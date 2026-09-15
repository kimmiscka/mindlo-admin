import { useState, useEffect } from 'react';
import { AlertCircle, RefreshCw, MessageSquare } from 'lucide-react';
import TopBar from '../components/TopBar';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

type FeedbackRow = {
  id: string;
  message: string;
  username: string | null;
  user_id: string | null;
  created_at: string;
};

export default function Feedback() {
  const { admin } = useAuth();
  const [feedback, setFeedback] = useState<FeedbackRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadFeedback = async () => {
    setLoading(true);
    setError('');
    try {
      const { data, error: err } = await supabase
        .from('feedback')
        .select('id, message, username, user_id, created_at')
        .order('created_at', { ascending: false });

      if (err) throw err;
      setFeedback((data ?? []) as FeedbackRow[]);
    } catch (e: unknown) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeedback();
  }, []);

  if (!admin || admin.role !== 'super_admin') {
    return (
      <div className="flex flex-col min-h-screen">
        <TopBar title="Feedback" subtitle="User feedback and suggestions" />
        <main className="flex-1 p-6">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-3">
            <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Access Denied</p>
              <p className="text-sm mt-1">Feedback review is restricted to Super Admins only.</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <TopBar title="Feedback" subtitle="User feedback and suggestions" />
      <main className="flex-1 p-6 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Refresh button */}
        <div className="flex gap-3">
          <button
            onClick={loadFeedback}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-brand-teal border border-gray-200 px-3 py-2 rounded-lg disabled:opacity-50"
          >
            <RefreshCw size={13} />
            Refresh
          </button>
          <div className="text-xs text-gray-500">
            {feedback.length} {feedback.length === 1 ? 'submission' : 'submissions'}
          </div>
        </div>

        {/* Feedback list */}
        <div className="bg-white rounded-xl border border-gray-200">
          {loading ? (
            <div className="px-5 py-10 text-center text-sm text-gray-400">Loading…</div>
          ) : feedback.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <MessageSquare size={22} className="text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No feedback submitted yet.</p>
              <p className="text-xs text-gray-300 mt-1">User suggestions will appear here.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {feedback.map((f) => (
                <div key={f.id} className="px-5 py-4 hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900">
                        {f.username || '(anonymous)'}
                      </p>
                      {f.user_id && (
                        <p className="text-xs text-gray-400 font-mono">{f.user_id}</p>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 ml-4 flex-shrink-0">
                      {new Date(f.created_at).toLocaleString('en-ZA', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {f.message}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
