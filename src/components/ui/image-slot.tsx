import Image from "next/image";
import { ImageIcon } from "lucide-react";

interface ImageSlotProps {
  src?: string;
  alt?: string;
  /** Dimension hint shown in the placeholder, e.g. "1200 × 900 px" */
  hint?: string;
  /** Controls aspect ratio, background, border, and rounded — caller sets these */
  className?: string;
  /** Icon + text colour override for dark-background hero slots */
  onDark?: boolean;
}

export function ImageSlot({
  src,
  alt = "",
  hint,
  className = "aspect-[4/3] rounded-2xl",
  onDark = false,
}: ImageSlotProps) {
  if (src) {
    return (
      <div className={`relative overflow-hidden ${className}`}>
        <Image src={src} alt={alt} fill className="object-cover" />
      </div>
    );
  }

  const iconColour = onDark
    ? "text-white/40"
    : "text-gray-400 dark:text-gray-600";
  const textColour = onDark
    ? "text-white/30"
    : "text-gray-400 dark:text-gray-600";

  return (
    <div className={`relative flex flex-col items-center justify-center gap-3 overflow-hidden ${className}`}>
      <ImageIcon className={`h-10 w-10 ${iconColour}`} strokeWidth={1.5} />
      {hint && (
        <span className={`text-xs font-medium tracking-wide ${textColour}`}>
          {hint}
        </span>
      )}
    </div>
  );
}
