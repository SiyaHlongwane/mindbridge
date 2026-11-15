# MindBridge setup

1. Install Node.js 20.19+ (or run `nvm install` and `nvm use`).
2. Run `npm install`.
3. Copy `.env.example` to `.env` and enter your Supabase project URL and public anon key. Never use a service-role key in the frontend. Without these values, public pages work and authentication shows a setup notice.
4. Enable Supabase email/password authentication and configure the app URL and permitted redirects. Authentication expects a `profiles` table with `id` (auth user UUID), `full_name` and `role` (`individual`, `professional`, `admin`). Configure RLS so users read only their own profile; keep role assignment privileged. A missing row defaults to `individual`. Schema and policies are not included in this step.
5. Run `npm run dev -- --host 0.0.0.0 --port 5173`.
6. Run `npm run lint` and `npm run build` before deployment. Vercel output directory is `dist`; set the same two `VITE_SUPABASE_*` variables there.
