begin;

-- 1. Profiles & 6-Role RBAC
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role text not null default 'individual',
  physical_context jsonb,
  equity jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists physical_context jsonb;
alter table public.profiles add column if not exists equity jsonb not null default '{}'::jsonb;
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('individual','professional','primary_care','coordinator','admin','analyst'));

create or replace function public.app_role() returns text
language sql stable security definer set search_path = public
as $$ select role from public.profiles where id = auth.uid() $$;

-- 2. Granular Consents (5+ independent scopes)
create table if not exists public.consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  consent_type text not null,
  granted boolean not null default false,
  updated_at timestamptz not null default now(),
  unique (user_id, consent_type)
);
alter table public.consents drop constraint if exists consents_consent_type_check;
alter table public.consents add constraint consents_consent_type_check
  check (consent_type in ('terms','retain_history','share_results','share_contact','share_physical_context','research_opt_in'));

-- 3. Assessments (PHQ-9, GAD-7, PSS-10, WHO-5 + functioning + opt-in signals)
create table if not exists public.assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  instrument text not null,
  total_score integer not null,
  severity text not null,
  answers jsonb not null,
  functioning integer,
  opt_in_signals jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.assessments add column if not exists functioning integer;
alter table public.assessments add column if not exists opt_in_signals jsonb not null default '[]'::jsonb;
alter table public.assessments drop constraint if exists assessments_instrument_check;
alter table public.assessments add constraint assessments_instrument_check
  check (instrument in ('PHQ9','GAD7','PSS10','WHO5'));
alter table public.assessments drop constraint if exists assessments_total_score_check;
alter table public.assessments drop constraint if exists assessments_check;
alter table public.assessments add constraint assessments_total_score_check
  check (
    total_score >= 0 and (
      (instrument = 'PHQ9' and total_score <= 27) or
      (instrument = 'GAD7' and total_score <= 21) or
      (instrument = 'PSS10' and total_score <= 40) or
      (instrument = 'WHO5' and total_score <= 100)
    )
  );

-- 4. Support Services Directory (6 stepped-care categories)
create table if not exists public.support_services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  tier text not null,
  description text,
  eligibility text,
  languages text,
  location text,
  operating_hours text,
  appointment_method text,
  delivery_mode text,
  typical_wait text,
  availability text,
  geography text,
  contact text,
  website text,
  last_verified_at text,
  verified boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.support_services add column if not exists location text;
alter table public.support_services add column if not exists operating_hours text;
alter table public.support_services add column if not exists appointment_method text;
alter table public.support_services add column if not exists availability text;
alter table public.support_services add column if not exists last_verified_at text;
alter table public.support_services drop constraint if exists support_services_tier_check;
alter table public.support_services add constraint support_services_tier_check
  check (tier in ('self_help','community','primary_care','tele_mental_health','mental_health_professional','specialist','urgent_emergency'));

-- 5. Referrals, Appointments, Crisis Tracking & Feedback
create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  service_id uuid not null references public.support_services(id),
  professional_id uuid references public.profiles(id) on delete set null,
  status text not null default 'submitted',
  priority text not null default 'routine' check (priority in ('routine','urgent')),
  crisis_flagged boolean not null default false,
  crisis_acknowledged_at timestamptz,
  crisis_completed_at timestamptz,
  first_response_at timestamptz,
  appointment_at timestamptz,
  appointment_mode text,
  attendance_status text not null default 'pending',
  share_results boolean not null default false,
  share_contact boolean not null default false,
  share_physical_context boolean not null default false,
  user_note text,
  feedback jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.referrals add column if not exists crisis_acknowledged_at timestamptz;
alter table public.referrals add column if not exists appointment_at timestamptz;
alter table public.referrals add column if not exists appointment_mode text;
alter table public.referrals add column if not exists attendance_status text not null default 'pending';
alter table public.referrals add column if not exists feedback jsonb;
alter table public.referrals drop constraint if exists referrals_status_check;
alter table public.referrals add constraint referrals_status_check
  check (status in (
    'support_requested','submitted','received','professional_review',
    'appointment_scheduled','appointment_attended','follow_up_completed',
    'escalated','declined','cancelled','unsuccessful_handover',
    'pending','accepted','unable_to_contact'
  ));
