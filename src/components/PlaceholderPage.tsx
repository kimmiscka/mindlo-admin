import { type LucideIcon } from 'lucide-react';
import TopBar from './TopBar';

interface PlaceholderPageProps {
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  description: string;
  badge?: string;
}

export default function PlaceholderPage({
  title,
  subtitle,
  icon: Icon,
  description,
  badge = 'Coming next',
}: PlaceholderPageProps) {
  return (
    <div className="flex flex-col min-h-screen">
      <TopBar title={title} subtitle={subtitle} />
      <main className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-sm">
          <div className="w-14 h-14 rounded-2xl bg-brand-teal-pale flex items-center justify-center mx-auto mb-4">
            <Icon size={26} className="text-brand-teal" />
          </div>
          <span className="inline-block bg-brand-pink/20 text-brand-pink-dark text-xs font-semibold px-2.5 py-0.5 rounded-full mb-3">
            {badge}
          </span>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">{title}</h2>
          <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
        </div>
      </main>
    </div>
  );
}
