"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface Post {
  id: string;
  title: string;
  content: string;
  published: boolean;
  created_at: string;
}

export default function AdminPage() {
  const [user, setUser] = useState<any>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [published, setPublished] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) fetchPosts();
  }, [user]);

  const fetchPosts = async () => {
    const { data } = await supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false });
    setPosts(data || []);
  };

  const signIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const resetForm = () => {
    setTitle("");
    setContent("");
    setPublished(false);
    setEditing(null);
    setShowForm(false);
  };

  const handleSubmit = async () => {
    if (!title.trim()) return;

    if (editing) {
      await supabase
        .from("posts")
        .update({ title, content, published })
        .eq("id", editing);
    } else {
      await supabase.from("posts").insert({ title, content, published });
    }

    resetForm();
    fetchPosts();
  };

  const handleEdit = (post: Post) => {
    setTitle(post.title);
    setContent(post.content);
    setPublished(post.published);
    setEditing(post.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return;
    await supabase.from("posts").delete().eq("id", id);
    fetchPosts();
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center">
        <p className="text-neutral-500">Loading...</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-8">Admin</h1>
          <button
            onClick={signIn}
            className="px-6 py-3 bg-neutral-100 text-neutral-950 rounded-lg font-medium hover:bg-white transition-colors"
          >
            Sign in with Google
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 px-6 py-24">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-12">
          <h1 className="text-3xl font-bold">Admin</h1>
          <div className="flex items-center gap-4">
            <p className="text-sm text-neutral-500">{user.email}</p>
            <button
              onClick={signOut}
              className="text-sm text-neutral-500 hover:text-neutral-100 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>

        {!showForm ? (
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-neutral-100 text-neutral-950 rounded-lg text-sm font-medium hover:bg-white transition-colors"
            >
              + New Post
            </button>
            <a
              href="/"
              className="px-4 py-2 rounded-lg text-sm font-medium text-white hover:opacity-80 transition-opacity"
              style={{ backgroundColor: "#3b82f6" }}
            >
              ← Back to Home
            </a>
          </div>
        ) : (
          <div className="border border-neutral-800 rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold mb-4">
              {editing ? "Edit Post" : "New Post"}
            </h2>

            <input
              type="text"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2 mb-4 text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-neutral-600"
            />

            <textarea
              placeholder="Write your content..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={10}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2 mb-4 text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-neutral-600 resize-none"
            />

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-neutral-400">
                <input
                  type="checkbox"
                  checked={published}
                  onChange={(e) => setPublished(e.target.checked)}
                  className="rounded"
                />
                Publish (visible to everyone)
              </label>

              <div className="flex gap-3">
                <button
                  onClick={resetForm}
                  className="px-4 py-2 text-sm text-neutral-500 hover:text-neutral-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  className="px-4 py-2 bg-neutral-100 text-neutral-950 rounded-lg text-sm font-medium hover:bg-white transition-colors"
                >
                  {editing ? "Update" : "Publish"}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {posts.map((post) => (
            <div
              key={post.id}
              className="border border-neutral-800 rounded-lg p-4 flex justify-between items-start"
            >
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-medium">{post.title}</h3>
                  {post.published ? (
                    <span
                      className="text-xs px-3 py-1 rounded-full font-medium"
                      style={{ backgroundColor: "#16a34a", color: "white" }}
                    >
                      Public
                    </span>
                  ) : (
                    <span
                      className="text-xs px-3 py-1 rounded-full font-medium"
                      style={{ backgroundColor: "#ea580c", color: "white" }}
                    >
                      Draft
                    </span>
                  )}
                </div>
                <p className="text-sm text-neutral-500">
                  {new Date(post.created_at).toLocaleDateString()}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => handleEdit(post)}
                  className="text-sm text-neutral-500 hover:text-neutral-100 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(post.id)}
                  className="text-sm text-red-500 hover:text-red-400 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}