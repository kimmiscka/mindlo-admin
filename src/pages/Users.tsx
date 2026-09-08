import { Smartphone, ShieldOff, Database } from 'lucide-react';
import TopBar from '../components/TopBar';

const FUTURE_FEATURES = [
  { label: 'User profiles', description: 'Name, age group, language preference, onboarding date.' },
  { label: 'Check-in history', description: 'Mood trends and streak data synced from the device.' },
  { label: 'Flag reports', description: 'User-submitted flags on content for moderation review.' },
  { label: 'Account actions', description: 'Reset data, disable account, export user record.' },
];

export default function Users() {
  return (
    <div className="flex flex-col min-h-screen">
      <TopBar title="Users" subtitle="Mobile app user management" />
      <main className="flex-1 p-6 space-y-6">

        {/* Status banner */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 flex gap-3 items-start">
          <ShieldOff size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">User data is stored on-device only</p>
            <p className="text-sm text-amber-700 mt-0.5 leading-relaxed">
              MindLo users do not create accounts — all check-in history, moods, and preferences are
              stored locally in the app using <code className="bg-amber-100 px-1 rounded">AsyncStorage</code>.
              No personal data is sent to Supabase. This is by design to protect user privacy.
            </p>
          </div>
        </div>

        {/* Architecture note */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-brand-teal-pale flex items-center justify-center">
              <Smartphone size={16} className="text-brand-teal" />
            </div>
            <h2 className="text-sm font-semibold text-gray-900">How it works today</h2>
          </div>
          <div className="space-y-2">
            {[
              'Users open the app — no sign-up, no login required.',
              'Check-ins, mood history, and saved articles are stored on the device.',
              'Preference learning (format weights) lives in AsyncStorage, keyed by install.',
              'If a user deletes the app, their data is gone — this is intentional.',
            ].map((line) => (
              <div key={line} className="flex items-start gap-2 text-sm text-gray-600">
                <span className="text-brand-teal mt-0.5">•</span>
                <span>{line}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Future features */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center">
              <Database size={16} className="text-violet-500" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">What this page will show</h2>
              <p className="text-xs text-gray-400">When optional Supabase sync is added</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {FUTURE_FEATURES.map((f) => (
              <div key={f.label} className="border border-dashed border-gray-200 rounded-lg p-3">
                <p className="text-sm font-medium text-gray-700">{f.label}</p>
                <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>

      </main>
    </div>
  );
}
