export type AdminRole = 'super_admin' | 'content_manager' | 'support_moderator';

export interface AdminUser {
  id: string;
  email: string;
  role: AdminRole;
  created_at: string;
}

export interface AuditLog {
  id: string;
  admin_id: string;
  admin_email: string;
  action: string;
  resource_type?: string;
  resource_id?: string;
  details?: Record<string, unknown>;
  created_at: string;
}

export const ROLE_LABELS: Record<AdminRole, string> = {
  super_admin: 'Super Admin',
  content_manager: 'Content Manager',
  support_moderator: 'Support / Moderator',
};

// Which sidebar sections each role can access.
export const ROLE_SECTIONS: Record<AdminRole, string[]> = {
  super_admin:       ['overview', 'content', 'users', 'activity', 'directory', 'quotes', 'settings'],
  content_manager:   ['overview', 'content', 'directory', 'quotes'],
  support_moderator: ['overview', 'users', 'activity'],
};
