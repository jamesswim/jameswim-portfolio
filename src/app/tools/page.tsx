import Link from "next/link";
import { TOOLS, type Tool } from "@/lib/tools";

const STATUS_BADGE: Record<
  Tool["status"],
  { label: string; bg: string; color: string }
> = {
  live: { label: "Live", bg: "#16a34a", color: "white" },
  wip: { label: "WIP", bg: "#f97316", color: "white" },
  planned: { label: "Planned", bg: "#404040", color: "#f5f5f5" },
};

export default function ToolsPage() {
  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 px-6 py-24">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-12">
          <h1 className="text-4xl font-bold">Tools</h1>
          <Link
            href="/"
            className="px-4 py-2 rounded-lg text-sm font-medium text-white hover:opacity-80 transition-opacity"
            style={{ backgroundColor: "#3b82f6" }}
          >
            ← Back to Home
          </Link>
        </div>

        {TOOLS.length === 0 ? (
          <p className="text-neutral-500">尚無工具。</p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {TOOLS.map((tool) => (
              <ToolCard key={tool.slug} tool={tool} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function ToolCard({ tool }: { tool: Tool }) {
  const badge = STATUS_BADGE[tool.status];
  const isLive = tool.status === "live";

  const inner = (
    <>
      <div className="flex items-start justify-between gap-3 mb-2">
        <h2
          className={`text-xl font-semibold ${
            isLive
              ? "text-neutral-200 group-hover:text-white transition-colors"
              : "text-neutral-300"
          }`}
        >
          {tool.name}
        </h2>
        <span
          className="text-xs px-2 py-0.5 rounded-full font-medium shrink-0"
          style={{ backgroundColor: badge.bg, color: badge.color }}
        >
          {badge.label}
        </span>
      </div>
      <p className="text-sm text-neutral-400 leading-relaxed mb-4 flex-1">
        {tool.description}
      </p>
      {tool.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-auto">
          {tool.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs px-2 py-0.5 rounded-full border border-neutral-700 text-neutral-400"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </>
  );

  // Live tools are clickable; WIP / planned are just visual placeholders.
  if (isLive) {
    return (
      <Link
        href={`/tools/${tool.slug}`}
        className="group border border-neutral-800 rounded-lg p-6 hover:border-neutral-600 transition-colors flex flex-col"
      >
        {inner}
      </Link>
    );
  }
  return (
    <div className="border border-neutral-800 rounded-lg p-6 flex flex-col opacity-70">
      {inner}
    </div>
  );
}
