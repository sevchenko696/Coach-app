export default function AdminDashboardLoading() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6 animate-pulse">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 h-24" />
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 p-5 h-48" />
      <div className="bg-white rounded-2xl border border-gray-100 p-5 h-36" />
    </div>
  )
}
