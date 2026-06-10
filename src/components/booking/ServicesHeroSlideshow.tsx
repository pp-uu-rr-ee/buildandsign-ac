"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

export type Slide = {
  src: string;
  alt: string;
};

type Props = {
  slides: Slide[];
  /** Auto-advance interval in ms. Set to 0 to disable. Default: 5000ms. */
  intervalMs?: number;
  /** Optional Tailwind classes — defaults to a 4:3 aspect ratio card. */
  className?: string;
};

/**
 * Auto-advancing image carousel. Cycles forever every `intervalMs` ms.
 * Includes manual prev/next arrows (visible on hover) and dot indicators.
 *
 * The interval depends ONLY on `intervalMs` and `slides.length`, so it is
 * created once and left alone — the increment uses the functional form of
 * setState to avoid stale closures.
 */
export function ServicesHeroSlideshow({
  slides,
  intervalMs = 3000,
  className = "aspect-[4/3] rounded-2xl",
}: Props) {
  const [index, setIndex] = useState(0);
  const total = slides.length;

  // Auto-advance — runs once per mount, never paused.
  useEffect(() => {
    if (intervalMs <= 0 || total <= 1) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % total);
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs, total]);

  if (total === 0) return null;

  const goPrev = () => setIndex((i) => (i - 1 + total) % total);
  const goNext = () => setIndex((i) => (i + 1) % total);

  return (
    <div
      className={`relative overflow-hidden group bg-gray-100 dark:bg-gray-800 ${className}`}
      aria-roledescription="carousel"
    >
      {slides.map((slide, i) => (
        <div
          key={slide.src}
          className={`absolute inset-0 transition-opacity duration-700 ${
            i === index ? "opacity-100" : "opacity-0"
          }`}
          aria-hidden={i !== index}
        >
          <Image
            src={slide.src}
            alt={slide.alt}
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
            priority={i === 0}
          />
        </div>
      ))}

      {total > 1 && (
        <>
          {/* Prev / next arrows — visible on hover */}
          <button
            type="button"
            onClick={goPrev}
            aria-label="Previous slide"
            className="absolute left-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-black/30 backdrop-blur text-white opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity flex items-center justify-center hover:bg-black/50"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={goNext}
            aria-label="Next slide"
            className="absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-black/30 backdrop-blur text-white opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity flex items-center justify-center hover:bg-black/50"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          {/* Dots */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === index ? "true" : undefined}
                className={`h-1.5 rounded-full transition-all ${
                  i === index ? "w-6 bg-white" : "w-1.5 bg-white/60 hover:bg-white/80"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
