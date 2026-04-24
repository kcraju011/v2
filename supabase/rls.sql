-- Row Level Security policies for BioAttend SaaS

alter table public.tenants enable row level security;
alter table public.roles enable row level security;
alter table public.departments enable row level security;
alter table public.users enable row level security;
alter table public.attendance_locations enable row level security;
alter table public.user_location_map enable row level security;
alter table public.attendance_windows enable row level security;
alter table public.attendance_types enable row level security;
alter table public.sessions enable row level security;
alter table public.auth_sessions enable row level security;
alter table public.rate_limits enable row level security;
alter table public.attendance enable row level security;
alter table public.location_logs enable row level security;
alter table public.webauthn_challenges enable row level security;
alter table public.webauthn_credentials enable row level security;
alter table public.audit_logs enable row level security;
alter table public.user_presence enable row level security;

create or replace function public.is_tenant_admin()
returns boolean
language sql
stable
as $$
  select public.current_app_role() in ('admin', 'owner', 'super_admin')
$$;

create or replace function public.same_tenant(target_tenant_id uuid)
returns boolean
language sql
stable
as $$
  select target_tenant_id = public.current_tenant_id()
$$;

drop policy if exists tenants_select_self on public.tenants;
create policy tenants_select_self
on public.tenants
for select
using (id = public.current_tenant_id());

drop policy if exists roles_tenant_access on public.roles;
create policy roles_tenant_access
on public.roles
for all
using (public.same_tenant(tenant_id))
with check (public.same_tenant(tenant_id));

drop policy if exists departments_tenant_access on public.departments;
create policy departments_tenant_access
on public.departments
for all
using (public.same_tenant(tenant_id))
with check (public.same_tenant(tenant_id));

drop policy if exists users_select_tenant on public.users;
create policy users_select_tenant
on public.users
for select
using (
  public.same_tenant(tenant_id)
  and (
    public.is_tenant_admin()
    or id = auth.uid()
  )
);

drop policy if exists users_update_self_or_admin on public.users;
create policy users_update_self_or_admin
on public.users
for update
using (
  public.same_tenant(tenant_id)
  and (
    public.is_tenant_admin()
    or id = auth.uid()
  )
)
with check (
  public.same_tenant(tenant_id)
  and (
    public.is_tenant_admin()
    or id = auth.uid()
  )
);

drop policy if exists users_insert_admin_only on public.users;
create policy users_insert_admin_only
on public.users
for insert
with check (
  public.same_tenant(tenant_id)
  and public.is_tenant_admin()
);

drop policy if exists attendance_locations_tenant_access on public.attendance_locations;
create policy attendance_locations_tenant_access
on public.attendance_locations
for all
using (public.same_tenant(tenant_id))
with check (public.same_tenant(tenant_id));

drop policy if exists user_location_map_select_self_or_admin on public.user_location_map;
create policy user_location_map_select_self_or_admin
on public.user_location_map
for select
using (
  public.same_tenant(tenant_id)
  and (
    public.is_tenant_admin()
    or user_id = auth.uid()
  )
);

drop policy if exists user_location_map_write_admin_only on public.user_location_map;
create policy user_location_map_write_admin_only
on public.user_location_map
for all
using (
  public.same_tenant(tenant_id)
  and public.is_tenant_admin()
)
with check (
  public.same_tenant(tenant_id)
  and public.is_tenant_admin()
);

drop policy if exists attendance_windows_tenant_access on public.attendance_windows;
create policy attendance_windows_tenant_access
on public.attendance_windows
for all
using (public.same_tenant(tenant_id))
with check (public.same_tenant(tenant_id));

drop policy if exists attendance_types_tenant_access on public.attendance_types;
create policy attendance_types_tenant_access
on public.attendance_types
for all
using (public.same_tenant(tenant_id))
with check (public.same_tenant(tenant_id));

drop policy if exists sessions_select_tenant on public.sessions;
create policy sessions_select_tenant
on public.sessions
for select
using (public.same_tenant(tenant_id));

drop policy if exists sessions_write_teacher_admin on public.sessions;
create policy sessions_write_teacher_admin
on public.sessions
for all
using (
  public.same_tenant(tenant_id)
  and public.current_app_role() in ('admin', 'teacher', 'owner', 'super_admin')
)
with check (
  public.same_tenant(tenant_id)
  and public.current_app_role() in ('admin', 'teacher', 'owner', 'super_admin')
);

