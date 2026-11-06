"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ImagePlus, X } from "lucide-react";

import { MAX_PHOTOS, MAX_UPLOAD_BYTES as MAX_TOTAL_BYTES } from "@/lib/upload-policy";

type Picked = { id: string; key: string; file: File; url: string };

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
async function compressImage(file: File, maxEdge = 1920, quality = 0.82) {
  if (!file.type.startsWith("image/") || file.type === "image/gif") return file;

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return file;
    }
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality)
    );
    if (!blob || blob.size >= file.size) return file;

    return new File([blob], `${file.name.replace(/\.[^.]+$/, "")}.jpg`, {
      type: "image/jpeg",
    });
  } catch {
    return file;
  }
}

export function PhotoPicker({
  onChange,
  existingPhotos = [],
  label,
}: {
  onChange: (files: File[]) => void;
  existingPhotos?: { id: string; url: string }[];
  label: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previews, setPreviews] = useState<Picked[]>([]);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const previewsRef = useRef<Picked[]>([]);
  useEffect(() => {
    previewsRef.current = previews;
  }, [previews]);
  useEffect(() => {
    return () => {
      for (const preview of previewsRef.current) URL.revokeObjectURL(preview.url);
    };
  }, []);

  const syncing = useRef(false);
  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    try {
      syncing.current = true;
      const transfer = new DataTransfer();
      for (const preview of previews) transfer.items.add(preview.file);
      input.files = transfer.files;
    } catch {
    } finally {
      syncing.current = false;
    }
  }, [previews]);

  async function addFiles(incoming: FileList | File[] | null) {
    if (!incoming || syncing.current) return;
    const images = Array.from(incoming).filter(
      (file) => file.size > 0 && file.type.startsWith("image/")
    );
    if (images.length === 0) {
      if (Array.from(incoming).length > 0) {
        setNotice("Those files aren't images.");
      }
      return;
    }

    setBusy(true);
    setNotice(null);

    const room = MAX_PHOTOS - existingPhotos.length - previews.length;
    const accepted = images.slice(0, Math.max(room, 0));
    const skipped = images.length - accepted.length;

    const processed: Picked[] = [];
    for (const file of accepted) {
      const key = `${file.name}:${file.size}:${file.lastModified}`;
      const duplicate =
        previews.some((preview) => preview.key === key) ||
        processed.some((item) => item.key === key);
      if (duplicate) continue;
      const compressed = await compressImage(file);
      processed.push({
        id: crypto.randomUUID(),
        key,
        file: compressed,
        url: URL.createObjectURL(compressed),
      });
    }

    if (processed.length > 0) {
      const nextPreviews = [...previews, ...processed];
      setPreviews(nextPreviews);
      onChange(nextPreviews.map((preview) => preview.file));
    }
    setBusy(false);

    if (skipped > 0) {
      setNotice(`Only ${MAX_PHOTOS} photos per listing — ${skipped} not added.`);
    }

  }

  function remove(id: string) {
    const target = previews.find((preview) => preview.id === id);
    if (target) URL.revokeObjectURL(target.url);
    const next = previews.filter((preview) => preview.id !== id);
    setPreviews(next);
    onChange(next.map((preview) => preview.file));
    setNotice(null);
  }

  const totalBytes = previews.reduce((sum, preview) => sum + preview.file.size, 0);
  const overBudget = totalBytes > MAX_TOTAL_BYTES;
  const count = existingPhotos.length + previews.length;

  return (
    <div className="flex flex-col gap-3">
      <label
        htmlFor="photos"
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-8 text-center transition-colors ${
          dragging
            ? "border-blue-400 bg-blue-50"
            : "border-zinc-300 bg-zinc-50/60 hover:border-blue-300 hover:bg-blue-50/40"
        }`}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          void addFiles(event.dataTransfer.files);
        }}
      >
        <ImagePlus className="h-6 w-6 text-blue-800" />
        <span className="text-sm font-medium text-blue-950">
          {busy ? "Preparing photos..." : label}
        </span>
        <span className="text-xs text-zinc-500">
          Pick several at once, or add them one at a time &mdash; up to{" "}
          {MAX_PHOTOS}. Drag and drop works too.
        </span>
        <input
          ref={inputRef}
          id="photos"
          name="photos"
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          onChange={(event) => void addFiles(event.target.files)}
        />
      </label>

      {notice && <p className="text-xs text-amber-700">{notice}</p>}

      {count > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs text-zinc-500">
          <span>
            {count} photo{count === 1 ? "" : "s"}
            {previews.length > 0 && ` · ${formatBytes(totalBytes)} to upload`}
          </span>
          {overBudget && (
            <span className="font-medium text-red-600">
              Too much at once &mdash; remove a few (max{" "}
              {formatBytes(MAX_TOTAL_BYTES)}).
            </span>
          )}
        </div>
      )}

      {(previews.length > 0 || existingPhotos.length > 0) && (
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(5.5rem,1fr))] gap-3">
          {existingPhotos.map((photo) => (
            <li
              key={photo.id}
              className="relative aspect-square overflow-hidden rounded-xl bg-zinc-100 ring-1 ring-zinc-200"
            >
              <Image
                src={photo.url}
                alt=""
                fill
                sizes="120px"
                className="object-cover"
              />
              <span className="absolute inset-x-0 bottom-0 bg-black/55 py-0.5 text-center text-[0.65rem] text-white">
                Uploaded
              </span>
            </li>
          ))}
          {previews.map((preview) => (
            <li
              key={preview.id}
              className="relative aspect-square overflow-hidden rounded-xl bg-zinc-100 ring-1 ring-zinc-200"
            >

              <Image
                src={preview.url}
                alt={preview.file.name}
                fill
                unoptimized
                sizes="120px"
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={() => remove(preview.id)}
                aria-label={`Remove ${preview.file.name}`}
                className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-red-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
