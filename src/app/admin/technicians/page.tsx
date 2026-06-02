import { getAdminTechnicians } from "@/lib/queries/admin";

export const metadata = { title: "Technicians | Admin" };

const STATUS_COLORS: Record<string, string> = {
  active:   "bg-green-100 text-green-700",
  inactive: "bg-gray-100 text-gray-600",
  on_leave: "bg-yellow-100 text-yellow-700",
};

export default async function AdminTechniciansPage() {
  const technicians = await getAdminTechnicians();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          Technicians <span className="text-gray-400 font-normal text-lg">({technicians.length})</span>
        </h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {technicians.length === 0 ? (
          <p className="text-gray-400 text-sm col-span-3">No technicians yet.</p>
        ) : technicians.map((t) => {
          const specs = (t.specializations as string[]) ?? [];
          const rating = t.totalRatings > 0 ? (t.averageRating / 10).toFixed(1) : "—";
          return (
            <div key={t.id} className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {t.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{t.name}</p>
                    <p className="text-xs text-gray-500">{t.email}</p>
                  </div>
                </div>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[t.status] ?? "bg-gray-100"}`}>
                  {t.status.replace("_"," ")}
                </span>
              </div>

              {/* Phone */}
              {t.phone && <p className="text-sm text-gray-600">{t.phone}</p>}

              {/* Specializations */}
              <div>
                <p className="text-xs text-gray-400 mb-1.5">Specializations</p>
                <div className="flex flex-wrap gap-1">
                  {specs.map((s) => (
                    <span key={s} className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs capitalize">{s}</span>
                  ))}
                </div>
              </div>

              {/* Rating */}
              <div className="flex items-center justify-between text-sm border-t border-gray-100 pt-3">
                <span className="text-gray-400 text-xs">Rating</span>
                <span className="font-semibold text-gray-900">
                  {rating !== "—" ? `⭐ ${rating}` : "—"}{" "}
                  {t.totalRatings > 0 && <span className="text-xs text-gray-400">({t.totalRatings})</span>}
                </span>
              </div>

              {/* Joined */}
              <p className="text-xs text-gray-400">
                Joined {new Date(t.createdAt).toLocaleDateString("en-PH", { month: "short", year: "numeric" })}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
