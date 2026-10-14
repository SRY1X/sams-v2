begin;
select plan(29);

select is((select count(*)::integer from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r' and not c.relrowsecurity),0,'every public table enables RLS');
select ok(not has_table_privilege('anon','public.institution_memberships','select'),'anonymous role cannot select memberships');
select ok(not has_function_privilege('anon','public.record_attendance(uuid)','execute'),'anonymous role cannot submit attendance');
select ok(has_function_privilege('authenticated','public.record_attendance(uuid)','execute'),'authenticated role can call the guarded attendance RPC');
select ok(not has_function_privilege('authenticated','private.touch_updated_at()','execute'),'internal trigger helpers are not directly executable by clients');
select ok(has_function_privilege('authenticated','private.record_attendance(uuid)','execute'),'authenticated role can invoke only the guarded internal attendance helper');
select ok(not has_table_privilege('authenticated','public.attendance_records','insert'),'attendance records cannot be inserted directly by clients');
select ok(exists(select 1 from pg_catalog.pg_indexes where schemaname='public' and indexname='attendance_one_open_session_per_section'),'one-open-session constraint index exists');
select ok(not has_table_privilege('authenticated','public.institution_memberships','update'),'membership updates are not granted table-wide');
select ok(not has_column_privilege('authenticated','public.institution_memberships','role','update'),'clients cannot update membership roles');
select ok(has_column_privilege('authenticated','public.institution_memberships','status','update'),'the status column has its narrow update grant');

create table public.default_privilege_probe(id integer primary key);
alter table public.default_privilege_probe enable row level security;
create function public.default_privilege_probe() returns integer language sql as $$ select 1 $$;
select ok(not has_table_privilege('anon','public.default_privilege_probe','select'),'new tables are not granted to anon by default');
select ok(not has_table_privilege('authenticated','public.default_privilege_probe','select'),'new tables are not granted to authenticated by default');
select ok(has_table_privilege('service_role','public.default_privilege_probe','select'),'service_role retains trusted server access by default');
select ok(not has_function_privilege('anon','public.default_privilege_probe()','execute'),'new functions are not executable by anon by default');
select ok(not has_function_privilege('authenticated','public.default_privilege_probe()','execute'),'new functions are not executable by authenticated by default');
select ok(has_function_privilege('service_role','public.default_privilege_probe()','execute'),'service_role retains trusted function access by default');

insert into auth.users(id,email) values
  ('10000000-0000-4000-8000-000000000001','student-one@example.test'),
  ('10000000-0000-4000-8000-000000000002','student-two@example.test'),
  ('10000000-0000-4000-8000-000000000003','faculty@example.test'),
  ('10000000-0000-4000-8000-000000000004','admin@example.test'),
  ('10000000-0000-4000-8000-000000000005','other-institution@example.test');

insert into public.institutions(id,name,slug,timezone)
values ('00000000-0000-4000-8000-000000000002','Other Demo Institution','other-demo','UTC');
insert into public.institution_memberships(institution_id,user_id,role) values
  ('00000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','student'),
  ('00000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000002','student'),
  ('00000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000003','faculty'),
  ('00000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000004','admin'),
  ('00000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000005','student');
insert into public.section_faculty(institution_id,section_id,faculty_user_id)
values ('00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000040','10000000-0000-4000-8000-000000000003');
insert into public.enrollments(institution_id,section_id,student_user_id)
values ('00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000040','10000000-0000-4000-8000-000000000001');
insert into public.attendance_sessions(id,institution_id,section_id,created_by,expires_at)
values ('00000000-0000-4000-8000-000000000070','00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000040','10000000-0000-4000-8000-000000000003',now()+interval '1 hour');

set local role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);
select is(public.record_attendance('00000000-0000-4000-8000-000000000070'),'recorded','enrolled student can check in');
select is(public.record_attendance('00000000-0000-4000-8000-000000000070'),'already_recorded','duplicate check-in is idempotent');
select is((select count(*)::integer from public.institution_memberships),1,'student sees only their own membership');
select is((select count(*)::integer from public.course_sections),1,'enrolled student sees the enrolled section');
select is((select count(*)::integer from public.attendance_records),1,'student sees their own attendance record');
select is((select count(*)::integer from public.profiles where id='10000000-0000-4000-8000-000000000002'),0,'student cannot read another student profile');

select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000002',true);
select is((select count(*)::integer from public.attendance_records),0,'unenrolled student cannot see another student attendance');
select throws_ok($$select public.record_attendance('00000000-0000-4000-8000-000000000070')$$,'42501','Not eligible for this session','unenrolled student cannot submit attendance');

select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000003',true);
select is((select count(*)::integer from public.attendance_records where session_id='00000000-0000-4000-8000-000000000070'),1,'assigned faculty can see section attendance for the test session');
select is((select count(*)::integer from public.profiles where id='10000000-0000-4000-8000-000000000001'),1,'assigned faculty can see an enrolled student display name');

select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000004',true);
select is((select count(*)::integer from public.institution_memberships where user_id in ('10000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000004')),4,'admin can read fixture institution memberships');

select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000005',true);
select is((select count(*)::integer from public.course_sections),0,'other institution cannot read this institution section');

reset role;
select * from finish();
rollback;
