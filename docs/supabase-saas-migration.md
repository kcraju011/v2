# BioAttend Supabase SaaS Migration

This repo currently contains a Google Apps Script attendance backend in [code.gs](/c:/Users/kcraj/OneDrive/Pictures/Documents/Desktop/Av2/code.gs). The new target architecture moves that logic into Supabase + Next.js 14 while preserving the existing behavior:

- institute-aware tenant routing
- role-based access for admin, teacher, student, employee
- session-based attendance
- geofence-based entry and auto-exit
- live dashboard and location tracking
- analytics and reporting

Important architecture update:

- `SIT` should use its own Supabase project/database
- `SSIT` should use its own Supabase project/database
- canonical tenant URL chooses the correct institute app context

## 1. PostgreSQL schema

The base schema is in [supabase/schema.sql](/c:/Users/kcraj/OneDrive/Pictures/Documents/Desktop/Av2/supabase/schema.sql), with seed data in [supabase/seed.sql](/c:/Users/kcraj/OneDrive/Pictures/Documents/Desktop/Av2/supabase/seed.sql).

Core tables:

- `tenants`
- `roles`
- `departments`
- `users`
- `attendance_locations`
- `user_location_map`
- `attendance_windows`
- `attendance_types`
- `sessions`
- `auth_sessions`
- `rate_limits`
- `attendance`
- `location_logs`
- `webauthn_challenges`
- `webauthn_credentials`
- `audit_logs`
- `user_presence`

Design notes:

- Every tenant-owned table includes `tenant_id`.
- `public.users.id` maps directly to `auth.users.id`.
- PostGIS is used for accurate geofence distance checks.
- SQL views provide `daily_attendance_summary`, `weekly_attendance_summary`, and `user_attendance_stats`.
- `mark_attendance_entry(...)`, `mark_attendance_exit(...)`, and `track_user_location(...)` are included as RPC starters for secure server-side attendance and location writes.
- `tenants` now includes `guid`, `alias`, branding, and application metadata to match the current `tenant.js` and `Nerve-Code.gs` bootstrap flow.

## 2. RLS policies

Policies are in [supabase/rls.sql](/c:/Users/kcraj/OneDrive/Pictures/Documents/Desktop/Av2/supabase/rls.sql).

The policy model is:

- all access must satisfy `tenant_id = auth.jwt()->>'tenant_id'`
- students can only read/write their own rows where appropriate
- teachers can read tenant attendance/location/session data
- admins can manage full tenant data

If you keep one dedicated Supabase project per institute, RLS still matters inside that institute project, but hard isolation already starts one layer earlier because SIT and SSIT are not sharing the same database.

JWT expectations:

- `tenant_id`
- `role`
- optionally `device_id`

Recommended auth flow:

1. Sign up or invite user through Supabase Auth.
2. Set custom claims or app metadata with `tenant_id`, `role`, `device_id`.
3. Mirror auth user into `public.users` via trigger.
4. Use RLS everywhere; only use service role inside Edge Functions/admin jobs.

## 3. Supabase setup steps

1. Create one Supabase project for `SIT`.
2. Create one separate Supabase project for `SSIT`.
3. In each project, run [supabase/schema.sql](/c:/Users/kcraj/OneDrive/Pictures/Documents/Desktop/Av2/supabase/schema.sql).
4. In each project, run [supabase/rls.sql](/c:/Users/kcraj/OneDrive/Pictures/Documents/Desktop/Av2/supabase/rls.sql).
5. Enable email/password auth in each project's Supabase Auth.
6. Create Storage buckets in each project:
   - `avatars`
   - `reports`
   - optionally `tenant-assets`
7. Enable Realtime in each project for:
   - `attendance`
   - `location_logs`
   - `user_presence`
   - `sessions`
8. Deploy the Edge Function in [supabase/functions/auto-exit/index.ts](/c:/Users/kcraj/OneDrive/Pictures/Documents/Desktop/Av2/supabase/functions/auto-exit/index.ts) to each project.
9. Add a scheduled trigger for auto-exit in each project, for example every 1 minute.
10. Seed `SIT` data into the `SIT` project and `SSIT` data into the `SSIT` project.
11. Build the Next.js frontend against tenant-aware Supabase helpers.

Environment variables for Next.js:

```bash
NEXT_PUBLIC_SUPABASE_URL_SIT=https://your-sit-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY_SIT=your-sit-anon-key
SUPABASE_SERVICE_ROLE_KEY_SIT=your-sit-service-role-key

NEXT_PUBLIC_SUPABASE_URL_SSIT=https://your-ssit-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY_SSIT=your-ssit-anon-key
SUPABASE_SERVICE_ROLE_KEY_SSIT=your-ssit-service-role-key
```

