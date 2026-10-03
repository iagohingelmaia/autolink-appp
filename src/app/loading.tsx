import { BrandMark } from "@/components/brand";

export default function Loading() {
  return <main className="screen-loader" aria-live="polite" aria-busy="true"><div style={{ display: "grid", justifyItems: "center", gap: 16 }}><BrandMark /><span className="loading-ring" aria-hidden="true" /><span>Carregando a AutoLink...</span></div></main>;
}
