import { HeroSkeleton, RowSkeleton } from "@/components/Skeletons";

export default function Loading() {
  return (
    <>
      <HeroSkeleton />
      <RowSkeleton rows={3} />
    </>
  );
}
