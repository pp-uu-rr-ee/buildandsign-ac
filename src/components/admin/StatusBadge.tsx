const orderColors: Record<string, string> = {
  pending:    "bg-yellow-100 text-yellow-800",
  confirmed:  "bg-blue-100 text-blue-800",
  processing: "bg-indigo-100 text-indigo-800",
  shipped:    "bg-purple-100 text-purple-800",
  delivered:  "bg-green-100 text-green-800",
  cancelled:  "bg-red-100 text-red-800",
  refunded:   "bg-gray-100 text-gray-600",
};

const bookingColors: Record<string, string> = {
  pending:     "bg-yellow-100 text-yellow-800",
  confirmed:   "bg-blue-100 text-blue-800",
  in_progress: "bg-indigo-100 text-indigo-800",
  completed:   "bg-green-100 text-green-800",
  cancelled:   "bg-red-100 text-red-800",
  no_show:     "bg-gray-100 text-gray-600",
};

type Props = { status: string; type?: "order" | "booking" };

export function StatusBadge({ status, type = "order" }: Props) {
  const map = type === "booking" ? bookingColors : orderColors;
  const cls = map[status] ?? "bg-gray-100 text-gray-600";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${cls}`}>
      {status.replace("_", " ")}
    </span>
  );
}
