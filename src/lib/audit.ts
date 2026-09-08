import { supabase } from './supabase';

interface AuditParams {
  action: string;
  resource_type?: string;
  resource_id?: string;
  details?: Record<string, unknown>;
}

// Call after every admin write action (article update, user ban, role change, etc.).
// Failures are silent so they never block the main operation.
export async function logAudit(
  adminId: string,
  adminEmail: string,
  params: AuditParams,
): Promise<void> {
  const { error } = await supabase.from('audit_logs').insert({
    admin_id: adminId,
    admin_email: adminEmail,
    action: params.action,
    resource_type: params.resource_type ?? null,
    resource_id: params.resource_id ?? null,
    details: params.details ?? null,
  });
  if (error) console.warn('[audit] log failed:', error.message);
}
