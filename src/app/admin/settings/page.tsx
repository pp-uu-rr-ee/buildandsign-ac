import { Settings } from "lucide-react";

export const metadata = { title: "Settings | Admin" };

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Configure your platform settings.</p>
      </div>

      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 py-20 text-center">
        <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <Settings className="h-6 w-6 text-gray-400" />
        </div>
        <h2 className="text-lg font-semibold text-gray-700 mb-1">Coming Soon</h2>
        <p className="text-sm text-gray-400 max-w-sm">
          Platform settings — business info, notification preferences, and payment configuration — will be available in a future update.
        </p>
      </div>
    </div>
  );
}
