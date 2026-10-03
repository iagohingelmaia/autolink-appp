"use client";

import { ArrowLeft, Check, Clock3, Copy, MapPin, MessageCircle, Star, Wrench } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

type Service = { id: string; name: string; description: string; priceFrom: number; durationMinutes: number };
type Workshop = { id: string; name: string; description: string; address: string; city: string; state: string; phone: string | null; rating: number; reviewCount: number; distanceKm: number; isOpen: boolean; isDemo: boolean; services: Service[]; reviews: { id: string; rating: number; comment: string; customerName: string }[] };

export function WorkshopDetails({ workshop }: { workshop: Workshop }) {
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/saved-workshops").then(async (response) => {
      if (!response.ok) return;
      const result = (await response.json()) as { saved?: { workshopId: string }[] };
      if (active) setSaved(Boolean(result.saved?.some((item) => item.workshopId === workshop.id)));
    }).catch(() => undefined);
    return () => { active = false; };
  }, [workshop.id]);

  async function toggleSaved() {
    const previous = saved;
    setSaved(!previous);
    setSaving(true);
    setNotice("");
    try {
      const response = await fetch("/api/saved-workshops", {
        method: previous ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workshopId: workshop.id }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) { setSaved(previous); setNotice(result.error ?? "Não foi possível salvar a oficina."); }
      else setNotice(previous ? "Oficina removida dos salvos." : "Oficina salva para você consultar depois.");
    } catch { setSaved(previous); setNotice("Não foi possível conectar. Tente novamente."); }
    finally { setSaving(false); window.setTimeout(() => setNotice(""), 3500); }
  }

  async function copyAddress() {
    const address = `${workshop.address}, ${workshop.city} - ${workshop.state}`;
    try { await navigator.clipboard.writeText(address); setCopied(true); setNotice("Endereço copiado."); }
    catch { setNotice(address); }
    window.setTimeout(() => { setCopied(false); setNotice(""); }, 3000);
  }

  return <>
    <div className="page-heading"><div><Link href="/app/workshops" className="text-link" style={{ marginBottom: 12 }}><ArrowLeft size={16} /> Voltar para oficinas</Link><h1>{workshop.name}</h1><p>{workshop.description}</p></div></div>
    <div className="note note-warning" style={{ marginBottom: 18 }}><MapPin size={17} /><span>Esta oficina e seus dados são demonstrativos. Não há contato externo nem mapa ativo nesta versão.</span></div>
    <section className="card card-pad" style={{ marginBottom: 17 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 15, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 15 }}><div className="workshop-avatar" style={{ width: 60, height: 60 }}><Wrench size={28} /></div><div><div className="rating" style={{ fontSize: 15 }}><Star size={17} /> {Number(workshop.rating).toFixed(1)} <span style={{ color: "var(--muted)", fontWeight: 500 }}>· {workshop.reviewCount} avaliações de demonstração</span></div><p style={{ margin: "4px 0 0", color: "var(--muted)", fontSize: 14 }}>{workshop.address} · {workshop.city} - {workshop.state}</p><span className={`open-label${workshop.isOpen ? "" : " closed"}`} style={{ marginTop: 7 }}><span className="eyebrow-dot" style={{ width: 7, height: 7, background: workshop.isOpen ? "#218739" : "#929ba3" }} />{workshop.isOpen ? "Aberta hoje" : "Fechada agora"}</span></div></div>
        <div className="heading-actions"><button className="button button-outline button-small" type="button" onClick={toggleSaved} disabled={saving}>{saving ? "Salvando..." : <><Star size={16} fill={saved ? "currentColor" : "none"} /> {saved ? "Oficina salva" : "Salvar oficina"}</>}</button><button className="button button-outline button-small" type="button" onClick={copyAddress}>{copied ? <Check size={16} /> : <Copy size={16} />} Copiar endereço</button></div>
      </div>
      <div className="note" style={{ marginTop: 16 }}><Clock3 size={17} /><span>Distância aproximada de demonstração: {Number(workshop.distanceKm).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} km. O endereço deve ser conferido diretamente pelo cliente.</span></div>
      {notice && <p className="field-hint" role="status" style={{ margin: "12px 0 0" }}>{notice}</p>}
    </section>
    <div className="dashboard-grid">
      <section className="card card-pad"><h2 className="card-title">Serviços oferecidos</h2>{workshop.services.length ? <div className="list-stack">{workshop.services.map((service) => <div className="list-row" key={service.id}><div className="list-icon"><Wrench size={18} /></div><div className="list-row-copy"><strong>{service.name}</strong><span>{service.description || "Atendimento com orçamento feito pela oficina."}</span></div><span style={{ color: "var(--muted)", fontSize: 12, whiteSpace: "nowrap" }}>Valor sob consulta</span></div>)}</div> : <p className="field-hint">Esta oficina ainda não cadastrou seus serviços.</p>}</section>
      <section className="card card-pad"><h2 className="card-title">Atendimento</h2><p style={{ margin: "0 0 14px", color: "var(--muted)", fontSize: 14 }}>Envie seu pedido para a oficina. Ela poderá responder e enviar um orçamento pela AutoLink.</p><Link href={`/app/request?workshop=${workshop.id}`} className="button button-primary button-wide">Solicitar atendimento <Wrench size={17} /></Link><button className="button button-outline button-wide" type="button" style={{ marginTop: 9 }} onClick={() => setNotice("Contato externo não está configurado para as oficinas de demonstração.")}><MessageCircle size={17} /> Entrar em contato</button><button className="button button-ghost button-wide" type="button" style={{ marginTop: 7 }} onClick={copyAddress}><MapPin size={17} /> Ver endereço</button></section>
    </div>
  </>;
}
