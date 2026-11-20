-- Keep direct Data API reads consistent with the application's active-membership
-- gate. A suspended user may remain in Auth and retain historical rows, but
-- cannot use an old session to read those rows directly.
create or replace function private.can_read_profile(p_user_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.institution_memberships own
    where own.user_id = (select auth.uid())
      and own.user_id = p_user_id
      and own.status = 'active'
  ) or exists (
    select 1
    from public.institution_memberships target
    join public.institution_memberships viewer
      on viewer.institution_id = target.institution_id
    where target.user_id = p_user_id
      and viewer.user_id = (select auth.uid())
      and viewer.status = 'active'
      and (
        viewer.role = 'admin'
        or (
          viewer.role = 'faculty'
          and exists (
            select 1
            from public.enrollments e
            join public.section_faculty sf on sf.section_id = e.section_id
            where e.student_user_id = target.user_id
              and e.status = 'active'
              and sf.faculty_user_id = viewer.user_id
          )
        )
      )
  );
$$;

drop policy if exists "users update own profile" on public.profiles;
create policy "users update own profile" on public.profiles for update to authenticated
  using (
    id = (select auth.uid())
    and exists (
      select 1
      from public.institution_memberships
      where user_id = (select auth.uid()) and status = 'active'
    )
  )
  with check (
    id = (select auth.uid())
    and exists (
      select 1
      from public.institution_memberships
      where user_id = (select auth.uid()) and status = 'active'
    )
  );

drop policy if exists "users read relevant faculty links" on public.section_faculty;
create policy "users read relevant faculty links" on public.section_faculty for select to authenticated
  using (
    private.has_membership(institution_id, array['admin']::text[])
    or (
      faculty_user_id = (select auth.uid())
      and private.has_membership(institution_id, array['faculty']::text[])
    )
    or (
      private.has_membership(institution_id, array['student']::text[])
      and private.is_enrolled(section_id)
    )
  );

drop policy if exists "users read relevant enrollments" on public.enrollments;
create policy "users read relevant enrollments" on public.enrollments for select to authenticated
  using (
    (
      student_user_id = (select auth.uid())
      and private.has_membership(institution_id, array['student']::text[])
    )
    or private.has_membership(institution_id, array['admin']::text[])
    or (
      private.has_membership(institution_id, array['faculty']::text[])
      and private.is_section_faculty(section_id)
    )
  );

drop policy if exists "users read relevant attendance" on public.attendance_records;
create policy "users read relevant attendance" on public.attendance_records for select to authenticated
  using (
    (
      student_user_id = (select auth.uid())
      and private.has_membership(institution_id, array['student']::text[])
    )
    or private.has_membership(institution_id, array['admin']::text[])
    or exists (
      select 1
      from public.attendance_sessions s
      where s.id = attendance_records.session_id
        and private.has_membership(s.institution_id, array['faculty']::text[])
        and private.is_section_faculty(s.section_id)
    )
  );
