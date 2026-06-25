"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, ShoppingBag, CalendarCheck, Check } from "lucide-react";
import { formatPrice } from "@/lib/helpers/price";
import type { AdminNotification } from "@/lib/queries/admin";

const SEEN_KEY = "admin-notif-seen";

const SERVICE_LABELS: Record<string, string> = {
  cleaning: "Cleaning",
  repair: "Repair",
  installation: "Installation",
  inspection: "Inspection",
};

function timeLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function NotificationBell({ items }: { items: AdminNotification[] }) {
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState<Set<string>>(new Set());
  const ref = useRef<HTMLDivElement>(null);

  // Load read state once mounted (kept out of SSR to avoid hydration drift).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SEEN_KEY);
      if (raw) setSeen(new Set(JSON.parse(raw) as string[]));
    } catch {
      /* ignore */
    }
  }, []);

  // Close on outside click.
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const persist = (next: Set<string>) => {
    setSeen(next);
    try {
      localStorage.setItem(SEEN_KEY, JSON.stringify([...next]));
    } catch {
      /* ignore */
    }
  };

  const markSeen = (id: string) => {
    if (seen.has(id)) return;
    persist(new Set(seen).add(id));
  };

  const markAll = () => persist(new Set(items.map((i) => i.id)));

  const unreadCount = items.reduce((n, i) => (seen.has(i.id) ? n : n + 1), 0);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        aria-label="Notifications"
        aria-expanded={open}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 sm:w-96 rounded-xl border border-gray-200 bg-white shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between gap-2 border-b border-gray-100 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-gray-900">Today&apos;s activity</p>
              <p className="text-xs text-gray-400">
                {items.length} {items.length === 1 ? "submission" : "submissions"} today
              </p>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAll}
                className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline"
              >
                <Check className="h-3.5 w-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* Scrollable list — bounded height so it never grows unbounded */}
          <div className="max-h-[24rem] overflow-y-auto p-2">
            {items.length === 0 ? (
              <div className="px-3 py-10 text-center">
                <Bell className="mx-auto mb-2 h-7 w-7 text-gray-300" />
                <p className="text-sm text-gray-400">No new bookings or orders today</p>
              </div>
            ) : (
              <ul className="flex flex-col gap-1.5">
                {items.map((item) => {
                  const isUnread = !seen.has(item.id);
                  const isOrder = item.kind === "order";
                  return (
                    <li key={`${item.kind}-${item.id}`}>
                      <Link
                        href={item.href}
                        onClick={() => {
                          markSeen(item.id);
                          setOpen(false);
                        }}
                        className={`flex items-start gap-3 rounded-lg border px-3 py-2.5 transition-colors ${
                          isUnread
                            ? "border-blue-200 bg-blue-50/70 hover:bg-blue-50"
                            : "border-transparent hover:bg-gray-50"
                        }`}
                      >
                        <span
                          className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                            isOrder ? "bg-blue-100 text-blue-600" : "bg-green-100 text-green-600"
                          }`}
                        >
                          {isOrder ? (
                            <ShoppingBag className="h-4 w-4" />
                          ) : (
                            <CalendarCheck className="h-4 w-4" />
                          )}
                        </span>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <p className="truncate text-sm font-medium text-gray-900">
                              {item.customerName}
                            </p>
                            {isUnread && (
                              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                            )}
                          </div>
                          <p className="truncate text-xs text-gray-500">
                            {isOrder ? "New order" : `Booking · ${SERVICE_LABELS[item.serviceType ?? ""] ?? item.serviceType}`}
                            {" · "}
                            {timeLabel(item.createdAt)}
                          </p>
                        </div>

                        <div className="shrink-0 text-right">
                          {isOrder && item.totalInSatang != null && (
                            <p className="text-sm font-semibold text-gray-900">
                              {formatPrice(item.totalInSatang)}
                            </p>
                          )}
                          <p className="text-[10px] font-mono text-gray-400">
                            {item.number.slice(-6)}
                          </p>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
