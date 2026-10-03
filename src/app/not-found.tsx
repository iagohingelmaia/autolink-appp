import { ArrowLeft, SearchX } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return <main className="screen-loader"><section className="card card-pad" style={{ width: "min(100% - 32px, 480px)", textAlign: "center" }}><div className="empty-icon" style={{ marginInline: "auto" }}><SearchX size={25} /></div><h1 style={{ margin: "12px 0 5px", color: "var(--navy)", fontSize: 25 }}>Não encontramos esta página.</h1><p style={{ color: "var(--muted)" }}>Confira o endereço ou volte para a área inicial.</p><Link className="button button-primary" href="/app/home"><ArrowLeft size={16} /> Ir para o início</Link></section></main>;
}
