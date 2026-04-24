-- BioAttend SaaS schema for Supabase/PostgreSQL
-- Multi-tenant design: single database with tenant_id isolation

create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";
create extension if not exists postgis;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.current_tenant_id()
returns uuid
language sql
stable
as $$
  select nullif(auth.jwt() ->> 'tenant_id', '')::uuid
$$;

create or replace function public.current_app_role()
returns text
language sql
stable
as $$
  select coalesce(auth.jwt() ->> 'role', '')
$$;

create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  guid text unique,
  alias text,
  name text not null,
  org_type text not null default 'college',
  city text,
  logo_url text,
  website text,
  address text,
  spreadsheet_url text,
  api_url text,
  application_id integer,
  application_name text,
  application_description text,
  geofence_center geography(point, 4326),
  geofence_radius_m integer not null default 2000 check (geofence_radius_m > 0),
  status text not null default 'active' check (status in ('active', 'suspended', 'archived')),
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.roles (
  id bigserial primary key,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  key text not null,
  name text not null,
  description text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (tenant_id, key),
  unique (tenant_id, name)
);

create table if not exists public.departments (
  id bigserial primary key,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  in_charge text,
  email text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (tenant_id, name)
);

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  role_id bigint references public.roles(id) on delete set null,
  department_id bigint references public.departments(id) on delete set null,
  institute_id text,
  full_name text not null,
  dob date,
  mobile text,
  email text not null,
  device_id text,
  biometric_credential_id text,
  avatar_path text,
  metadata jsonb not null default '{}'::jsonb,
  status text not null default 'active' check (status in ('active', 'inactive', 'blocked')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (tenant_id, email)
);

