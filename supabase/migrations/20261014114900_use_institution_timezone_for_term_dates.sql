create or replace function private.create_attendance_session(p_section_id uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_institution_id uuid;
  v_timezone text;
  v_starts_on date;
  v_ends_on date;
  v_duration integer;
  v_session_id uuid;
begin
  select s.institution_id, i.timezone, t.starts_on, t.ends_on
    into v_institution_id, v_timezone, v_starts_on, v_ends_on
  from public.course_sections s
  join public.academic_terms t on (t.id,t.institution_id) = (s.term_id,s.institution_id)
  join public.institutions i on i.id = s.institution_id
  where s.id = p_section_id;
  if v_institution_id is null then raise exception using errcode = '42501', message = 'Not authorized'; end if;
  if not (private.has_membership(v_institution_id,array['admin']::text[])
    or (private.has_membership(v_institution_id,array['faculty']::text[]) and private.is_section_faculty(p_section_id)))
  then raise exception using errcode = '42501', message = 'Not authorized'; end if;
  if (now() at time zone v_timezone)::date < v_starts_on
    or (now() at time zone v_timezone)::date > v_ends_on then
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
