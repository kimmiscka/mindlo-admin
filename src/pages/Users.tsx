import { Users as UsersIcon } from 'lucide-react';
import PlaceholderPage from '../components/PlaceholderPage';

export default function Users() {
  return (
    <PlaceholderPage
      title="Users"
      subtitle="Mobile app user management"
      icon={UsersIcon}
      description="View app users, review flag reports, and manage accounts. Support and moderation actions are logged automatically to the audit trail."
    />
  );
}
