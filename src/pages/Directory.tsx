import { Phone, MessageSquare, ExternalLink } from 'lucide-react';
import TopBar from '../components/TopBar';

interface Contact {
  kind: 'call' | 'sms' | 'whatsapp';
  display: string;
}

interface Service {
  name: string;
  what: string;
  cost?: string;
  contacts: Contact[];
  tier: 'emergency' | 'support' | 'partner';
  url?: string;
}

const SERVICES: Service[] = [
  {
    tier: 'emergency',
    name: 'SADAG',
    what: 'Counselling and referrals for depression, anxiety, trauma, GBV, abuse, PTSD, suicide and other mental health issues. 24-hour toll-free emergency helpline.',
    cost: 'Free',
    contacts: [
      { kind: 'call', display: '0800 567 567' },
      { kind: 'sms', display: 'SMS 31393' },
    ],
  },
  {
    tier: 'emergency',
    name: 'Childline',
    what: "Children's mental health services: counselling, support, training, helpline, education and more.",
    cost: 'Free',
    contacts: [
      { kind: 'call', display: '116' },
      { kind: 'call', display: '0800 055 555' },
      { kind: 'whatsapp', display: 'WhatsApp 083 371 2104' },
    ],
  },
  {
    tier: 'emergency',
    name: 'Emergency services',
    what: 'South African Police Service emergency line.',
    cost: 'Free',
    contacts: [{ kind: 'call', display: '10111' }],
  },
  {
    tier: 'support',
    name: 'Substance abuse helpline',
    what: 'Support for substance abuse. Department of Social Development.',
    cost: 'Free',
    contacts: [
      { kind: 'call', display: '0800 12 13 14' },
      { kind: 'sms', display: 'SMS 32312' },
    ],
  },
  {
    tier: 'support',
    name: 'ADHD helpline',
    what: 'Free telephonic counselling, guidance, and educational resources for individuals with ADHD, and for family members, teachers, and GPs.',
    cost: 'Free',
    contacts: [{ kind: 'call', display: '0800 55 44 33' }],
  },
  {
    tier: 'support',
    name: 'PsychMatters',
    what: 'Psychotherapy for children and parents, group therapy, and workshops.',
    contacts: [{ kind: 'call', display: '011 450 3576' }],
  },
  {
    tier: 'support',
    name: 'Lifeline',
    what: 'Counselling services.',
    contacts: [{ kind: 'call', display: '0861 322 322' }],
  },
  {
    tier: 'partner',
    name: 'Global Youth Solutions (GYS)',
    what: 'Peer support network for young people.',
    contacts: [],
    url: 'https://gys.org.za',
  },
  {
    tier: 'partner',
    name: 'NexGen Gender Advocates',
    what: 'Gender equity and youth advocacy.',
    contacts: [],
    url: 'https://nexgen.org.za',
  },
];

const KIND_ICON = {
  call: Phone,
  sms: MessageSquare,
  whatsapp: MessageSquare,
};

const TIER_LABELS: Record<Service['tier'], string> = {
  emergency: '🚨 Emergency lines',
  support: 'More support',
  partner: 'Partner organisations',
};

const TIER_ORDER: Service['tier'][] = ['emergency', 'support', 'partner'];

export default function Directory() {
  const grouped = TIER_ORDER.map((tier) => ({
    tier,
    label: TIER_LABELS[tier],
    services: SERVICES.filter((s) => s.tier === tier),
  }));

  return (
    <div className="flex flex-col min-h-screen">
      <TopBar title="Directory" subtitle="Support services and partner organisations" />
      <main className="flex-1 p-6 space-y-6">

        {grouped.map(({ tier, label, services }) => (
          <section key={tier}>
            <h2 className="text-sm font-semibold text-gray-700 mb-3">{label}</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {services.map((s) => (
                <div
                  key={s.name}
                  className={`bg-white rounded-xl border p-4 ${
                    tier === 'emergency' ? 'border-brand-pink/40' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{s.name}</p>
                      {s.cost && (
                        <span className="text-[10px] font-medium bg-green-50 text-green-700 px-1.5 py-0.5 rounded-full">
                          {s.cost}
                        </span>
                      )}
                    </div>
                    {s.url && (
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-brand-teal hover:underline flex-shrink-0"
                      >
                        <ExternalLink size={12} /> Website
                      </a>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed mb-3">{s.what}</p>
                  {s.contacts.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {s.contacts.map((c) => {
                        const Icon = KIND_ICON[c.kind];
                        return (
                          <span
                            key={c.display}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${
                              tier === 'emergency'
                                ? 'bg-brand-pink/10 text-brand-pink-dark'
                                : 'bg-brand-teal-pale text-brand-teal'
                            }`}
                          >
                            <Icon size={11} />
                            {c.display}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        ))}

        <p className="text-xs text-gray-400 pt-2">
          Contact details are hardcoded in the mobile app (
          <code className="bg-gray-100 px-1 py-0.5 rounded">DirectoryScreen.tsx</code>
          ). A mobile release is required to update them.
        </p>
      </main>
    </div>
  );
}
