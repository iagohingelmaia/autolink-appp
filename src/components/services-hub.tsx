"use client";

import { AlertCircle, ArrowRight, Check, Clock3, FileText, History, Pencil, Plus, ReceiptText, Trash2, Truck, Wrench, X } from "lucide-react";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { EmptyState, StatusBadge } from "@/components/ui";
import { formatCurrency, formatDate, statusLabel } from "@/lib/format";

type Vehicle = { id: string; make: string; model: string; year: number } | null;
type Workshop = { id: string; name: string; address: string; city: string } | null;
type ServiceRequest = { id: string; protocol: string; serviceType: string; description: string; status: string; preferredAt: Date | string | null; createdAt: Date | string; vehicle: Vehicle; workshop: Workshop };
type Quote = { id: string; description: string; totalPriceInCents: number; status: string; createdAt: Date | string; request: { serviceType: string; protocol: string }; workshop: { name: string } };
type Tow = { id: string; protocol: string; location: string; problem: string; status: string; createdAt: Date | string; vehicle: Vehicle };
type Diagnostic = { id: string; symptom: string; attentionLevel: string; possibleCauses: string[]; recommendation: string; createdAt: Date | string };
type Tab = "active" | "requests" | "history" | "quotes";

const symptomNames: Record<string, string> = { noise: "Motor fazendo barulho", shaking: "Carro tremendo", dashboard: "Luz acesa no painel", overheating: "Carro esquentando", starting: "Problema para ligar", wheels: "Problema nas rodas ou freios", other: "Outro problema" };

