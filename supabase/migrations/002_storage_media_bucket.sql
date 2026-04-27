-- ============================================================
-- Storage bucket for uploaded media (images for projects/blogs).
-- Public bucket: anyone can read via public URL.
-- Only admins (is_admin() RPC) can upload / update / delete.
-- Run once in Supabase SQL Editor.
-- ============================================================

-- Create the bucket (idempotent)
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

-- ----- Storage RLS policies on storage.objects -----
-- Note: public buckets already allow SELECT through the public URL,
--       no SELECT policy needed. We only restrict writes.

drop policy if exists "Admin upload media" on storage.objects;
create policy "Admin upload media"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'media' and is_admin());

drop policy if exists "Admin update media" on storage.objects;
create policy "Admin update media"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'media' and is_admin());

drop policy if exists "Admin delete media" on storage.objects;
create policy "Admin delete media"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'media' and is_admin());
