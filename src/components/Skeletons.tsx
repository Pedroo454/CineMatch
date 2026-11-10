export function RowSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="container-x py-5">
          <div className="skeleton mb-4 h-6 w-56" />
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="w-36 shrink-0 sm:w-44">
                <div className="skeleton aspect-[2/3] w-full" />
                <div className="skeleton mt-2 h-4 w-3/4" />
                <div className="skeleton mt-1.5 h-3 w-1/2" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}

export function GridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>
          <div className="skeleton aspect-[2/3] w-full" />
          <div className="skeleton mt-2 h-4 w-3/4" />
        </div>
      ))}
    </div>
  );
}

export function HeroSkeleton() {
  return <div className="skeleton h-[52vh] w-full rounded-none sm:h-[62vh]" />;
}
