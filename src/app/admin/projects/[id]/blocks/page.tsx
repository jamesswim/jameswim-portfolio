"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import type {
  Project,
  ProjectBlock,
  ProjectBlockType,
} from "@/lib/types";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="h-[300px] flex items-center justify-center text-neutral-500 text-sm">
      Loading editor...
    </div>
  ),
});

// Types we expose in the "Add block" picker. Code/gallery come later.
const ADDABLE_TYPES: ProjectBlockType[] = [
  "markdown",
  "image",
  "metric",
  "video",
];

const TYPE_LABELS: Record<ProjectBlockType, string> = {
  markdown: "📝 Markdown",
  image: "🖼 Image",
  metric: "📊 Metric",
  video: "🎬 Video",
  code: "💻 Code",
  gallery: "🗂 Gallery",
};

// Default content shape for newly created blocks of each type.
function defaultContent(type: ProjectBlockType): Record<string, unknown> {
  switch (type) {
    case "markdown":
      return { text: "" };
    case "image":
      return { src: "", alt: "", caption: "" };
    case "metric":
      return { label: "", value: "", context: "" };
    case "video":
      return { src: "", kind: "youtube", caption: "" };
    default:
      return {};
  }
}

// Short single-line preview shown when a block is collapsed.
function blockPreview(block: ProjectBlock): string {
  const c = block.content as Record<string, unknown>;
  switch (block.type) {
    case "markdown":
      return ((c.text as string) ?? "").slice(0, 120) || "(empty)";
    case "image":
      return (c.src as string) || "(no src)";
    case "metric":
      return `${(c.label as string) ?? ""}: ${(c.value as string) ?? ""}`;
    case "video":
      return `${(c.kind as string) ?? "?"} — ${(c.src as string) ?? "(no src)"}`;
    default:
      return JSON.stringify(c).slice(0, 120);
  }
}

