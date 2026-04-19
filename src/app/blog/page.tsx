"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface Post {
  id: string;
  title: string;
  content: string;
  created_at: string;
}

export default function BlogPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 px-6 py-24">
      <div className="max-w-2xl mx-auto">
        <a
          href="/"
          className="text-sm text-neutral-500 hover:text-neutral-100 transition-colors"
        >
          ← Back
        </a>

        <h1 className="text-4xl font-bold mt-8 mb-12">Blog</h1>

        {loading ? (
          <p className="text-neutral-500">Loading...</p>
        ) : posts.length === 0 ? (
          <p className="text-neutral-500">No posts yet.</p>
        ) : (
          <div className="space-y-8">
            {posts.map((post) => (
              <article
                key={post.id}
                className="border-b border-neutral-800 pb-8"
              >
                <a href={`/blog/${post.id}`}>
                  <h2 className="text-xl font-semibold mb-2 text-neutral-300 hover:text-white underline-offset-4 hover:underline transition-colors cursor-pointer">
                    {post.title}
                  </h2>
                </a>
                <p className="text-sm text-neutral-500 mb-4">
                  {new Date(post.created_at).toLocaleDateString()}
                </p>
                <p className="text-neutral-300 leading-relaxed">
                  {post.content}
                </p>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}