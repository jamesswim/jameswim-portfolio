"use client";

import { useState, useEffect, use } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { supabase } from "@/lib/supabase";

interface Post {
  id: string;
  title: string;
  content: string;
  tags: string[] | null;
  created_at: string;
}

export default function PostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq("id", id)
        .eq("published", true)
        .single();

      if (error) {
        console.error("Error fetching post:", error);
      } else {
        setPost(data);
      }
      setLoading(false);
    };

    fetchPost();
  }, [id]);

  if (loading) {
    return (
      <main className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center">
        <p className="text-neutral-500">Loading...</p>
      </main>
    );
  }

  if (!post) {
    return (
      <main className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Post not found</h1>
          <a
            href="/blog"
            className="text-neutral-500 hover:text-neutral-100 transition-colors"
          >
            ← Back to Blog
          </a>
        </div>
      </main>
    );
  }

  const tags = post.tags ?? [];

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 px-6 py-24">
      <article className="max-w-2xl mx-auto">
        <a
          href="/blog"
          className="text-sm text-neutral-500 hover:text-neutral-100 transition-colors"
        >
          ← Back to Blog
        </a>

        <h1 className="text-3xl sm:text-4xl font-bold mt-8 mb-4">
          {post.title}
        </h1>

        <div className="flex flex-wrap items-center gap-3 mb-12">
          <p className="text-sm text-neutral-500">
            {new Date(post.created_at).toLocaleDateString()}
          </p>
          {tags.length > 0 && (
            <>
              <span className="text-neutral-700">·</span>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <a
                    key={tag}
                    href={`/blog?tag=${encodeURIComponent(tag)}`}
                    className="text-xs px-2.5 py-1 rounded-full bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-neutral-100 transition-colors"
                  >
                    #{tag}
                  </a>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="prose prose-invert prose-neutral max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight]}
          >
            {post.content}
          </ReactMarkdown>
        </div>
      </article>
    </main>
  );
}
