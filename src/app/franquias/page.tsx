import type { Metadata } from "next";
import FranchiseRow from "@/components/FranchiseRow";
import { hasTmdb } from "@/lib/tmdb";
import SetupNotice, { missingEnv } from "@/components/SetupNotice";

export const metadata: Metadata = { title: "Franquias e sagas" };

export default function Franquias() {
  if (!hasTmdb()) return <SetupNotice missing={missingEnv()} />;
  return (
    <div className="pt-8">
      <div className="container-x">
        <h1 className="font-display text-3xl font-semibold text-white">Franquias e sagas</h1>
        <p className="mt-1 text-sm text-neutral-400">Todas as produções de cada saga, na ordem de lançamento.</p>
      </div>
      <FranchiseRow title="Sagas" />
    </div>
  );
}
