import { PageSkeleton } from "@/components/ui";

export default function CustomerLoading() {
  return <div aria-live="polite" aria-busy="true"><PageSkeleton cards={3} /><span style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clipPath: "inset(50%)" }}>Carregando seus dados...</span></div>;
}
