-- Run only after 202610010001_classroom_rls.sql on an existing database.
create or replace function private.sync_essay_review_status()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  update public.essays e set status = case
    when exists (select 1 from public.reviews r where r.essay_id = new.essay_id
      and r.is_complete and (r.edited_by_teacher or not r.is_partial)) then 'reviewed'
    when exists (select 1 from public.reviews r where r.essay_id = new.essay_id
      and r.is_complete) then 'reviewing'
    else 'submitted' end
  where e.id = new.essay_id and e.status <> 'draft';
  return new;
end;
$$;
revoke all on function private.sync_essay_review_status() from public, anon, authenticated;
drop trigger if exists sync_essay_review_status on public.reviews;
create trigger sync_essay_review_status after insert or update on public.reviews
  for each row execute function private.sync_essay_review_status();

-- Repair statuses left by client-only review submissions without changing drafts.
update public.essays e set status = case
  when exists (select 1 from public.reviews r where r.essay_id = e.id
    and r.is_complete and (r.edited_by_teacher or not r.is_partial)) then 'reviewed'
  when exists (select 1 from public.reviews r where r.essay_id = e.id
    and r.is_complete) then 'reviewing'
  else 'submitted' end
where e.status <> 'draft' and exists
  (select 1 from public.reviews r where r.essay_id = e.id and r.is_complete);
