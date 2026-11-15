insert into public.support_services(id, name, tier, description, contact, verified)
values
 ('00000000-0000-4000-8000-000000000001','Demo reflection resource','self_help','Demo listing — replace with verified Abu Dhabi service details','Demo listing — replace with verified Abu Dhabi service details',false),
 ('00000000-0000-4000-8000-000000000002','Demo wellbeing guide','self_help','Demo listing — replace with verified Abu Dhabi service details','Demo listing — replace with verified Abu Dhabi service details',false),
 ('00000000-0000-4000-8000-000000000003','Demo community connection','community','Demo listing — replace with verified Abu Dhabi service details','Demo listing — replace with verified Abu Dhabi service details',false),
 ('00000000-0000-4000-8000-000000000004','Demo peer support group','community','Demo listing — replace with verified Abu Dhabi service details','Demo listing — replace with verified Abu Dhabi service details',false),
 ('00000000-0000-4000-8000-000000000005','Demo primary care service','primary_care','Demo listing — replace with verified Abu Dhabi service details','Demo listing — replace with verified Abu Dhabi service details',false),
 ('00000000-0000-4000-8000-000000000006','Demo professional support','mental_health_professional','Demo listing — replace with verified Abu Dhabi service details','Demo listing — replace with verified Abu Dhabi service details',false),
 ('00000000-0000-4000-8000-000000000007','Demo counselling service','mental_health_professional','Demo listing — replace with verified Abu Dhabi service details','Demo listing — replace with verified Abu Dhabi service details',false),
 ('00000000-0000-4000-8000-000000000008','Demo specialist service','specialist','Demo listing — replace with verified Abu Dhabi service details','Demo listing — replace with verified Abu Dhabi service details',false)
on conflict (id) do nothing;

-- After registering synthetic demo accounts, run as postgres in the SQL editor:
-- update public.profiles set role='professional' where id=(select id from auth.users where email='professional-demo@example.com');
-- update public.profiles set role='admin' where id=(select id from auth.users where email='admin-demo@example.com');
