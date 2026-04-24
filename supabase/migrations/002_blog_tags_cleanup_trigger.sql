-- ============================================================
-- 刪除 blog_tags 中的某個 tag 時，自動從所有 posts.tags[] 把它移除
-- 執行方式：Supabase Dashboard → SQL Editor → 貼上並執行
-- 前置條件：001_blog_tags.sql 已執行過
-- ============================================================

-- 1. 建立 trigger function
create or replace function public.remove_tag_from_posts()
returns trigger
language plpgsql
security definer
as $$
begin
  -- OLD.name 是被刪除的 tag 名稱
  -- array_remove() 會回傳一個移除指定元素後的新陣列
  update public.posts
    set tags = array_remove(tags, OLD.name)
    where OLD.name = any(tags);
  return OLD;
end;
$$;

-- 2. 綁到 blog_tags 的 AFTER DELETE 事件
drop trigger if exists blog_tags_after_delete on public.blog_tags;
create trigger blog_tags_after_delete
  after delete on public.blog_tags
  for each row
  execute function public.remove_tag_from_posts();

-- ------------------------------------------------------------
-- 測試方式（選用，執行完可刪掉）：
--   1. 先在 blog_tags 新增一個 '測試tag' 並在某篇 post 打上這個 tag
--   2. 執行：delete from blog_tags where name = '測試tag';
--   3. 查看 posts.tags 應該已經沒有 '測試tag' 了
-- ------------------------------------------------------------
