export default function Loading() {
  return (
    <div className="container-x grid gap-8 py-12 md:grid-cols-[260px_1fr]">
      <div className="skeleton mx-auto aspect-[2/3] w-48 md:w-full" />
      <div className="space-y-4">
        <div className="skeleton h-4 w-20" />
        <div className="skeleton h-10 w-2/3" />
        <div className="skeleton h-4 w-1/3" />
        <div className="skeleton h-16 w-full max-w-md" />
        <div className="skeleton h-24 w-full max-w-3xl" />
        <div className="skeleton h-10 w-full max-w-xl" />
      </div>
    </div>
  );
}
