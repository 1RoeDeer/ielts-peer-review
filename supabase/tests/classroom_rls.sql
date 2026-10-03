-- Run as postgres in a DISPOSABLE test database after applying the schema/migration.
-- Fixtures and assertion helpers are rolled back; any failed assertion aborts the test.
begin;

create function pg_temp.assert_count(statement text, expected bigint) returns void
language plpgsql as $$ declare actual bigint; begin
  execute 'select count(*) from (' || statement || ') q' into actual;
  if actual <> expected then raise exception 'Expected % rows, got %: %', expected, actual, statement; end if;
end $$;
create function pg_temp.assert_affected(statement text, expected bigint) returns void
language plpgsql as $$ declare actual bigint; begin
  execute statement; get diagnostics actual = row_count;
  if actual <> expected then raise exception 'Expected % affected rows, got %: %', expected, actual, statement; end if;
end $$;
create function pg_temp.expect_denied(statement text) returns void
language plpgsql as $$ begin
  begin execute statement;
  exception when insufficient_privilege then return; end;
  raise exception 'Expected permission denied: %', statement;
end $$;

-- Two owners, two peers in A, a peer in B, and an account with no memberships.
insert into auth.users(id,email,raw_user_meta_data) values
 ('10000000-0000-0000-0000-000000000001','rls-owner-a@example.test','{"name":"Owner A","role":"teacher"}'),
 ('10000000-0000-0000-0000-000000000002','rls-owner-b@example.test','{"name":"Owner B","role":"teacher"}'),
 ('10000000-0000-0000-0000-000000000003','rls-peer-a@example.test','{"name":"Peer A"}'),
 ('10000000-0000-0000-0000-000000000004','rls-peer-a2@example.test','{"name":"Peer A2"}'),
 ('10000000-0000-0000-0000-000000000005','rls-peer-b@example.test','{"name":"Peer B"}'),
 ('10000000-0000-0000-0000-000000000006','rls-outsider@example.test','{"name":"Outsider","role":"teacher"}');
insert into public.classrooms(id,name,code,teacher_id) values
 ('20000000-0000-0000-0000-000000000001','A','RLS-CLASS-A','10000000-0000-0000-0000-000000000001'),
 ('20000000-0000-0000-0000-000000000002','B','RLS-CLASS-B','10000000-0000-0000-0000-000000000002');
insert into public.classroom_students(classroom_id,student_id) values
 ('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000003'),
 ('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000004'),
 ('20000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000005');
insert into public.assignments(id,classroom_id,title) values
 ('30000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','Task A'),
 ('30000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000002','Task B');
insert into public.essays(id,assignment_id,author_id,status,content) values
 ('40000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000003','draft','PRIVATE A DRAFT'),
 ('40000000-0000-0000-0000-000000000002','30000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000004','submitted','A SUBMITTED'),
 ('40000000-0000-0000-0000-000000000003','30000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000005','submitted','PRIVATE B');
insert into public.notifications(id,type,title,recipient_id,classroom_id,assignment_id) values
 ('60000000-0000-0000-0000-000000000001','new_assignment','A notification','10000000-0000-0000-0000-000000000003','20000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001'),
 ('60000000-0000-0000-0000-000000000002','new_assignment','B notification','10000000-0000-0000-0000-000000000005','20000000-0000-0000-0000-000000000002','30000000-0000-0000-0000-000000000002'),
 ('60000000-0000-0000-0000-000000000003','system_security','Legacy global','all',null,null),
 ('60000000-0000-0000-0000-000000000004','system_security','Wrong context','10000000-0000-0000-0000-000000000003','20000000-0000-0000-0000-000000000002',null);

-- Legacy full grade with no evaluators/coverage is still owned by its reviewer.
insert into public.reviews(id,essay_id,reviewer_id,is_complete,criteria) values
 ('50000000-0000-0000-0000-000000000002','40000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000004',true,
 '{"taskResponse":{"band":6},"coherence":{"band":6},"lexicalResource":{"band":6},"grammar":{"band":6}}');
set local role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000003',true);
select pg_temp.expect_denied($test$update public.reviews set criteria=jsonb_set(criteria,'{grammar,band}','9'),
 reviewed_criteria=array['grammar'], criteria_evaluators=jsonb_build_object('grammar',jsonb_build_object('userId',auth.uid()))
 where id='50000000-0000-0000-0000-000000000002'$test$);
reset role;
select set_config('request.jwt.claim.sub','',true);
delete from public.reviews where id='50000000-0000-0000-0000-000000000002';

