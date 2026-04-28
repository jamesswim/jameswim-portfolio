"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { Project } from "@/lib/types";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      // Top-level only on the index. Sub-projects show up inside their parent's hub page.
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .is("parent_id", null)
        .eq("published", true)
        .order("order_index", { ascending: true })
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching projects:", error);
      } else {
        setProjects(data || []);
      }
      setLoading(false);
    };

    fetchProjects();
  }, []);

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 px-6 py-24">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-12">
          <h1 className="text-4xl font-bold">Projects</h1>
          <Link
            href="/"
            className="px-4 py-2 rounded-lg text-sm font-medium text-white hover:opacity-80 transition-opacity"
            style={{ backgroundColor: "#3b82f6" }}
          >
            ← Back to Home
          </Link>
        </div>

        {loading ? (
          <p className="text-neutral-500">Loading...</p>
        ) : projects.length === 0 ? (
          <p className="text-neutral-500">尚無專案。</p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {projects.map((p) => (
              <Link
                key={p.id}
                href={`/projects/${p.slug}`}
                className="group border border-neutral-800 rounded-lg p-6 hover:border-neutral-600 transition-colors flex flex-col"
              >
                <h2 className="text-xl font-semibold mb-2 text-neutral-200 group-hover:text-white transition-colors">
                  {p.title}
                </h2>
                {p.summary && (
                  <p className="text-sm text-neutral-400 leading-relaxed mb-4 line-clamp-3 flex-1">
                    {p.summary}
                  </p>
                )}
                {(p.tags ?? []).length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-auto">
                    {p.tags!.map((tag) => (
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
        )}
      </div>
    </main>
  );
}
