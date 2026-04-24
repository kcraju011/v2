# Current App Mapping

This mapping is based on the actual files in this repo:

- [code.gs](/c:/Users/kcraj/OneDrive/Pictures/Documents/Desktop/Av2/code.gs)
- [app.js](/c:/Users/kcraj/OneDrive/Pictures/Documents/Desktop/Av2/app.js)
- [tenant.js](/c:/Users/kcraj/OneDrive/Pictures/Documents/Desktop/Av2/tenant.js)
- [index.html](/c:/Users/kcraj/OneDrive/Pictures/Documents/Desktop/Av2/index.html)
- [styles.css](/c:/Users/kcraj/OneDrive/Pictures/Documents/Desktop/Av2/styles.css)
- [Nerve-Code.gs](/c:/Users/kcraj/OneDrive/Pictures/Documents/Desktop/Av2/Nerve-Code.gs)

## UI flows that must survive the migration

Student flows from `index.html` + `app.js`:

- sign in with email/password
- sign in with WebAuthn biometric
- mark entry immediately after successful sign-in
- get GPS coordinates and reverse-geocoded address before attendance write
- show active attendance card
- mark exit manually
- background location tracking after entry
- auto-exit when user leaves campus geofence

Teacher flows:

- teacher login
- create and close attendance sessions
- live dashboard with present/absent/recent tabs
- live map with Leaflet markers
- history viewer
- student roster
- analytics dashboard with daily, weekly, and per-user stats
- CSV export
- force-exit a live user

Admin flows:

- add departments
- add attendance locations
- map users to locations
- manage lookup-driven registration UI

Tenant flows from `tenant.js` + `Nerve-Code.gs`:

- boot app from tenant `guid`
- fetch organization branding and tenant API URL
- support tenant aliases and fallback profiles

## getApplicationFromGuid output

`getApplicationFromGuid(guid)` should now resolve the institute and return its canonical application URL as a first-class field.

Expected examples:

- `guid = 2` -> SIT
- `guid = 3` -> SSIT

Suggested response shape:

```json
{
  "success": true,
  "guid": "2",
  "alias": "SIT",
  "name": "Siddaganga Institute of Technology",
  "appUrl": "https://v2-phi-three.vercel.app/t/sit",
  "supabaseProjectMode": "dedicated-project"
}
```

That `appUrl` is important because frontend routing should no longer depend on a weak shared page plus only `q`.

## Canonical routing fix

The old deployment used `?q=2` and `?q=3` as runtime hints. That works for tenant lookup, but it is not a strong route boundary by itself.

The new Next.js app should use canonical tenant routes:

- `/t/sit`
- `/t/ssit`
- `/t/sit/login`
- `/t/ssit/login`
- `/t/sit/dashboard/live`
- `/t/ssit/dashboard/live`

Compatibility behavior:

- `/?q=2` should redirect to `/t/sit`
- `/?q=3` should redirect to `/t/ssit`
- `/login?q=2` should redirect to `/t/sit/login`
- `/dashboard/live?q=3` should redirect to `/t/ssit/dashboard/live`

That gives each tenant a stable URL namespace instead of sharing one page shell with a query-string switch.

## Database model change

This requirement changes the backend model from shared database isolation to separate database ownership per institute.

New rule:

- `SIT` has its own Supabase project/database
- `SSIT` has its own Supabase project/database
- each institute stores only its own users, sessions, attendance, locations, and analytics

That means tenant separation is enforced in two layers:

1. URL and routing choose the institute
2. the resolved institute chooses a different Supabase project/database

## API actions currently used by the frontend

Authentication and biometric:

- `registerUser`
- `loginUser`
- `logout`
- `refreshToken`
- `beginWebAuthnRegistration`
- `finishWebAuthnRegistration`
- `beginWebAuthnLogin`
- `finishWebAuthnLogin`

Attendance and location:

- `markEntry`
- `markExit`
- `trackLocation`
- `getMyAttendance`
- `forceExitUser`

Teacher dashboard:

- `createSession`
- `closeSession`
- `getActiveSession`
- `getSessions`
- `getDashboard`
- `getLiveAttendance`
- `getLiveUpdates`
- `getStudents`
- `exportAttendance`

Analytics:

- `getDailyStats`
- `getWeeklyStats`
- `getAttendanceInsights`
- `getUserAttendanceSummary`

Lookup/admin:

- `getRoles`
- `getDepartments`
- `getLocations`
- `getAttendanceLocations`
- `addDepartment`
- `addAttendanceLocation`
- `addUserLocMap`

Tenant bootstrap:

- `getApplicationFromGuid`
- `getOrgByGUID`
- `getRolesDepartments`

## Supabase design implications

These repo files required a few additions beyond the first draft:

- tenant registry fields on `tenants` for `guid`, `alias`, branding, app metadata, and legacy source URLs
- `attendance_types`, because the current backend seeds and exposes attendance-type lookup data
- `rate_limits`, because `code.gs` rate-limits login and WebAuthn actions
- `webauthn_challenges` and `webauthn_credentials`, because the current app performs browser WebAuthn registration and login
- `user_presence` and a live dashboard view, because the teacher UI expects live presence plus map markers
- `mark_attendance_exit(...)` RPC, because exit is a first-class frontend action
- `track_user_location(...)` RPC, because the student app sends periodic tracking updates after entry

## Recommended Next.js route mapping

Current `index.html` tabs map cleanly to these tenant-aware App Router screens:

- `/t/[tenant]/login` for student sign in
- `/t/[tenant]/register` for registration + WebAuthn onboarding
- `/t/[tenant]/dashboard/teacher`
- `/t/[tenant]/dashboard/live`
- `/t/[tenant]/dashboard/history`
- `/t/[tenant]/dashboard/analytics`
- `/t/[tenant]/dashboard/student`
- `/t/[tenant]/dashboard/admin`

## Realtime mapping

Current polling in `app.js` should become:

- `attendance` realtime for live presence status updates
- `location_logs` realtime for map updates
- `sessions` realtime for open/close state
- `user_presence` realtime for online/offline status

## What stays server-side

Do not move these rules to the client:

- geofence acceptance/rejection
- auto-exit decisions
- session window enforcement
- force-exit permissions
- tenant isolation
- WebAuthn challenge creation/verification
- rate limiting

## Backend tenant enforcement

Even with correct routing, tenant separation is only real if backend access uses the correct institute database and still scopes tenant-owned tables correctly.

Rules:

- always resolve tenant from canonical route or trusted tenant claims
- for dedicated databases, connect to the correct institute project first
- still filter tenant-owned tables with `tenant_id` inside that institute project where needed
- never trust a raw client-supplied `tenant_id` without server verification
- verify the authenticated user belongs to the resolved tenant before reading or mutating tenant data

Examples in the new code:

- [lib/tenant/config.ts](/c:/Users/kcraj/OneDrive/Pictures/Documents/Desktop/Av2/lib/tenant/config.ts)
- [lib/tenant/resolve.ts](/c:/Users/kcraj/OneDrive/Pictures/Documents/Desktop/Av2/lib/tenant/resolve.ts)
- [lib/supabase/tenant-client.ts](/c:/Users/kcraj/OneDrive/Pictures/Documents/Desktop/Av2/lib/supabase/tenant-client.ts)
- [lib/supabase/tenant-scope.ts](/c:/Users/kcraj/OneDrive/Pictures/Documents/Desktop/Av2/lib/supabase/tenant-scope.ts)
- [lib/supabase/middleware.ts](/c:/Users/kcraj/OneDrive/Pictures/Documents/Desktop/Av2/lib/supabase/middleware.ts)