export default function ProjectBlocksPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id: projectId } = use(params);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);

  const [project, setProject] = useState<Project | null>(null);
  const [blocks, setBlocks] = useState<ProjectBlock[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [newBlockType, setNewBlockType] = useState<ProjectBlockType>("markdown");
  const [editingId, setEditingId] = useState<string | null>(null);

  // ----- Auth (mirrors other admin pages) -----
  useEffect(() => {
    let redirectTimeout: ReturnType<typeof setTimeout> | null = null;
    const verify = async (session: Session | null) => {
      if (!session) {
        setUser(null);
        setUnauthorized(false);
        setAuthLoading(false);
        return;
      }
      const { data: isAdmin } = await supabase.rpc("is_admin");
      if (!isAdmin) {
        await supabase.auth.signOut();
        setUser(null);
        setUnauthorized(true);
        setAuthLoading(false);
        redirectTimeout = setTimeout(() => router.push("/"), 3000);
      } else {
        setUser(session.user);
        setUnauthorized(false);
        setAuthLoading(false);
      }
    };
    supabase.auth.getSession().then(({ data: { session } }) => verify(session));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => verify(session));
    return () => {
      subscription.unsubscribe();
      if (redirectTimeout) clearTimeout(redirectTimeout);
    };
  }, [router]);

  // ----- Data fetching -----
  useEffect(() => {
    if (!user) return;
    fetchProject();
    fetchBlocks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, projectId]);

  const fetchProject = async () => {
    const { data } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single();
    setProject(data);
    setLoadingData(false);
  };

  const fetchBlocks = async () => {
    const { data } = await supabase
      .from("project_blocks")
      .select("*")
      .eq("project_id", projectId)
      .order("order_index", { ascending: true });
    setBlocks(data || []);
  };

  // ----- Block actions -----
  const addBlock = async () => {
    const maxOrder = blocks.reduce(
      (m, b) => Math.max(m, b.order_index),
      -1
    );
    const { data } = await supabase
      .from("project_blocks")
      .insert({
        project_id: projectId,
        type: newBlockType,
        content: defaultContent(newBlockType),
        order_index: maxOrder + 1,
      })
      .select()
      .single();
    if (data) {
      await fetchBlocks();
      setEditingId(data.id); // open the new block for editing immediately
    }
  };

  const saveBlockContent = async (
    blockId: string,
    content: Record<string, unknown>
  ) => {
    await supabase
      .from("project_blocks")
      .update({ content })
      .eq("id", blockId);
    await fetchBlocks();
    setEditingId(null);
  };

  const deleteBlock = async (block: ProjectBlock) => {
    if (!confirm(`刪除這個 ${block.type} block？`)) return;
    await supabase.from("project_blocks").delete().eq("id", block.id);
    await fetchBlocks();
  };

  const moveBlock = async (block: ProjectBlock, direction: "up" | "down") => {
    const sorted = [...blocks].sort((a, b) => a.order_index - b.order_index);
    const idx = sorted.findIndex((b) => b.id === block.id);
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= sorted.length) return;
    const target = sorted[targetIdx];
    await Promise.all([
      supabase
        .from("project_blocks")
        .update({ order_index: target.order_index })
        .eq("id", block.id),
      supabase
        .from("project_blocks")
        .update({ order_index: block.order_index })
        .eq("id", target.id),
    ]);
    await fetchBlocks();
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  // ----- Render guards -----
  if (authLoading) {
    return (
      <main className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center">
        <p className="text-neutral-500">Loading...</p>
      </main>
    );
  }

  if (unauthorized) {
    return (
      <main className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center px-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-3">未授權</h1>
          <p className="text-xs text-neutral-600 mb-6">
            3 秒後自動返回首頁...
          </p>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center">
        <Link
          href="/admin"
          className="px-6 py-3 bg-neutral-100 text-neutral-950 rounded-lg font-medium"
        >
          Go to Admin to sign in
        </Link>
      </main>
    );
  }

  if (loadingData) {
    return (
      <main className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center">
        <p className="text-neutral-500">Loading project...</p>
      </main>
    );
  }

  if (!project) {
    return (
      <main className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Project not found</h1>
          <Link
            href="/admin/projects"
            className="text-neutral-500 hover:text-neutral-100 transition-colors"
          >
            ← Back to Projects
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 px-6 py-24">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <Link
              href="/admin/projects"
              className="text-sm text-neutral-500 hover:text-neutral-100 transition-colors"
            >
              ← Back to Projects
            </Link>
            <h1 className="text-3xl font-bold mt-3">{project.title}</h1>
            <p className="text-sm text-neutral-500 mt-1 font-mono">
              /{project.slug}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href={`/projects/${project.slug}`}
              target="_blank"
              className="text-sm text-neutral-500 hover:text-neutral-100 transition-colors"
            >
              View live ↗
            </Link>
            <button
              onClick={signOut}
              className="text-sm text-neutral-500 hover:text-neutral-100 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>

        {/* Add block */}
        <div className="border border-neutral-800 rounded-lg p-4 mb-6 flex items-center gap-3">
          <span className="text-sm text-neutral-400">+ Add block:</span>
          <select
            value={newBlockType}
            onChange={(e) =>
              setNewBlockType(e.target.value as ProjectBlockType)
            }
            className="bg-neutral-900 border border-neutral-800 rounded px-3 py-1.5 text-sm text-neutral-100 focus:outline-none focus:border-neutral-600"
          >
            {ADDABLE_TYPES.map((t) => (
              <option key={t} value={t}>
                {TYPE_LABELS[t]}
              </option>
            ))}
          </select>
          <button
            onClick={addBlock}
            className="px-3 py-1.5 bg-neutral-100 text-neutral-950 rounded text-sm font-medium hover:bg-white transition-colors"
          >
            Add
          </button>
        </div>

        {/* Block list */}
        <div className="space-y-3">
          {blocks.length === 0 && (
            <p className="text-neutral-500 text-sm">
              還沒有任何 block。從上面選類型、按 Add 開始建。
            </p>
          )}
          {blocks.map((block, idx) => (
            <BlockCard
              key={block.id}
              block={block}
              isFirst={idx === 0}
              isLast={idx === blocks.length - 1}
              isEditing={editingId === block.id}
              onEdit={() => setEditingId(block.id)}
              onCancel={() => setEditingId(null)}
              onSave={(content) => saveBlockContent(block.id, content)}
              onDelete={() => deleteBlock(block)}
              onMoveUp={() => moveBlock(block, "up")}
              onMoveDown={() => moveBlock(block, "down")}
            />
          ))}
        </div>
      </div>
    </main>
  );
}

