insert into public.support_services(
  id, name, tier, description, eligibility, languages, location,
  operating_hours, appointment_method, delivery_mode, typical_wait, availability, geography, contact, verified
)
values
  ('00000000-0000-4000-8000-000000000001','MindBridge Self-Guided Sleep & Stress Program (Demo)','self_help','Evidence-informed breathing, sleep hygiene, and stress self-reflection modules in Arabic and English (Demonstration record).','Open to all Abu Dhabi residents','Arabic, English','Online (Abu Dhabi)','24/7 digital self-access','Instant access','Self-paced online','Immediate','Available now','Abu Dhabi','In-app guided self-help modules',false),
  ('00000000-0000-4000-8000-000000000002','Abu Dhabi Community Peer & Family Hub (Demo)','community','Moderated Arabic & English peer circles and community resilience workshops across Abu Dhabi City, Al Ain, and Al Dhafra (Demonstration record).','Residents aged 18+','Arabic, English','Abu Dhabi City & Al Ain','Sun–Thu 10:00–20:00','Community group request','Community / group video','2–3 days','Open spots this week','Abu Dhabi City','Demo community coordinator desk',false),
  ('00000000-0000-4000-8000-000000000003','SEHA Integrated Primary Care Mind-Body Clinic (Demo)','primary_care','Family medicine coordination connecting sleep, chronic conditions, and mild-to-moderate mood/anxiety check-ins (Simulated Malaffi integration concept).','Valid Emirates ID / THIQA or Daman plan','Arabic, English','Abu Dhabi City (Al Bateen) · Al Ain · Al Dhafra','Sun–Thu 08:00–18:00','MindBridge referral / Primary care booking','In-person primary clinic','2–5 days','Accepting appointments','Abu Dhabi City','Demo primary care coordination desk',false),
  ('00000000-0000-4000-8000-000000000004','Abu Dhabi Bilingual Tele-Mental Health Service (Demo)','tele_mental_health','Confidential video & phone sessions with licensed psychologists and counsellors (Demonstration listing).','Adults in Abu Dhabi (18+)','Arabic, English, Hindi/Urdu','Remote across Abu Dhabi','Sun–Sat 08:00–22:00','Online appointment selection via MindBridge','Video tele-health','24–48 hours','Slots open today','Abu Dhabi','Tele-health booking via MindBridge referral',false),
  ('00000000-0000-4000-8000-000000000005','Specialist Psychiatric & Behavioural Outpatient Unit (Demo)','specialist','Outpatient psychiatry, CBT psychotherapy, and collaborative comorbidity management with licensed clinicians (Demonstration listing).','Moderate-to-severe symptoms or clinician referral','Arabic, English','Abu Dhabi City & Al Ain','Sun–Thu 08:00–17:00','Clinician-reviewed referral','In-person outpatient / video follow-up','3–7 days','Priority triage active','Abu Dhabi City','Demo outpatient specialist triage desk',false),
  ('00000000-0000-4000-8000-000000000006','Sakina Urgent Crisis & UAE Emergency Escalation','urgent_emergency','Immediate human crisis support via Sakina (800-SAKINA / 800-725462), UAE Ambulance (998), Police (999), and Estijaba (800 1717), plus 24h clinician escalation.','Anyone in urgent distress or safety risk','Arabic, English','All UAE / Abu Dhabi','24/7 Emergency & Crisis Coverage','Immediate call or 24h urgent callback','24/7 hotline + urgent clinician outreach','Immediate','24/7 Immediate Response','Abu Dhabi','Sakina: 800-725462 · Emergency: 998 · Estijaba: 800 1717',true)
on conflict (id) do update set
  name = excluded.name,
  tier = excluded.tier,
  description = excluded.description,
  eligibility = excluded.eligibility,
  languages = excluded.languages,
  location = excluded.location,
  operating_hours = excluded.operating_hours,
  appointment_method = excluded.appointment_method,
  delivery_mode = excluded.delivery_mode,
  typical_wait = excluded.typical_wait,
  availability = excluded.availability,
  geography = excluded.geography,
  contact = excluded.contact,
  verified = excluded.verified;

-- After registering accounts in Supabase Authentication, promote clinical/staff roles in the SQL Editor:
-- update public.profiles set role = 'professional' where email = 'dr.tariq@mindbridge.demo';
-- update public.profiles set role = 'primary_care' where email = 'dr.nadia@mindbridge.demo';
-- update public.profiles set role = 'coordinator'  where email = 'coordinator@mindbridge.demo';
-- update public.profiles set role = 'admin'        where email = 'admin@mindbridge.demo';
-- update public.profiles set role = 'analyst'      where email = 'analyst@mindbridge.demo';
