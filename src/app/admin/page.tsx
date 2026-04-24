"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { supabase } from "@/lib/supabase";

// Monaco 編輯器只能在瀏覽器端跑，所以用 dynamic import 關掉 SSR
const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="h-[420px] flex items-center justify-center text-neutral-500 text-sm">
      Loading editor...
    </div>
  ),
});

interface Post {
  id: string;
  title: string;
  content: string;
  published: boolean;
  tags: string[] | null;
  created_at: string;
}

interface BlogTag {
  id: string;
  name: string;
}

export default function AdminPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [user, setUser] = useState<any>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [tags, setTags] = useState<BlogTag[]>([]);
  const [loading, setLoading] = useState(true);

  // form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [published, setPublished] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editorMode, setEditorMode] = useState<"edit" | "preview">("edit");

  // tag management
  const [showTagManager, setShowTagManager] = useState(false);
  const [newTagName, setNewTagName] = useState("");

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
    if (user) {
      fetchPosts();
      fetchTags();
    }
  }, [user]);

  const fetchPosts = async () => {
    const { data } = await supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false });
    setPosts(data || []);
  };

  const fetchTags = async () => {
    const { data } = await supabase
      .from("blog_tags")
      .select("*")
      .order("created_at", { ascending: true });
    setTags(data || []);
  };

  const addTag = async () => {
    const name = newTagName.trim();
    if (!name) return;
    if (tags.some((t) => t.name === name)) {
      setNewTagName("");
      return;
    }
    await supabase.from("blog_tags").insert({ name, user_id: user.id });
    setNewTagName("");
    fetchTags();
  };

  const deleteTag = async (name: string) => {
    if (
      !confirm(
        `確定要刪除「${name}」標籤嗎？\n所有文章中使用此 tag 的也會一併被清掉。`
      )
    )
      return;
    await supabase.from("blog_tags").delete().eq("name", name);
    // trigger 會把此 tag 從所有 posts.tags[] 中移除，重抓讓 UI 同步
    fetchTags();
    fetchPosts();
    // 正在編輯的 post 也要移除這個 tag
    setSelectedTags((prev) => prev.filter((t) => t !== name));
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
    setSelectedTags([]);
    setEditing(null);
    setShowForm(false);
    setEditorMode("edit");
  };

  const toggleTag = (name: string) => {
    setSelectedTags((prev) =>
      prev.includes(name) ? prev.filter((t) => t !== name) : [...prev, name]
    );
  };

  const handleSubmit = async () => {
    if (!title.trim()) return;

    if (editing) {
      await supabase
        .from("posts")
        .update({ title, content, published, tags: selectedTags })
        .eq("id", editing);
    } else {
      await supabase
        .from("posts")
        .insert({ title, content, published, tags: selectedTags });
    }

    resetForm();
    fetchPosts();
  };

  const handleEdit = (post: Post) => {
    setTitle(post.title);
    setContent(post.content);
    setPublished(post.published);
    setSelectedTags(post.tags ?? []);
    setEditing(post.id);
    setShowForm(true);
    setEditorMode("edit");
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
      <div className="max-w-4xl mx-auto">
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

        {/* Tag Manager */}
        <div className="border border-neutral-800 rounded-lg p-4 mb-6 bg-neutral-900/40">
          <div className="flex justify-between items-center mb-3">
            <p className="text-sm font-medium text-neutral-300">
              📂 標籤管理（共 {tags.length} 個）
            </p>
            <button
              onClick={() => setShowTagManager(!showTagManager)}
              className="text-xs text-neutral-500 hover:text-neutral-100 transition-colors"
            >
              {showTagManager ? "收起" : "展開"}
            </button>
          </div>
          {showTagManager && (
            <>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  placeholder="新標籤名稱"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addTag()}
                  className="flex-1 bg-neutral-900 border border-neutral-800 rounded px-3 py-1.5 text-sm text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-neutral-600"
                />
                <button
                  onClick={addTag}
                  className="px-3 py-1.5 bg-neutral-100 text-neutral-950 rounded text-sm font-medium hover:bg-white transition-colors"
                >
                  + 新增
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="inline-flex items-center gap-2 text-xs px-3 py-1 rounded-full bg-neutral-800 text-neutral-300"
                  >
                    #{tag.name}
                    <button
                      onClick={() => deleteTag(tag.name)}
                      className="text-red-400 hover:text-red-300 transition-colors"
                      title="刪除"
                    >
                      ✕
                    </button>
                  </span>
                ))}
                {tags.length === 0 && (
                  <p className="text-xs text-neutral-600">
                    還沒有標籤，先新增一些吧。
                  </p>
                )}
              </div>
            </>
          )}
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

            {/* Tag picker */}
            <div className="mb-4">
              <p className="text-xs text-neutral-500 mb-2">
                標籤（點擊切換，可多選）
              </p>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => {
                  const active = selectedTags.includes(tag.name);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTag(tag.name)}
                      className={`text-xs px-3 py-1 rounded-full transition-colors ${
                        active
                          ? "bg-neutral-100 text-neutral-950 font-medium"
                          : "bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-neutral-100"
                      }`}
                    >
                      {active ? "✓ " : ""}#{tag.name}
                    </button>
                  );
                })}
                {tags.length === 0 && (
                  <p className="text-xs text-neutral-600">
                    還沒有標籤，請先在上方「標籤管理」區新增。
                  </p>
                )}
              </div>
            </div>

            {/* Editor / Preview tabs */}
            <div className="mb-2 flex items-center justify-between">
              <div className="flex gap-1 bg-neutral-900 border border-neutral-800 rounded-lg p-1">
                <button
                  onClick={() => setEditorMode("edit")}
                  className={`px-3 py-1 rounded text-xs transition-colors ${
                    editorMode === "edit"
                      ? "bg-neutral-100 text-neutral-950 font-medium"
                      : "text-neutral-400 hover:text-neutral-100"
                  }`}
                >
                  ✏️ 編輯
                </button>
                <button
                  onClick={() => setEditorMode("preview")}
                  className={`px-3 py-1 rounded text-xs transition-colors ${
                    editorMode === "preview"
                      ? "bg-neutral-100 text-neutral-950 font-medium"
                      : "text-neutral-400 hover:text-neutral-100"
                  }`}
                >
                  👁️ 預覽
                </button>
              </div>
              <p className="text-xs text-neutral-600">
                支援 Markdown：`##` 標題、```lang 程式碼、**粗體** 等
              </p>
            </div>

            <div className="mb-4 border border-neutral-800 rounded-lg overflow-hidden">
              {editorMode === "edit" ? (
                <MonacoEditor
                  height="420px"
                  defaultLanguage="markdown"
                  theme="vs-dark"
                  value={content}
                  onChange={(v) => setContent(v || "")}
                  options={{
                    fontSize: 14,
                    lineNumbers: "on",
                    minimap: { enabled: false },
                    wordWrap: "on",
                    scrollBeyondLastLine: false,
                    padding: { top: 12, bottom: 12 },
                    fontFamily:
                      "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                  }}
                />
              ) : (
                <div
                  className="prose prose-invert prose-neutral max-w-none bg-neutral-950 px-5 py-4"
                  style={{ minHeight: "420px" }}
                >
                  {content.trim() ? (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeHighlight]}
                    >
                      {content}
                    </ReactMarkdown>
                  ) : (
                    <p className="text-neutral-600 text-sm">
                      還沒內容可以預覽。
                    </p>
                  )}
                </div>
              )}
            </div>

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
              className="border border-neutral-800 rounded-lg p-4 flex justify-between items-start gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1 flex-wrap">
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
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <p className="text-sm text-neutral-500">
                    {new Date(post.created_at).toLocaleDateString()}
                  </p>
                  {(post.tags ?? []).map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 shrink-0">
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

