"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { Star, Trash2, Upload, Loader2 } from "lucide-react";
import {
  uploadProductImageAction,
  saveProductImageAction,
  setPrimaryImageAction,
  deleteProductImageAction,
} from "@/lib/actions/images";
import type { ProductImage } from "@/types";

const MAX_SIZE_BYTES = 10 * 1024 * 1024;
const ACCEPTED = "image/jpeg,image/png,image/webp,image/avif";

type Props = {
  productId: string;
  images: ProductImage[];
};

export function ProductImageManager({ productId, images }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    setUploading(true);

    for (const file of Array.from(files)) {
      if (file.size > MAX_SIZE_BYTES) {
        setError(`"${file.name}" exceeds the 10 MB limit.`);
        continue;
      }

      const fd = new FormData();
      fd.append("file", file);

      // Upload file through Next.js server → R2 (no CORS required)
      const result = await uploadProductImageAction(productId, fd);

      if ("error" in result) {
        setError(result.error);
        continue;
      }

      const isFirst = images.length === 0;
      await saveProductImageAction(productId, result.url, result.key, null, isFirst);
    }

    setUploading(false);
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    handleFiles(e.target.files);
    e.target.value = "";
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  }

  function setPrimary(imageId: string) {
    startTransition(() => setPrimaryImageAction(imageId, productId));
  }

  function deleteImage(imageId: string, key: string) {
    if (!confirm("Delete this image?")) return;
    startTransition(async () => {
      const res = await deleteProductImageAction(imageId, productId, key);
      if (res.error) setError(res.error);
    });
  }

  const isLoading = uploading || isPending;

  return (
    <div className="space-y-4">
      {/* Existing images grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {images.map((img) => {
            const key = extractKey(img.url);
            return (
              <div
                key={img.id}
                className="relative group rounded-lg overflow-hidden border border-gray-200 bg-gray-50 aspect-square"
              >
                <Image
                  src={img.url}
                  alt={img.altText ?? "Product image"}
                  fill
                  sizes="200px"
                  className="object-cover"
                />

                {img.isPrimary && (
                  <div className="absolute top-1.5 left-1.5 flex items-center gap-1 bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                    <Star className="h-2.5 w-2.5 fill-white" /> Primary
                  </div>
                )}

                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  {!img.isPrimary && (
                    <button
                      onClick={() => setPrimary(img.id)}
                      disabled={isLoading}
                      title="Set as primary"
                      className="p-1.5 rounded-md bg-white/20 hover:bg-white/40 text-white transition-colors disabled:opacity-50"
                    >
                      <Star className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => deleteImage(img.id, key)}
                    disabled={isLoading}
                    title="Delete image"
                    className="p-1.5 rounded-md bg-white/20 hover:bg-red-500/80 text-white transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload drop zone */}
      <div
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => !isLoading && inputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 text-center transition-colors
          ${isLoading
            ? "border-gray-200 bg-gray-50 cursor-not-allowed"
            : "border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50 cursor-pointer"
          }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED}
          multiple
          className="sr-only"
          onChange={onInputChange}
          disabled={isLoading}
        />

        {isLoading ? (
          <>
            <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
            <p className="text-sm text-gray-500">Uploading…</p>
          </>
        ) : (
          <>
            <Upload className="h-8 w-8 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-700">
                Drop images here or{" "}
                <span className="text-blue-600">click to browse</span>
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                JPEG, PNG, WebP, AVIF — max 10 MB each
              </p>
            </div>
          </>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      {images.length === 0 && !uploading && (
        <p className="text-xs text-gray-400">
          The first image you upload will automatically be set as primary.
        </p>
      )}
    </div>
  );
}

function extractKey(url: string): string {
  try {
    const publicBase = process.env.NEXT_PUBLIC_STORAGE_URL ?? "";
    if (publicBase && url.startsWith(publicBase)) {
      return url.slice(publicBase.replace(/\/$/, "").length + 1);
    }
    return new URL(url).pathname.slice(1);
  } catch {
    return "";
  }
}
