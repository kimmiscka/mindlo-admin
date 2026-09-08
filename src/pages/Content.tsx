import { FileText } from 'lucide-react';
import PlaceholderPage from '../components/PlaceholderPage';

export default function Content() {
  return (
    <PlaceholderPage
      title="Content"
      subtitle="Manage articles, categories, and exercises"
      icon={FileText}
      description="Browse and edit the 87 articles in the MindLo library. Update copy, move articles between categories, and publish or unpublish content — all without a code deploy."
    />
  );
}
