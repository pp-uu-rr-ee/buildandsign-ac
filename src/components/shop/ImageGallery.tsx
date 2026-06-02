"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  images: { url: string; altText: string | null }[];
  productName: string;
};

export function ImageGallery({ images, productName }: Props) {
  const [active, setActive] = useState(0);

  if (images.length === 0) {
    return (
      <div className="aspect-square rounded-xl bg-gray-100 flex items-center justify-center">
        <svg
          className="h-24 w-24 text-gray-300"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1}
            d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Main image */}
      <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-50 border border-gray-200">
        <Image
          src={images[active].url}
          alt={images[active].altText ?? productName}
          fill
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover"
        />

        {images.length > 1 && (
          <>
            <button
              onClick={() => setActive((i) => Math.max(0, i - 1))}
              disabled={active === 0}
              className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-white/80 shadow flex items-center justify-center hover:bg-white transition-colors disabled:opacity-30"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() =>
                setActive((i) => Math.min(images.length - 1, i + 1))
              }
              disabled={active === images.length - 1}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-white/80 shadow flex items-center justify-center hover:bg-white transition-colors disabled:opacity-30"
              aria-label="Next image"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`relative h-16 w-16 shrink-0 rounded-lg overflow-hidden border-2 transition-colors ${
                i === active
                  ? "border-blue-600"
                  : "border-gray-200 hover:border-gray-400"
              }`}
            >
              <Image
                src={img.url}
                alt={img.altText ?? `${productName} image ${i + 1}`}
                fill
                sizes="64px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
