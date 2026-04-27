"use client";

import { useRef, useState } from "react";
import { uploadImage } from "@/lib/uploadImage";

// Small reusable button that opens a file picker, uploads to Supabase Storage,
// and calls onUploaded(url) on success.
//
// Usage:
//   <ImageUploadButton onUploaded={(url) => setSrc(url)} />
export default function ImageUploadButton({
  onUploaded,
  label = "📤 Upload",
}: {
  onUploaded: (url: string) => void;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset the input so selecting the same file again still triggers onChange.
    if (inputRef.current) inputRef.current.value = "";
    if (!file) return;

    setError(null);
    setUploading(true);
    const { url, error: err } = await uploadImage(file);
    setUploading(false);

    if (err) {
      setError(err);
      return;
    }
    if (url) onUploaded(url);
  };

  return (
    <div className="flex flex-col gap-1">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="px-3 py-2 text-sm border border-neutral-700 rounded text-neutral-300 hover:text-neutral-100 hover:border-neutral-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
      >
        {uploading ? "Uploading..." : label}
      </button>
      {error && (
        <p className="text-xs" style={{ color: "#fca5a5" }}>
          {error}
        </p>
      )}
    </div>
  );
}
