import type { ReactNode } from "react";

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  let tone = "";
  if (["COMPLETED", "ACCEPTED"].includes(status)) tone = "status-success";
  else if (["REQUESTED", "PENDING", "CONFIRMED", "SCHEDULED"].includes(status)) tone = "status-warning";
  else if (["CANCELED", "DECLINED"].includes(status)) tone = "status-danger";
  else if (["IN_PROGRESS", "FOUND", "ON_THE_WAY", "ON_SITE"].includes(status)) tone = "status-blue";
  return <span className={`status-pill ${tone}`}>{label ?? status.replaceAll("_", " ")}</span>;
}

export function EmptyState({ icon, title, description, action }: { icon: ReactNode; title: string; description: string; action?: ReactNode }) {
  return <div className="empty-state"><div className="empty-icon">{icon}</div><h3>{title}</h3><p>{description}</p>{action}</div>;
}

export function PageSkeleton({ cards = 3 }: { cards?: number }) {
  return <div aria-label="Carregando conteúdo" role="status"><div className="skeleton skeleton-line" style={{ width: "38%", height: 30, marginBottom: 22 }} /><div className="stat-grid" style={{ gridTemplateColumns: `repeat(${Math.min(cards, 3)}, minmax(0, 1fr))` }}>{Array.from({ length: cards }, (_, index) => <div className="skeleton skeleton-box" key={index} />)}</div><span className="sr-only">Carregando…</span></div>;
}
