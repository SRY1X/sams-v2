-- Project-level defaults can grant broad Data API privileges to anon and
-- authenticated. Keep new public objects closed by default; grant only what
-- the application needs below. Preserve service_role defaults for trusted
-- server-side operations.
alter default privileges for role postgres in schema public
  revoke all on tables from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke all on functions from public, anon, authenticated;
-- PostgreSQL grants EXECUTE on new functions to PUBLIC globally by default;
-- that built-in grant cannot be revoked by a per-schema default ACL.
alter default privileges for role postgres
  revoke execute on functions from public;
alter default privileges for role postgres in schema public
  revoke all on sequences from anon, authenticated;

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create table public.institutions (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 2 and 160),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  timezone text not null default 'UTC',
  created_at timestamptz not null default now(),
  unique (id)
);

create table public.institution_settings (
  institution_id uuid primary key references public.institutions(id) on delete cascade,
  settings jsonb not null default '{"qr_rotation_seconds":25,"qr_token_ttl_seconds":40,"max_session_seconds":7200}'::jsonb,
  updated_at timestamptz not null default now(),
  check (settings ?& array['qr_rotation_seconds','qr_token_ttl_seconds','max_session_seconds']),
  check ((settings->>'qr_rotation_seconds')::integer between 10 and 120),
  check ((settings->>'qr_token_ttl_seconds')::integer between 10 and 180),
  check ((settings->>'qr_token_ttl_seconds')::integer >= (settings->>'qr_rotation_seconds')::integer),
  check ((settings->>'max_session_seconds')::integer between 300 and 28800)
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'SAMS member' check (length(trim(display_name)) between 1 and 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.institution_memberships (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('student','faculty','admin')),
  status text not null default 'active' check (status in ('active','suspended')),
  created_at timestamptz not null default now(),
  unique (institution_id,user_id),
  unique (institution_id,user_id,role)
);

create table public.departments (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  name text not null check (length(trim(name)) between 2 and 120),
  code text,
  created_at timestamptz not null default now(),
  unique (id,institution_id),
  unique (institution_id,name),
  unique (institution_id,code)
);

create table public.academic_terms (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  name text not null check (length(trim(name)) between 2 and 100),
  starts_on date not null,
  ends_on date not null,
  created_at timestamptz not null default now(),
  unique (id,institution_id),
  unique (institution_id,name),
  check (starts_on < ends_on)
);

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  department_id uuid,
  code text not null check (length(trim(code)) between 1 and 40),
  title text not null check (length(trim(title)) between 2 and 160),
  created_at timestamptz not null default now(),
  unique (id,institution_id),
  unique (institution_id,code),
  foreign key (department_id,institution_id) references public.departments(id,institution_id) on delete set null (department_id)
);

create table public.course_sections (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  course_id uuid not null,
  term_id uuid not null,
  section_code text not null check (length(trim(section_code)) between 1 and 40),
  created_at timestamptz not null default now(),
  unique (id,institution_id),
  unique (course_id,term_id,section_code),
  foreign key (course_id,institution_id) references public.courses(id,institution_id) on delete cascade,
  foreign key (term_id,institution_id) references public.academic_terms(id,institution_id) on delete cascade
);

create table public.section_faculty (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null,
  section_id uuid not null,
  faculty_user_id uuid not null,
  member_role text not null default 'faculty' check (member_role='faculty'),
  created_at timestamptz not null default now(),
  unique (section_id,faculty_user_id),
  foreign key (section_id,institution_id) references public.course_sections(id,institution_id) on delete cascade,
  foreign key (institution_id,faculty_user_id,member_role) references public.institution_memberships(institution_id,user_id,role) on delete cascade
);
create index section_faculty_faculty_section_idx on public.section_faculty(faculty_user_id,section_id);

create table public.enrollments (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null,
  section_id uuid not null,
  student_user_id uuid not null,
  member_role text not null default 'student' check (member_role='student'),
  status text not null default 'active' check (status in ('active','withdrawn')),
  created_at timestamptz not null default now(),
  unique (section_id,student_user_id),
  foreign key (section_id,institution_id) references public.course_sections(id,institution_id) on delete cascade,
  foreign key (institution_id,student_user_id,member_role) references public.institution_memberships(institution_id,user_id,role) on delete cascade
);
create index enrollments_student_section_status_idx on public.enrollments(student_user_id,section_id,status);

