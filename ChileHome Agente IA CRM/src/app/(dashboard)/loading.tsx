export default function Loading() {
  return (
    <div className="flex flex-col gap-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-end justify-between">
        <div className="flex flex-col gap-2">
          <div className="h-3 w-32 rounded-lg" style={{ background: "rgba(255,255,255,0.55)" }} />
          <div className="h-10 w-72 rounded-xl" style={{ background: "rgba(255,255,255,0.6)" }} />
        </div>
        <div className="flex gap-3">
          <div className="h-9 w-28 rounded-xl" style={{ background: "rgba(255,255,255,0.5)" }} />
          <div className="h-9 w-28 rounded-xl" style={{ background: "rgba(255,255,255,0.5)" }} />
        </div>
      </div>

      {/* Progress pills skeleton */}
      <div className="flex items-center gap-3 flex-wrap">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-10 rounded-full"
            style={{ width: `${140 + i * 20}px`, background: "rgba(255,255,255,0.55)" }}
          />
        ))}
      </div>

      {/* KPI cards skeleton */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-32 rounded-2xl"
            style={{ background: "rgba(255,255,255,0.6)" }}
          />
        ))}
      </div>

      {/* Main grid skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <div
          className="lg:col-span-1 h-52 rounded-2xl"
          style={{ background: "rgba(255,255,255,0.5)" }}
        />
        <div
          className="lg:col-span-3 h-52 rounded-2xl"
          style={{ background: "rgba(255,255,255,0.6)" }}
        />
        <div
          className="lg:col-span-1 h-52 rounded-2xl"
          style={{ background: "rgba(255,255,255,0.5)" }}
        />
      </div>

      {/* Table skeleton */}
      <div
        className="h-64 rounded-2xl"
        style={{ background: "rgba(255,255,255,0.6)" }}
      />
    </div>
  );
}
