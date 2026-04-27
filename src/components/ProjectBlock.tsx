"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import type { ProjectBlock as ProjectBlockType } from "@/lib/types";

// Renders one project content block based on its `type`.
// Block types `video`, `code`, `gallery` are placeholders for now —
// they'll be implemented in later stages (code block needs CodeRunner first).
export default function ProjectBlock({ block }: { block: ProjectBlockType }) {
  switch (block.type) {
    case "markdown": {
      const text = (block.content as { text?: string }).text ?? "";
      return (
        <div className="prose prose-invert prose-neutral max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw, rehypeHighlight]}
          >
            {text}
          </ReactMarkdown>
        </div>
      );
    }

    case "image": {
      const c = block.content as {
        src?: string;
        alt?: string;
        caption?: string;
      };
      if (!c.src) return null;
      return (
        <figure className="my-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={c.src}
            alt={c.alt ?? ""}
            className="w-full rounded-lg border border-neutral-800"
          />
          {c.caption && (
            <figcaption className="text-sm text-neutral-500 mt-2 text-center">
              {c.caption}
            </figcaption>
          )}
        </figure>
      );
    }

    case "metric": {
      const c = block.content as {
        label?: string;
        value?: string;
        context?: string;
      };
      return (
        <div className="border border-neutral-800 rounded-lg p-6 bg-neutral-900/40">
          {c.label && (
            <p className="text-xs uppercase tracking-[0.2em] text-neutral-500 mb-2">
              {c.label}
            </p>
          )}
          {c.value && (
            <p className="text-3xl font-bold text-neutral-100">{c.value}</p>
          )}
          {c.context && (
            <p className="text-sm text-neutral-400 mt-2">{c.context}</p>
          )}
        </div>
      );
    }

    case "video": {
      const c = block.content as {
        src?: string;
        kind?: "youtube" | "mp4";
        caption?: string;
      };
      if (!c.src) return null;
      return (
        <figure className="my-6">
          {c.kind === "youtube" ? (
            <div
              className="relative w-full rounded-lg overflow-hidden border border-neutral-800"
              style={{ paddingBottom: "56.25%" }}
            >
              <iframe
                src={c.src}
                className="absolute inset-0 w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            <video
              src={c.src}
              controls
              className="w-full rounded-lg border border-neutral-800"
            />
          )}
          {c.caption && (
            <figcaption className="text-sm text-neutral-500 mt-2 text-center">
              {c.caption}
            </figcaption>
          )}
        </figure>
      );
    }

    case "code":
    case "gallery":
      return (
        <div className="border border-dashed border-neutral-700 rounded-lg p-4 text-sm text-neutral-500">
          Block type <code className="text-neutral-400">{block.type}</code> not
          yet rendered (coming in a later stage).
        </div>
      );

    default:
      return null;
  }
}
