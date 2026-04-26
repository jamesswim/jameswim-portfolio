// Shared type definitions for content stored in Supabase.

export interface Project {
  id: string;
  slug: string;                                    // full path, e.g. 'uav-vio' or 'uav-vio/dataset-collection'
  parent_id: string | null;                        // null = top-level project
  title: string;
  summary: string | null;
  hero_image: string | null;
  tags: string[] | null;
  tech_stack: string[] | null;
  metrics: Record<string, unknown> | null;         // e.g. { rmse_cm: 3, fps: 30 }
  links: Record<string, string> | null;            // e.g. { github, demo, paper }
  published: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export type ProjectBlockType =
  | "markdown"
  | "image"
  | "video"
  | "code"
  | "metric"
  | "gallery";

export interface ProjectBlock {
  id: string;
  project_id: string;
  type: ProjectBlockType;
  content: Record<string, unknown>;                // shape depends on `type` — narrow at usage site
  order_index: number;
  created_at: string;
}
