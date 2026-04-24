-- ============================================================
-- Blog tags migration
-- 執行方式：Supabase Dashboard → SQL Editor → 貼上並執行
-- ============================================================

-- 1. 在 posts 表加上 tags 欄位（字串陣列，預設空陣列）
alter table public.posts
  add column if not exists tags text[] not null default '{}';

-- 為 tags 欄位加 GIN index，讓「包含某 tag」的查詢 (?| / @>) 很快
create index if not exists posts_tags_idx
  on public.posts using gin (tags);

-- 2. 建立 blog_tags 表（tag 資料庫，獨立於文章）
--    即使某 tag 暫時沒有任何文章使用，也可以保留；也可先建好 tag 再寫文章
create table if not exists public.blog_tags (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- 3. RLS：任何人可讀取（blog tags 是公開的），只有本人能寫入/刪除
alter table public.blog_tags enable row level security;

drop policy if exists "blog_tags_select_public" on public.blog_tags;
create policy "blog_tags_select_public"
  on public.blog_tags for select
  using (true);

drop policy if exists "blog_tags_insert_own" on public.blog_tags;
create policy "blog_tags_insert_own"
  on public.blog_tags for insert
  with check (auth.uid() = user_id);

drop policy if exists "blog_tags_update_own" on public.blog_tags;
create policy "blog_tags_update_own"
  on public.blog_tags for update
  using (auth.uid() = user_id);

drop policy if exists "blog_tags_delete_own" on public.blog_tags;
create policy "blog_tags_delete_own"
  on public.blog_tags for delete
  using (auth.uid() = user_id);

-- 4. （選用）預設 tag，跑完可以直接刪掉不要的
--    注意：這些會 insert 成「第一個登入過的 user」擁有的 tag
--    如果你想手動在 Admin 介面新增，就把這段註解掉
-- insert into public.blog_tags (name, user_id)
-- select unnest(array['資料結構','演算法','系統設計','C++','Linux','嵌入式','心得']), id
-- from auth.users
-- order by created_at
-- limit 1
-- on conflict (name) do nothing;
