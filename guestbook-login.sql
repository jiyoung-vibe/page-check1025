-- 구글 로그인 방명록: 읽기는 누구나, 쓰기는 로그인한 사람만, 지우기는 내가 쓴 글만.
-- Supabase 대시보드 > SQL Editor 에서 한 번 실행한다. (guestbook.sql을 먼저 실행한 뒤)
--
-- ┌──────────────────────┬────────┬──────────────────┬──────────────────────┐
-- │ 누가                 │ 글 읽기 │ 글 쓰기          │ 글 지우기            │
-- ├──────────────────────┼────────┼──────────────────┼──────────────────────┤
-- │ 로그인 안 한 사람    │ O      │ X                │ X                    │
-- │ 로그인한 사람        │ O      │ O (내 이름으로만) │ O (내가 쓴 글만)     │
-- └──────────────────────┴────────┴──────────────────┴──────────────────────┘
-- 고치기(update)는 아무에게도 허락하지 않는다.
-- 이 SQL을 실행하기 전에 만든 옛 글은 주인이 없어서 아무도 지울 수 없다.

-- 1) 누가 쓴 글인지 적어 두는 칸. 글을 저장할 때 로그인한 사람의 id가 자동으로 들어간다.
alter table guestbook
  add column if not exists user_id uuid default auth.uid() references auth.users (id) on delete set null;

-- 2) 옛 규칙(누구나 쓰기)을 치우고 새 규칙을 만든다.
drop policy if exists "누구나 읽기" on guestbook;
drop policy if exists "누구나 쓰기" on guestbook;
drop policy if exists "로그인한 사람만 쓰기" on guestbook;
drop policy if exists "내 글만 지우기" on guestbook;

create policy "누구나 읽기" on guestbook
  for select using (true);

create policy "로그인한 사람만 쓰기" on guestbook
  for insert to authenticated
  with check (user_id = auth.uid());

create policy "내 글만 지우기" on guestbook
  for delete to authenticated
  using (user_id = auth.uid());

-- 3) 표 자체의 열쇠도 맞춘다. 로그인 안 한 사람(anon)은 읽기만, 로그인한 사람은 읽기·쓰기·지우기.
revoke insert, update, delete on table guestbook from anon;
grant select on table guestbook to anon;
grant select, insert, delete on table guestbook to authenticated;
