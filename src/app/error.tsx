"use client";

import { AlertCircle, RotateCcw } from "lucide-react";
import Link from "next/link";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="screen-loader" role="alert"><section className="card card-pad" style={{ width: "min(100% - 32px, 480px)", textAlign: "center" }}><div className="empty-icon" style={{ marginInline: "auto", color: "var(--danger)", background: "var(--danger-bg)" }}><AlertCircle size={25} /></div><h1 style={{ margin: "12px 0 5px", color: "var(--navy)", fontSize: 24 }}>Não foi possível carregar esta página.</h1><p style={{ color: "var(--muted)" }}>Tente novamente. Se o problema continuar, volte ao início.</p><div style={{ display: "flex", justifyContent: "center", gap: 9, flexWrap: "wrap" }}><button className="button button-primary" onClick={reset} type="button"><RotateCcw size={16} /> Tentar novamente</button><Link className="button button-outline" href="/">Voltar ao início</Link></div></section></main>;
}