// ============================================================
// BlockCard: collapsed preview + inline editor when expanded
// ============================================================

function BlockCard({
  block,
  isFirst,
  isLast,
  isEditing,
  onEdit,
  onCancel,
  onSave,
  onDelete,
  onMoveUp,
  onMoveDown,
}: {
  block: ProjectBlock;
  isFirst: boolean;
  isLast: boolean;
  isEditing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: (content: Record<string, unknown>) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  return (
    <div className="border border-neutral-800 rounded-lg overflow-hidden">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-neutral-900/40 border-b border-neutral-800">
        <div className="flex items-center gap-3">
          <span className="text-xs text-neutral-400">
            {TYPE_LABELS[block.type]}
          </span>
          {!isEditing && (
            <span className="text-xs text-neutral-500 truncate max-w-md">
              {blockPreview(block)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onMoveUp}
            disabled={isFirst}
            className="text-xs text-neutral-500 hover:text-neutral-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="Move up"
          >
            ↑
          </button>
          <button
            onClick={onMoveDown}
            disabled={isLast}
            className="text-xs text-neutral-500 hover:text-neutral-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="Move down"
          >
            ↓
          </button>
          {!isEditing ? (
            <button
              onClick={onEdit}
              className="text-xs text-neutral-500 hover:text-neutral-100 transition-colors ml-2"
            >
              Edit
            </button>
          ) : (
            <button
              onClick={onCancel}
              className="text-xs text-neutral-500 hover:text-neutral-100 transition-colors ml-2"
            >
              Cancel
            </button>
          )}
          <button
            onClick={onDelete}
            className="text-xs hover:opacity-80 transition-opacity ml-1"
            style={{ color: "#dc2626" }}
          >
            Del
          </button>
        </div>
      </div>

      {/* Editor (only when expanded) */}
      {isEditing && (
        <div className="p-4">
          {block.type === "markdown" && (
            <MarkdownBlockEditor block={block} onSave={onSave} />
          )}
          {block.type === "image" && (
            <ImageBlockEditor block={block} onSave={onSave} />
          )}
          {block.type === "metric" && (
            <MetricBlockEditor block={block} onSave={onSave} />
          )}
          {block.type === "video" && (
            <VideoBlockEditor block={block} onSave={onSave} />
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Per-type editors
// ============================================================

function MarkdownBlockEditor({
  block,
  onSave,
}: {
  block: ProjectBlock;
  onSave: (content: Record<string, unknown>) => void;
}) {
  const initial = (block.content as { text?: string }).text ?? "";
  const [text, setText] = useState(initial);

  return (
    <div>
      <div className="border border-neutral-800 rounded overflow-hidden mb-3">
        <MonacoEditor
          height="320px"
          defaultLanguage="markdown"
          theme="vs-dark"
          value={text}
          onChange={(v) => setText(v || "")}
          options={{
            fontSize: 14,
            lineNumbers: "on",
            minimap: { enabled: false },
            wordWrap: "on",
            scrollBeyondLastLine: false,
            padding: { top: 12, bottom: 12 },
          }}
        />
      </div>
      <div className="flex justify-end">
        <button
          onClick={() => onSave({ text })}
          className="px-4 py-2 bg-neutral-100 text-neutral-950 rounded text-sm font-medium hover:bg-white transition-colors"
        >
          Save
        </button>
      </div>
    </div>
  );
}

function ImageBlockEditor({
  block,
  onSave,
}: {
  block: ProjectBlock;
  onSave: (content: Record<string, unknown>) => void;
}) {
  const c = block.content as { src?: string; alt?: string; caption?: string };
  const [src, setSrc] = useState(c.src ?? "");
  const [alt, setAlt] = useState(c.alt ?? "");
  const [caption, setCaption] = useState(c.caption ?? "");

  return (
    <div className="space-y-3">
      <Field label="Image URL">
        <input
          type="text"
          value={src}
          onChange={(e) => setSrc(e.target.value)}
          placeholder="https://..."
          className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-sm text-neutral-100 font-mono focus:outline-none focus:border-neutral-600"
        />
      </Field>
      <Field label="Alt text">
        <input
          type="text"
          value={alt}
          onChange={(e) => setAlt(e.target.value)}
          className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:border-neutral-600"
        />
      </Field>
      <Field label="Caption">
        <input
          type="text"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:border-neutral-600"
        />
      </Field>
      <div className="flex justify-end">
        <button
          onClick={() => onSave({ src, alt, caption })}
          className="px-4 py-2 bg-neutral-100 text-neutral-950 rounded text-sm font-medium hover:bg-white transition-colors"
        >
          Save
        </button>
      </div>
    </div>
  );
}

function MetricBlockEditor({
  block,
  onSave,
}: {
  block: ProjectBlock;
  onSave: (content: Record<string, unknown>) => void;
}) {
  const c = block.content as {
    label?: string;
    value?: string;
    context?: string;
  };
  const [label, setLabel] = useState(c.label ?? "");
  const [value, setValue] = useState(c.value ?? "");
  const [context, setContext] = useState(c.context ?? "");

  return (
    <div className="space-y-3">
      <Field label="Label">
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Position RMSE"
          className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:border-neutral-600"
        />
      </Field>
      <Field label="Value">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="3 cm"
          className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:border-neutral-600"
        />
      </Field>
      <Field label="Context">
        <input
          type="text"
          value={context}
          onChange={(e) => setContext(e.target.value)}
          placeholder="在校內 50m × 50m 飛行軌跡"
          className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:border-neutral-600"
        />
      </Field>
      <div className="flex justify-end">
        <button
          onClick={() => onSave({ label, value, context })}
          className="px-4 py-2 bg-neutral-100 text-neutral-950 rounded text-sm font-medium hover:bg-white transition-colors"
        >
          Save
        </button>
      </div>
    </div>
  );
}

function VideoBlockEditor({
  block,
  onSave,
}: {
  block: ProjectBlock;
  onSave: (content: Record<string, unknown>) => void;
}) {
  const c = block.content as {
    src?: string;
    kind?: "youtube" | "mp4";
    caption?: string;
  };
  const [src, setSrc] = useState(c.src ?? "");
  const [kind, setKind] = useState<"youtube" | "mp4">(c.kind ?? "youtube");
  const [caption, setCaption] = useState(c.caption ?? "");

  return (
    <div className="space-y-3">
      <Field label="Type">
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value as "youtube" | "mp4")}
          className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:border-neutral-600"
        >
          <option value="youtube">YouTube (use embed URL)</option>
          <option value="mp4">MP4 (direct file URL)</option>
        </select>
      </Field>
      <Field
        label="Source URL"
        hint={
          kind === "youtube"
            ? "貼 YouTube 的 embed 連結，例如 https://www.youtube.com/embed/XXXX"
            : "MP4 直接連結"
        }
      >
        <input
          type="text"
          value={src}
          onChange={(e) => setSrc(e.target.value)}
          className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-sm text-neutral-100 font-mono focus:outline-none focus:border-neutral-600"
        />
      </Field>
      <Field label="Caption">
        <input
          type="text"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:border-neutral-600"
        />
      </Field>
      <div className="flex justify-end">
        <button
          onClick={() => onSave({ src, kind, caption })}
          className="px-4 py-2 bg-neutral-100 text-neutral-950 rounded text-sm font-medium hover:bg-white transition-colors"
        >
          Save
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-xs text-neutral-500 block mb-1">
        {label}
        {hint && <span className="text-neutral-600 ml-2">（{hint}）</span>}
      </label>
      {children}
    </div>
  );
}
