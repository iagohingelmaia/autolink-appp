"use client";

import { ArrowRight, CheckCircle2, PackageSearch, Wrench } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

type Vehicle = { id: string; make: string; model: string; year: number };
type Workshop = { id: string; name: string; city: string };

export function PartInquiry({ vehicles, workshops }: { vehicles: Vehicle[]; workshops: Workshop[] }) {
  const [vehicleId, setVehicleId] = useState(vehicles[0]?.id ?? "");
  const [workshopId, setWorkshopId] = useState("");
  const [part, setPart] = useState("");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [protocol, setProtocol] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!vehicleId || !workshopId || part.trim().length < 2) { setError("Escolha o veículo, a oficina e informe qual peça procura."); return; }
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/service-requests", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ vehicleId, workshopId, serviceType: "Consulta de peça", description: `Peça desejada: ${part.trim()}.${details.trim() ? ` Detalhes: ${details.trim()}` : ""}`, attachments: [] }) });
      const result = (await response.json()) as { request?: { protocol: string }; error?: string };
      if (!response.ok || !result.request) { setError(result.error ?? "Não foi possível enviar a consulta."); return; }
      setProtocol(result.request.protocol);
    } catch { setError("Não foi possível conectar. Tente novamente."); }
    finally { setBusy(false); }
  }

  if (protocol) return <div className="card confirmation"><div className="confirmation-icon"><CheckCircle2 size={32} /></div><h2>Consulta enviada!</h2><p>A oficina receberá seu pedido e poderá informar disponibilidade e orçamento pela AutoLink.</p><div className="protocol-box">Protocolo {protocol}</div><div style={{ display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap", marginTop: 20 }}><Link className="button button-primary" href="/app/services">Acompanhar consulta <ArrowRight size={16} /></Link><Link className="button button-outline" href="/app/home">Voltar ao início</Link></div></div>;

  return <div className="dashboard-grid">
    <form className="card card-pad form-stack" onSubmit={submit}><h2 className="card-title" style={{ marginBottom: 0 }}>O que você precisa?</h2><p className="field-hint" style={{ margin: "-10px 0 0" }}>Descreva a peça e uma oficina verificará a disponibilidade.</p><div className="field"><label htmlFor="part-vehicle">Seu veículo</label><select id="part-vehicle" value={vehicleId} onChange={(event) => setVehicleId(event.target.value)}><option value="">Escolha um veículo</option>{vehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.make} {vehicle.model} {vehicle.year}</option>)}</select></div><div className="field"><label htmlFor="part-name">Nome da peça</label><input id="part-name" value={part} onChange={(event) => setPart(event.target.value)} maxLength={100} required placeholder="Ex.: pastilha de freio dianteira" /></div><div className="field"><label htmlFor="part-details">Mais detalhes <span style={{ color: "#79848d", fontWeight: 450 }}>(opcional)</span></label><textarea id="part-details" value={details} onChange={(event) => setDetails(event.target.value)} maxLength={700} placeholder="Ano, versão, código da peça ou qualquer detalhe útil." /></div><div className="field"><label htmlFor="part-workshop">Oficina para consultar</label><select id="part-workshop" value={workshopId} onChange={(event) => setWorkshopId(event.target.value)}><option value="">Escolha uma oficina</option>{workshops.map((workshop) => <option key={workshop.id} value={workshop.id}>{workshop.name} · {workshop.city}</option>)}</select></div>{error && <p className="inline-error" role="alert">{error}</p>}<button className="button button-primary" type="submit" disabled={busy || !vehicles.length || !workshops.length}>{busy ? "Enviando consulta..." : <>Consultar disponibilidade <ArrowRight size={17} /></>}</button></form>
    <div style={{ display: "grid", gap: 15, alignContent: "start" }}><section className="card card-pad"><div className="empty-icon"><PackageSearch size={26} /></div><h2 style={{ margin: "12px 0 7px", color: "var(--navy)", fontSize: 19 }}>Sem surpresa, sem estoque inventado.</h2><p style={{ margin: 0, color: "var(--muted)", fontSize: 14 }}>A AutoLink ainda não tem catálogo ou estoque integrado. Sua consulta será enviada à oficina escolhida, que poderá responder pela plataforma.</p></section><section className="card card-pad"><h2 className="card-title">Como funciona</h2><div className="list-stack"><div className="list-row"><div className="list-icon">1</div><div className="list-row-copy"><strong>Descreva a peça</strong><span>Inclua o modelo do carro e detalhes que souber.</span></div></div><div className="list-row"><div className="list-icon">2</div><div className="list-row-copy"><strong>Escolha uma oficina</strong><span>O pedido chega ao painel do prestador.</span></div></div><div className="list-row"><div className="list-icon"><Wrench size={18} /></div><div className="list-row-copy"><strong>Acompanhe a resposta</strong><span>A disponibilidade e o orçamento são confirmados pela oficina.</span></div></div></div></section></div>
  </div>;
}