drop index if exists referrals_one_open_service;
create unique index if not exists referrals_one_open_service on public.referrals(user_id, service_id)
  where status not in ('declined','follow_up_completed','cancelled','unsuccessful_handover','unable_to_contact');

-- 6. Follow-up & Clinical Coordination Notes
create table if not exists public.follow_ups (
  id uuid primary key default gen_random_uuid(),
  referral_id uuid not null references public.referrals(id) on delete cascade,
  author_id uuid default auth.uid() references public.profiles(id) on delete set null,
  note text,
  outcome text,
  outcome_status text,
  created_at timestamptz not null default now()
);
alter table public.follow_ups add column if not exists outcome_status text;
alter table public.follow_ups alter column author_id drop not null;
alter table public.follow_ups drop constraint if exists follow_ups_author_id_fkey;
alter table public.follow_ups add constraint follow_ups_author_id_fkey
  foreign key (author_id) references public.profiles(id) on delete set null;

-- 7. Safety / Adverse Events Log
create table if not exists public.adverse_events (
  id uuid primary key default gen_random_uuid(),
  referral_id uuid references public.referrals(id) on delete set null,
  reported_by uuid references public.profiles(id) on delete set null,
  category text not null,
  severity text not null default 'moderate' check (severity in ('low','moderate','high')),
  summary text not null,
  action_taken text,
  status text not null default 'open' check (status in ('open','reviewed','resolved')),
  created_at timestamptz not null default now()
);

-- 8. Audit Logs
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
create index if not exists adverse_events_referral_id_idx on public.adverse_events(referral_id);
create index if not exists audit_logs_actor_id_idx on public.audit_logs(actor_id);

-- Triggers & Profile Auto-Provisioning
create or replace function public.create_profile() returns trigger
language plpgsql security definer set search_path = public
as $$ begin
  insert into public.profiles(id, email, full_name, role)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', 'individual')
  on conflict (id) do update set email = coalesce(excluded.email, public.profiles.email);
  return new;
end $$;
drop trigger if exists create_profile_on_signup on auth.users;
create trigger create_profile_on_signup after insert on auth.users for each row execute function public.create_profile();

insert into public.profiles(id, email, full_name, role)
select u.id, u.email, u.raw_user_meta_data->>'full_name', 'individual' from auth.users u
on conflict (id) do update set email = coalesce(excluded.email, public.profiles.email);

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
  if public.app_role() in ('admin', 'coordinator') or auth.uid() is null then
    new.updated_at := now();
    return new;
  end if;
  if old.user_id = auth.uid() then
    if (to_jsonb(new) - array['status','share_results','share_contact','share_physical_context','feedback','updated_at']) is distinct from
       (to_jsonb(old) - array['status','share_results','share_contact','share_physical_context','feedback','updated_at'])
       or (new.status is distinct from old.status and new.status <> 'cancelled') then
      raise exception 'Owners may only cancel, submit feedback, or change sharing flags' using errcode = '42501';
    end if;
  elsif (old.professional_id = auth.uid() and public.app_role() = 'professional')
     or (old.share_physical_context and public.app_role() = 'primary_care') then
    if (to_jsonb(new) - array['status','appointment_at','appointment_mode','attendance_status','first_response_at','crisis_acknowledged_at','crisis_completed_at','updated_at']) is distinct from
       (to_jsonb(old) - array['status','appointment_at','appointment_mode','attendance_status','first_response_at','crisis_acknowledged_at','crisis_completed_at','updated_at'])
       or new.status = 'cancelled' then
      raise exception 'Clinicians may only update clinical status, appointments, or crisis timestamps' using errcode = '42501';
    end if;
  else
    raise exception 'Referral update not permitted' using errcode = '42501';
  end if;
  new.updated_at := now();
  return new;
end $$;
drop trigger if exists guard_referral_update on public.referrals;
create trigger guard_referral_update before update on public.referrals for each row execute function public.guard_referral_update();

create or replace function public.next_referral_professional(excluded_user_id uuid) returns uuid
language plpgsql security definer set search_path = public
as $$ declare chosen uuid; begin
  perform pg_advisory_xact_lock(7182407);
  select p.id into chosen from public.profiles p
  where p.role = 'professional' and p.id is distinct from excluded_user_id
  order by (select count(*) from public.referrals r where r.professional_id = p.id
    and r.status not in ('declined','follow_up_completed','cancelled','unsuccessful_handover','unable_to_contact')), p.id
  limit 1;
  return chosen;
