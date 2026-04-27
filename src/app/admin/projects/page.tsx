"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import type { Project } from "@/lib/types";

// Convert "a, b, c" -> ["a", "b", "c"], stripping blanks.
function parseCsv(input: string): string[] {
  return input
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

// Safely parse a JSON string, returning a tuple of [value, error message].
function safeJson<T = unknown>(input: string): [T | null, string | null] {
  if (!input.trim()) return [{} as T, null];
  try {
    return [JSON.parse(input) as T, null];
  } catch (e) {
    return [null, e instanceof Error ? e.message : "Invalid JSON"];
  }
}

export default function AdminProjectsPage() {
  const router = useRouter();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);

  const [projects, setProjects] = useState<Project[]>([]);

  // Form state
  const [editing, setEditing] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [parentId, setParentId] = useState<string>(""); // "" = top-level
  const [summary, setSummary] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [techStackInput, setTechStackInput] = useState("");
  const [heroImage, setHeroImage] = useState("");
  const [linksJson, setLinksJson] = useState("{}");
  const [metricsJson, setMetricsJson] = useState("{}");
  const [published, setPublished] = useState(false);
  const [orderIndex, setOrderIndex] = useState(0);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // ----- Auth (mirrors /admin/page.tsx pattern) -----
  useEffect(() => {
    let redirectTimeout: ReturnType<typeof setTimeout> | null = null;

    const verify = async (session: Session | null) => {
      if (!session) {
        setUser(null);
        setUnauthorized(false);
        setLoading(false);
        return;
      }
      const { data: isAdmin } = await supabase.rpc("is_admin");
      if (!isAdmin) {
        await supabase.auth.signOut();
        setUser(null);
        setUnauthorized(true);
        setLoading(false);
        redirectTimeout = setTimeout(() => router.push("/"), 3000);
      } else {
        setUser(session.user);
        setUnauthorized(false);
        setLoading(false);
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => verify(session));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      verify(session);
    });

    return () => {
      subscription.unsubscribe();
      if (redirectTimeout) clearTimeout(redirectTimeout);
    };
  }, [router]);

  useEffect(() => {
    if (user) fetchProjects();
  }, [user]);

  const fetchProjects = async () => {
    const { data } = await supabase
      .from("projects")
      .select("*")
      .order("order_index", { ascending: true })
      .order("created_at", { ascending: false });
    setProjects(data || []);
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
    setEditing(null);
    setShowForm(false);
    setTitle("");
    setSlug("");
    setParentId("");
    setSummary("");
    setTagsInput("");
    setTechStackInput("");
    setHeroImage("");
    setLinksJson("{}");
    setMetricsJson("{}");
    setPublished(false);
    setOrderIndex(0);
    setFormError(null);
  };

  // When parent changes, auto-rewrite slug to match the new parent's path.
  // This prevents the user from ever forgetting the prefix.
  const handleParentChange = (newParentId: string) => {
    setParentId(newParentId);

    // Going to top-level: leave slug alone, user can clean up manually.
    // (We'll error at submit time if it still contains "/".)
    if (!newParentId) return;

    const newParent = projects.find((p) => p.id === newParentId);
    if (!newParent) return;

    const desiredPrefix = `${newParent.slug}/`;
    if (slug.startsWith(desiredPrefix)) return; // already correct

    // Extract the leaf portion (last segment) and re-prefix.
    const leaf = slug.includes("/") ? slug.split("/").pop() ?? "" : slug;
    setSlug(`${desiredPrefix}${leaf}`);
  };

  const startEdit = (p: Project) => {
    setEditing(p.id);
    setShowForm(true);
    setTitle(p.title);
    setSlug(p.slug);
    setParentId(p.parent_id ?? "");
    setSummary(p.summary ?? "");
    setTagsInput((p.tags ?? []).join(", "));
    setTechStackInput((p.tech_stack ?? []).join(", "));
    setHeroImage(p.hero_image ?? "");
    setLinksJson(JSON.stringify(p.links ?? {}, null, 2));
    setMetricsJson(JSON.stringify(p.metrics ?? {}, null, 2));
    setPublished(p.published);
    setOrderIndex(p.order_index);
    setFormError(null);
  };

  const handleSubmit = async () => {
    setFormError(null);

    if (!title.trim()) {
      setFormError("Title 必填");
      return;
    }
    if (!slug.trim()) {
      setFormError("Slug 必填");
      return;
    }

    const [linksParsed, linksErr] = safeJson<Record<string, string>>(linksJson);
    if (linksErr) {
      setFormError(`Links JSON 格式錯誤：${linksErr}`);
      return;
    }
    const [metricsParsed, metricsErr] = safeJson<Record<string, unknown>>(
      metricsJson
    );
    if (metricsErr) {
      setFormError(`Metrics JSON 格式錯誤：${metricsErr}`);
      return;
    }

    // Slug-vs-parent consistency: hard requirement, not a warning.
    // Inconsistent slug breaks breadcrumbs, URL hierarchy, and child links.
    const trimmedSlug = slug.trim();
    if (parentId) {
      const parent = projects.find((p) => p.id === parentId);
      if (parent && !trimmedSlug.startsWith(`${parent.slug}/`)) {
        const leafGuess = trimmedSlug.split("/").pop() || "leaf-name";
        setFormError(
          `Slug 必須以 parent 的 slug「${parent.slug}/」開頭。建議改成「${parent.slug}/${leafGuess}」。`
        );
        return;
      }
      if (trimmedSlug === `${parent?.slug}/`) {
        setFormError(
          `Slug 不能只是 parent 前綴，後面要加上這個子專案的名字。`
        );
        return;
      }
    } else if (trimmedSlug.includes("/")) {
      setFormError(
        `Top-level project 的 slug 不能含有「/」。如果這是子專案，請選擇 Parent；否則請改成不含 / 的名稱。`
      );
      return;
    }

    setSaving(true);

    const payload = {
      title: title.trim(),
      slug: slug.trim(),
      parent_id: parentId || null,
      summary: summary.trim() || null,
      tags: parseCsv(tagsInput),
      tech_stack: parseCsv(techStackInput),
      hero_image: heroImage.trim() || null,
      links: linksParsed ?? {},
      metrics: metricsParsed ?? {},
      published,
      order_index: orderIndex,
    };

    const { error } = editing
      ? await supabase.from("projects").update(payload).eq("id", editing)
      : await supabase.from("projects").insert(payload);

    setSaving(false);

    if (error) {
      setFormError(error.message);
      return;
    }

    resetForm();
    fetchProjects();
  };

  const handleDelete = async (p: Project) => {
    const childCount = projects.filter((c) => c.parent_id === p.id).length;
    const msg = childCount
      ? `「${p.title}」有 ${childCount} 個子專案，刪除會連同子專案 + 所有 blocks 一起刪掉，確定？`
      : `刪除「${p.title}」？所有 blocks 也會一起刪掉。`;
    if (!confirm(msg)) return;
    await supabase.from("projects").delete().eq("id", p.id);
    fetchProjects();
  };

  // ----- Render guards -----
  if (loading) {
    return (
      <main className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center">
        <p className="text-neutral-500">Loading...</p>
      </main>
    );
  }

  if (unauthorized) {
    return (
      <main className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <h1 className="text-4xl font-bold mb-3">未授權</h1>
          <p className="text-lg text-neutral-300 mb-8">
            您沒有權限訪問此頁面
          </p>
          <p className="text-xs text-neutral-600 mb-6">
            3 秒後自動返回首頁 / Redirecting in 3s...
          </p>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-3 bg-neutral-100 text-neutral-950 rounded-lg font-medium hover:bg-white transition-colors"
          >
            立即返回首頁
          </button>
        </div>
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

  // Sort into hub list (top-level + their children grouped underneath)
  const topLevel = projects.filter((p) => !p.parent_id);
  const childrenOf = (id: string) =>
    projects.filter((p) => p.parent_id === id);

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 px-6 py-24">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
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

        {/* Section nav */}
        <nav className="flex gap-6 mb-10 text-sm border-b border-neutral-800 pb-3">
          <Link
            href="/admin"
            className="text-neutral-500 hover:text-neutral-100 transition-colors"
          >
            📝 Posts
          </Link>
          <span className="text-neutral-100 font-medium">🗂 Projects</span>
        </nav>

        {!showForm && (
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
              className="px-4 py-2 bg-neutral-100 text-neutral-950 rounded-lg text-sm font-medium hover:bg-white transition-colors"
            >
              + New Project
            </button>
            <Link
              href="/projects"
              target="_blank"
              className="text-sm text-neutral-500 hover:text-neutral-100 transition-colors"
            >
              View live ↗
            </Link>
          </div>
        )}

        {/* ---------- Form ---------- */}
        {showForm && (
          <div className="border border-neutral-800 rounded-lg p-6 mb-8 space-y-4">
            <h2 className="text-lg font-semibold">
              {editing ? "Edit Project" : "New Project"}
            </h2>

            {formError && (
              <div
                className="border rounded-lg px-3 py-2 text-sm"
                style={{
                  borderColor: "#dc2626",
                  backgroundColor: "rgba(220, 38, 38, 0.1)",
                  color: "#fca5a5",
                }}
              >
                {formError}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-neutral-500 block mb-1">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:border-neutral-600"
                />
              </div>
              <div>
                <label className="text-xs text-neutral-500 block mb-1">
                  Slug <span className="text-red-500">*</span>
                  <span className="text-neutral-600 ml-2">
                    （子專案請填完整路徑，例如 uav-vio/algorithm）
                  </span>
                </label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="uav-vio"
                  className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-sm text-neutral-100 font-mono focus:outline-none focus:border-neutral-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-neutral-500 block mb-1">
                  Parent
                </label>
                <select
                  value={parentId}
                  onChange={(e) => handleParentChange(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:border-neutral-600"
                >
                  <option value="">— Top-level —</option>
                  {projects
                    .filter((p) => p.id !== editing) // can't be its own parent
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.slug} — {p.title}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-neutral-500 block mb-1">
                  Order index
                </label>
                <input
                  type="number"
                  value={orderIndex}
                  onChange={(e) => setOrderIndex(Number(e.target.value))}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:border-neutral-600"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-neutral-500 block mb-1">
                Summary
                <span className="text-neutral-600 ml-2">
                  （卡片用的 1-2 句摘要）
                </span>
              </label>
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                rows={2}
                className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:border-neutral-600 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-neutral-500 block mb-1">
                  Tags
                  <span className="text-neutral-600 ml-2">
                    （逗號分隔，例如：UAV, BMC）
                  </span>
                </label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="UAV, BMC"
                  className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:border-neutral-600"
                />
              </div>
              <div>
                <label className="text-xs text-neutral-500 block mb-1">
                  Tech stack
                  <span className="text-neutral-600 ml-2">（逗號分隔）</span>
                </label>
                <input
                  type="text"
                  value={techStackInput}
                  onChange={(e) => setTechStackInput(e.target.value)}
                  placeholder="C++, ROS, Jetson Nano"
                  className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:border-neutral-600"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-neutral-500 block mb-1">
                Hero image URL
              </label>
              <input
                type="text"
                value={heroImage}
                onChange={(e) => setHeroImage(e.target.value)}
                placeholder="https://..."
                className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-sm text-neutral-100 font-mono focus:outline-none focus:border-neutral-600"
              />
            </div>

            <details>
              <summary className="text-xs text-neutral-500 cursor-pointer hover:text-neutral-300">
                ⚙️ 進階：Links / Metrics（JSON）
              </summary>
              <div className="mt-3 grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-neutral-500 block mb-1">
                    Links (JSON)
                  </label>
                  <textarea
                    value={linksJson}
                    onChange={(e) => setLinksJson(e.target.value)}
                    rows={4}
                    placeholder='{"github": "https://..."}'
                    className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-xs text-neutral-100 font-mono focus:outline-none focus:border-neutral-600 resize-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-neutral-500 block mb-1">
                    Metrics (JSON)
                  </label>
                  <textarea
                    value={metricsJson}
                    onChange={(e) => setMetricsJson(e.target.value)}
                    rows={4}
                    placeholder='{"rmse_cm": 3}'
                    className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-xs text-neutral-100 font-mono focus:outline-none focus:border-neutral-600 resize-none"
                  />
                </div>
              </div>
            </details>

            <div className="flex items-center justify-between pt-2">
              <label className="flex items-center gap-2 text-sm text-neutral-400">
                <input
                  type="checkbox"
                  checked={published}
                  onChange={(e) => setPublished(e.target.checked)}
                />
                Published（公開可見）
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
                  disabled={saving}
                  className="px-4 py-2 bg-neutral-100 text-neutral-950 rounded-lg text-sm font-medium hover:bg-white transition-colors disabled:opacity-50"
                >
                  {saving ? "Saving..." : editing ? "Update" : "Create"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ---------- Project list (with hierarchy) ---------- */}
        <div className="space-y-3">
          {topLevel.length === 0 && (
            <p className="text-neutral-500 text-sm">
              還沒有專案。按上面 + New Project 開始。
            </p>
          )}
          {topLevel.map((p) => {
            const kids = childrenOf(p.id);
            return (
              <div key={p.id}>
                <ProjectRow project={p} onEdit={startEdit} onDelete={handleDelete} />
                {kids.length > 0 && (
                  <div className="ml-6 mt-2 space-y-2 border-l border-neutral-800 pl-4">
                    {kids.map((c) => (
                      <ProjectRow
                        key={c.id}
                        project={c}
                        onEdit={startEdit}
                        onDelete={handleDelete}
                        isChild
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-12 p-4 border border-dashed border-neutral-700 rounded-lg text-xs text-neutral-500">
          💡 內容區塊（block）的編輯器還沒做，目前只能管理 project 的
          metadata。Block 編輯（markdown / image / metric / 之後的 code）會在下一個 stage 實作；在那之前要新增內容請用 Supabase SQL Editor 直接 insert 到 <code className="text-neutral-400">project_blocks</code> 表。
        </div>
      </div>
    </main>
  );
}

function ProjectRow({
  project,
  onEdit,
  onDelete,
  isChild,
}: {
  project: Project;
  onEdit: (p: Project) => void;
  onDelete: (p: Project) => void;
  isChild?: boolean;
}) {
  return (
    <div className="border border-neutral-800 rounded-lg p-3 flex justify-between items-start gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          {isChild && <span className="text-neutral-600 text-xs">└</span>}
          <h3 className="font-medium text-sm">{project.title}</h3>
          {project.published ? (
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ backgroundColor: "#16a34a", color: "white" }}
            >
              Public
            </span>
          ) : (
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ backgroundColor: "#ea580c", color: "white" }}
            >
              Draft
            </span>
          )}
        </div>
        <p className="text-xs text-neutral-500 mt-1 font-mono">
          /{project.slug}
        </p>
        {project.summary && (
          <p className="text-xs text-neutral-400 mt-1 line-clamp-1">
            {project.summary}
          </p>
        )}
      </div>
      <div className="flex gap-3 shrink-0">
        <button
          onClick={() => onEdit(project)}
          className="text-xs text-neutral-500 hover:text-neutral-100 transition-colors"
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(project)}
          className="text-xs hover:opacity-80 transition-opacity"
          style={{ color: "#dc2626" }}
        >
          Del
        </button>
      </div>
    </div>
  );
}