set local role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000003',true);
select pg_temp.assert_count('select * from public.profiles',3);
select pg_temp.assert_count('select * from public.classrooms',1);
select pg_temp.assert_count('select * from public.classroom_students',2);
select pg_temp.assert_count('select * from public.assignments',1);
select pg_temp.assert_count('select * from public.essays',2);
select pg_temp.assert_count('select * from public.notifications',1);
select pg_temp.assert_affected('update public.essays set content=''My revision'' where id=''40000000-0000-0000-0000-000000000001''',1);
select pg_temp.assert_affected('update public.essays set content=''Foreign revision'' where id=''40000000-0000-0000-0000-000000000002''',0);
select pg_temp.assert_affected('update public.essays set content=''Cross class'' where id=''40000000-0000-0000-0000-000000000003''',0);
select pg_temp.expect_denied('update public.essays set author_id=''10000000-0000-0000-0000-000000000003'' where id=''40000000-0000-0000-0000-000000000002''');
select pg_temp.expect_denied('update public.essays set assignment_id=''30000000-0000-0000-0000-000000000002''');
select pg_temp.expect_denied('insert into public.essays(assignment_id,author_id) values(''30000000-0000-0000-0000-000000000002'',''10000000-0000-0000-0000-000000000003'')');
select pg_temp.expect_denied('insert into public.essays(assignment_id,author_id) values(''30000000-0000-0000-0000-000000000001'',''10000000-0000-0000-0000-000000000006'')');
select pg_temp.expect_denied('insert into public.assignments(classroom_id,title) values(''20000000-0000-0000-0000-000000000001'',''Forged task'')');
select pg_temp.assert_affected('update public.assignments set title=''Forged''',0);
select pg_temp.expect_denied('insert into public.classroom_students values(''20000000-0000-0000-0000-000000000002'',''10000000-0000-0000-0000-000000000003'',now())');
select pg_temp.expect_denied('update public.classroom_students set classroom_id=''20000000-0000-0000-0000-000000000002''');
select pg_temp.assert_affected('delete from public.classroom_students where student_id=''10000000-0000-0000-0000-000000000004''',0);
select pg_temp.assert_affected('update public.profiles set role=''teacher'' where id=auth.uid()',1);
-- A self-selected teacher label cannot grant access to B or ownership of A.
select pg_temp.assert_count('select * from public.classrooms',1);
select pg_temp.assert_affected('update public.classrooms set name=''Stolen''',0);
select pg_temp.expect_denied('insert into public.classrooms(name,code,teacher_id) values(''Stolen'',''RLS-STEAL'',''10000000-0000-0000-0000-000000000001'')');
select pg_temp.assert_affected('update public.notifications set read=true where id=''60000000-0000-0000-0000-000000000001''',1);
select pg_temp.assert_affected('update public.notifications set read=true where id=''60000000-0000-0000-0000-000000000002''',0);
select pg_temp.expect_denied('update public.notifications set recipient_id=auth.uid()::text');
select pg_temp.expect_denied('update public.notifications set body=''Forged''');
select pg_temp.expect_denied('insert into public.notifications(type,title,recipient_id,classroom_id) values(''new_assignment'',''Spam'',''all'',''20000000-0000-0000-0000-000000000001'')');
select pg_temp.expect_denied('insert into public.notifications(type,title,recipient_id,classroom_id) values(''new_assignment'',''Spam'',''10000000-0000-0000-0000-000000000005'',''20000000-0000-0000-0000-000000000002'')');

-- Authorized partial review; forged author/teacher metadata and cross-class review denied.
insert into public.reviews(id,essay_id,reviewer_id,is_complete,is_partial,criteria,reviewed_criteria,criteria_evaluators,contributors,inline_comments,general_verdict) values
 ('50000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000002',auth.uid(),true,true,
 '{"taskResponse":{"band":6},"coherence":{"band":5},"lexicalResource":{"band":5},"grammar":{"band":5}}',
 array['taskResponse'],jsonb_build_object('taskResponse',jsonb_build_object('userId',auth.uid())),
 jsonb_build_array(jsonb_build_object('userId',auth.uid(),'role','student','criteriaAssessed',array['taskResponse'])),
 jsonb_build_array(jsonb_build_object('id','comment-a','authorId',auth.uid(),'startIndex',0,'endIndex',1,'comment','Original A')), 'Original verdict');