end $$;
revoke all on function public.next_referral_professional(uuid) from public, anon, authenticated;

create or replace function public.assign_referral_professional() returns trigger
language plpgsql security definer set search_path = public
as $$ begin
  if auth.uid() is not null and public.app_role() is distinct from 'admin'
    and new.professional_id is not null then
    raise exception 'Clients cannot choose a professional' using errcode = '42501';
  end if;
  if new.professional_id is null then
    new.professional_id := public.next_referral_professional(new.user_id);
  end if;
  return new;
end $$;
drop trigger if exists assign_referral_professional on public.referrals;
create trigger assign_referral_professional before insert on public.referrals
  for each row execute function public.assign_referral_professional();

create or replace function public.assign_unassigned_referrals_on_professional_promotion() returns trigger
language plpgsql security definer set search_path = public
as $$ declare referral record; begin
  if new.role = 'professional' and old.role is distinct from new.role then
    for referral in select id, user_id from public.referrals where professional_id is null
      and status not in ('declined','follow_up_completed','cancelled','unsuccessful_handover','unable_to_contact')
      order by created_at, id loop
      update public.referrals set professional_id = public.next_referral_professional(referral.user_id)
        where id = referral.id and professional_id is null;
    end loop;
  end if;
  return new;
end $$;
drop trigger if exists assign_unassigned_referrals_on_professional_promotion on public.profiles;
create trigger assign_unassigned_referrals_on_professional_promotion
  after update of role on public.profiles for each row
  execute function public.assign_unassigned_referrals_on_professional_promotion();

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
  foreach t in array array['profiles','consents','assessments','support_services','referrals','follow_ups','adverse_events'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop trigger if exists audit_changes on public.%I', t);
    execute format('create trigger audit_changes after insert or update or delete on public.%I for each row execute function public.write_audit_log()', t);
  end loop;
end $$;
alter table public.audit_logs enable row level security;

-- Row-Level Security Policies
drop policy if exists profiles_read on public.profiles;
create policy profiles_read on public.profiles for select to authenticated using (
  id = auth.uid() or public.app_role() = 'admin' or
  (public.app_role() = 'professional' and exists (select 1 from public.referrals r where r.user_id = profiles.id and r.professional_id = auth.uid() and (r.share_contact or r.share_physical_context))) or
  (public.app_role() = 'coordinator' and exists (select 1 from public.referrals r where r.user_id = profiles.id and r.share_contact)) or
  (public.app_role() = 'primary_care' and exists (select 1 from public.referrals r where r.user_id = profiles.id and r.share_physical_context))
);
drop policy if exists profiles_insert on public.profiles;
create policy profiles_insert on public.profiles for insert to authenticated with check (id = auth.uid() and role = 'individual');
drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update to authenticated using (id = auth.uid() or public.app_role() = 'admin') with check (id = auth.uid() or public.app_role() = 'admin');

drop policy if exists consents_owner on public.consents;
create policy consents_owner on public.consents for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists consents_admin_read on public.consents;
create policy consents_admin_read on public.consents for select to authenticated using (public.app_role() = 'admin');

drop policy if exists assessments_read on public.assessments;
create policy assessments_read on public.assessments for select to authenticated using (
  user_id = auth.uid() or public.app_role() = 'admin' or
  (public.app_role() = 'professional' and exists (select 1 from public.referrals r where r.user_id = assessments.user_id and r.professional_id = auth.uid() and r.share_results)) or
  (public.app_role() = 'primary_care' and exists (select 1 from public.referrals r where r.user_id = assessments.user_id and r.share_physical_context and r.share_results))
);
drop policy if exists assessments_insert on public.assessments;
create policy assessments_insert on public.assessments for insert to authenticated with check (user_id = auth.uid());
drop policy if exists assessments_delete on public.assessments;
create policy assessments_delete on public.assessments for delete to authenticated using (user_id = auth.uid());

drop policy if exists services_read on public.support_services;
create policy services_read on public.support_services for select to authenticated using (active or public.app_role() = 'admin');
drop policy if exists services_admin on public.support_services;
create policy services_admin on public.support_services for all to authenticated using (public.app_role() = 'admin') with check (public.app_role() = 'admin');

drop policy if exists referrals_read on public.referrals;
create policy referrals_read on public.referrals for select to authenticated using (
  user_id = auth.uid() or public.app_role() in ('admin','coordinator') or
  (professional_id = auth.uid() and public.app_role() = 'professional') or
  (share_physical_context and public.app_role() = 'primary_care')
);
drop policy if exists referrals_insert on public.referrals;
create policy referrals_insert on public.referrals for insert to authenticated with check (
  public.app_role() = 'admin' or (user_id = auth.uid() and status in ('pending','submitted','escalated','support_requested'))
);
drop policy if exists referrals_update on public.referrals;
create policy referrals_update on public.referrals for update to authenticated using (
  user_id = auth.uid() or public.app_role() in ('admin','coordinator') or
  (professional_id = auth.uid() and public.app_role() = 'professional') or
  (share_physical_context and public.app_role() = 'primary_care')
) with check (
  user_id = auth.uid() or public.app_role() in ('admin','coordinator') or
  (professional_id = auth.uid() and public.app_role() = 'professional') or
  (share_physical_context and public.app_role() = 'primary_care')
);
drop policy if exists referrals_delete on public.referrals;
create policy referrals_delete on public.referrals for delete to authenticated using (public.app_role() = 'admin' or user_id = auth.uid());

drop policy if exists follow_ups_read on public.follow_ups;
create policy follow_ups_read on public.follow_ups for select to authenticated using (
  public.app_role() in ('admin','coordinator') or exists (
    select 1 from public.referrals r where r.id = follow_ups.referral_id and (
      r.user_id = auth.uid() or
      (r.professional_id = auth.uid() and public.app_role() = 'professional') or
      (r.share_physical_context and public.app_role() = 'primary_care')
    )
  )
);
drop policy if exists follow_ups_insert on public.follow_ups;
create policy follow_ups_insert on public.follow_ups for insert to authenticated with check (
  author_id = auth.uid() and (
    public.app_role() in ('admin','coordinator') or
    (public.app_role() = 'professional' and exists (select 1 from public.referrals r where r.id = follow_ups.referral_id and r.professional_id = auth.uid())) or
    (public.app_role() = 'primary_care' and exists (select 1 from public.referrals r where r.id = follow_ups.referral_id and r.share_physical_context))
  )
);

drop policy if exists adverse_read on public.adverse_events;
create policy adverse_read on public.adverse_events for select to authenticated using (
  public.app_role() in ('admin','analyst','coordinator','professional','primary_care')
);
drop policy if exists adverse_insert on public.adverse_events;
create policy adverse_insert on public.adverse_events for insert to authenticated with check (
  public.app_role() in ('admin','coordinator','professional','primary_care')
);
drop policy if exists adverse_update on public.adverse_events;
create policy adverse_update on public.adverse_events for update to authenticated using (
  public.app_role() = 'admin'
) with check (
  public.app_role() = 'admin'
);

drop policy if exists audit_admin_read on public.audit_logs;
create policy audit_admin_read on public.audit_logs for select to authenticated using (public.app_role() = 'admin');

-- Server-side De-identified Outcome, Safety & Fairness RPC (research_opt_in + n < 3 suppression)
create or replace function public.get_outcome_and_safety_metrics(date_range_days integer default 30)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  cutoff timestamptz;
  small_cell constant integer := 3;
  opted_in_count integer;
  total_assessments integer;
  positive_screens integer;
  converted_count integer;
  conversion_rate integer;
  non_cancelled integer;
  completed_refs integer;
  referral_completion_rate integer;
  scheduled_or_attended integer;
  attended_count integer;
  attendance_rate integer;
  avg_wait numeric;
  median_wait numeric;
  timely_count integer;
  sla_compliance_rate integer;
  repeat_pairs integer;
  improved_pairs integer;
  improved_followups integer;
  total_evaluated integer;
  improvement_rate integer;
  crisis_total integer;
  crisis_completed integer;
  crisis_completion_rate integer;
  service_utilisation jsonb;
  equity_json jsonb;
  alerts_json jsonb;
  adverse_json jsonb;
begin
  if public.app_role() not in ('admin', 'analyst') then
    raise exception 'Unauthorized analytics access' using errcode = '42501';
  end if;

  cutoff := case when coalesce(date_range_days, 0) > 0 then now() - make_interval(days => date_range_days) else '-infinity'::timestamptz end;

  with opted_individuals as (
    select p.id, p.equity
    from public.profiles p
    where p.role = 'individual'
      and exists (
        select 1 from public.consents c
        where c.user_id = p.id and c.consent_type = 'research_opt_in' and c.granted = true
      )
  ),
  filt_assessments as (
    select a.* from public.assessments a
    join opted_individuals oi on oi.id = a.user_id
    where a.created_at >= cutoff
  ),
  filt_referrals as (
    select r.*, s.tier as service_tier
    from public.referrals r
    join opted_individuals oi on oi.id = r.user_id
    left join public.support_services s on s.id = r.service_id
    where r.created_at >= cutoff
  ),
  filt_followups as (
    select f.* from public.follow_ups f
    join filt_referrals r on r.id = f.referral_id
    where f.created_at >= cutoff
  ),
  positive_users as (
    select distinct user_id from filt_assessments
    where severity in ('moderate', 'moderately severe', 'severe')
       or (instrument = 'PHQ9' and coalesce((answers->>8)::int, 0) > 0)
  ),
  converted_users as (
    select distinct user_id from filt_referrals
    where status in ('accepted','professional_review','appointment_scheduled','appointment_attended','follow_up_completed','escalated')
  ),
  non_canc as (
    select * from filt_referrals where status <> 'cancelled'
  ),
  waits as (
    select greatest(0, extract(epoch from (first_response_at - created_at)) / 3600.0) as hrs
    from non_canc where first_response_at is not null
  ),
  series_pairs as (
    select user_id, instrument,
      (array_agg(total_score order by created_at asc))[1] as first_score,
      (array_agg(total_score order by created_at desc))[1] as last_score,
      count(*) as cnt
    from filt_assessments
    group by user_id, instrument
    having count(*) >= 2
  )
  select
    (select count(*) from opted_individuals),
    (select count(*) from filt_assessments),
    (select count(*) from positive_users),
    (select count(*) from positive_users p where exists (select 1 from converted_users c where c.user_id = p.user_id)),
    (select count(*) from non_canc),
    (select count(*) from non_canc where status = 'follow_up_completed'),
    (select count(*) from non_canc where appointment_at is not null or status in ('appointment_attended','follow_up_completed')),
    (select count(*) from non_canc where attendance_status = 'attended' or status in ('appointment_attended','follow_up_completed')),
    coalesce((select round(avg(hrs)::numeric, 1) from waits), 0),
    coalesce((select round((percentile_cont(0.5) within group (order by hrs))::numeric, 1) from waits), 0),
    (select count(*) from non_canc where
      case when first_response_at is null
        then extract(epoch from (now() - created_at)) / 3600.0 <= case when priority = 'urgent' or crisis_flagged then 24 else 168 end
        else extract(epoch from (first_response_at - created_at)) / 3600.0 <= case when priority = 'urgent' or crisis_flagged then 24 else 168 end
      end),
    (select count(*) from series_pairs),
    (select count(*) from series_pairs where case when instrument = 'WHO5' then last_score > first_score else last_score < first_score end),
    (select count(*) from filt_followups where outcome_status = 'improved'),
    (select count(*) from filt_followups where outcome_status is not null),
    (select count(*) from non_canc where crisis_flagged or priority = 'urgent' or status = 'escalated'),
    (select count(*) from non_canc where (crisis_flagged or priority = 'urgent' or status = 'escalated') and crisis_completed_at is not null)
  into
    opted_in_count, total_assessments, positive_screens, converted_count,
    non_cancelled, completed_refs, scheduled_or_attended, attended_count,
    avg_wait, median_wait, timely_count,
    repeat_pairs, improved_pairs, improved_followups, total_evaluated,
    crisis_total, crisis_completed;

  conversion_rate := case when positive_screens > 0 then round((converted_count::numeric / positive_screens) * 100) else 0 end;
  referral_completion_rate := case when non_cancelled > 0 then round((completed_refs::numeric / non_cancelled) * 100) else 0 end;
  attendance_rate := case when scheduled_or_attended > 0 then round((attended_count::numeric / scheduled_or_attended) * 100) else 0 end;
  sla_compliance_rate := case when non_cancelled > 0 then round((timely_count::numeric / non_cancelled) * 100) else 100 end;
  total_evaluated := repeat_pairs + total_evaluated;
  improvement_rate := case when total_evaluated > 0 then round(((improved_pairs + improved_followups)::numeric / total_evaluated) * 100) else 0 end;
  crisis_completion_rate := case when crisis_total > 0 then round((crisis_completed::numeric / crisis_total) * 100) else 100 end;

  with opted_individuals as (
    select p.id from public.profiles p
    where p.role = 'individual'
      and exists (select 1 from public.consents c where c.user_id = p.id and c.consent_type = 'research_opt_in' and c.granted = true)
  ),
  tiers(id, label, sort_order) as (
    values
      ('self_help', 'Self-help & wellbeing education', 1),
      ('community', 'Community support', 2),
      ('primary_care', 'Primary healthcare', 3),
      ('tele_mental_health', 'Tele-mental health', 4),
      ('specialist', 'Specialist mental healthcare', 5),
      ('urgent_emergency', 'Urgent & emergency assistance', 6)
  ),
  non_canc as (
    select r.*, s.tier as service_tier
    from public.referrals r
    join opted_individuals oi on oi.id = r.user_id
    left join public.support_services s on s.id = r.service_id
    where r.created_at >= cutoff and r.status <> 'cancelled'
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'tier', t.label,
    'count', coalesce((select count(*) from non_canc nc where nc.service_tier = t.id), 0)
  ) order by t.sort_order), '[]'::jsonb)
  into service_utilisation
  from tiers t;

  with opted_individuals as (
    select p.id, p.equity from public.profiles p
    where p.role = 'individual'
      and exists (select 1 from public.consents c where c.user_id = p.id and c.consent_type = 'research_opt_in' and c.granted = true)
  ),
  pos_u as (
    select distinct a.user_id from public.assessments a
    join opted_individuals oi on oi.id = a.user_id
    where a.created_at >= cutoff
      and (a.severity in ('moderate', 'moderately severe', 'severe') or (a.instrument = 'PHQ9' and coalesce((a.answers->>8)::int, 0) > 0))
  ),
  conv_u as (
    select distinct r.user_id from public.referrals r
    join opted_individuals oi on oi.id = r.user_id
    where r.created_at >= cutoff
      and r.status in ('accepted','professional_review','appointment_scheduled','appointment_attended','follow_up_completed','escalated')
  ),
  dims as (
    select d.dim, coalesce(nullif(oi.equity->>d.dim, ''), 'Not specified') as grp,
      oi.id as user_id,
      exists (select 1 from pos_u p where p.user_id = oi.id) as is_pos,
      exists (select 1 from conv_u c where c.user_id = oi.id) as is_conv
    from opted_individuals oi
    cross join (values ('age_group'), ('gender'), ('nationality_group'), ('language'), ('geography')) as d(dim)
  ),
  group_waits as (
    select d.dim, d.grp,
      round(avg(greatest(0, extract(epoch from (r.first_response_at - r.created_at)) / 3600.0))::numeric, 1) as avg_wait
    from dims d
    join public.referrals r
      on r.user_id = d.user_id
     and r.created_at >= cutoff
     and r.status <> 'cancelled'
     and r.first_response_at is not null
    group by d.dim, d.grp
  ),
  grouped as (
    select d.dim, d.grp,
      count(*) as individuals,
      count(*) filter (where d.is_pos) as pos_screens,
      count(*) filter (where d.is_conv) as handoffs,
      gw.avg_wait
    from dims d
    left join group_waits gw on gw.dim = d.dim and gw.grp = d.grp
    group by d.dim, d.grp, gw.avg_wait
  ),
  formatted as (
    select dim,
      jsonb_agg(
        case when individuals < small_cell then
          jsonb_build_object(
            'group', grp, 'suppressed', true,
            'individuals', null, 'positiveScreens', null, 'handoffs', null, 'conversionRate', null, 'avgWaitHours', null
          )
        else
          jsonb_build_object(
            'group', grp, 'suppressed', false,
            'individuals', individuals,
            'positiveScreens', pos_screens,
            'handoffs', handoffs,
            'conversionRate', case when pos_screens > 0 then round((handoffs::numeric / pos_screens) * 100) else 0 end,
            'avgWaitHours', avg_wait
          )
        end order by grp
      ) as rows
    from grouped
    group by dim
  )
  select
    jsonb_build_object(
      'age_group', coalesce((select rows from formatted where dim = 'age_group'), '[]'::jsonb),
      'gender', coalesce((select rows from formatted where dim = 'gender'), '[]'::jsonb),
      'nationality_group', coalesce((select rows from formatted where dim = 'nationality_group'), '[]'::jsonb),
      'language', coalesce((select rows from formatted where dim = 'language'), '[]'::jsonb),
      'geography', coalesce((select rows from formatted where dim = 'geography'), '[]'::jsonb)
    )
  into equity_json;

  with alert_rows as (
    select dim.key as dim, row_item
    from jsonb_each(equity_json) as dim(key, val),
    lateral jsonb_array_elements(dim.val) as row_item
    where (row_item->>'suppressed')::boolean = false
  )
  select coalesce(jsonb_agg(msg), '[]'::jsonb) into alerts_json
  from (
    select 'Lower hand-off conversion (' || (row_item->>'conversionRate') || '%) observed in ' || replace(dim, '_', ' ') || ': ' || (row_item->>'group') || '.' as msg
    from alert_rows where coalesce((row_item->>'positiveScreens')::int, 0) > 0 and coalesce((row_item->>'conversionRate')::int, 100) < 70
    union all
    select 'Extended average wait (' || (row_item->>'avgWaitHours') || 'h) observed in ' || replace(dim, '_', ' ') || ': ' || (row_item->>'group') || '.' as msg
    from alert_rows where row_item->>'avgWaitHours' is not null and (row_item->>'avgWaitHours')::numeric > 48
  ) sub;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', ae.id,
    'referral_id', ae.referral_id,
    'category', ae.category,
    'severity', ae.severity,
    'summary', ae.summary,
    'action_taken', ae.action_taken,
    'status', ae.status,
    'created_at', ae.created_at
  ) order by ae.created_at desc), '[]'::jsonb)
  into adverse_json
  from public.adverse_events ae;

  return jsonb_build_object(
    'optedInCount', opted_in_count,
    'totalAssessments', total_assessments,
    'positiveScreenCount', positive_screens,
    'convertedCount', converted_count,
    'conversionRate', conversion_rate,
    'referralCompletionRate', referral_completion_rate,
    'attendanceRate', attendance_rate,
    'avgWaitHours', avg_wait,
    'medianWaitHours', median_wait,
    'slaComplianceRate', sla_compliance_rate,
    'improvementRate', improvement_rate,
    'crisisTotal', crisis_total,
    'crisisCompleted', crisis_completed,
    'crisisCompletionRate', crisis_completion_rate,
    'serviceUtilisation', service_utilisation,
    'adverseEvents', adverse_json,
    'equity', equity_json,
    'alerts', alerts_json
  );
end $$;

-- Grants
grant usage on schema public to authenticated;
revoke all on public.profiles, public.consents, public.assessments, public.support_services,
  public.referrals, public.follow_ups, public.adverse_events, public.audit_logs from public, anon;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.consents, public.referrals, public.support_services to authenticated;
grant select, insert, delete on public.assessments to authenticated;
grant select, insert on public.follow_ups to authenticated;
grant select, insert, update on public.adverse_events to authenticated;
revoke all on public.audit_logs from anon, authenticated;
grant select on public.audit_logs to authenticated;
revoke all on function public.app_role() from public;
grant execute on function public.app_role() to authenticated;
revoke all on function public.get_outcome_and_safety_metrics(integer) from public, anon;
grant execute on function public.get_outcome_and_safety_metrics(integer) to authenticated;
revoke all on function public.create_profile(), public.guard_profile_role(), public.guard_referral_update(), public.assign_unassigned_referrals_on_professional_promotion(), public.touch_consent(), public.write_audit_log() from public;

commit;
