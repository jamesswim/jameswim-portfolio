-- ============================================================
-- Projects schema
-- Case study container with parent/child hierarchy + block-based content.
-- Run this once in Supabase SQL Editor.
-- ============================================================

-- Main project table (supports nesting via self-referencing parent_id)
create table if not exists projects (
  id           uuid primary key default gen_random_uuid(),
  slug         text unique not null,                              -- full path, e.g. 'uav-vio/dataset-collection'
  parent_id    uuid references projects(id) on delete cascade,    -- NULL = top-level
  title        text not null,
  summary      text,                                              -- 1-2 sentence card description
  hero_image   text,                                              -- URL or storage path
  tags         text[]      default '{}',                          -- ['UAV', 'BMC']
  tech_stack   text[]      default '{}',                          -- ['ROS', 'C++', 'Jetson Nano']
  metrics      jsonb       default '{}'::jsonb,                   -- {"rmse_cm": 3, "fps": 30}
  links        jsonb       default '{}'::jsonb,                   -- {"github": "...", "demo": "...", "paper": "..."}
  published    boolean     default false,
  order_index  int         default 0,                             -- manual ordering
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

create index if not exists projects_parent_id_idx on projects(parent_id);
create index if not exists projects_published_idx on projects(published);

-- Block-based content per project (a project = ordered sequence of blocks)
create table if not exists project_blocks (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid references projects(id) on delete cascade not null,
  type         text not null check (type in ('markdown', 'image', 'video', 'code', 'metric', 'gallery')),
  content      jsonb not null,                                    -- shape varies by type
  order_index  int         default 0,
  created_at   timestamptz default now()
);

create index if not exists project_blocks_project_id_idx on project_blocks(project_id);

-- updated_at trigger for projects
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists projects_set_updated_at on projects;
create trigger projects_set_updated_at
  before update on projects
  for each row execute function set_updated_at();

-- ============================================================
-- Row Level Security
-- Mirrors the pattern used by `posts` table:
--   - Public can SELECT only published rows
--   - Admin (via existing is_admin() RPC) has full access
-- ============================================================

alter table projects enable row level security;
alter table project_blocks enable row level security;

-- Public read: published projects only
drop policy if exists "Public read published projects" on projects;
create policy "Public read published projects"
  on projects for select
  using (published = true);

-- Public read: blocks belonging to published projects only
drop policy if exists "Public read blocks of published projects" on project_blocks;
create policy "Public read blocks of published projects"
  on project_blocks for select
  using (
    exists (
      select 1 from projects p
      where p.id = project_blocks.project_id
        and p.published = true
    )
  );

-- Admin full access (assumes is_admin() RPC already exists, same as posts)
drop policy if exists "Admin all projects" on projects;
create policy "Admin all projects"
  on projects for all
  using (is_admin())
  with check (is_admin());

drop policy if exists "Admin all project_blocks" on project_blocks;
create policy "Admin all project_blocks"
  on project_blocks for all
  using (is_admin())
  with check (is_admin());
