-- D01: review against the live schema before applying in Supabase SQL Editor.
-- No data is deleted. Replaces policies/grants only on the seven application tables.
begin;

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

-- Definer helpers avoid recursive classroom/membership/profile RLS queries.
-- private must not be added to the Data API exposed schemas.
create or replace function private.owns_classroom(class_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.classrooms c
    where c.id = class_id and c.teacher_id = (select auth.uid()));
$$;
create or replace function private.is_classroom_member(class_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.classroom_students s
    where s.classroom_id = class_id and s.student_id = (select auth.uid()));
$$;
create or replace function private.can_access_classroom(class_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select private.owns_classroom(class_id) or private.is_classroom_member(class_id);
$$;
create or replace function private.shares_classroom(profile_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select profile_id = (select auth.uid()) or exists (
    select 1 from public.classrooms c where private.can_access_classroom(c.id)
      and (c.teacher_id = profile_id or exists (select 1 from public.classroom_students s
        where s.classroom_id = c.id and s.student_id = profile_id))
  );
$$;
create or replace function private.can_write_essay(task_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.assignments a
    where a.id = task_id and private.is_classroom_member(a.classroom_id));
$$;
create or replace function private.can_read_essay(work_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.essays e join public.assignments a on a.id = e.assignment_id
    where e.id = work_id and private.can_access_classroom(a.classroom_id)
      and (e.author_id = (select auth.uid()) or e.status <> 'draft'));
$$;
create or replace function private.owns_essay_classroom(work_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.essays e join public.assignments a on a.id = e.assignment_id
    where e.id = work_id and private.owns_classroom(a.classroom_id));
$$;
create or replace function private.can_review_essay(work_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.essays e join public.assignments a on a.id = e.assignment_id
    where e.id = work_id and e.status <> 'draft'
      and (private.owns_classroom(a.classroom_id)
        or (private.is_classroom_member(a.classroom_id) and e.author_id <> (select auth.uid()))));
$$;

-- Invitations are capabilities: the caller must supply the code, never another user ID.
create or replace function public.join_classroom_by_code(join_code text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare class_id uuid; owner_id uuid; caller uuid := auth.uid();
begin
  if caller is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  select c.id, c.teacher_id into class_id, owner_id from public.classrooms c
    where upper(btrim(c.code)) = upper(btrim(join_code));
  if class_id is null then raise exception 'Invalid classroom code' using errcode = 'P0002'; end if;
  if owner_id = caller then raise exception 'teacher_owner' using errcode = 'P0001'; end if;
  if exists (select 1 from public.classroom_students s
    where s.classroom_id = class_id and s.student_id = caller) then
    raise exception 'already_joined' using errcode = 'P0001';
  end if;
  insert into public.classroom_students(classroom_id, student_id) values (class_id, caller)
    on conflict do nothing;
  return class_id;
end;
$$;
revoke all on function public.join_classroom_by_code(text) from public, anon;
grant execute on function public.join_classroom_by_code(text) to authenticated;

-- A collective review may be extended, but an existing foreign contribution is immutable
-- for peers. JSON identity is validated/stamped here, never used as a membership grant.
create or replace function private.guard_review_contributions()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  caller uuid := auth.uid(); owner boolean;
  person_name text; key text; previous_owner text; item jsonb; previous jsonb;
  keys constant text[] := array['taskResponse','coherence','lexicalResource','grammar'];
  band_sum numeric := 0; band_count integer := 0; avg_band numeric;
begin
  -- Trusted SQL maintenance may run without a JWT; client roles never bypass this guard.
  if caller is null then
    if current_setting('role', true) in ('anon', 'authenticated') then
      raise exception 'Authentication required' using errcode = '42501';
    end if;
    return new;
  end if;
  if not private.can_review_essay(new.essay_id) then
    raise exception 'Review access denied' using errcode = '42501';
  end if;
  owner := private.owns_essay_classroom(new.essay_id);
  select p.name into person_name from public.profiles p where p.id = caller;
  if tg_op = 'UPDATE' and (new.id <> old.id or new.essay_id <> old.essay_id
    or new.reviewer_id <> old.reviewer_id or new.created_at is distinct from old.created_at) then
    raise exception 'Review identity is immutable' using errcode = '42501';
  end if;
  if tg_op = 'INSERT' and new.reviewer_id <> caller then
    raise exception 'Reviewer must be the caller' using errcode = '42501';
  end if;
  if owner then
    new.edited_by_teacher := true;
    new.teacher_id := caller;
    new.teacher_name := person_name;
    new.teacher_edited_at := now();
    new.original_band := case when tg_op = 'UPDATE' then coalesce(old.original_band, old.overall_band)
      else new.overall_band end;
    return new;
  end if;
  if tg_op = 'INSERT' then
    if new.edited_by_teacher or new.teacher_id is not null or new.teacher_name is not null
      or new.teacher_edited_at is not null or new.teacher_feedback is not null or new.original_band is not null then
      raise exception 'Teacher fields are protected' using errcode = '42501';
    end if;
  else
    if old.edited_by_teacher or old.teacher_id is not null
      or row(new.edited_by_teacher,new.teacher_id,new.teacher_name,new.teacher_edited_at,new.teacher_feedback,new.original_band)
        is distinct from row(old.edited_by_teacher,old.teacher_id,old.teacher_name,old.teacher_edited_at,old.teacher_feedback,old.original_band) then
      raise exception 'Teacher fields are protected' using errcode = '42501';
    end if;
    if old.reviewer_id <> caller and new.general_verdict is distinct from old.general_verdict then
      raise exception 'Another reviewer owns this verdict' using errcode = '42501';
    end if;
    if not coalesce(old.reviewed_criteria, '{}') <@ coalesce(new.reviewed_criteria, '{}') then
      raise exception 'Cannot remove assessed criteria' using errcode = '42501';
    end if;
  end if;
  if jsonb_typeof(new.criteria) <> 'object' or jsonb_typeof(new.criteria_evaluators) <> 'object'
    or jsonb_typeof(new.inline_comments) <> 'array' or jsonb_typeof(new.contributors) <> 'array'
    or new.criteria_evaluators is null or new.inline_comments is null or new.contributors is null
    or new.reviewed_criteria is null or cardinality(new.reviewed_criteria) = 0
    or not new.reviewed_criteria <@ keys
    or exists (select 1 from jsonb_object_keys(new.criteria_evaluators) k where not k = any(keys)) then
    raise exception 'Invalid review structure' using errcode = '23514';
  end if;
  foreach key in array keys loop
    previous_owner := null;
    if tg_op = 'UPDATE' then
      previous_owner := old.criteria_evaluators -> key ->> 'userId';
      -- Legacy assessments with no evaluator belong to the original reviewer.
      if previous_owner is null and (key = any(coalesce(old.reviewed_criteria, '{}'))
        or (old.is_complete and coalesce(cardinality(old.reviewed_criteria),0) = 0)) then
        previous_owner := old.reviewer_id::text;
      end if;
      if previous_owner is not null and previous_owner <> caller::text then
        if new.criteria -> key is distinct from old.criteria -> key
          or new.criteria_evaluators -> key is distinct from old.criteria_evaluators -> key then
          raise exception 'Another reviewer owns criterion %', key using errcode = '42501';
        end if;
      end if;
    end if;
    if key = any(new.reviewed_criteria) then
      if previous_owner is null or previous_owner = caller::text then
        if new.criteria_evaluators -> key ->> 'userId' is distinct from caller::text then
          raise exception 'Evaluator must be the caller' using errcode = '42501';
        end if;
        new.criteria_evaluators := jsonb_set(new.criteria_evaluators, array[key],
          jsonb_build_object('userId',caller,'userName',person_name,'userRole','student',
            'evaluatedAt',now(),'band',new.criteria -> key -> 'band'));
      end if;
      avg_band := (new.criteria -> key ->> 'band')::numeric;
      if avg_band is null or avg_band < 0 or avg_band > 9 then
        raise exception 'Invalid band' using errcode = '23514';
      end if;
      band_sum := band_sum + avg_band; band_count := band_count + 1;
    elsif new.criteria_evaluators ? key then
      raise exception 'Evaluator without assessed criterion' using errcode = '23514';
    end if;
  end loop;
  -- Preserve every foreign comment, including IDs, author and text offsets.
  if tg_op = 'UPDATE' then
    for item in select value from jsonb_array_elements(coalesce(old.inline_comments, '[]')) loop
      if coalesce(item ->> 'authorId', old.reviewer_id::text) <> caller::text
        and not new.inline_comments @> jsonb_build_array(item) then
        raise exception 'Another reviewer owns this comment' using errcode = '42501';
      end if;
    end loop;
    for item in select value from jsonb_array_elements(coalesce(old.contributors, '[]')) loop
      if item ->> 'userId' is distinct from caller::text
        and not new.contributors @> jsonb_build_array(item) then
        raise exception 'Another reviewer owns this contribution' using errcode = '42501';
      end if;
    end loop;
  end if;
  if exists (select 1 from jsonb_array_elements(new.inline_comments) c
    group by c ->> 'id' having c ->> 'id' is null or count(*) > 1)
    or exists (select 1 from jsonb_array_elements(new.contributors) c
      group by c ->> 'userId' having c ->> 'userId' is null or count(*) > 1) then
    raise exception 'Invalid contribution identity' using errcode = '23514';
  end if;
  for item in select value from jsonb_array_elements(new.inline_comments) loop
    previous := null;
    if tg_op = 'UPDATE' then
      select value into previous from jsonb_array_elements(coalesce(old.inline_comments, '[]'))
        where value ->> 'id' = item ->> 'id';
    end if;
    if previous is null or item is distinct from previous then
      if item ->> 'authorId' is distinct from caller::text then
        raise exception 'Comment author must be the caller' using errcode = '42501';
      end if;
    end if;
  end loop;
  for item in select value from jsonb_array_elements(new.contributors) loop
    previous := null;
    if tg_op = 'UPDATE' then
      select value into previous from jsonb_array_elements(coalesce(old.contributors, '[]'))
        where value ->> 'userId' = item ->> 'userId';
    end if;
    if previous is null or item is distinct from previous then
      if item ->> 'userId' is distinct from caller::text or item ->> 'role' is distinct from 'student' then
        raise exception 'Contributor must be the caller' using errcode = '42501';
      end if;
      if jsonb_typeof(item -> 'criteriaAssessed') is distinct from 'array'
        or exists (select 1 from jsonb_array_elements_text(item -> 'criteriaAssessed') assessed
          where not assessed = any(keys) or new.criteria_evaluators -> assessed ->> 'userId' is distinct from caller::text) then
        raise exception 'Contributor does not own these criteria' using errcode = '42501';
      end if;
    end if;
  end loop;
  select coalesce(jsonb_agg(case when value ->> 'authorId' = caller::text then
    value || jsonb_build_object('authorName',person_name) else value end), '[]')
    into new.inline_comments from jsonb_array_elements(new.inline_comments);
  select coalesce(jsonb_agg(case when value ->> 'userId' = caller::text then
    value || jsonb_build_object('userName',person_name,'role','student') else value end), '[]')
    into new.contributors from jsonb_array_elements(new.contributors);
  avg_band := band_sum / band_count;
  new.overall_band := floor(avg_band) + case when avg_band - floor(avg_band) < 0.25 then 0
    when avg_band - floor(avg_band) < 0.75 then 0.5 else 1 end;
  new.is_complete := true; -- submitted includes partial reviews
  new.is_partial := not keys <@ new.reviewed_criteria;
  return new;
end;
$$;
drop trigger if exists guard_review_contributions on public.reviews;
create trigger guard_review_contributions before insert or update on public.reviews
  for each row execute function private.guard_review_contributions();

create or replace function private.notification_context_access(class_id uuid, task_id uuid, work_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select case
    when work_id is not null then exists (
      select 1 from public.essays e join public.assignments a on a.id = e.assignment_id
      where e.id = work_id and (task_id is null or task_id = a.id)
        and (class_id is null or class_id = a.classroom_id) and private.can_read_essay(e.id))
    when task_id is not null then exists (select 1 from public.assignments a
      where a.id = task_id and (class_id is null or class_id = a.classroom_id)
        and private.can_access_classroom(a.classroom_id))
    when class_id is not null then private.can_access_classroom(class_id)
    else true end;
$$;
create or replace function private.can_send_notification(kind text, class_id uuid, task_id uuid, work_id uuid, recipient text)
returns boolean language plpgsql stable security definer set search_path = '' as $$
declare target_class uuid; work_author uuid; owner_id uuid;
begin
  if auth.uid() is null or recipient = 'all' then return false; end if;
  if not private.notification_context_access(class_id, task_id, work_id) then return false; end if;
  if work_id is not null then
    select a.classroom_id, e.author_id into target_class, work_author
      from public.essays e join public.assignments a on a.id = e.assignment_id where e.id = work_id;
  elsif task_id is not null then
    select a.classroom_id into target_class from public.assignments a where a.id = task_id;
  else target_class := class_id; end if;
  if target_class is null then return false; end if;
  select c.teacher_id into owner_id from public.classrooms c where c.id = target_class;
  if not (recipient = owner_id::text or exists (select 1 from public.classroom_students s
    where s.classroom_id = target_class and s.student_id::text = recipient)) then return false; end if;
  if private.owns_classroom(target_class) then
    return kind in ('new_assignment', 'new_topic', 'deadline_reminder', 'grade_edited_by_teacher', 'essay_reviewed');
  end if;
  return kind in ('essay_reviewed','review_received','review_submitted') and work_id is not null
    and recipient in (work_author::text, owner_id::text) and exists (
      select 1 from public.reviews r where r.essay_id = work_id and r.is_complete
        and (r.reviewer_id = auth.uid() or exists (select 1 from jsonb_each(r.criteria_evaluators) ev
          where ev.value ->> 'userId' = auth.uid()::text)));
end;
$$;

-- Replace all policies on these tables: permissive policies combine with OR.
do $$ declare policy record; tab text;
begin
  foreach tab in array array['profiles','classrooms','classroom_students','assignments','essays','reviews','notifications'] loop
    execute format('alter table public.%I enable row level security', tab);
    for policy in select policyname from pg_policies where schemaname = 'public' and tablename = tab loop
      execute format('drop policy %I on public.%I', policy.policyname, tab);
    end loop;
    execute format('revoke all on table public.%I from public, anon, authenticated', tab);
    -- Clear pre-existing column grants too; table REVOKE does not remove them.
    execute (select format('revoke select (%s), insert (%s), update (%s), references (%s) on public.%I from public, anon, authenticated',
      string_agg(quote_ident(attname), ','), string_agg(quote_ident(attname), ','),
      string_agg(quote_ident(attname), ','), string_agg(quote_ident(attname), ','), tab)
      from pg_attribute where attrelid = format('public.%I', tab)::regclass and attnum > 0 and not attisdropped);
    execute format('grant select on table public.%I to authenticated', tab);
  end loop;
end $$;
grant update (name, avatar, role) on public.profiles to authenticated;
-- role is a self-selected UI preference, NEVER an authorization input.
grant insert on public.classrooms, public.assignments, public.essays, public.reviews, public.notifications to authenticated;
grant update (name, code, description, color) on public.classrooms to authenticated;
grant delete on public.classroom_students to authenticated;
grant update (title, prompt, essay_type, deadline, min_words, required_reviews) on public.assignments to authenticated;
grant update (content, word_count, status, submitted_at, is_exam_mode, time_spent_seconds) on public.essays to authenticated;
grant update (overall_band, general_verdict, is_complete, is_partial, edited_by_teacher, teacher_id,
  teacher_name, teacher_edited_at, teacher_feedback, original_band, criteria, reviewed_criteria,
  criteria_evaluators, contributors, inline_comments) on public.reviews to authenticated;
grant update (read) on public.notifications to authenticated;

create policy profiles_select on public.profiles for select to authenticated using (private.shares_classroom(id));
create policy profiles_update on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy classrooms_select on public.classrooms for select to authenticated using (private.can_access_classroom(id));
create policy classrooms_insert on public.classrooms for insert to authenticated with check (teacher_id = (select auth.uid()));
create policy classrooms_update on public.classrooms for update to authenticated using (private.owns_classroom(id)) with check (private.owns_classroom(id));
create policy cs_select on public.classroom_students for select to authenticated using (private.can_access_classroom(classroom_id));
create policy cs_delete on public.classroom_students for delete to authenticated using (student_id = (select auth.uid()) or private.owns_classroom(classroom_id));
create policy assignments_select on public.assignments for select to authenticated using (private.can_access_classroom(classroom_id));
create policy assignments_insert on public.assignments for insert to authenticated with check (private.owns_classroom(classroom_id));
create policy assignments_update on public.assignments for update to authenticated using (private.owns_classroom(classroom_id)) with check (private.owns_classroom(classroom_id));
create policy essays_select on public.essays for select to authenticated using (private.can_read_essay(id));
create policy essays_insert on public.essays for insert to authenticated with check (author_id = (select auth.uid()) and private.can_write_essay(assignment_id));
create policy essays_update on public.essays for update to authenticated using (author_id = (select auth.uid()) and private.can_write_essay(assignment_id)) with check (author_id = (select auth.uid()) and private.can_write_essay(assignment_id));
create policy reviews_select on public.reviews for select to authenticated using (private.can_read_essay(essay_id) and (is_complete or reviewer_id = (select auth.uid()) or private.owns_essay_classroom(essay_id)));
create policy reviews_insert on public.reviews for insert to authenticated with check (reviewer_id = (select auth.uid()) and private.can_review_essay(essay_id));
create policy reviews_update on public.reviews for update to authenticated using (private.can_review_essay(essay_id) and (is_complete or reviewer_id = (select auth.uid()) or private.owns_essay_classroom(essay_id))) with check (private.can_review_essay(essay_id));
create policy notif_select on public.notifications for select to authenticated using (recipient_id = (select auth.uid())::text and private.notification_context_access(classroom_id, assignment_id, essay_id));
create policy notif_insert on public.notifications for insert to authenticated with check (private.can_send_notification(type, classroom_id, assignment_id, essay_id, recipient_id));
create policy notif_update on public.notifications for update to authenticated using (recipient_id = (select auth.uid())::text and private.notification_context_access(classroom_id, assignment_id, essay_id)) with check (recipient_id = (select auth.uid())::text and private.notification_context_access(classroom_id, assignment_id, essay_id));

-- Helpers are not public RPC endpoints. Lock default EXECUTE privileges explicitly.
revoke all on function private.guard_review_contributions(), private.owns_classroom(uuid),
  private.is_classroom_member(uuid), private.can_access_classroom(uuid), private.shares_classroom(uuid),
  private.can_write_essay(uuid), private.can_read_essay(uuid), private.owns_essay_classroom(uuid),
  private.can_review_essay(uuid), private.notification_context_access(uuid,uuid,uuid),
  private.can_send_notification(text,uuid,uuid,uuid,text) from public, anon, authenticated;
grant execute on function private.owns_classroom(uuid), private.is_classroom_member(uuid),
  private.can_access_classroom(uuid), private.shares_classroom(uuid), private.can_write_essay(uuid),
  private.can_read_essay(uuid), private.owns_essay_classroom(uuid), private.can_review_essay(uuid),
  private.notification_context_access(uuid,uuid,uuid), private.can_send_notification(text,uuid,uuid,uuid,text)
  to authenticated;

commit;