drop policy if exists auth_sessions_select_self_or_admin on public.auth_sessions;
create policy auth_sessions_select_self_or_admin
on public.auth_sessions
for select
using (
  public.same_tenant(tenant_id)
  and (
    public.is_tenant_admin()
    or user_id = auth.uid()
  )
);

drop policy if exists auth_sessions_write_self_or_admin on public.auth_sessions;
create policy auth_sessions_write_self_or_admin
on public.auth_sessions
for all
using (
  public.same_tenant(tenant_id)
  and (
    public.is_tenant_admin()
    or user_id = auth.uid()
  )
)
with check (
  public.same_tenant(tenant_id)
  and (
    public.is_tenant_admin()
    or user_id = auth.uid()
  )
);

drop policy if exists rate_limits_admin_only on public.rate_limits;
create policy rate_limits_admin_only
on public.rate_limits
for select
using (
  public.same_tenant(tenant_id)
  and public.is_tenant_admin()
);

drop policy if exists attendance_select_self_or_admin on public.attendance;
create policy attendance_select_self_or_admin
on public.attendance
for select
using (
  public.same_tenant(tenant_id)
  and (
    public.is_tenant_admin()
    or public.current_app_role() = 'teacher'
    or user_id = auth.uid()
  )
);

drop policy if exists attendance_insert_self on public.attendance;
create policy attendance_insert_self
on public.attendance
for insert
with check (
  public.same_tenant(tenant_id)
  and user_id = auth.uid()
);

drop policy if exists attendance_update_self_or_admin on public.attendance;
create policy attendance_update_self_or_admin
on public.attendance
for update
using (
  public.same_tenant(tenant_id)
  and (
    public.is_tenant_admin()
    or public.current_app_role() = 'teacher'
    or user_id = auth.uid()
  )
)
with check (
  public.same_tenant(tenant_id)
  and (
    public.is_tenant_admin()
    or public.current_app_role() = 'teacher'
    or user_id = auth.uid()
  )
);

drop policy if exists location_logs_select_self_or_admin on public.location_logs;
create policy location_logs_select_self_or_admin
on public.location_logs
for select
using (
  public.same_tenant(tenant_id)
  and (
    public.is_tenant_admin()
    or public.current_app_role() = 'teacher'
    or user_id = auth.uid()
  )
);

drop policy if exists location_logs_insert_self on public.location_logs;
create policy location_logs_insert_self
on public.location_logs
for insert
with check (
  public.same_tenant(tenant_id)
  and user_id = auth.uid()
);

drop policy if exists webauthn_challenges_self_or_admin on public.webauthn_challenges;
create policy webauthn_challenges_self_or_admin
on public.webauthn_challenges
for all
using (
  public.same_tenant(tenant_id)
  and (
    public.is_tenant_admin()
    or user_id = auth.uid()
    or email = auth.jwt() ->> 'email'
  )
)
with check (
  public.same_tenant(tenant_id)
);

drop policy if exists webauthn_credentials_self_or_admin on public.webauthn_credentials;
create policy webauthn_credentials_self_or_admin
on public.webauthn_credentials
for select
using (
  public.same_tenant(tenant_id)
  and (
    public.is_tenant_admin()
    or user_id = auth.uid()
  )
);

drop policy if exists webauthn_credentials_write_self_or_admin on public.webauthn_credentials;
create policy webauthn_credentials_write_self_or_admin
on public.webauthn_credentials
for all
using (
  public.same_tenant(tenant_id)
  and (
    public.is_tenant_admin()
    or user_id = auth.uid()
  )
)
with check (
  public.same_tenant(tenant_id)
  and (
    public.is_tenant_admin()
    or user_id = auth.uid()
  )
);

drop policy if exists audit_logs_admin_only on public.audit_logs;
create policy audit_logs_admin_only
on public.audit_logs
for select
using (
  public.same_tenant(tenant_id)
  and public.is_tenant_admin()
);

drop policy if exists user_presence_select_teacher_admin on public.user_presence;
create policy user_presence_select_teacher_admin
on public.user_presence
for select
using (
  public.same_tenant(tenant_id)
  and public.current_app_role() in ('admin', 'teacher', 'owner', 'super_admin')
);

drop policy if exists user_presence_write_self_or_service on public.user_presence;
create policy user_presence_write_self_or_service
on public.user_presence
for all
using (
  public.same_tenant(tenant_id)
  and (
    user_id = auth.uid()
    or public.is_tenant_admin()
  )
)
with check (
  public.same_tenant(tenant_id)
  and (
    user_id = auth.uid()
    or public.is_tenant_admin()
  )
);
