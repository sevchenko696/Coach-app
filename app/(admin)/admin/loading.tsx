export default function AdminLoading() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-4 animate-pulse">
      <div className="flex gap-3">
        <div className="bg-white rounded-lg border border-gray-100 h-9 w-24" />
        <div className="bg-white rounded-lg border border-gray-100 h-9 w-32" />
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-100" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-gray-100 rounded w-1/3" />
              <div className="h-2 bg-gray-50 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