create table public.attendance_sessions (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null,
  section_id uuid not null,
  created_by uuid not null references auth.users(id),
  status text not null default 'open' check (status in ('open','closed')),
  starts_at timestamptz not null default now(),
  expires_at timestamptz not null,
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (id,institution_id),
  foreign key (section_id,institution_id) references public.course_sections(id,institution_id) on delete cascade,
  check (expires_at > starts_at),
  check ((status = 'open' and closed_at is null) or (status = 'closed' and closed_at is not null))
);

create unique index attendance_one_open_session_per_section
  on public.attendance_sessions(section_id) where status = 'open';
create index attendance_sessions_section_started_idx on public.attendance_sessions(section_id,starts_at desc);

create table public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null,
  session_id uuid not null,
  student_user_id uuid not null,
  member_role text not null default 'student' check (member_role='student'),
  recorded_at timestamptz not null default now(),
  status text not null default 'present' check (status in ('present')),
  unique (session_id,student_user_id),
  foreign key (session_id,institution_id) references public.attendance_sessions(id,institution_id) on delete cascade,
  foreign key (institution_id,student_user_id,member_role) references public.institution_memberships(institution_id,user_id,role) on delete cascade
);
create index attendance_records_student_history_idx on public.attendance_records(student_user_id,recorded_at desc);
create index attendance_records_session_idx on public.attendance_records(session_id,recorded_at);

create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null check (length(action) between 1 and 80),
  entity_type text not null check (length(entity_type) between 1 and 80),
  entity_id uuid,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index audit_events_institution_created_idx on public.audit_events(institution_id,created_at desc);

create function private.touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
create trigger profiles_touch_updated_at before update on public.profiles
  for each row execute function private.touch_updated_at();
create trigger settings_touch_updated_at before update on public.institution_settings
  for each row execute function private.touch_updated_at();

create function private.on_auth_user_created()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(id,display_name)
  values (new.id, coalesce(nullif(trim(new.raw_user_meta_data->>'full_name'),''), 'SAMS member'))
  on conflict (id) do nothing;
  return new;
end;
$$;
revoke all on function private.on_auth_user_created() from public, anon, authenticated;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function private.on_auth_user_created();

create function private.has_membership(p_institution_id uuid, p_roles text[] default null)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.institution_memberships m
    where m.institution_id = p_institution_id
      and m.user_id = (select auth.uid())
      and m.status = 'active'
      and (p_roles is null or m.role = any(p_roles))
  );
$$;

create function private.is_section_faculty(p_section_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.section_faculty sf
    where sf.section_id = p_section_id and sf.faculty_user_id = (select auth.uid())
  );
$$;

create function private.is_enrolled(p_section_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.enrollments e
    where e.section_id = p_section_id and e.student_user_id = (select auth.uid()) and e.status = 'active'
  );
$$;

