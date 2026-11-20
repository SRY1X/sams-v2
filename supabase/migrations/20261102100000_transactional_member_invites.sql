-- Keep membership creation and its audit event atomic. Auth user creation is
-- still performed by the Auth Admin API, so the application removes that user
-- if this transaction fails.
create function private.create_invited_membership(
  p_institution_id uuid,
  p_user_id uuid,
  p_role text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid := (select auth.uid());
  v_membership_id uuid;
begin
  if v_actor_id is null
    or not private.has_membership(p_institution_id, array['admin']::text[]) then
    raise exception using errcode = '42501', message = 'Not authorized';
  end if;
  if p_role not in ('student', 'faculty') then
    raise exception using errcode = '22023', message = 'Invalid invite role';
  end if;
  if exists (
    select 1
    from public.institution_memberships
    where institution_id = p_institution_id and user_id = p_user_id
  ) then
    raise exception using
      errcode = '23505',
      message = 'Member already has an institution membership';
  end if;

  insert into public.institution_memberships(institution_id,user_id,role,status)
  values (p_institution_id,p_user_id,p_role,'active')
  returning id into v_membership_id;

  insert into public.audit_events(
    institution_id,actor_id,action,entity_type,entity_id,details
  )
  values (
    p_institution_id,
    v_actor_id,
    'membership.invited',
    'institution_membership',
    v_membership_id,
    jsonb_build_object('role', p_role)
  );

  return v_membership_id;
end;
$$;

revoke all on function private.create_invited_membership(uuid,uuid,text)
  from public, anon, authenticated;

create function public.create_invited_membership(
  p_institution_id uuid,
  p_user_id uuid,
  p_role text
)
returns uuid
language sql
security definer
set search_path = ''
as $$
  select private.create_invited_membership(p_institution_id,p_user_id,p_role);
$$;

revoke all on function public.create_invited_membership(uuid,uuid,text)
  from public, anon;
grant execute on function public.create_invited_membership(uuid,uuid,text)
  to authenticated;
