-- Shorten the shipped QR lifetime without overwriting institution-specific
-- policy choices that differ from the previous shipped defaults.
alter table public.institution_settings
  alter column settings set default
  '{"qr_rotation_seconds":10,"qr_token_ttl_seconds":10,"max_session_seconds":7200}'::jsonb;

update public.institution_settings
set settings = jsonb_set(
  jsonb_set(settings, '{qr_rotation_seconds}', '10'::jsonb, true),
  '{qr_token_ttl_seconds}',
  '10'::jsonb,
  true
)
where settings->>'qr_rotation_seconds' = '25'
  and settings->>'qr_token_ttl_seconds' = '40';

-- Return only the QR policy fields required by the server-side signer. RLS on
-- attendance_sessions and institution_settings remains in effect because this
-- is an invoker function; the explicit manager predicate is defense in depth.
create function public.get_attendance_qr_context(p_session_id uuid)
returns table (
  expires_at timestamptz,
  qr_rotation_seconds integer,
  qr_token_ttl_seconds integer
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    s.expires_at,
    coalesce((settings.settings->>'qr_rotation_seconds')::integer, 10),
    coalesce((settings.settings->>'qr_token_ttl_seconds')::integer, 10)
  from public.attendance_sessions as s
  left join public.institution_settings as settings
    on settings.institution_id = s.institution_id
  where s.id = p_session_id
    and s.status = 'open'
    and s.expires_at > now()
    and private.can_manage_session(s.id);
$$;

-- Fetch a manager-scoped attendance list and timezone in one round trip. The
-- invoker context preserves RLS on sessions, records, profiles, and institutions.
create function public.get_attendance_session_snapshot(p_session_id uuid)
returns table (
  timezone text,
  records jsonb
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    i.timezone,
    coalesce(
      jsonb_agg(
        jsonb_build_object(
          'id', r.id,
          'name', coalesce(p.display_name, 'Student'),
          'recordedAt', r.recorded_at,
          'status', r.status
        ) order by r.recorded_at, r.id
      ) filter (where r.id is not null),
      '[]'::jsonb
    )
  from public.attendance_sessions as s
  join public.institutions as i on i.id = s.institution_id
  left join public.attendance_records as r on r.session_id = s.id
  left join public.profiles as p on p.id = r.student_user_id
  where s.id = p_session_id
    and private.can_manage_session(s.id)
  group by i.timezone;
$$;

revoke all on function public.get_attendance_qr_context(uuid) from public, anon;
revoke all on function public.get_attendance_session_snapshot(uuid) from public, anon;
grant execute on function public.get_attendance_qr_context(uuid) to authenticated;
grant execute on function public.get_attendance_session_snapshot(uuid) to authenticated;
