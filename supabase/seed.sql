-- Synthetic catalog fixture for isolated database/RLS tests and optional local
-- schema testing. Hosted `supabase db push` does not apply this file. Never add
-- real people, credentials, or institution records here.
insert into public.institutions(id,name,slug,timezone)
values ('00000000-0000-4000-8000-000000000001','SAMS Test Institution','sams-test','UTC')
on conflict (id) do nothing;

-- Keep the isolated test institution stable if an older test database is reset.
update public.institutions
set name='SAMS Test Institution', slug='sams-test', timezone='UTC'
where id='00000000-0000-4000-8000-000000000001';

insert into public.institution_settings(institution_id)
values ('00000000-0000-4000-8000-000000000001') on conflict (institution_id) do nothing;

insert into public.departments(id,institution_id,name,code)
values ('00000000-0000-4000-8000-000000000010','00000000-0000-4000-8000-000000000001','Department of Computing','COMP')
on conflict (id) do nothing;

insert into public.academic_terms(id,institution_id,name,starts_on,ends_on)
values ('00000000-0000-4000-8000-000000000020','00000000-0000-4000-8000-000000000001','2026–27 Academic Year','2026-01-01','2027-01-01')
on conflict (id) do nothing;

insert into public.courses(id,institution_id,department_id,code,title)
values ('00000000-0000-4000-8000-000000000030','00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000010','COMP-101','Foundations of Computing')
on conflict (id) do nothing;

insert into public.course_sections(id,institution_id,course_id,term_id,section_code)
values ('00000000-0000-4000-8000-000000000040','00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000030','00000000-0000-4000-8000-000000000020','A')
on conflict (id) do nothing;
