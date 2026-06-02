export default function AdminDashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: "Total Orders", value: "—", color: "bg-blue-50 text-blue-700" },
          { label: "Active Bookings", value: "—", color: "bg-green-50 text-green-700" },
          { label: "Products", value: "—", color: "bg-purple-50 text-purple-700" },
          { label: "Technicians", value: "—", color: "bg-orange-50 text-orange-700" },
        ].map((stat) => (
          <div
            key={stat.label}
            className={`rounded-xl p-5 ${stat.color} border border-current/10`}
          >
            <p className="text-sm font-medium opacity-70">{stat.label}</p>
            <p className="text-3xl font-bold mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      <p className="mt-10 text-sm text-gray-400">
        Dashboard widgets will be populated as data is added.
      </p>
    </div>
  );
}
