"use client";

import { useState, useEffect, useRef } from "react";
import { Phone, X, MessageCircleMore } from "lucide-react";
import { siteConfig } from "@/config/site";

function LineIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
      <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.07 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

const contacts = [
  {
    id: "facebook",
    label: "Facebook",
    href: siteConfig.social.facebook,
    bg: "bg-[#1877F2] hover:bg-[#1565d8]",
    icon: <FacebookIcon />,
  },
  {
    id: "line",
    label: "Line",
    href: siteConfig.social.line,
    bg: "bg-[#06C755] hover:bg-[#05a848]",
    icon: <LineIcon />,
  },
  {
    id: "phone2",
    label: siteConfig.phone2,
    href: `tel:${siteConfig.phone2}`,
    bg: "bg-emerald-600 hover:bg-emerald-700",
    icon: <Phone className="h-5 w-5" />,
  },
  {
    id: "phone1",
    label: siteConfig.phone,
    href: `tel:${siteConfig.phone}`,
    bg: "bg-green-500 hover:bg-green-600",
    icon: <Phone className="h-5 w-5" />,
  },
] as const;

export function FloatingContact() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div
      ref={ref}
      className="fixed bottom-6 right-5 z-50 flex flex-col items-end gap-3 pointer-events-none"
    >
      {/* Contact buttons */}
      {contacts.map((item, i) => (
        <div
          key={item.id}
          className={`flex items-center gap-3 transition-all duration-300 ${
            open
              ? "opacity-100 translate-y-0 pointer-events-auto"
              : "opacity-0 translate-y-6 pointer-events-none"
          }`}
          style={{
            transitionDelay: open ? `${i * 60}ms` : `${(contacts.length - 1 - i) * 40}ms`,
          }}
        >
          {/* Label pill */}
          <span className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-gray-800 shadow-md whitespace-nowrap dark:bg-gray-800 dark:text-gray-100">
            {item.label}
          </span>

          {/* Icon button */}
          <a
            href={item.href}
            target={item.id === "facebook" || item.id === "line" ? "_blank" : undefined}
            rel={item.id === "facebook" || item.id === "line" ? "noopener noreferrer" : undefined}
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-white shadow-lg transition-transform duration-150 active:scale-95 ${item.bg}`}
            aria-label={item.label}
            onClick={() => setOpen(false)}
          >
            {item.icon}
          </a>
        </div>
      ))}

      {/* Toggle button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-xl transition-all duration-300 hover:bg-blue-700 active:scale-95"
        aria-label={open ? "ปิดเมนูติดต่อ" : "ติดต่อเรา"}
      >
        <span
          className={`absolute transition-all duration-300 ${open ? "opacity-100 rotate-0 scale-100" : "opacity-0 rotate-90 scale-75"}`}
        >
          <X className="h-6 w-6" />
        </span>
        <span
          className={`absolute transition-all duration-300 ${open ? "opacity-0 -rotate-90 scale-75" : "opacity-100 rotate-0 scale-100"}`}
        >
          <MessageCircleMore className="h-6 w-6" />
        </span>
      </button>
    </div>
  );
}
