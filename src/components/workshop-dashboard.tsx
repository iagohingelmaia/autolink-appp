"use client";

import { ArrowRight, BriefcaseBusiness, CalendarClock, Check, CheckCircle2, Clock3, FileText, Gauge, Star, Wrench, X } from "lucide-react";
import { useState } from "react";
import { EmptyState, StatusBadge } from "@/components/ui";
import { formatCurrency, formatDate, statusLabel } from "@/lib/format";

type Workshop = { id: string; name: string; rating: number; reviewCount: number; address: string; city: string };
type Quote = { id: string; requestId: string; description: string; totalPriceInCents: number; status: string; createdAt: Date | string };
type RequestItem = { id: string; protocol: string; serviceType: string; description: string; status: string; preferredAt: Date | string | null; createdAt: Date | string; customer: { id: string; fullName: string; phone: string | null }; vehicle: { make: string; model: string; year: number; plate: string | null } | null; quote: Quote | null };

export function WorkshopDashboard({ workshop, initialRequests, initialQuotes }: { workshop: Workshop; initialRequests: RequestItem[]; initialQuotes: Quote[] }) {
  const [requests, setRequests] = useState(initialRequests);
  const [quotes, setQuotes] = useState(initialQuotes);
  const [busy, setBusy] = useState("");
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("NEW");

  function notify(message: string) { setToast(message); window.setTimeout(() => setToast(""), 3200); }

  async function updateStatus(item: RequestItem, status: "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "CANCELED") {
    const previous = requests;
    setRequests((current) => current.map((request) => request.id === item.id ? { ...request, status } : request));
    setBusy(item.id);
    setError("");
    try {
      const response = await fetch(`/api/workshop/requests/${item.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) { setRequests(previous); setError(result.error ?? "Não foi possível atualizar o atendimento."); }
      else notify(status === "CONFIRMED" ? "Solicitação aceita. O cliente foi avisado." : status === "IN_PROGRESS" ? "Atendimento marcado como em andamento." : status === "COMPLETED" ? "Atendimento concluído." : "Solicitação recusada.");
    } catch { setRequests(previous); setError("Falha de conexão. O status anterior foi restaurado."); }
    finally { setBusy(""); }
  }

  async function sendQuote(event: React.FormEvent<HTMLFormElement>, item: RequestItem) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const description = String(form.get("description") ?? "").trim();
    const amount = Number(form.get("amount"));
    if (description.length < 4 || !Number.isFinite(amount) || amount <= 0) { setError("Informe a descrição do serviço e um valor válido."); return; }
    const optimistic: Quote = { id: `temporary-${Date.now()}`, requestId: item.id, description, totalPriceInCents: Math.round(amount * 100), status: "PENDING", createdAt: new Date() };
    const previous = quotes;
    setQuotes((current) => [optimistic, ...current]);
    setBusy(item.id);
    setError("");
    try {
      const response = await fetch(`/api/workshop/requests/${item.id}/quote`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ description, amount }) });
      const result = (await response.json()) as { quote?: Quote; error?: string };
      if (!response.ok || !result.quote) { setQuotes(previous); setError(result.error ?? "Não foi possível enviar o orçamento."); return; }
      setQuotes((current) => current.map((quote) => quote.id === optimistic.id ? result.quote! : quote));
      setRequests((current) => current.map((request) => request.id === item.id ? { ...request, quote: result.quote! } : request));
      notify("Orçamento enviado para o cliente.");
    } catch { setQuotes(previous); setError("Falha de conexão. O orçamento não foi enviado."); }
    finally { setBusy(""); }
  }

  const newItems = requests.filter((item) => item.status === "REQUESTED");
  const inProgress = requests.filter((item) => ["CONFIRMED", "IN_PROGRESS", "SCHEDULED"].includes(item.status));
  const completed = requests.filter((item) => item.status === "COMPLETED");
  const visible = filter === "NEW" ? newItems : filter === "ACTIVE" ? inProgress : filter === "DONE" ? completed : requests;

  return <>
    <div className="page-heading"><div><span className="eyebrow" style={{ marginBottom: 9 }}><span className="eyebrow-dot" /> Painel do prestador</span><h1>Olá, {workshop.name}</h1><p>Gerencie solicitações, atenda clientes e acompanhe sua oficina.</p></div></div>
    <div className="note note-warning" style={{ marginBottom: 16 }}><FileText size={17} /><span>Ambiente demonstrativo: os clientes, avaliações e solicitações de exemplo são fictícios. Nenhum faturamento é calculado nesta versão.</span></div>
    <div className="stat-grid" style={{ marginBottom: 24 }}><div className="card stat-card"><div className="stat-icon"><FileText size={19} /></div><strong>{newItems.length}</strong><span>Novas solicitações</span></div><div className="card stat-card"><div className="stat-icon"><Clock3 size={19} /></div><strong>{inProgress.length}</strong><span>Em andamento</span></div><div className="card stat-card"><div className="stat-icon"><CheckCircle2 size={19} /></div><strong>{completed.length}</strong><span>Concluídos</span></div></div>
    <div className="dashboard-grid">
      <section className="card card-pad" id="solicitacoes"><div className="card-title"><span>Solicitações de atendimento</span><span className="status-pill status-warning">{newItems.length} novas</span></div>
        <div className="tabs" role="tablist" aria-label="Filtrar solicitações">{[["NEW", "Novas"], ["ACTIVE", "Em andamento"], ["DONE", "Concluídas"], ["ALL", "Todas"]].map(([value, label]) => <button key={value} type="button" className={`tab-button${filter === value ? " active" : ""}`} role="tab" aria-selected={filter === value} onClick={() => setFilter(value)}>{label}</button>)}</div>
        {error && <div className="alert alert-error" role="alert" style={{ marginBottom: 13 }}>{error}</div>}
        {visible.length ? <div className="list-stack">{visible.map((item) => { const quote = quotes.find((entry) => entry.requestId === item.id) ?? item.quote; return <article key={item.id} style={{ padding: "17px 0", borderBottom: "1px solid #edf0f2" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}><div><strong style={{ color: "var(--navy)", fontSize: 15 }}>{item.serviceType}</strong><span style={{ display: "block", color: "var(--muted)", fontSize: 12 }}>{item.protocol} · {formatDate(item.createdAt)}</span></div><StatusBadge status={item.status} label={statusLabel(item.status)} /></div>
          <div style={{ display: "grid", gap: 5, marginTop: 12, color: "#4e5c67", fontSize: 13 }}><span><strong>Cliente:</strong> {item.customer.fullName}{item.customer.phone ? ` · ${item.customer.phone}` : ""}</span><span><strong>Veículo:</strong> {item.vehicle ? `${item.vehicle.make} ${item.vehicle.model} ${item.vehicle.year}${item.vehicle.plate ? ` · ${item.vehicle.plate}` : ""}` : "Não informado"}</span><span><strong>Relato:</strong> {item.description}</span>{item.preferredAt && <span><strong>Preferência:</strong> {formatDate(item.preferredAt, { dateStyle: "medium", timeStyle: "short" })}</span>}</div>
          {quote && <div className="note" style={{ marginTop: 11 }}><ReceiptTextIcon /> <span>Orçamento enviado: <strong>{formatCurrency(quote.totalPriceInCents)}</strong> · {quote.description}</span></div>}
          {item.status === "REQUESTED" && <>
            {!quote && <form className="quote-form" onSubmit={(event) => sendQuote(event, item)}><input name="description" aria-label="Descrição do orçamento" placeholder="Descrição do orçamento" maxLength={500} required /><input name="amount" type="number" step="0.01" min="0.01" max="500000" aria-label="Valor em reais" placeholder="Valor R$" required /><button className="button button-outline button-small" type="submit" disabled={busy === item.id}>Enviar orçamento</button></form>}
            <div className="card-actions" style={{ marginTop: 11 }}><button className="button button-primary button-small" type="button" onClick={() => updateStatus(item, "CONFIRMED")} disabled={busy === item.id}><Check size={15} /> Aceitar pedido</button><button className="button button-ghost button-small" type="button" onClick={() => updateStatus(item, "CANCELED")} disabled={busy === item.id}><X size={15} /> Recusar</button></div>
          </>}
          {item.status === "CONFIRMED" && <button className="button button-dark button-small" style={{ marginTop: 12 }} type="button" onClick={() => updateStatus(item, "IN_PROGRESS")} disabled={busy === item.id}><Wrench size={15} /> Iniciar atendimento</button>}
          {item.status === "IN_PROGRESS" && <button className="button button-primary button-small" style={{ marginTop: 12 }} type="button" onClick={() => updateStatus(item, "COMPLETED")} disabled={busy === item.id}><CheckCircle2 size={15} /> Marcar como concluído</button>}
        </article>; })}</div> : <EmptyState icon={<ClipboardMini />} title={filter === "NEW" ? "Nenhuma nova solicitação." : "Nenhum atendimento nesta lista."} description="Quando um cliente solicitar atendimento, ele aparecerá aqui." />}
      </section>
      <div style={{ display: "grid", gap: 15, alignContent: "start" }}><section className="card card-pad"><h2 className="card-title">Resumo da oficina</h2><div className="settings-row"><div><strong>Nome</strong><span>{workshop.name}</span></div></div><div className="settings-row"><div><strong>Endereço</strong><span>{workshop.address}, {workshop.city}</span></div></div><div className="settings-row"><div><strong><Star size={15} style={{ verticalAlign: "middle", marginRight: 4 }} />Avaliação de demonstração</strong><span>{Number(workshop.rating).toFixed(1)} · {workshop.reviewCount} avaliações de exemplo</span></div></div><div className="settings-row"><div><strong><BriefcaseBusiness size={15} style={{ verticalAlign: "middle", marginRight: 4 }} />Faturamento</strong><span>Não calculado nesta versão</span></div></div><a className="button button-outline button-wide" href="/workshop/profile" style={{ marginTop: 15 }}>Editar perfil da oficina <ArrowRight size={15} /></a></section><section className="card card-pad"><h2 className="card-title">Dicas para atender</h2><div className="note"><CalendarClock size={17} /><span>Responda às solicitações e mantenha os clientes atualizados sobre os próximos passos.</span></div><div className="note" style={{ marginTop: 10 }}><Gauge size={17} /><span>Envie um orçamento transparente para que o cliente possa analisar antes de aceitar.</span></div></section></div>
    </div>
    {toast && <div className="toast success" role="status"><CheckCircle2 size={18} />{toast}</div>}
  </>;
}

function ReceiptTextIcon() { return <FileText size={17} />; }
function ClipboardMini() { return <FileText size={25} />; }
