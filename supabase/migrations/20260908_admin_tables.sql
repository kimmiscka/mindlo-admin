-- MindLo Admin Console — foundation tables
-- Review this carefully before applying.
-- Apply via: paste into the Supabase SQL editor, or run
--   npx supabase db push --linked  (from the mobile-app repo root)

-- ── 1. admin_users ───────────────────────────────────────────────────────────
-- Maps Supabase Auth users to admin roles.
-- Only emails inserted here can access the dashboard.

create table if not exists public.admin_users (
  id         uuid        primary key references auth.users(id) on delete cascade,
  email      text        not null unique,
  role       text        not null
             check (role in ('super_admin', 'content_manager', 'support_moderator')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

-- Each admin can read their own row (used on login to verify access + load role).
create policy "admin_users: read own record"
  on public.admin_users for select
  using (auth.uid() = id);

-- Admins can read ALL rows (for the Settings admin-user list).
-- The admin UI gates writes to Super Admin only; Supabase prevents anon writes.
create policy "admin_users: super admin reads all"
  on public.admin_users for select
  using (
    exists (
      select 1 from public.admin_users a
      where a.id = auth.uid()
    )
  );

-- Allow insert (the Settings page creates new admins via signUp + insert).
create policy "admin_users: admins can insert"
  on public.admin_users for insert
  with check (
    exists (
      select 1 from public.admin_users a
      where a.id = auth.uid()
        and a.role = 'super_admin'
    )
  );

-- Allow super_admin to delete (remove admin access).
create policy "admin_users: super admin can delete"
  on public.admin_users for delete
  using (
    exists (
      select 1 from public.admin_users a
      where a.id = auth.uid()
        and a.role = 'super_admin'
    )
  );


-- ── 2. audit_logs ────────────────────────────────────────────────────────────
-- Immutable append-only log of every admin write action.
-- Never update or delete rows — this is a tamper-evident trail.

create table if not exists public.audit_logs (
  id            uuid        primary key default gen_random_uuid(),
  admin_id      uuid        not null references auth.users(id),
  admin_email   text        not null,
  action        text        not null,      -- e.g. 'update_article', 'add_admin'
  resource_type text,                      -- e.g. 'article', 'admin_user', 'quote'
  resource_id   text,                      -- affected row's id/slug
  details       jsonb,                     -- before/after snapshot or extra context
  created_at    timestamptz not null default now()
);

alter table public.audit_logs enable row level security;

-- Admins can insert their own log entries.
create policy "audit_logs: insert own"
  on public.audit_logs for insert
  with check (auth.uid() = admin_id);

-- All admins can read audit logs (UI shows full history to super_admin,
-- filtered view to others — gating happens in the React layer).
create policy "audit_logs: admins can read"
  on public.audit_logs for select
  using (
    exists (
      select 1 from public.admin_users a
      where a.id = auth.uid()
    )
  );