Use [lib/supabase/tenant-client.ts](/c:/Users/kcraj/OneDrive/Pictures/Documents/Desktop/Av2/lib/supabase/tenant-client.ts) to choose the correct project from the resolved tenant.

## 4. Realtime subscription example

Use Supabase Realtime instead of polling:

```tsx
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type AttendanceRow = {
  id: number;
  user_id: string;
  status: "in" | "out" | "auto_exited";
  entry_time: string | null;
  exit_time: string | null;
};

export function LiveAttendanceFeed({ tenantId }: { tenantId: string }) {
  const supabase = createClient();
  const [rows, setRows] = useState<AttendanceRow[]>([]);

  useEffect(() => {
    const channel = supabase
      .channel(`attendance:${tenantId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "attendance",
          filter: `tenant_id=eq.${tenantId}`,
        },
        (payload) => {
          const next = payload.new as AttendanceRow;
          setRows((current) => {
            const withoutCurrent = current.filter((row) => row.id !== next.id);
            return [next, ...withoutCurrent].slice(0, 100);
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, tenantId]);

  return (
    <div className="space-y-2">
      {rows.map((row) => (
        <div key={row.id} className="rounded-xl border p-3">
          <div className="font-medium">{row.user_id}</div>
          <div className="text-sm text-slate-500">
            {row.status} | {row.entry_time ?? "-"} | {row.exit_time ?? "-"}
          </div>
        </div>
      ))}
    </div>
  );
}
```

You should make a second subscription for `location_logs` and hydrate a Leaflet map from the latest location per user.

For this repo specifically, current `app.js` polling around `getLiveAttendance` and `getLiveUpdates` maps best to:

- one `attendance` channel for status changes
- one `location_logs` channel for map movement
- one `sessions` channel for session open/close updates
- optional `user_presence` channel for online/offline freshness

## 5. Edge Function example

The starter function is in [supabase/functions/auto-exit/index.ts](/c:/Users/kcraj/OneDrive/Pictures/Documents/Desktop/Av2/supabase/functions/auto-exit/index.ts).

Behavior:

- finds users still marked `in`
- checks their latest location
- compares it with the assigned attendance location radius
- auto-updates the attendance row to `auto_exited`
- writes an audit log

Production improvements to add next:

- batch processing by tenant
- stale-location timeout handling
- idempotency guard to avoid double exits
- push notification hook for teacher/admin dashboards

## 6. Sample analytics queries

Daily summary:

```sql
select *
from public.daily_attendance_summary
where tenant_id = :tenant_id
order by attendance_date desc
limit 30;
```

Weekly summary:

```sql
select *
from public.weekly_attendance_summary
where tenant_id = :tenant_id
order by week_start desc
limit 12;
```

User stats:

```sql
select
  u.full_name,
  s.total_entries,
  s.total_exits,
  s.last_entry_at,
  s.last_exit_at
from public.user_attendance_stats s
join public.users u on u.id = s.user_id
where s.tenant_id = :tenant_id
order by s.total_entries desc;
```

Live map query:

```sql
select
  u.id as user_id,
  u.full_name,
  p.last_latitude,
  p.last_longitude,
  p.last_seen_at,
  p.online,
  a.status as attendance_status
from public.user_presence p
join public.users u on u.id = p.user_id
left join lateral (
  select status
  from public.attendance a
  where a.tenant_id = p.tenant_id
    and a.user_id = p.user_id
  order by a.created_at desc
  limit 1
) a on true
where p.tenant_id = :tenant_id;
```

## 7. Next.js 14 folder structure

Recommended production structure:

```text
app/
  (marketing)/
    page.tsx
    pricing/page.tsx
  (auth)/
    login/page.tsx
    register/page.tsx
  (dashboard)/
    layout.tsx
    admin/page.tsx
    teacher/page.tsx
    student/page.tsx
    live/page.tsx
    analytics/page.tsx
  api/
    webhooks/
      auth/route.ts
components/
  dashboard/
  maps/
  attendance/
  auth/
  ui/
lib/
  supabase/
    client.ts
    server.ts
    middleware.ts
  auth/
  geofence/
  analytics/
  validations/
hooks/
  use-live-attendance.ts
  use-live-locations.ts
supabase/
  schema.sql
  rls.sql
  functions/
    auto-exit/
      index.ts
public/
  manifest.webmanifest
  icons/
styles/
  globals.css