create table if not exists public.attendance_locations (
  id bigserial primary key,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  latitude double precision not null,
  longitude double precision not null,
  geo geography(point, 4326) generated always as (
    st_setsrid(st_makepoint(longitude, latitude), 4326)::geography
  ) stored,
  radius_m integer not null default 2000 check (radius_m > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.user_location_map (
  id bigserial primary key,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  attendance_location_id bigint not null references public.attendance_locations(id) on delete cascade,
  allowed_distance_m integer not null default 2000 check (allowed_distance_m > 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (tenant_id, user_id, attendance_location_id)
);

create table if not exists public.attendance_windows (
  id bigserial primary key,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  start_time time not null,
  duration_minutes integer not null check (duration_minutes > 0),
  status text not null default 'active' check (status in ('active', 'inactive')),
  location_id bigint references public.attendance_locations(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.attendance_types (
  id bigserial primary key,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  key text not null,
  label text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (tenant_id, key)
);

create table if not exists public.sessions (
  id bigserial primary key,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  teacher_id uuid references public.users(id) on delete set null,
  teacher_name text,
  subject text not null,
  session_date date not null,
  start_time timestamptz not null,
  end_time timestamptz not null,
  status text not null default 'open' check (status in ('scheduled', 'open', 'closed', 'expired')),
  window_minutes integer not null check (window_minutes > 0),
  is_auto boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.auth_sessions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  device_id text,
  refresh_token_hash text,
  status text not null default 'active' check (status in ('active', 'revoked', 'expired')),
  last_seen_at timestamptz,
  expires_at timestamptz,
  refresh_expires_at timestamptz,
  ip_hint inet,
  user_agent text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.rate_limits (
  id bigserial primary key,
  tenant_id uuid references public.tenants(id) on delete cascade,
  key text not null,
  action text not null,
  request_count integer not null default 0 check (request_count >= 0),
  window_started_at timestamptz not null default timezone('utc', now()),
  last_request_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (tenant_id, key, action)
);

create table if not exists public.attendance (
  id bigserial primary key,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  session_id bigint references public.sessions(id) on delete set null,
  attendance_date date not null,
  attendance_type text not null check (attendance_type in ('entry', 'exit')),
  entry_time timestamptz,
  exit_time timestamptz,
  login_method text not null default 'password',
  latitude double precision,
  longitude double precision,
  geo geography(point, 4326) generated always as (
    case
      when latitude is not null and longitude is not null
        then st_setsrid(st_makepoint(longitude, latitude), 4326)::geography
      else null
    end
  ) stored,
  attendance_location_id bigint references public.attendance_locations(id) on delete set null,
  address text,
  distance_from_center_m numeric(10,2),
  status text not null default 'in' check (status in ('in', 'out', 'auto_exited')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.location_logs (
  id bigserial primary key,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  session_id bigint references public.sessions(id) on delete set null,
  latitude double precision not null,
  longitude double precision not null,
  geo geography(point, 4326) generated always as (
    st_setsrid(st_makepoint(longitude, latitude), 4326)::geography
  ) stored,
  distance_from_center_m numeric(10,2),
  movement_m numeric(10,2),
  battery_level numeric(5,2),
  accuracy_m numeric(8,2),
  source text default 'gps',
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.webauthn_challenges (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid references public.users(id) on delete cascade,
  email text,
  action text not null check (action in ('register', 'login')),
  challenge text not null,
  credential_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  expires_at timestamptz not null,
  status text not null default 'pending' check (status in ('pending', 'used', 'expired'))
);

create table if not exists public.webauthn_credentials (
  id bigserial primary key,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  credential_id text not null,
  public_key text,
  transports text[],
  aaguid text,
  sign_count bigint not null default 0,
  status text not null default 'active' check (status in ('active', 'revoked')),
  last_used_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (tenant_id, credential_id)
);

create table if not exists public.audit_logs (
  id bigserial primary key,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  event_type text not null,
  actor_user_id uuid references public.users(id) on delete set null,
  actor_role text,
  target_user_id uuid references public.users(id) on delete set null,
  details jsonb not null default '{}'::jsonb,
  ip_hint inet,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.user_presence (
  user_id uuid primary key references public.users(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  session_id bigint references public.sessions(id) on delete set null,
  last_seen_at timestamptz not null default timezone('utc', now()),
  last_latitude double precision,
  last_longitude double precision,
  last_distance_from_center_m numeric(10,2),
  online boolean not null default false,
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_roles_tenant_id on public.roles (tenant_id);
create index if not exists idx_departments_tenant_id on public.departments (tenant_id);
create index if not exists idx_users_tenant_id on public.users (tenant_id);
create index if not exists idx_users_role_tenant on public.users (tenant_id, role_id);
create index if not exists idx_locations_tenant_id on public.attendance_locations (tenant_id);
create index if not exists idx_user_location_map_tenant_user on public.user_location_map (tenant_id, user_id);
create index if not exists idx_attendance_types_tenant_id on public.attendance_types (tenant_id);
create index if not exists idx_sessions_tenant_date on public.sessions (tenant_id, session_date, status);
create index if not exists idx_auth_sessions_tenant_user on public.auth_sessions (tenant_id, user_id, status);
create index if not exists idx_rate_limits_tenant_key on public.rate_limits (tenant_id, key, action);
create index if not exists idx_attendance_tenant_user_date on public.attendance (tenant_id, user_id, attendance_date desc);
create index if not exists idx_attendance_tenant_session on public.attendance (tenant_id, session_id);
create index if not exists idx_attendance_status on public.attendance (tenant_id, status);
create index if not exists idx_location_logs_tenant_user_created on public.location_logs (tenant_id, user_id, created_at desc);
create index if not exists idx_webauthn_challenges_tenant_user on public.webauthn_challenges (tenant_id, user_id, created_at desc);
create index if not exists idx_webauthn_credentials_tenant_user on public.webauthn_credentials (tenant_id, user_id, status);
create index if not exists idx_audit_logs_tenant_created on public.audit_logs (tenant_id, created_at desc);
create index if not exists idx_presence_tenant_session on public.user_presence (tenant_id, session_id);

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tenant_id uuid;
  v_role_key text;
  v_role_id bigint;
begin
  v_tenant_id := nullif(new.raw_user_meta_data ->> 'tenant_id', '')::uuid;
  v_role_key := coalesce(new.raw_user_meta_data ->> 'role', 'student');

  if v_tenant_id is null then
    raise exception 'tenant_id is required in user metadata';
  end if;

  select id into v_role_id
  from public.roles
  where tenant_id = v_tenant_id and key = v_role_key
  limit 1;

  insert into public.users (
    id,
    tenant_id,
    role_id,
    department_id,
    institute_id,
    full_name,
    dob,
    mobile,
    email,
    device_id,
    biometric_credential_id,
    metadata
  )
  values (
    new.id,
    v_tenant_id,
    v_role_id,
    nullif(new.raw_user_meta_data ->> 'department_id', '')::bigint,
    new.raw_user_meta_data ->> 'institute_id',
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    nullif(new.raw_user_meta_data ->> 'dob', '')::date,
    new.raw_user_meta_data ->> 'mobile',
    new.email,
    new.raw_user_meta_data ->> 'device_id',
    new.raw_user_meta_data ->> 'biometric_credential_id',
    coalesce(new.raw_user_meta_data, '{}'::jsonb)
  )
  on conflict (id) do update
  set tenant_id = excluded.tenant_id,
      role_id = excluded.role_id,
      department_id = excluded.department_id,
      institute_id = excluded.institute_id,
      full_name = excluded.full_name,
      dob = excluded.dob,
      mobile = excluded.mobile,
      email = excluded.email,
      device_id = excluded.device_id,
      biometric_credential_id = excluded.biometric_credential_id,
      metadata = excluded.metadata,
      updated_at = timezone('utc', now());

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_auth_user();

create or replace function public.mark_attendance_entry(
  p_location_id bigint,
  p_latitude double precision,
  p_longitude double precision,
  p_address text default null,
  p_login_method text default 'password'
)
returns public.attendance
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user public.users;
  v_map public.user_location_map;
  v_location public.attendance_locations;
  v_session public.sessions;
  v_distance numeric;
  v_result public.attendance;
begin
  select * into v_user
  from public.users
  where id = auth.uid() and tenant_id = public.current_tenant_id();

  if v_user.id is null then
    raise exception 'User profile not found';
  end if;

  select * into v_map
  from public.user_location_map
  where tenant_id = v_user.tenant_id and user_id = v_user.id
  order by id asc
  limit 1;

  select * into v_location
  from public.attendance_locations
  where id = coalesce(p_location_id, v_map.attendance_location_id)
    and tenant_id = v_user.tenant_id
    and is_active = true;

  if v_location.id is null then
    raise exception 'Attendance location not found';
  end if;

  v_distance := st_distance(
    st_setsrid(st_makepoint(p_longitude, p_latitude), 4326)::geography,
    v_location.geo
  );

  if v_distance > coalesce(v_map.allowed_distance_m, v_location.radius_m) then
    raise exception 'Outside geofence';
  end if;

  select * into v_session
  from public.sessions
  where tenant_id = v_user.tenant_id
    and status = 'open'
    and start_time <= timezone('utc', now())
    and end_time >= timezone('utc', now())
  order by start_time desc
  limit 1;

  insert into public.attendance (
    tenant_id,
    user_id,
    session_id,
    attendance_date,
    attendance_type,
    entry_time,
    login_method,
    latitude,
    longitude,
    attendance_location_id,
    address,
    distance_from_center_m,
    status
  )
  values (
    v_user.tenant_id,
    v_user.id,
    v_session.id,
    current_date,
    'entry',
    timezone('utc', now()),
    p_login_method,
    p_latitude,
    p_longitude,
    v_location.id,
    p_address,
    v_distance,
    'in'
  )
  returning * into v_result;

  return v_result;
end;
$$;

create or replace function public.mark_attendance_exit(
  p_latitude double precision default null,
  p_longitude double precision default null,
  p_address text default null
)
returns public.attendance
language plpgsql
security definer
set search_path = public
as $$
declare
  v_attendance public.attendance;
  v_result public.attendance;
  v_location public.attendance_locations;
  v_distance numeric;
begin
  select * into v_attendance
  from public.attendance
  where tenant_id = public.current_tenant_id()
    and user_id = auth.uid()
    and status = 'in'
    and exit_time is null
  order by created_at desc
  limit 1;

  if v_attendance.id is null then
    raise exception 'No open attendance row found';
  end if;

  if v_attendance.attendance_location_id is not null and p_latitude is not null and p_longitude is not null then
    select * into v_location
    from public.attendance_locations
    where id = v_attendance.attendance_location_id
      and tenant_id = v_attendance.tenant_id;

    if v_location.id is not null then
      v_distance := st_distance(
        st_setsrid(st_makepoint(p_longitude, p_latitude), 4326)::geography,
        v_location.geo
      );
    end if;
  end if;

  update public.attendance
  set attendance_type = 'exit',
      exit_time = timezone('utc', now()),
      latitude = coalesce(p_latitude, latitude),
      longitude = coalesce(p_longitude, longitude),
      address = coalesce(p_address, address),
      distance_from_center_m = coalesce(v_distance, distance_from_center_m),
      status = 'out'
  where id = v_attendance.id
  returning * into v_result;

  return v_result;
end;
$$;

create or replace function public.track_user_location(
  p_latitude double precision,
  p_longitude double precision,
  p_accuracy_m numeric default null,
  p_battery_level numeric default null,
  p_source text default 'gps'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user public.users;
  v_open_attendance public.attendance;
  v_location public.attendance_locations;
  v_last_log public.location_logs;
  v_distance numeric;
  v_movement numeric;
begin
  select * into v_user
  from public.users
  where id = auth.uid()
    and tenant_id = public.current_tenant_id();

  if v_user.id is null then
    raise exception 'User profile not found';
  end if;

  select * into v_open_attendance
  from public.attendance
  where tenant_id = v_user.tenant_id
    and user_id = v_user.id
    and status = 'in'
  order by created_at desc
  limit 1;

  if v_open_attendance.attendance_location_id is not null then
    select * into v_location
    from public.attendance_locations
    where id = v_open_attendance.attendance_location_id
      and tenant_id = v_user.tenant_id;
  end if;

  if v_location.id is not null then
    v_distance := st_distance(
      st_setsrid(st_makepoint(p_longitude, p_latitude), 4326)::geography,
      v_location.geo
    );
  end if;

  select * into v_last_log
  from public.location_logs
  where tenant_id = v_user.tenant_id
    and user_id = v_user.id
  order by created_at desc
  limit 1;

  if v_last_log.id is not null then
    v_movement := st_distance(
      st_setsrid(st_makepoint(v_last_log.longitude, v_last_log.latitude), 4326)::geography,
      st_setsrid(st_makepoint(p_longitude, p_latitude), 4326)::geography
    );
  end if;

  if v_movement is null or v_movement > 15 then
    insert into public.location_logs (
      tenant_id,
      user_id,
      session_id,
      latitude,
      longitude,
      distance_from_center_m,
      movement_m,
      battery_level,
      accuracy_m,
      source
    )
    values (
      v_user.tenant_id,
      v_user.id,
      v_open_attendance.session_id,
      p_latitude,
      p_longitude,
      v_distance,
      coalesce(v_movement, 0),
      p_battery_level,
      p_accuracy_m,
      p_source
    );
  end if;

  insert into public.user_presence (
    user_id,
    tenant_id,
    session_id,
    last_seen_at,
    last_latitude,
    last_longitude,
    last_distance_from_center_m,
    online
  )
  values (
    v_user.id,
    v_user.tenant_id,
    v_open_attendance.session_id,
    timezone('utc', now()),
    p_latitude,
    p_longitude,
    v_distance,
    true
  )
  on conflict (user_id) do update
  set tenant_id = excluded.tenant_id,
      session_id = excluded.session_id,
      last_seen_at = excluded.last_seen_at,
      last_latitude = excluded.last_latitude,
      last_longitude = excluded.last_longitude,
      last_distance_from_center_m = excluded.last_distance_from_center_m,
      online = true,
      updated_at = timezone('utc', now());

  return jsonb_build_object(
    'success', true,
    'distance_from_center_m', v_distance,
    'movement_m', v_movement,
    'session_id', v_open_attendance.session_id
  );
end;
$$;

create or replace view public.daily_attendance_summary as
select
  tenant_id,
  attendance_date,
  count(*) filter (where attendance_type = 'entry') as total_entries,
  count(*) filter (where status in ('out', 'auto_exited')) as total_exits,
  count(distinct user_id) as unique_users
from public.attendance
group by tenant_id, attendance_date;

create or replace view public.weekly_attendance_summary as
select
  tenant_id,
  date_trunc('week', attendance_date::timestamp)::date as week_start,
  count(*) filter (where attendance_type = 'entry') as total_entries,
  count(*) filter (where status in ('out', 'auto_exited')) as total_exits,
  count(distinct user_id) as unique_users
from public.attendance
group by tenant_id, date_trunc('week', attendance_date::timestamp)::date;

create or replace view public.user_attendance_stats as
select
  tenant_id,
  user_id,
  count(*) filter (where attendance_type = 'entry') as total_entries,
  count(*) filter (where status in ('out', 'auto_exited')) as total_exits,
  max(entry_time) as last_entry_at,
  max(exit_time) as last_exit_at
from public.attendance
group by tenant_id, user_id;

create or replace view public.live_attendance_dashboard as
select
  p.tenant_id,
  p.user_id,
  u.full_name,
  u.email,
  d.name as department_name,
  p.session_id,
  p.last_seen_at,
  p.last_latitude,
  p.last_longitude,
  p.last_distance_from_center_m,
  p.online,
  a.status as attendance_status,
  a.entry_time,
  a.exit_time
from public.user_presence p
join public.users u on u.id = p.user_id
left join public.departments d on d.id = u.department_id
left join lateral (
  select status, entry_time, exit_time
  from public.attendance a
  where a.tenant_id = p.tenant_id
    and a.user_id = p.user_id
  order by a.created_at desc
  limit 1
) a on true;

drop trigger if exists trg_tenants_updated_at on public.tenants;
create trigger trg_tenants_updated_at before update on public.tenants
for each row execute procedure public.set_updated_at();

drop trigger if exists trg_roles_updated_at on public.roles;
create trigger trg_roles_updated_at before update on public.roles
for each row execute procedure public.set_updated_at();

drop trigger if exists trg_departments_updated_at on public.departments;
create trigger trg_departments_updated_at before update on public.departments
for each row execute procedure public.set_updated_at();

drop trigger if exists trg_users_updated_at on public.users;
create trigger trg_users_updated_at before update on public.users
for each row execute procedure public.set_updated_at();

drop trigger if exists trg_attendance_locations_updated_at on public.attendance_locations;
create trigger trg_attendance_locations_updated_at before update on public.attendance_locations
for each row execute procedure public.set_updated_at();

drop trigger if exists trg_user_location_map_updated_at on public.user_location_map;
create trigger trg_user_location_map_updated_at before update on public.user_location_map
for each row execute procedure public.set_updated_at();

drop trigger if exists trg_attendance_windows_updated_at on public.attendance_windows;
create trigger trg_attendance_windows_updated_at before update on public.attendance_windows
for each row execute procedure public.set_updated_at();

drop trigger if exists trg_attendance_types_updated_at on public.attendance_types;
create trigger trg_attendance_types_updated_at before update on public.attendance_types
for each row execute procedure public.set_updated_at();

drop trigger if exists trg_sessions_updated_at on public.sessions;
create trigger trg_sessions_updated_at before update on public.sessions
for each row execute procedure public.set_updated_at();

drop trigger if exists trg_auth_sessions_updated_at on public.auth_sessions;
create trigger trg_auth_sessions_updated_at before update on public.auth_sessions
for each row execute procedure public.set_updated_at();

drop trigger if exists trg_rate_limits_updated_at on public.rate_limits;
create trigger trg_rate_limits_updated_at before update on public.rate_limits
for each row execute procedure public.set_updated_at();

drop trigger if exists trg_attendance_updated_at on public.attendance;
create trigger trg_attendance_updated_at before update on public.attendance
for each row execute procedure public.set_updated_at();

drop trigger if exists trg_presence_updated_at on public.user_presence;
create trigger trg_presence_updated_at before update on public.user_presence
for each row execute procedure public.set_updated_at();

drop trigger if exists trg_webauthn_credentials_updated_at on public.webauthn_credentials;
create trigger trg_webauthn_credentials_updated_at before update on public.webauthn_credentials
for each row execute procedure public.set_updated_at();
