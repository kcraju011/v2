# Next.js SaaS Starter

This starter sits beside the existing Apps Script version and gives you the new frontend shell for the Supabase migration.

## Run locally

1. Copy `.env.example` to `.env.local`
2. Fill in each institute's Supabase project values
3. Install dependencies:

```bash
npm install
```

4. Start the app:

```bash
npm run dev
```

## Included

- Next.js 14 App Router
- Tailwind CSS
- Supabase client/server helpers
- Per-institute Supabase project registry
- Middleware wiring
- Tenant-aware auth screens
- Teacher dashboard shell
- Live attendance panel and Leaflet map
- Admin and analytics workspace shells
- Manifest and service worker starter for PWA support

## Important

Do not commit real service-role credentials into the repo. Use `.env.local` and rotate any key that has already been shared outside your private environment.

This version assumes:

- `SIT` uses its own Supabase project/database
- `SSIT` uses its own Supabase project/database
- tenant routing selects the correct project from the URL