select pg_temp.assert_count('select * from public.reviews',1);
select pg_temp.assert_count('select * from public.essays where id=''40000000-0000-0000-0000-000000000002'' and status=''reviewing''',1);
select pg_temp.expect_denied('insert into public.reviews(essay_id,reviewer_id) values(''40000000-0000-0000-0000-000000000003'',auth.uid())');
select pg_temp.expect_denied('insert into public.reviews(essay_id,reviewer_id) values(''40000000-0000-0000-0000-000000000002'',''10000000-0000-0000-0000-000000000004'')');
select pg_temp.expect_denied('update public.reviews set teacher_id=auth.uid(),edited_by_teacher=true');
select pg_temp.expect_denied('update public.reviews set reviewer_id=''10000000-0000-0000-0000-000000000004''');
select pg_temp.expect_denied('update public.reviews set essay_id=''40000000-0000-0000-0000-000000000003''');
select pg_temp.assert_affected('update public.reviews set criteria=jsonb_set(criteria,''{taskResponse,band}'',''7'')',1);
select pg_temp.assert_count('select * from public.reviews where overall_band=7 and is_partial and is_complete',1);
select pg_temp.assert_affected('insert into public.notifications(type,title,recipient_id,essay_id) values(''essay_reviewed'',''Reviewed'',''10000000-0000-0000-0000-000000000004'',''40000000-0000-0000-0000-000000000002'')',1);

-- The essay author cannot grade their own work.
select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000004',true);
select pg_temp.assert_count('select * from public.essays',1); -- A's other student's draft is private
select pg_temp.assert_count('select * from public.reviews',1);
select pg_temp.assert_affected('update public.reviews set overall_band=9',0);
select pg_temp.expect_denied('insert into public.reviews(essay_id,reviewer_id) values(''40000000-0000-0000-0000-000000000002'',auth.uid())');

-- B and a teacher account without memberships cannot see or mutate A.
select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000005',true);
select pg_temp.assert_count('select * from public.profiles',2);
select pg_temp.assert_count('select * from public.classrooms',1);
select pg_temp.assert_count('select * from public.essays',1);
select pg_temp.assert_count('select * from public.reviews',0);
select pg_temp.assert_affected('update public.reviews set overall_band=9',0);
select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000006',true);
select pg_temp.assert_count('select * from public.profiles',1);
select pg_temp.assert_count('select * from public.classrooms',0);
select pg_temp.assert_count('select * from public.assignments',0);
select pg_temp.assert_count('select * from public.essays',0);
select pg_temp.assert_count('select * from public.reviews',0);
select pg_temp.assert_affected('update public.reviews set teacher_id=auth.uid(),edited_by_teacher=true',0);
do $$ begin
  begin perform public.join_classroom_by_code('WRONG');
  exception when no_data_found then return; end;
  raise exception 'Invalid invitation was accepted';
end $$;
select pg_temp.assert_count('select * from public.classrooms',0);
select pg_temp.assert_count('select public.join_classroom_by_code('' rls-class-a '')',1);
select pg_temp.assert_count('select * from public.classrooms',1);
select pg_temp.assert_count('select * from public.assignments',1);

-- A third peer can ADD a criterion/comment, never overwrite an existing foreign grade.
select pg_temp.expect_denied('update public.reviews set criteria=jsonb_set(criteria,''{taskResponse,band}'',''9'')');
select pg_temp.expect_denied('update public.reviews set criteria_evaluators=jsonb_set(criteria_evaluators,''{taskResponse,userId}'',to_jsonb(auth.uid()::text))');
select pg_temp.expect_denied('update public.reviews set inline_comments=''[]''');
select pg_temp.expect_denied('update public.reviews set contributors=''[]''');
select pg_temp.expect_denied('update public.reviews set general_verdict=''Forged verdict''');
select pg_temp.expect_denied('update public.reviews set teacher_feedback=''Forged teacher feedback''');
select pg_temp.assert_affected($test$update public.reviews set
 criteria=jsonb_set(criteria,'{grammar,band}','8'),
 reviewed_criteria=array['taskResponse','grammar'],
 criteria_evaluators=criteria_evaluators || jsonb_build_object('grammar',jsonb_build_object('userId',auth.uid())),
 contributors=contributors || jsonb_build_array(jsonb_build_object('userId',auth.uid(),'role','student','criteriaAssessed',array['grammar'])),
 inline_comments=inline_comments || jsonb_build_array(jsonb_build_object('id','comment-c','authorId',auth.uid(),'startIndex',2,'endIndex',3,'comment','New C'))$test$,1);
select pg_temp.assert_count('select * from public.reviews where overall_band=7.5 and is_partial',1);
select pg_temp.assert_count('select * from public.reviews where inline_comments @> ''[{"id":"comment-a","comment":"Original A"}]''',1);
select pg_temp.assert_affected('update public.reviews set overall_band=9',1);
select pg_temp.assert_count('select * from public.reviews where overall_band=7.5',1); -- derived score cannot be forged
select pg_temp.expect_denied($test$update public.reviews set contributors=contributors ||
 jsonb_build_array(jsonb_build_object('userId','10000000-0000-0000-0000-000000000005','role','student'))$test$);
