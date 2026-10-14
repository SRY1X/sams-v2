-- Keep administrator writes scoped to their institution while allowing the
-- dedicated member/section SELECT policies to handle reads exactly once.
drop policy if exists "admins manage terms" on public.academic_terms;
create policy "admins insert terms" on public.academic_terms
  for insert to authenticated
  with check (private.has_membership(institution_id, array['admin']::text[]));
create policy "admins update terms" on public.academic_terms
  for update to authenticated
  using (private.has_membership(institution_id, array['admin']::text[]))
  with check (private.has_membership(institution_id, array['admin']::text[]));
create policy "admins delete terms" on public.academic_terms
  for delete to authenticated
  using (private.has_membership(institution_id, array['admin']::text[]));

drop policy if exists "admins manage sections" on public.course_sections;
create policy "admins insert sections" on public.course_sections
  for insert to authenticated
  with check (private.has_membership(institution_id, array['admin']::text[]));
create policy "admins update sections" on public.course_sections
  for update to authenticated
  using (private.has_membership(institution_id, array['admin']::text[]))
  with check (private.has_membership(institution_id, array['admin']::text[]));
create policy "admins delete sections" on public.course_sections
  for delete to authenticated
  using (private.has_membership(institution_id, array['admin']::text[]));

drop policy if exists "admins manage courses" on public.courses;
create policy "admins insert courses" on public.courses
  for insert to authenticated
  with check (private.has_membership(institution_id, array['admin']::text[]));
create policy "admins update courses" on public.courses
  for update to authenticated
  using (private.has_membership(institution_id, array['admin']::text[]))
  with check (private.has_membership(institution_id, array['admin']::text[]));
create policy "admins delete courses" on public.courses
  for delete to authenticated
  using (private.has_membership(institution_id, array['admin']::text[]));

drop policy if exists "admins manage departments" on public.departments;
create policy "admins insert departments" on public.departments
  for insert to authenticated
  with check (private.has_membership(institution_id, array['admin']::text[]));
create policy "admins update departments" on public.departments
  for update to authenticated
  using (private.has_membership(institution_id, array['admin']::text[]))
  with check (private.has_membership(institution_id, array['admin']::text[]));
create policy "admins delete departments" on public.departments
  for delete to authenticated
  using (private.has_membership(institution_id, array['admin']::text[]));

drop policy if exists "admins manage enrollments" on public.enrollments;
create policy "admins insert enrollments" on public.enrollments
  for insert to authenticated
  with check (private.has_membership(institution_id, array['admin']::text[]));
create policy "admins update enrollments" on public.enrollments
  for update to authenticated
  using (private.has_membership(institution_id, array['admin']::text[]))
  with check (private.has_membership(institution_id, array['admin']::text[]));
create policy "admins delete enrollments" on public.enrollments
  for delete to authenticated
  using (private.has_membership(institution_id, array['admin']::text[]));

drop policy if exists "admins manage settings" on public.institution_settings;
create policy "admins insert settings" on public.institution_settings
  for insert to authenticated
  with check (private.has_membership(institution_id, array['admin']::text[]));
create policy "admins update settings" on public.institution_settings
  for update to authenticated
  using (private.has_membership(institution_id, array['admin']::text[]))
  with check (private.has_membership(institution_id, array['admin']::text[]));
create policy "admins delete settings" on public.institution_settings
  for delete to authenticated
  using (private.has_membership(institution_id, array['admin']::text[]));

drop policy if exists "admins manage faculty links" on public.section_faculty;
create policy "admins insert faculty links" on public.section_faculty
  for insert to authenticated
  with check (private.has_membership(institution_id, array['admin']::text[]));
create policy "admins update faculty links" on public.section_faculty
  for update to authenticated
  using (private.has_membership(institution_id, array['admin']::text[]))
  with check (private.has_membership(institution_id, array['admin']::text[]));
create policy "admins delete faculty links" on public.section_faculty
  for delete to authenticated
  using (private.has_membership(institution_id, array['admin']::text[]));