function dateTimeLocal(date: Date | string | null) {
  if (!date) return "";
  const value = new Date(date);
  if (Number.isNaN(value.getTime())) return "";
  return new Date(value.getTime() - value.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

export function ServicesHub({ initialRequests, initialQuotes, initialTows, initialDiagnostics, initialTab = "active" }: { initialRequests: ServiceRequest[]; initialQuotes: Quote[]; initialTows: Tow[]; initialDiagnostics: Diagnostic[]; initialTab?: Tab }) {
  const [requests, setRequests] = useState(initialRequests);
  const [quotes, setQuotes] = useState(initialQuotes);
  const [tows, setTows] = useState(initialTows);
  const [tab, setTab] = useState<Tab>(initialTab);
  const [editing, setEditing] = useState<ServiceRequest | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [toast, setToast] = useState("");

  function notify(message: string) { setToast(message); window.setTimeout(() => setToast(""), 3300); }

  async function deleteRequest(item: ServiceRequest) {
    if (!window.confirm(`Cancelar e remover o pedido “${item.serviceType}”?`)) return;
    const previous = requests;
    setRequests((current) => current.filter((request) => request.id !== item.id));
    setBusy(item.id);
    try {
      const response = await fetch(`/api/service-requests/${item.id}`, { method: "DELETE" });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) { setRequests(previous); notify(result.error ?? "Não foi possível cancelar o pedido."); }
      else notify("Solicitação cancelada.");
    } catch { setRequests(previous); notify("Falha de conexão. O pedido continua ativo."); }
    finally { setBusy(""); }
  }

  async function saveRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    const form = new FormData(event.currentTarget);
    const body = { serviceType: String(form.get("serviceType") ?? "").trim(), description: String(form.get("description") ?? "").trim(), preferredAt: String(form.get("preferredAt") ?? "") ? new Date(String(form.get("preferredAt"))).toISOString() : null };
    const old = requests;
    const optimistic = requests.map((item) => item.id === editing.id ? { ...item, ...body, preferredAt: body.preferredAt } : item);
    setRequests(optimistic);
    setBusy(editing.id);
    setError("");
    try {
      const response = await fetch(`/api/service-requests/${editing.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const result = (await response.json()) as { request?: ServiceRequest; error?: string };
      if (!response.ok || !result.request) { setRequests(old); setError(result.error ?? "Não foi possível atualizar."); return; }
      setRequests((current) => current.map((item) => item.id === editing.id ? { ...item, ...result.request! } : item));
      setEditing(null);
      notify("Solicitação atualizada.");
    } catch { setRequests(old); setError("Não foi possível conectar. Tente novamente."); }
    finally { setBusy(""); }
  }

  async function answerQuote(quote: Quote, status: "ACCEPTED" | "DECLINED") {
    const previous = quotes;
    setQuotes((current) => current.map((item) => item.id === quote.id ? { ...item, status } : item));
    setBusy(quote.id);
    try {
      const response = await fetch(`/api/quotes/${quote.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) { setQuotes(previous); notify(result.error ?? "Não foi possível responder ao orçamento."); }
      else {
        if (status === "ACCEPTED") setRequests((current) => current.map((request) => request.protocol === quote.request.protocol ? { ...request, status: "CONFIRMED" } : request));
        notify(status === "ACCEPTED" ? "Orçamento aceito. O serviço foi agendado." : "Você recusou o orçamento.");
      }
    } catch { setQuotes(previous); notify("Não foi possível conectar. Tente novamente."); }
    finally { setBusy(""); }
  }

  async function cancelTow(tow: Tow) {
    if (!window.confirm("Cancelar este pedido de guincho?")) return;
    const previous = tows;
    setTows((current) => current.filter((item) => item.id !== tow.id));
    try {
      const response = await fetch(`/api/tow/${tow.id}`, { method: "DELETE" });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) { setTows(previous); notify(result.error ?? "Este pedido não pode ser cancelado."); }
      else notify("Pedido de guincho cancelado.");
    } catch { setTows(previous); notify("Não foi possível conectar. O pedido continua ativo."); }
  }

  const activeRequests = requests.filter((item) => ["CONFIRMED", "SCHEDULED", "IN_PROGRESS"].includes(item.status));
  const pendingRequests = requests.filter((item) => item.status === "REQUESTED");
  const historyRequests = requests.filter((item) => ["COMPLETED", "CANCELED"].includes(item.status));
  const activeTows = tows.filter((item) => !["COMPLETED", "CANCELED"].includes(item.status));
  const historyTows = tows.filter((item) => ["COMPLETED", "CANCELED"].includes(item.status));

  function renderRequest(item: ServiceRequest) {
    return <article className="card card-pad" key={item.id} style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}><div style={{ display: "flex", gap: 12, alignItems: "center" }}><div className="list-icon"><Wrench size={20} /></div><div><strong style={{ color: "var(--navy)" }}>{item.serviceType}</strong><span style={{ display: "block", color: "var(--muted)", fontSize: 13 }}>{item.workshop?.name ?? "Oficina a definir"}</span></div></div><StatusBadge status={item.status} label={statusLabel(item.status)} /></div>
      <div className="workshop-meta" style={{ margin: "14px 0 7px" }}><span>{item.vehicle ? `${item.vehicle.make} ${item.vehicle.model} ${item.vehicle.year}` : "Veículo não informado"}</span><span>Solicitado em {formatDate(item.createdAt)}</span><span>Protocolo {item.protocol}</span></div>
      <p style={{ margin: 0, color: "#52606c", fontSize: 14 }}>{item.description}</p>
      {item.preferredAt && <p style={{ margin: "8px 0 0", color: "var(--muted)", fontSize: 13 }}>Data preferida: {formatDate(item.preferredAt, { dateStyle: "medium", timeStyle: "short" })}</p>}
      {item.status === "REQUESTED" && <div className="card-actions" style={{ marginTop: 14 }}><button className="button button-outline button-small" type="button" onClick={() => { setError(""); setEditing(item); }}><Pencil size={15} /> Editar pedido</button><button className="button button-ghost button-small" type="button" onClick={() => deleteRequest(item)} disabled={busy === item.id}><X size={15} /> Cancelar</button></div>}
    </article>;
  }

  return <>
    <div className="page-heading"><div><h1>Meus serviços</h1><p>Acompanhe seus pedidos, orçamentos e histórico em um só lugar.</p></div><Link className="button button-primary" href="/app/request"><Plus size={17} /> Novo pedido</Link></div>
    <div className="tabs" role="tablist" aria-label="Filtrar serviços">{([ ["active", "Em andamento"], ["requests", "Solicitações"], ["history", "Histórico"], ["quotes", "Orçamentos"] ] as [Tab, string][]).map(([value, label]) => <button type="button" role="tab" aria-selected={tab === value} className={`tab-button${tab === value ? " active" : ""}`} key={value} onClick={() => setTab(value)}>{label}{value === "quotes" && quotes.filter((quote) => quote.status === "PENDING").length > 0 ? ` (${quotes.filter((quote) => quote.status === "PENDING").length})` : ""}</button>)}</div>

    {tab === "active" && <>
      {activeRequests.length ? activeRequests.map(renderRequest) : null}
      {activeTows.map((tow) => <article className="card card-pad" key={tow.id} style={{ marginBottom: 12 }}><div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}><strong style={{ color: "var(--navy)" }}><Truck size={17} style={{ verticalAlign: "middle", marginRight: 7 }} />Guincho solicitado</strong><StatusBadge status={tow.status} label={statusLabel(tow.status)} /></div><p style={{ color: "var(--muted)", fontSize: 14 }}>Protocolo {tow.protocol} · {tow.location}</p><div className="note note-warning"><AlertCircle size={16} /><span>Não há rastreamento ao vivo nesta versão. Status é atualizado apenas quando informado.</span></div><button className="button button-ghost button-small" style={{ marginTop: 10 }} onClick={() => cancelTow(tow)} type="button">Cancelar solicitação</button></article>)}
      {!activeRequests.length && !activeTows.length && <div className="card"><EmptyState icon={<Clock3 size={26} />} title="Nenhum serviço em andamento." description="Quando um atendimento for confirmado, você poderá acompanhá-lo por aqui." action={<Link className="button button-primary" href="/app/workshops">Encontrar oficina</Link>} /></div>}
    </>}

    {tab === "requests" && <>{pendingRequests.length ? pendingRequests.map(renderRequest) : <div className="card"><EmptyState icon={<FileText size={25} />} title="Você não tem pedidos aguardando resposta." description="As novas solicitações aparecerão aqui até que a oficina responda." action={<Link className="button button-primary" href="/app/request">Solicitar atendimento</Link>} /></div>}</>}

    {tab === "history" && <>
      {historyRequests.map(renderRequest)}
      {historyTows.map((tow) => <article className="card card-pad" key={tow.id} style={{ marginBottom: 12 }}><div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}><strong style={{ color: "var(--navy)" }}><Truck size={17} style={{ verticalAlign: "middle", marginRight: 7 }} />Guincho · {tow.location}</strong><StatusBadge status={tow.status} label={statusLabel(tow.status)} /></div><p className="field-hint">{tow.protocol} · {formatDate(tow.createdAt)}</p></article>)}
      {initialDiagnostics.map((item) => <article className="card card-pad" key={item.id} style={{ marginBottom: 12 }}><div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}><strong style={{ color: "var(--navy)" }}>Diagnóstico inicial · {symptomNames[item.symptom] ?? item.symptom}</strong><StatusBadge status={item.attentionLevel === "HIGH" ? "IN_PROGRESS" : item.attentionLevel === "MODERATE" ? "PENDING" : "COMPLETED"} label={item.attentionLevel === "HIGH" ? "Atenção alta" : item.attentionLevel === "MODERATE" ? "Atenção moderada" : "Atenção baixa"} /></div><p style={{ color: "var(--muted)", fontSize: 13 }}>Avaliação informativa · {formatDate(item.createdAt)}</p><div className="note"><AlertCircle size={16} /><span>{item.recommendation}</span></div></article>)}
      {!historyRequests.length && !historyTows.length && !initialDiagnostics.length && <div className="card"><EmptyState icon={<History size={25} />} title="Seu histórico está vazio." description="Serviços concluídos e avaliações iniciais serão guardados aqui." /></div>}
    </>}

    {tab === "quotes" && <>{quotes.length ? quotes.map((quote) => <article className="card card-pad" key={quote.id} style={{ marginBottom: 12 }}><div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}><div><strong style={{ color: "var(--navy)" }}>{quote.request.serviceType}</strong><span style={{ display: "block", color: "var(--muted)", fontSize: 13 }}>{quote.workshop.name} · {quote.request.protocol}</span></div><StatusBadge status={quote.status} label={statusLabel(quote.status)} /></div><div className="quote-card"><div><strong className="quote-price">{formatCurrency(quote.totalPriceInCents)}</strong><div style={{ color: "var(--muted)", fontSize: 14 }}>{quote.description}</div></div><span className="field-hint">{formatDate(quote.createdAt)}</span></div>{quote.status === "PENDING" && <div className="card-actions"><button className="button button-primary button-small" type="button" onClick={() => answerQuote(quote, "ACCEPTED")} disabled={busy === quote.id}><Check size={15} /> Aceitar orçamento</button><button className="button button-outline button-small" type="button" onClick={() => answerQuote(quote, "DECLINED")} disabled={busy === quote.id}>Recusar</button></div>}</article>) : <div className="card"><EmptyState icon={<ReceiptText size={25} />} title="Você ainda não recebeu orçamentos." description="Quando uma oficina enviar uma proposta, ela aparecerá aqui para você avaliar." /></div>}</>}

    {editing && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setEditing(null); }}><section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="edit-request-title"><div className="modal-head"><div><h2 id="edit-request-title">Editar solicitação</h2><p>Você pode editar enquanto a oficina ainda não respondeu.</p></div><button className="icon-button" type="button" onClick={() => setEditing(null)} aria-label="Fechar"><X size={20} /></button></div><form className="form-stack" onSubmit={saveRequest}><div className="field"><label htmlFor="edit-type">Serviço</label><input id="edit-type" name="serviceType" defaultValue={editing.serviceType} minLength={2} required /></div><div className="field"><label htmlFor="edit-description">Descrição</label><textarea id="edit-description" name="description" defaultValue={editing.description} minLength={5} required /></div><div className="field"><label htmlFor="edit-date">Data preferida</label><input id="edit-date" name="preferredAt" type="datetime-local" defaultValue={dateTimeLocal(editing.preferredAt)} /></div>{error && <p className="inline-error" role="alert">{error}</p>}<div className="modal-actions"><button className="button button-outline" type="button" onClick={() => setEditing(null)}>Cancelar</button><button className="button button-primary" type="submit" disabled={busy === editing.id}>{busy === editing.id ? "Salvando..." : <><Check size={16} /> Salvar alterações</>}</button></div></form></section></div>}
    {toast && <div className="toast" role="status"><Check size={17} />{toast}</div>}
  </>;
}
