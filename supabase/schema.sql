begin;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'individual' check (role in ('individual','professional','admin')),
  created_at timestamptz not null default now()
);

create or replace function public.app_role() returns text
language sql stable security definer set search_path = public
as $$ select role from public.profiles where id = auth.uid() $$;

create table if not exists public.consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  consent_type text not null check (consent_type in ('terms','share_results','share_contact')),
  granted boolean not null default false,
  updated_at timestamptz not null default now(),
  unique (user_id, consent_type)
);
create table if not exists public.assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  instrument text not null check (instrument in ('PHQ9','GAD7')),
  total_score integer not null,
  severity text not null,
  answers jsonb not null,
  created_at timestamptz not null default now(),
  check (total_score >= 0 and ((instrument = 'PHQ9' and total_score <= 27) or (instrument = 'GAD7' and total_score <= 21)))
);
create table if not exists public.support_services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  tier text not null check (tier in ('self_help','community','primary_care','mental_health_professional','specialist')),
  description text,
  contact text,
  website text,
  verified boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  service_id uuid not null references public.support_services(id),
  professional_id uuid references public.profiles(id) on delete set null,
  status text not null default 'pending' check (status in ('pending','accepted','declined','appointment_scheduled','follow_up_completed','cancelled','unable_to_contact')),
  share_results boolean not null default false,
  share_contact boolean not null default false,
  user_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists referrals_one_open_service on public.referrals(user_id, service_id)
  where status not in ('declined','follow_up_completed','cancelled','unable_to_contact');
