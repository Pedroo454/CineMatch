import { GridSkeleton } from "@/components/Skeletons";

export default function Loading() {
  return (
    <div className="container-x py-8">
      <div className="skeleton mb-5 h-9 w-64" />
      <div className="skeleton mb-6 h-32 w-full" />
      <GridSkeleton />
    </div>
  );
}
