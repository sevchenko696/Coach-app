export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-gray-50 animate-pulse">
      {/* Header skeleton */}
      <div className="bg-white border-b border-gray-100 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gray-200" />
            <div className="w-20 h-4 rounded bg-gray-200" />
          </div>
          <div className="w-6 h-6 rounded bg-gray-200" />
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        {/* Batch card skeleton */}
        <div className="bg-gray-200 rounded-2xl h-36" />

        {/* Session card skeleton */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="w-32 h-4 rounded bg-gray-200 mb-3" />
          <div className="w-full h-12 rounded-xl bg-gray-200" />
        </div>

        {/* Content list skeleton */}
        <div>
          <div className="w-36 h-4 rounded bg-gray-200 mb-3" />
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-gray-200" />
                <div className="flex-1 space-y-1.5">
                  <div className="w-24 h-3 rounded bg-gray-200" />
                  <div className="w-40 h-2.5 rounded bg-gray-200" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