create table if not exists public.follow_ups (
  id uuid primary key default gen_random_uuid(),
  referral_id uuid not null references public.referrals(id) on delete cascade,
  author_id uuid not null default auth.uid() references public.profiles(id),
  note text,
  outcome text,
  created_at timestamptz not null default now()
);
create table if not exists public.audit_logs (
  id bigserial primary key,
  actor_id uuid,
  action text not null,
  table_name text not null,
  record_id uuid not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists assessments_user_id_idx on public.assessments(user_id);
create index if not exists referrals_user_id_idx on public.referrals(user_id);
create index if not exists referrals_service_id_idx on public.referrals(service_id);
create index if not exists referrals_professional_id_idx on public.referrals(professional_id);
create index if not exists referrals_status_idx on public.referrals(status);
create index if not exists follow_ups_referral_id_idx on public.follow_ups(referral_id);
create index if not exists follow_ups_author_id_idx on public.follow_ups(author_id);
create index if not exists audit_logs_actor_id_idx on public.audit_logs(actor_id);

create or replace function public.create_profile() returns trigger
language plpgsql security definer set search_path = public
as $$ begin
  insert into public.profiles(id, full_name, role)
  values (new.id, new.raw_user_meta_data->>'full_name', 'individual') on conflict (id) do nothing;
  return new;
end $$;
drop trigger if exists create_profile_on_signup on auth.users;
create trigger create_profile_on_signup after insert on auth.users for each row execute function public.create_profile();

create or replace function public.guard_profile_role() returns trigger
language plpgsql set search_path = public
as $$ begin
  if new.role is distinct from old.role and public.app_role() is distinct from 'admin'
    and auth.uid() is not null then
    raise exception 'Only an administrator can change roles' using errcode = '42501';
  end if;
  return new;
end $$;
drop trigger if exists guard_profile_role on public.profiles;
create trigger guard_profile_role before update on public.profiles for each row execute function public.guard_profile_role();

create or replace function public.guard_referral_update() returns trigger
language plpgsql set search_path = public
as $$ begin
  if public.app_role() = 'admin' or auth.uid() is null then
    new.updated_at := now();
    return new;
  end if;
  if old.user_id = auth.uid() then
    if (to_jsonb(new) - array['status','share_results','share_contact','updated_at']) is distinct from
       (to_jsonb(old) - array['status','share_results','share_contact','updated_at'])
       or (new.status is distinct from old.status and new.status <> 'cancelled') then
      raise exception 'Owners may only cancel or change sharing flags' using errcode = '42501';
    end if;
  elsif old.professional_id = auth.uid() and public.app_role() = 'professional' then
    if (to_jsonb(new) - array['status','updated_at']) is distinct from (to_jsonb(old) - array['status','updated_at'])
       or new.status = 'cancelled' then
      raise exception 'Professionals may only update status, not cancel' using errcode = '42501';
    end if;
  else
    raise exception 'Referral update not permitted' using errcode = '42501';
  end if;
  new.updated_at := now();
  return new;
end $$;
drop trigger if exists guard_referral_update on public.referrals;
create trigger guard_referral_update before update on public.referrals for each row execute function public.guard_referral_update();

create or replace function public.touch_consent() returns trigger
language plpgsql set search_path = public
as $$ begin new.updated_at := now(); return new; end $$;
drop trigger if exists touch_consent on public.consents;
create trigger touch_consent before update on public.consents for each row execute function public.touch_consent();

create or replace function public.write_audit_log() returns trigger
language plpgsql security definer set search_path = public
as $$ declare
  detail jsonb := '{}'::jsonb;
  row_id uuid;
begin
  if tg_op = 'DELETE' then row_id := old.id; else row_id := new.id; end if;
  if tg_table_name = 'referrals' then
    detail := jsonb_build_object('old_status', case when tg_op <> 'INSERT' then old.status else null end,
                                 'new_status', case when tg_op <> 'DELETE' then new.status else null end);
  end if;
  insert into public.audit_logs(actor_id, action, table_name, record_id, details)
  values (auth.uid(), tg_op, tg_table_name, row_id, detail);
  return null;
end $$;

do $$ declare t text; begin
  foreach t in array array['profiles','consents','assessments','support_services','referrals','follow_ups'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop trigger if exists audit_changes on public.%I', t);
    execute format('create trigger audit_changes after insert or update or delete on public.%I for each row execute function public.write_audit_log()', t);
  end loop;
end $$;
alter table public.audit_logs enable row level security;

drop policy if exists profiles_read on public.profiles;
create policy profiles_read on public.profiles for select to authenticated using (
  id = auth.uid() or public.app_role() = 'admin' or
  (public.app_role() = 'professional' and exists (select 1 from public.referrals r where r.user_id = profiles.id and r.professional_id = auth.uid()))
);
drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update to authenticated using (id = auth.uid() or public.app_role() = 'admin') with check (id = auth.uid() or public.app_role() = 'admin');

drop policy if exists consents_owner on public.consents;
create policy consents_owner on public.consents for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists consents_admin_read on public.consents;
create policy consents_admin_read on public.consents for select to authenticated using (public.app_role() = 'admin');

drop policy if exists assessments_read on public.assessments;
create policy assessments_read on public.assessments for select to authenticated using (
  user_id = auth.uid() or public.app_role() = 'admin' or
  (public.app_role() = 'professional' and exists (select 1 from public.referrals r where r.user_id = assessments.user_id and r.professional_id = auth.uid() and r.share_results))
);
drop policy if exists assessments_insert on public.assessments;
create policy assessments_insert on public.assessments for insert to authenticated with check (user_id = auth.uid());

drop policy if exists services_read on public.support_services;
create policy services_read on public.support_services for select to authenticated using (active or public.app_role() = 'admin');
drop policy if exists services_admin on public.support_services;
create policy services_admin on public.support_services for all to authenticated using (public.app_role() = 'admin') with check (public.app_role() = 'admin');

drop policy if exists referrals_read on public.referrals;
create policy referrals_read on public.referrals for select to authenticated using (user_id = auth.uid() or public.app_role() = 'admin' or (professional_id = auth.uid() and public.app_role() = 'professional'));
drop policy if exists referrals_insert on public.referrals;
create policy referrals_insert on public.referrals for insert to authenticated with check (public.app_role() = 'admin' or (user_id = auth.uid() and status = 'pending' and professional_id is null));
drop policy if exists referrals_update on public.referrals;
create policy referrals_update on public.referrals for update to authenticated using (user_id = auth.uid() or public.app_role() = 'admin' or (professional_id = auth.uid() and public.app_role() = 'professional')) with check (user_id = auth.uid() or public.app_role() = 'admin' or (professional_id = auth.uid() and public.app_role() = 'professional'));
drop policy if exists referrals_delete on public.referrals;
create policy referrals_delete on public.referrals for delete to authenticated using (public.app_role() = 'admin');

drop policy if exists follow_ups_read on public.follow_ups;
create policy follow_ups_read on public.follow_ups for select to authenticated using (public.app_role() = 'admin' or exists (
  select 1 from public.referrals r where r.id = follow_ups.referral_id and (r.user_id = auth.uid() or (r.professional_id = auth.uid() and public.app_role() = 'professional'))
));
drop policy if exists follow_ups_insert on public.follow_ups;
create policy follow_ups_insert on public.follow_ups for insert to authenticated with check (
  author_id = auth.uid() and (public.app_role() = 'admin' or (public.app_role() = 'professional' and exists (select 1 from public.referrals r where r.id = follow_ups.referral_id and r.professional_id = auth.uid())))
);

drop policy if exists audit_admin_read on public.audit_logs;
create policy audit_admin_read on public.audit_logs for select to authenticated using (public.app_role() = 'admin');

grant usage on schema public to authenticated;
revoke all on public.profiles, public.consents, public.assessments, public.support_services,
  public.referrals, public.follow_ups, public.audit_logs from public, anon;
grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.consents, public.referrals, public.support_services to authenticated;
grant select, insert on public.assessments, public.follow_ups to authenticated;
revoke all on public.audit_logs from anon, authenticated;
grant select on public.audit_logs to authenticated;
revoke all on function public.app_role() from public;
grant execute on function public.app_role() to authenticated;
revoke all on function public.create_profile(), public.guard_profile_role(), public.guard_referral_update(), public.touch_consent(), public.write_audit_log() from public;

commit;
