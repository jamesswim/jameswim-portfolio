"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { stripMarkdown } from "@/lib/markdown";

interface Post {
  id: string;
  title: string;
  content: string;
  tags: string[] | null;
  created_at: string;
}

export default function BlogPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTag, setActiveTag] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const t = params.get("tag");
      if (t) setActiveTag(t);
    }
  }, []);

  useEffect(() => {
    const fetchPosts = async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq("published", true)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching posts:", error);
      } else {
        setPosts(data || []);
      }
      setLoading(false);
    };

    fetchPosts();
  }, []);

  const allTags = Array.from(
    new Set(posts.flatMap((p) => p.tags ?? []))
  ).sort();

  const tagCounts: Record<string, number> = {};
  posts.forEach((p) => {
    (p.tags ?? []).forEach((t) => {
      tagCounts[t] = (tagCounts[t] || 0) + 1;
    });
  });

  const filteredPosts = activeTag
    ? posts.filter((p) => (p.tags ?? []).includes(activeTag))
    : posts;

  const selectTag = (tag: string | null) => {
    setActiveTag(tag);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (tag) url.searchParams.set("tag", tag);
      else url.searchParams.delete("tag");
      window.history.replaceState(null, "", url.toString());
    }
  };

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 px-6 py-24">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Blog</h1>
          <a
            href="/"
            className="px-4 py-2 rounded-lg text-sm font-medium text-white hover:opacity-80 transition-opacity"
            style={{ backgroundColor: "#3b82f6" }}
          >
            ← Back
          </a>
        </div>

        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-12">
            <button
              onClick={() => selectTag(null)}
              className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
                activeTag === null
                  ? "bg-neutral-100 text-neutral-950 font-medium"
                  : "bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-neutral-100 hover:border-neutral-600"
              }`}
            >
              全部 ({posts.length})
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => selectTag(tag)}
                className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
                  activeTag === tag
                    ? "bg-neutral-100 text-neutral-950 font-medium"
                    : "bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-neutral-100 hover:border-neutral-600"
                }`}
              >
                #{tag} ({tagCounts[tag]})
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <p className="text-neutral-500">Loading...</p>
        ) : filteredPosts.length === 0 ? (
          <p className="text-neutral-500">
            {activeTag ? `「${activeTag}」分類下還沒有文章。` : "No posts yet."}
          </p>
        ) : (
          <div className="space-y-8">
            {filteredPosts.map((post) => {
              const preview = stripMarkdown(post.content);
              const truncated = preview.length > 240;
              return (
                <article
                  key={post.id}
                  className="border-b border-neutral-800 pb-8"
                >
                  <a href={`/blog/${post.id}`}>
                    <h2 className="text-xl font-semibold mb-2 text-neutral-300 hover:text-white underline-offset-4 hover:underline transition-colors cursor-pointer">
                      {post.title}
                    </h2>
                  </a>

                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <p className="text-sm text-neutral-500">
                      {new Date(post.created_at).toLocaleDateString()}
                    </p>
                    {(post.tags ?? []).length > 0 && (
                      <>
                        <span className="text-neutral-700">·</span>
                        <div className="flex flex-wrap gap-2">
                          {(post.tags ?? []).map((tag) => (
                            <button
                              key={tag}
                              onClick={(e) => {
                                e.preventDefault();
                                selectTag(tag);
                              }}
                              className="text-xs px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-neutral-100 transition-colors"
                            >
                              #{tag}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  <p className="text-neutral-400 leading-relaxed line-clamp-3">
                    {preview.slice(0, 240)}
                    {truncated ? "..." : ""}
                  </p>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