```

## 8. Migration mapping from Apps Script

Current Apps Script concepts map like this:

- `Users` sheet -> `public.users`
- `Departments` -> `public.departments`
- `Roles` -> `public.roles`
- Nerve `Tenants` sheet -> central tenant registry plus institute app URLs
- `Attendance` -> `public.attendance`
- `LocationMonitor` -> `public.location_logs`
- `Sessions` -> `public.sessions`
- `AuthSessions` -> `public.auth_sessions`
- `AttendanceLocations` -> `public.attendance_locations`
- `UserAttendanceLocationMap` -> `public.user_location_map`
- `AttendanceWindows` -> `public.attendance_windows`
- `AttendanceType` -> `public.attendance_types`
- `RateLimit` -> `public.rate_limits`
- `WebAuthnChallenges` -> `public.webauthn_challenges`
- `WebAuthnCredentials` -> `public.webauthn_credentials`
- audit events -> `public.audit_logs`

Function mapping:

- `registerUser` -> Supabase Auth signup + profile trigger
- `signInUser` -> Supabase Auth signInWithPassword
- `markEntry` -> RPC or server action + insert into `attendance`
- `markExit` -> authenticated update of active attendance row
- `trackLocation` -> `track_user_location(...)` RPC + `location_logs` + `user_presence`
- `createSession` -> insert into `sessions`
- `getDashboard` and `getLiveUpdates` -> SQL queries + Realtime subscriptions
- WebAuthn functions -> browser WebAuthn + `webauthn_challenges` + `webauthn_credentials`
- `tenant.js` + `Nerve-Code.gs` -> tenant bootstrap from registry, including canonical institute `appUrl`

There is a repo-specific detail here: the current UI in [index.html](/c:/Users/kcraj/OneDrive/Pictures/Documents/Desktop/Av2/index.html) has three major surfaces inside one shell:

- student auth and attendance
- teacher session/live/history/students/analytics
- admin lookup management

That means the Next.js migration should preserve role-based route gating, but the underlying feature set is already very clear from the current frontend.

## 9. Recommended migration order

1. Build Supabase project and schema first.
2. Move auth and profile creation.
3. Move attendance entry/exit flows.
4. Move location tracking and live dashboard.
5. Add analytics views and reports.
6. Add Edge Functions and scheduled jobs.
7. Replace the old frontend with Next.js 14 app router screens.

## 10. Production notes

- Keep all tenant filters server-side and RLS-enforced.
- Do not trust client-supplied `tenant_id`.
- Prefer RPCs/Edge Functions for geofence decisions.
- Use Storage signed URLs for reports and private photos.
- Add rate limiting for location updates and attendance writes.
- Add device attestation and stronger WebAuthn verification later if biometric login stays in scope.
- Replace current client-side reverse-geocoding with a controlled server-side or proxied service before production scale.
- For dedicated institute databases, never let SIT frontend requests touch SSIT Supabase credentials, and vice versa.

## 11. Canonical tenant routing

Do not keep tenant identity only in `?q=...` once the app is on Next.js.

Use canonical tenant routes:

- `/t/sit`
- `/t/ssit`
- `/t/[tenant]/login`
- `/t/[tenant]/register`
- `/t/[tenant]/dashboard/...`

Then keep compatibility redirects for old links:

- `/?q=2` -> `/t/sit`
- `/?q=3` -> `/t/ssit`

Canonical institute URLs can also be returned by `getApplicationFromGuid`:

- `2` -> `https://v2-phi-three.vercel.app/t/sit`
- `3` -> `https://v2-phi-three.vercel.app/t/ssit`

The Next.js tenant routing helpers now live in:

- [lib/tenant/config.ts](/c:/Users/kcraj/OneDrive/Pictures/Documents/Desktop/Av2/lib/tenant/config.ts)
- [lib/tenant/resolve.ts](/c:/Users/kcraj/OneDrive/Pictures/Documents/Desktop/Av2/lib/tenant/resolve.ts)
- [lib/supabase/middleware.ts](/c:/Users/kcraj/OneDrive/Pictures/Documents/Desktop/Av2/lib/supabase/middleware.ts)
- [lib/supabase/tenant-client.ts](/c:/Users/kcraj/OneDrive/Pictures/Documents/Desktop/Av2/lib/supabase/tenant-client.ts)

## 12. File-specific migration note

The detailed file-by-file mapping is in [docs/current-app-to-supabase-mapping.md](/c:/Users/kcraj/OneDrive/Pictures/Documents/Desktop/Av2/docs/current-app-to-supabase-mapping.md). That document was written after reading the full current app surface, not only `code.gs`.
