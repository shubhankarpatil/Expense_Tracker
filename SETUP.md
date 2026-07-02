# Setup guide

## 1. Google Cloud — OAuth + Sheets API

1. Go to [console.cloud.google.com](https://console.cloud.google.com) and create a project.
2. **Enable APIs**: search for and enable **Google Sheets API**.
3. **Create OAuth credentials**:
   - Credentials > Create Credentials > OAuth client ID
   - Application type: **Web application**
   - Authorised redirect URIs: add `https://<your-supabase-project>.supabase.co/auth/v1/callback`
     (and `http://localhost:3000/api/auth/callback` for local dev — but note Supabase handles the callback, not Next.js directly when using the Supabase OAuth flow)
   - Copy **Client ID** and **Client Secret**

## 2. Supabase project

1. Create a project at [supabase.com](https://supabase.com).
2. **Auth > Providers > Google** — paste your Client ID and Client Secret, enable the provider.
3. **Auth > URL Configuration** — add your Vercel domain (and `http://localhost:3000`) to the Allowed Redirect URLs.
4. **SQL Editor** — run the contents of `supabase/schema.sql` to create tables and RLS policies.

## 3. Environment variables

Copy `.env.local.example` to `.env.local` and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

On Vercel, add these same variables in **Project Settings > Environment Variables**.

## 4. Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## 5. Deploy to Vercel

```bash
npx vercel
```

Or connect the GitHub repo in the Vercel dashboard and it deploys automatically on push.

## 6. PWA icons

Place `icon-192.png` and `icon-512.png` in the `public/` folder before deploying.
These are used for the "Add to Home Screen" icon on mobile.

## Google Sheet format

Your sheet needs at least three columns with these **exact header names** (case-insensitive):

| Date       | Amount | Category      |
|------------|--------|---------------|
| 2025-06-01 | 450    | Food          |
| 2025-06-02 | 1200   | Bills         |

Accepted category values: `Food`, `Travel`, `Bills`, `Shopping`, `Entertainment`, `Health`.
Anything else becomes `Other`.
