# MindBridge setup

1. Install Node.js 20.19+ (or run `nvm install` and `nvm use`).
2. Run `npm install`.
3. Copy `.env.example` to `.env` and enter your Supabase project URL and public anon key. Never use a service-role key in the frontend. Without these values, public pages work and authentication shows a setup notice.
4. Enable Supabase email/password authentication and configure the app URL and permitted redirects. Complete the database setup below. A missing profile defaults to `individual` in the frontend.
5. Run `npm run dev -- --host 0.0.0.0 --port 5173`.
6. Run `npm run lint` and `npm run build` before deployment. Vercel output directory is `dist`; set the same two `VITE_SUPABASE_*` variables there.

## Database setup

Run `supabase/schema.sql`, then `supabase/seed.sql`, in the Supabase SQL editor as `postgres`. Both can be re-run. Seed listings are synthetic and unverified, not real support recommendations.

For a demo only, optionally turn off email confirmation in Supabase Authentication settings. Register synthetic demo accounts through the app, then run the commented role-promotion statements at the bottom of `seed.sql`, replacing the example emails. New accounts always start as individuals regardless of signup metadata. SQL-editor role promotion without a user session is reserved for `postgres`; signed-in clients need an existing admin role.

Apply the schema before creating demo accounts so the signup trigger creates profiles. RLS protects all tables; the frontend role checks are only navigation controls. Audit records omit assessment answers and note content.