select pg_temp.expect_denied($test$update public.reviews set inline_comments=inline_comments ||
 jsonb_build_array(jsonb_build_object('id','forged-comment','authorId','10000000-0000-0000-0000-000000000003'))$test$);
select pg_temp.assert_affected('delete from public.classroom_students where student_id=auth.uid()',1);
select pg_temp.assert_count('select * from public.reviews',0);
select pg_temp.assert_count('select * from public.classrooms',0);

-- Owner A can manage A's assignments and grade submitted work, but sees no drafts or B.
select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000001',true);
select pg_temp.assert_count('select * from public.essays',1);
select pg_temp.assert_affected('update public.essays set content=''Teacher changed text''',0);
select pg_temp.assert_affected('update public.assignments set title=''Updated by owner''',1);
select pg_temp.assert_affected('update public.assignments set title=''Cross class'' where id=''30000000-0000-0000-0000-000000000002''',0);
select pg_temp.expect_denied('update public.classrooms set teacher_id=''10000000-0000-0000-0000-000000000006''');
select pg_temp.expect_denied('update public.assignments set classroom_id=''20000000-0000-0000-0000-000000000002''');
select pg_temp.assert_affected('update public.reviews set overall_band=8,teacher_feedback=''Teacher correction''',1);
select pg_temp.assert_count('select * from public.reviews where teacher_id=auth.uid() and edited_by_teacher and original_band=7.5',1);
select pg_temp.assert_count('select * from public.essays where id=''40000000-0000-0000-0000-000000000002'' and status=''reviewed''',1);
select pg_temp.assert_affected('insert into public.classrooms(name,code,teacher_id) values(''Owned new class'',''RLS-NEW-CLASS'',auth.uid())',1);
select pg_temp.assert_affected('insert into public.assignments(classroom_id,title) values(''20000000-0000-0000-0000-000000000001'',''Owner task'')',1);
select pg_temp.assert_affected('insert into public.reviews(essay_id,reviewer_id,overall_band) values(''40000000-0000-0000-0000-000000000002'',auth.uid(),8)',1);
select pg_temp.assert_count('select * from public.reviews where reviewer_id=auth.uid() and teacher_id=auth.uid() and edited_by_teacher',1);
select pg_temp.assert_affected('insert into public.notifications(type,title,recipient_id,classroom_id,assignment_id) values(''new_assignment'',''Owner event'',''10000000-0000-0000-0000-000000000003'',''20000000-0000-0000-0000-000000000001'',''30000000-0000-0000-0000-000000000001'')',1);
select pg_temp.expect_denied('insert into public.notifications(type,title,recipient_id,classroom_id) values(''new_assignment'',''Foreign recipient'',''10000000-0000-0000-0000-000000000005'',''20000000-0000-0000-0000-000000000001'')');
select pg_temp.assert_affected('delete from public.classroom_students where student_id=''10000000-0000-0000-0000-000000000004''',1);
select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000003',true);
select pg_temp.expect_denied('update public.reviews set overall_band=9'); -- teacher grade locked for peers
select pg_temp.expect_denied('delete from public.reviews');
select pg_temp.expect_denied('delete from public.essays');
select pg_temp.expect_denied('delete from public.assignments');
select pg_temp.expect_denied('delete from public.classrooms');
select pg_temp.expect_denied('delete from public.profiles');
select pg_temp.expect_denied('delete from public.notifications');
select pg_temp.assert_affected('delete from public.classroom_students where student_id=auth.uid()',1);
select pg_temp.assert_count('select * from public.essays',0);
select pg_temp.assert_count('select * from public.notifications',0);

-- Anonymous and authenticated-without-sub receive no protected rows or RPC privileges.
select set_config('request.jwt.claim.sub','',true);
select pg_temp.assert_count('select * from public.profiles',0);
select pg_temp.assert_count('select * from public.classrooms',0);
select pg_temp.expect_denied('select public.join_classroom_by_code(''RLS-CLASS-A'')');
set local role anon;
do $$ declare tab text; begin
  foreach tab in array array['profiles','classrooms','classroom_students','assignments','essays','reviews','notifications'] loop
    perform pg_temp.expect_denied(format('select * from public.%I',tab));
    perform pg_temp.expect_denied(format('insert into public.%I default values',tab));
    perform pg_temp.expect_denied(format('update public.%I set %I=%I',tab,
      case when tab='classroom_students' then 'student_id' else 'id' end,
      case when tab='classroom_students' then 'student_id' else 'id' end));
    perform pg_temp.expect_denied(format('delete from public.%I',tab));
  end loop;
end $$;
select pg_temp.expect_denied('select public.join_classroom_by_code(''RLS-CLASS-A'')');
select pg_temp.expect_denied('select private.can_access_classroom(''20000000-0000-0000-0000-000000000001'')');
rollback;