create function private.can_read_profile(p_user_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select p_user_id = (select auth.uid()) or exists (
    select 1
    from public.institution_memberships target
    join public.institution_memberships viewer on viewer.institution_id=target.institution_id
    where target.user_id=p_user_id and viewer.user_id=(select auth.uid()) and viewer.status='active'
      and (viewer.role='admin' or (viewer.role='faculty' and exists (
        select 1 from public.enrollments e join public.section_faculty sf on sf.section_id=e.section_id
        where e.student_user_id=target.user_id and e.status='active' and sf.faculty_user_id=viewer.user_id
      )))
  );
$$;

create function private.can_manage_session(p_session_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.attendance_sessions s
    where s.id = p_session_id
      and (private.has_membership(s.institution_id, array['admin']::text[])
        or (private.has_membership(s.institution_id, array['faculty']::text[]) and private.is_section_faculty(s.section_id)))
  );
$$;

create function private.create_attendance_session(p_section_id uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_institution_id uuid;
  v_starts_on date;
  v_ends_on date;
  v_duration integer;
  v_session_id uuid;
begin
  select s.institution_id, t.starts_on, t.ends_on into v_institution_id, v_starts_on, v_ends_on
  from public.course_sections s
  join public.academic_terms t on (t.id,t.institution_id) = (s.term_id,s.institution_id)
  where s.id = p_section_id;
  if v_institution_id is null then raise exception using errcode = '42501', message = 'Not authorized'; end if;
  if not (private.has_membership(v_institution_id,array['admin']::text[])
    or (private.has_membership(v_institution_id,array['faculty']::text[]) and private.is_section_faculty(p_section_id)))
  then raise exception using errcode = '42501', message = 'Not authorized'; end if;
  if current_date < v_starts_on or current_date > v_ends_on then
    raise exception using errcode = '55000', message = 'The academic term is not active';
  end if;
  select coalesce((settings->>'max_session_seconds')::integer,7200) into v_duration
  from public.institution_settings where institution_id = v_institution_id;
  v_duration := coalesce(v_duration,7200);
  update public.attendance_sessions set status='closed', closed_at=expires_at
    where section_id=p_section_id and status='open' and expires_at <= now();
  insert into public.attendance_sessions(institution_id,section_id,created_by,expires_at)
  values (v_institution_id,p_section_id,(select auth.uid()),now()+make_interval(secs=>v_duration))
  returning id into v_session_id;
  insert into public.audit_events(institution_id,actor_id,action,entity_type,entity_id)
  values (v_institution_id,(select auth.uid()),'attendance.session.created','attendance_session',v_session_id);
  return v_session_id;
exception when unique_violation then
  raise exception using errcode = '55000', message = 'An attendance session is already active for this section';
end;
$$;

create function private.close_attendance_session(p_session_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare v_institution_id uuid;
begin
  select institution_id into v_institution_id from public.attendance_sessions where id=p_session_id and status='open';
  if v_institution_id is null or not private.can_manage_session(p_session_id) then
    raise exception using errcode = '42501', message = 'Not authorized';
  end if;
  update public.attendance_sessions set status='closed',closed_at=now() where id=p_session_id and status='open';
  insert into public.audit_events(institution_id,actor_id,action,entity_type,entity_id)
  values (v_institution_id,(select auth.uid()),'attendance.session.closed','attendance_session',p_session_id);
end;
$$;

create function private.record_attendance(p_session_id uuid)
returns text language plpgsql security definer set search_path = '' as $$
declare
  v_user_id uuid := (select auth.uid());
  v_institution_id uuid;
  v_section_id uuid;
  v_session_status text;
  v_expires_at timestamptz;
  v_record_id uuid;
begin
  if v_user_id is null then raise exception using errcode='42501',message='Not authorized'; end if;
  select institution_id,section_id,status,expires_at
    into v_institution_id,v_section_id,v_session_status,v_expires_at
    from public.attendance_sessions where id=p_session_id;
  if v_institution_id is null or v_session_status <> 'open' or now() > v_expires_at then
    raise exception using errcode='55000',message='Attendance session is not active';
  end if;
  if not private.has_membership(v_institution_id,array['student']::text[]) or not private.is_enrolled(v_section_id) then
    raise exception using errcode='42501',message='Not eligible for this session';
  end if;
  insert into public.attendance_records(institution_id,session_id,student_user_id)
    values (v_institution_id,p_session_id,v_user_id)
    on conflict (session_id,student_user_id) do nothing returning id into v_record_id;
  if v_record_id is null then return 'already_recorded'; end if;
  insert into public.audit_events(institution_id,actor_id,action,entity_type,entity_id)
    values (v_institution_id,v_user_id,'attendance.record.created','attendance_record',v_record_id);
  return 'recorded';
end;
$$;

create function private.audit_academic_change()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_row jsonb;
  v_action text;
begin
  if tg_op='DELETE' then v_row:=to_jsonb(old); v_action:='deleted';
  elsif tg_op='UPDATE' then v_row:=to_jsonb(new); v_action:='updated';
  else v_row:=to_jsonb(new); v_action:='created'; end if;
  insert into public.audit_events(institution_id,actor_id,action,entity_type,entity_id)
  values ((v_row->>'institution_id')::uuid,(select auth.uid()),'academic.'||tg_table_name||'.'||v_action,tg_table_name,coalesce((v_row->>'id')::uuid,(v_row->>'institution_id')::uuid));
  if tg_op='DELETE' then return old; else return new; end if;
end;
$$;
revoke all on function private.audit_academic_change() from public,anon,authenticated;
create trigger departments_audit after insert or update or delete on public.departments
  for each row execute function private.audit_academic_change();
create trigger terms_audit after insert or update or delete on public.academic_terms
  for each row execute function private.audit_academic_change();
create trigger courses_audit after insert or update or delete on public.courses
  for each row execute function private.audit_academic_change();
create trigger sections_audit after insert or update or delete on public.course_sections
  for each row execute function private.audit_academic_change();
create trigger faculty_assignments_audit after insert or update or delete on public.section_faculty
  for each row execute function private.audit_academic_change();
create trigger institution_settings_audit after update on public.institution_settings
  for each row execute function private.audit_academic_change();
create trigger enrollments_audit after insert or update or delete on public.enrollments
  for each row execute function private.audit_academic_change();
create trigger membership_audit after update on public.institution_memberships
  for each row execute function private.audit_academic_change();

create function public.create_attendance_session(p_section_id uuid)
returns uuid language sql security invoker set search_path = '' as $$
  select private.create_attendance_session(p_section_id);
$$;
create function public.close_attendance_session(p_session_id uuid)
returns void language sql security invoker set search_path = '' as $$
  select private.close_attendance_session(p_session_id);
$$;
create function public.record_attendance(p_session_id uuid)
returns text language sql security invoker set search_path = '' as $$
  select private.record_attendance(p_session_id);
$$;
create function public.can_manage_attendance_session(p_session_id uuid)
returns boolean language sql security invoker set search_path = '' as $$
  select private.can_manage_session(p_session_id);
$$;

revoke all on all functions in schema private from public, anon, authenticated;
revoke all on function private.has_membership(uuid,text[]) from public,anon;
revoke all on function private.is_section_faculty(uuid) from public,anon;
revoke all on function private.is_enrolled(uuid) from public,anon;
revoke all on function private.can_read_profile(uuid) from public,anon;
revoke all on function private.can_manage_session(uuid) from public,anon;
revoke all on function private.create_attendance_session(uuid) from public,anon;
revoke all on function private.close_attendance_session(uuid) from public,anon;
revoke all on function private.record_attendance(uuid) from public,anon;
grant execute on function private.has_membership(uuid,text[]) to authenticated;
grant execute on function private.is_section_faculty(uuid) to authenticated;
grant execute on function private.is_enrolled(uuid) to authenticated;
grant execute on function private.can_read_profile(uuid) to authenticated;
grant execute on function private.can_manage_session(uuid) to authenticated;
grant execute on function private.create_attendance_session(uuid) to authenticated;
grant execute on function private.close_attendance_session(uuid) to authenticated;
grant execute on function private.record_attendance(uuid) to authenticated;
revoke all on all functions in schema public from public, anon, authenticated;
revoke all on function public.create_attendance_session(uuid) from public,anon;
revoke all on function public.close_attendance_session(uuid) from public,anon;
revoke all on function public.record_attendance(uuid) from public,anon;
revoke all on function public.can_manage_attendance_session(uuid) from public,anon;
grant execute on function public.create_attendance_session(uuid) to authenticated;
grant execute on function public.close_attendance_session(uuid) to authenticated;
grant execute on function public.record_attendance(uuid) to authenticated;
grant execute on function public.can_manage_attendance_session(uuid) to authenticated;

alter table public.institutions enable row level security;
alter table public.institution_settings enable row level security;
alter table public.profiles enable row level security;
alter table public.institution_memberships enable row level security;
alter table public.departments enable row level security;
alter table public.academic_terms enable row level security;
alter table public.courses enable row level security;
alter table public.course_sections enable row level security;
alter table public.section_faculty enable row level security;
alter table public.enrollments enable row level security;
alter table public.attendance_sessions enable row level security;
alter table public.attendance_records enable row level security;
alter table public.audit_events enable row level security;

revoke all on all tables in schema public from anon, authenticated;
-- Regrant the minimum table and column privileges after clearing project defaults.
grant select on public.institutions,public.institution_settings,public.profiles,public.institution_memberships,
  public.departments,public.academic_terms,public.courses,public.course_sections,public.section_faculty,
  public.enrollments,public.attendance_sessions,public.attendance_records,public.audit_events to authenticated;
revoke all on all sequences in schema public from anon, authenticated;
grant update (display_name) on public.profiles to authenticated;
grant update (status) on public.institution_memberships to authenticated;
grant insert,update,delete on public.institution_settings,public.departments,public.academic_terms,public.courses,
  public.course_sections,public.section_faculty,public.enrollments to authenticated;

create policy "members read institutions" on public.institutions for select to authenticated
  using (private.has_membership(id,null));
create policy "members read settings" on public.institution_settings for select to authenticated
  using (private.has_membership(institution_id,null));
create policy "admins manage settings" on public.institution_settings for all to authenticated
  using (private.has_membership(institution_id,array['admin']::text[]))
  with check (private.has_membership(institution_id,array['admin']::text[]));
create policy "users read own profile" on public.profiles for select to authenticated
  using (private.can_read_profile(id));
create policy "users update own profile" on public.profiles for update to authenticated
  using (id=(select auth.uid())) with check (id=(select auth.uid()));
create policy "users read own membership" on public.institution_memberships for select to authenticated
  using (user_id=(select auth.uid()) or private.has_membership(institution_id,array['admin']::text[]));
create policy "admins update other member status" on public.institution_memberships for update to authenticated
  using (user_id<>(select auth.uid()) and private.has_membership(institution_id,array['admin']::text[]))
  with check (user_id<>(select auth.uid()) and private.has_membership(institution_id,array['admin']::text[]));

create policy "members read departments" on public.departments for select to authenticated
  using (private.has_membership(institution_id,null));
create policy "admins manage departments" on public.departments for all to authenticated
  using (private.has_membership(institution_id,array['admin']::text[]))
  with check (private.has_membership(institution_id,array['admin']::text[]));
create policy "members read terms" on public.academic_terms for select to authenticated
  using (private.has_membership(institution_id,null));
create policy "admins manage terms" on public.academic_terms for all to authenticated
  using (private.has_membership(institution_id,array['admin']::text[]))
  with check (private.has_membership(institution_id,array['admin']::text[]));
create policy "members read courses" on public.courses for select to authenticated
  using (private.has_membership(institution_id,null));
create policy "admins manage courses" on public.courses for all to authenticated
  using (private.has_membership(institution_id,array['admin']::text[]))
  with check (private.has_membership(institution_id,array['admin']::text[]));
create policy "users read relevant sections" on public.course_sections for select to authenticated
  using (private.has_membership(institution_id,array['admin']::text[])
    or (private.has_membership(institution_id,array['faculty']::text[]) and private.is_section_faculty(id))
    or (private.has_membership(institution_id,array['student']::text[]) and private.is_enrolled(id)));
create policy "admins manage sections" on public.course_sections for all to authenticated
  using (private.has_membership(institution_id,array['admin']::text[]))
  with check (private.has_membership(institution_id,array['admin']::text[]));
create policy "users read relevant faculty links" on public.section_faculty for select to authenticated
  using (private.has_membership(institution_id,array['admin']::text[])
    or faculty_user_id=(select auth.uid())
    or private.is_enrolled(section_id));
create policy "admins manage faculty links" on public.section_faculty for all to authenticated
  using (private.has_membership(institution_id,array['admin']::text[]))
  with check (private.has_membership(institution_id,array['admin']::text[]));
create policy "users read relevant enrollments" on public.enrollments for select to authenticated
  using (student_user_id=(select auth.uid())
    or private.has_membership(institution_id,array['admin']::text[])
    or (private.has_membership(institution_id,array['faculty']::text[]) and private.is_section_faculty(section_id)));
create policy "admins manage enrollments" on public.enrollments for all to authenticated
  using (private.has_membership(institution_id,array['admin']::text[]))
  with check (private.has_membership(institution_id,array['admin']::text[]));
create policy "users read relevant attendance sessions" on public.attendance_sessions for select to authenticated
  using (private.has_membership(institution_id,array['admin']::text[])
    or (private.has_membership(institution_id,array['faculty']::text[]) and private.is_section_faculty(section_id))
    or (private.has_membership(institution_id,array['student']::text[]) and private.is_enrolled(section_id)));
create policy "users read relevant attendance" on public.attendance_records for select to authenticated
  using (student_user_id=(select auth.uid())
    or private.has_membership(institution_id,array['admin']::text[])
    or exists (select 1 from public.attendance_sessions s
      where s.id=attendance_records.session_id and private.has_membership(institution_id,array['faculty']::text[])
      and private.is_section_faculty(s.section_id)));
create policy "admins read audit events" on public.audit_events for select to authenticated
  using (private.has_membership(institution_id,array['admin']::text[]));

insert into public.institutions(id,name,slug,timezone)
values ('00000000-0000-4000-8000-000000000001','SAMS Demo Institution','sams-demo','UTC')
on conflict (id) do nothing;
insert into public.institution_settings(institution_id)
values ('00000000-0000-4000-8000-000000000001') on conflict (institution_id) do nothing;
