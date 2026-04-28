"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type {
  Project,
  ProjectBlock as ProjectBlockType,
} from "@/lib/types";
import ProjectBlock from "@/components/ProjectBlock";

interface BreadcrumbItem {
  slug: string;
  title: string;
}

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug: slugArr } = use(params);
  const fullSlug = slugArr.join("/");

  const [project, setProject] = useState<Project | null>(null);
  const [blocks, setBlocks] = useState<ProjectBlockType[]>([]);
  const [children, setChildren] = useState<Project[]>([]);
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      setNotFound(false);

      // Build prefix list for breadcrumbs:
      //   slug 'uav-vio/dataset-collection' -> ['uav-vio', 'uav-vio/dataset-collection']
      const parts = fullSlug.split("/");
      const prefixes = parts.map((_, i) => parts.slice(0, i + 1).join("/"));

      // Fetch the current project + all its ancestors in one query.
      const { data: chain } = await supabase
        .from("projects")
        .select("*")
        .in("slug", prefixes)
        .eq("published", true);

      const current = chain?.find((p: Project) => p.slug === fullSlug);

      if (!current) {
        setProject(null);
        setNotFound(true);
        setLoading(false);
        return;
      }

      setProject(current);

      // Build breadcrumbs in slug order. Unpublished ancestors are silently skipped.
      const crumbs = prefixes
        .map((s) => chain?.find((p: Project) => p.slug === s))
        .filter((p): p is Project => !!p)
        .map((p) => ({ slug: p.slug, title: p.title }));
      setBreadcrumbs(crumbs);

      // Blocks for this project, in order.
      const { data: blockData } = await supabase
        .from("project_blocks")
        .select("*")
        .eq("project_id", current.id)
        .order("order_index", { ascending: true });
      setBlocks(blockData || []);

      // Children — present means this is a hub page.
      const { data: childData } = await supabase
        .from("projects")
        .select("*")
        .eq("parent_id", current.id)
        .eq("published", true)
        .order("order_index", { ascending: true });
      setChildren(childData || []);

      setLoading(false);
    };

    fetchAll();
  }, [fullSlug]);

  if (loading) {
    return (
      <main className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center">
        <p className="text-neutral-500">Loading...</p>
      </main>
    );
  }

  if (notFound || !project) {
    return (
      <main className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Project not found</h1>
          <Link
            href="/projects"
            className="text-neutral-500 hover:text-neutral-100 transition-colors"
          >
            ← Back to Projects
          </Link>
        </div>
      </main>
    );
  }

  const hasChildren = children.length > 0;
  const linkEntries = project.links
    ? Object.entries(project.links).filter(([, url]) => !!url)
    : [];

  // Contextual back target: parent hub if this is a sub-project, otherwise the index.
  const parentCrumb =
    breadcrumbs.length > 1 ? breadcrumbs[breadcrumbs.length - 2] : null;
  const backHref = parentCrumb ? `/projects/${parentCrumb.slug}` : "/projects";
  const backLabel = parentCrumb ? parentCrumb.title : "Projects";

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 px-6 py-24">
      <article className="max-w-3xl mx-auto">
        {/* Breadcrumb */}
        <nav className="flex flex-wrap items-center gap-2 text-sm text-neutral-500 mb-8">
          <Link
            href="/projects"
            className="hover:text-neutral-100 transition-colors"
          >
            Projects
          </Link>
          {breadcrumbs.map((crumb, idx) => (
            <span key={crumb.slug} className="flex items-center gap-2">
              <span className="text-neutral-700">/</span>
              {idx === breadcrumbs.length - 1 ? (
                <span className="text-neutral-300">{crumb.title}</span>
              ) : (
                <Link
                  href={`/projects/${crumb.slug}`}
                  className="hover:text-neutral-100 transition-colors"
                >
                  {crumb.title}
                </Link>
              )}
            </span>
          ))}
        </nav>

        {/* Hero: title left, blue back button right */}
        <div className="flex justify-between items-start gap-4 mb-4">
          <h1 className="text-4xl font-bold flex-1 min-w-0">{project.title}</h1>
          <Link
            href={backHref}
            title={`← Back to ${backLabel}`}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white hover:opacity-80 transition-opacity shrink-0 inline-block max-w-xs truncate"
            style={{ backgroundColor: "#3b82f6" }}
          >
            ← Back to {backLabel}
          </Link>
        </div>
        {project.summary && (
          <p className="text-lg text-neutral-300 leading-relaxed mb-6">
            {project.summary}
          </p>
        )}

        {/* Tags + tech stack badges */}
        {((project.tags ?? []).length > 0 ||
          (project.tech_stack ?? []).length > 0) && (
          <div className="flex flex-wrap gap-2 mb-6">
            {(project.tags ?? []).map((tag) => (
              <span
                key={`tag-${tag}`}
                className="text-xs px-2.5 py-1 rounded-full bg-neutral-800 text-neutral-300"
              >
                #{tag}
              </span>
            ))}
            {(project.tech_stack ?? []).map((tech) => (
              <span
                key={`tech-${tech}`}
                className="text-xs px-2.5 py-1 rounded-full border border-neutral-700 text-neutral-400"
              >
                {tech}
              </span>
            ))}
          </div>
        )}

        {/* External links */}
        {linkEntries.length > 0 && (
          <div className="flex flex-wrap gap-4 mb-12">
            {linkEntries.map(([key, url]) => (
              <a
                key={key}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-neutral-400 hover:text-neutral-100 transition-colors underline underline-offset-4"
              >
                {key}
              </a>
            ))}
          </div>
        )}

        {/* Hero image */}
        {project.hero_image && (
          <figure className="mb-12">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={project.hero_image}
              alt={project.title}
              className="w-full rounded-lg border border-neutral-800"
            />
          </figure>
        )}

        {/* Content blocks */}
        <div className="space-y-6 mb-16">
          {blocks.map((block) => (
            <ProjectBlock key={block.id} block={block} />
          ))}
        </div>

        {/* Sub-projects (hub mode only) */}
        {hasChildren && (
          <section className="border-t border-neutral-800 pt-12">
            <h2 className="text-2xl font-bold mb-6">Sub-projects</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {children.map((child) => (
                <Link
                  key={child.id}
                  href={`/projects/${child.slug}`}
                  className="group border border-neutral-800 rounded-lg p-5 hover:border-neutral-600 transition-colors flex flex-col"
                >
                  <h3 className="text-lg font-semibold mb-2 text-neutral-200 group-hover:text-white transition-colors">
                    {child.title}
                  </h3>
                  {child.summary && (
                    <p className="text-sm text-neutral-400 leading-relaxed mb-3 line-clamp-2 flex-1">
                      {child.summary}
                    </p>
                  )}
                  {(child.tags ?? []).length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-auto">
                      {child.tags!.map((tag) => (
                        <span
                          key={tag}
                          className="text-xs px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}
      </article>
    </main>
  );
}
