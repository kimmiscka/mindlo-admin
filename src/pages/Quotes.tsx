import { Quote } from 'lucide-react';
import PlaceholderPage from '../components/PlaceholderPage';

export default function Quotes() {
  return (
    <PlaceholderPage
      title="Daily Quotes"
      subtitle="Manage the 30-quote motivational rotation"
      icon={Quote}
      description="Add, edit, or reorder the 30 daily motivational quotes that are pushed as local notifications. Preview how each quote will look in the notification banner."
    />
  );
}
