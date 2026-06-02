export default function GlobalLoading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
      <div className="h-10 w-10 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
    </div>
  );
}
