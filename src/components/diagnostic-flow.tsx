"use client";

import { Activity, AlertTriangle, Battery, Check, CheckCircle2, CircleHelp, Gauge, Lightbulb, RotateCcw, Thermometer, Trash2, Volume2, Wind, Wrench } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { symptomOptions, type Assessment, type SymptomId } from "@/lib/diagnostics";
import { formatDate } from "@/lib/format";
import { EmptyState } from "@/components/ui";

type Vehicle = { id: string; make: string; model: string; year: number };
type DiagnosticRecord = { id: string; vehicleId: string | null; symptom: string; answers: Record<string, string>; possibleCauses: string[]; attentionLevel: "LOW" | "MODERATE" | "HIGH" | string; recommendation: string; createdAt: Date | string; vehicle?: Vehicle | null };
type Result = { diagnostic?: DiagnosticRecord; error?: string };
const icons = { noise: Volume2, shaking: Activity, dashboard: Lightbulb, overheating: Thermometer, starting: Battery, wheels: Wind, other: CircleHelp };
const whenOptions = ["Com o carro parado", "Durante aceleração", "Durante frenagem", "Com o motor frio", "Acontece sempre", "Ainda não sei"];

function attentionCopy(level: string) {
  if (level === "HIGH") return { label: "Atenção alta", color: "#a73429", background: "#fff0ed" };
  if (level === "MODERATE") return { label: "Atenção moderada", color: "#8b5a0c", background: "#fff6e8" };
  return { label: "Atenção baixa", color: "#26713d", background: "#e9f6ed" };
}

export function DiagnosticFlow({ vehicles, initialDiagnostics }: { vehicles: Vehicle[]; initialDiagnostics: DiagnosticRecord[] }) {
  const [step, setStep] = useState<1 | 2>(1);
  const [symptom, setSymptom] = useState<SymptomId | "">("");
  const [when, setWhen] = useState("");
  const [vehicleId, setVehicleId] = useState(vehicles[0]?.id ?? "");
  const [result, setResult] = useState<DiagnosticRecord | null>(null);
  const [history, setHistory] = useState(initialDiagnostics);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  function reset() { setStep(1); setSymptom(""); setWhen(""); setResult(null); setError(""); }

  async function submit() {
    if (!symptom) { setError("Escolha o problema que melhor descreve o que acontece."); return; }
    if (!when) { setError("Escolha quando o problema costuma acontecer."); return; }
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/diagnostics", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ symptom, vehicleId: vehicleId || undefined, answers: { when } }) });
      const payload = (await response.json()) as Result;
      if (!response.ok || !payload.diagnostic) { setError(payload.error ?? "Não foi possível gerar sua avaliação inicial."); return; }
      setResult(payload.diagnostic);
      setHistory((current) => [payload.diagnostic!, ...current]);
    } catch { setError("Não foi possível conectar. Tente novamente."); }
    finally { setBusy(false); }
  }

  async function deleteRecord(item: DiagnosticRecord) {
    if (!window.confirm("Remover esta avaliação inicial do histórico?")) return;
    const previous = history;
    setHistory((current) => current.filter((entry) => entry.id !== item.id));
    try {
      const response = await fetch(`/api/diagnostics/${item.id}`, { method: "DELETE" });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) { setHistory(previous); setToast(payload.error ?? "Não foi possível remover."); }
      else setToast("Avaliação removida do histórico.");
    } catch { setHistory(previous); setToast("Não foi possível conectar."); }
    window.setTimeout(() => setToast(""), 3200);
  }

  const currentSymptom = symptomOptions.find((item) => item.id === (result?.symptom ?? symptom));
  const level = result ? attentionCopy(result.attentionLevel) : null;

  return <>
    <div className="diagnostic-intro"><h2>O que está acontecendo com seu carro?</h2><p>Responda algumas perguntas para receber uma orientação inicial. É simples e leva menos de um minuto.</p></div>
    <div className="note note-warning" style={{ marginTop: 13, marginBottom: 18 }}><AlertTriangle size={18} /><span><strong>Esta é uma avaliação inicial, não um diagnóstico mecânico.</strong> As possíveis causas são informativas e devem ser confirmadas por um profissional.</span></div>

    {!result && <section className="card card-pad" style={{ maxWidth: 800, marginInline: "auto" }}>
      {step === 1 ? <><h2 style={{ color: "var(--navy)", margin: "0 0 5px", fontSize: 20 }}>Escolha o que você percebeu</h2><p className="field-hint" style={{ margin: "0 0 16px" }}>Toque na opção mais parecida. Você poderá voltar e escolher outra.</p><div className="symptom-grid">{symptomOptions.map((option) => { const Icon = icons[option.id]; return <button key={option.id} type="button" className={`symptom-button${symptom === option.id ? " selected" : ""}`} onClick={() => { setSymptom(option.id); setError(""); }} aria-pressed={symptom === option.id}><span className="symptom-icon"><Icon size={20} /></span>{option.label}</button>; })}</div><div className="modal-actions"><span /> <button className="button button-primary" type="button" onClick={() => { if (!symptom) { setError("Escolha uma opção para continuar."); return; } setError(""); setStep(2); }}>Continuar</button></div></> : <><button className="button button-ghost button-small" type="button" onClick={() => { setStep(1); setError(""); }}>‹ Voltar</button><h2 style={{ color: "var(--navy)", margin: "8px 0 5px", fontSize: 20 }}>Quando o problema acontece?</h2><p className="field-hint" style={{ margin: "0 0 16px" }}>Escolha a situação que mais se aproxima. Se não souber, tudo bem.</p><div className="choice-grid">{whenOptions.map((option) => <button key={option} className={`choice-button${when === option ? " selected" : ""}`} type="button" onClick={() => { setWhen(option); setError(""); }} aria-pressed={when === option}><Check size={16} style={{ opacity: when === option ? 1 : 0, color: "var(--success)" }} />{option}</button>)}</div><div className="field" style={{ marginTop: 17 }}><label htmlFor="diagnostic-vehicle">Qual veículo?</label>{vehicles.length ? <select id="diagnostic-vehicle" value={vehicleId} onChange={(event) => setVehicleId(event.target.value)}><option value="">Sem veículo específico</option>{vehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.make} {vehicle.model} {vehicle.year}</option>)}</select> : <span className="field-hint">Você pode fazer a avaliação sem cadastrar o veículo.</span>}</div><div className="modal-actions"><span /> <button className="button button-primary" type="button" onClick={submit} disabled={busy}>{busy ? "Preparando avaliação..." : "Ver orientação inicial"}</button></div></>}
      {error && <p className="inline-error" role="alert" style={{ marginTop: 12 }}>{error}</p>}
    </section>}

    {result && level && <section className="assessment-result" style={{ maxWidth: 800, margin: "18px auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 13, flexWrap: "wrap" }}><div><span className="eyebrow"><span className="eyebrow-dot" /> Diagnóstico AutoLink</span><h2 style={{ margin: "11px 0 3px", color: "var(--navy)", fontSize: 23 }}>{currentSymptom?.label}</h2><p style={{ margin: 0, color: "var(--muted)", fontSize: 14 }}>{vehicles.find((vehicle) => vehicle.id === result.vehicleId)?.make ?? "Veículo"} {vehicles.find((vehicle) => vehicle.id === result.vehicleId)?.model ?? ""}{result.answers.when ? ` · ${result.answers.when.toLocaleLowerCase("pt-BR")}` : ""}</p></div><span className="assessment-level" style={{ color: level.color, background: level.background }}>{level.label}</span></div>
      <h3 style={{ margin: "21px 0 0", color: "var(--navy)", fontSize: 17 }}>Possíveis causas</h3><ul className="assessment-causes">{result.possibleCauses.map((cause) => <li key={cause}><CheckCircle2 size={17} />{cause}</li>)}</ul>
      <h3 style={{ margin: "18px 0 6px", color: "var(--navy)", fontSize: 17 }}>O que recomendamos</h3><p style={{ margin: 0, color: "#43525e", fontSize: 15 }}>{result.recommendation}</p>
      <div className="note note-warning" style={{ marginTop: 17 }}><AlertTriangle size={17} /><span>Esta orientação é baseada apenas nas respostas informadas. Não substitui inspeção, diagnóstico profissional ou atendimento emergencial.</span></div>
      <div className="card-actions" style={{ marginTop: 18 }}><Link className="button button-primary" href="/app/request">Solicitar avaliação na oficina</Link><button className="button button-outline" type="button" onClick={reset}><RotateCcw size={16} /> Fazer outra avaliação</button></div>
    </section>}

    <section className="section-block"><div className="section-heading"><div><h2>Últimas avaliações</h2><p>Seu histórico inicial fica guardado na conta.</p></div></div>
      {history.length ? <div className="card card-pad"><div className="list-stack">{history.map((item) => { const option = symptomOptions.find((entry) => entry.id === item.symptom); const tone = attentionCopy(item.attentionLevel); return <div className="list-row" key={item.id}><div className="list-icon"><Gauge size={19} /></div><div className="list-row-copy"><strong>{option?.label ?? item.symptom}</strong><span>{item.vehicle ? `${item.vehicle.make} ${item.vehicle.model} · ` : ""}{formatDate(item.createdAt)}</span></div><span className="status-pill" style={{ color: tone.color, background: tone.background }}>{tone.label}</span><button className="icon-button" type="button" aria-label="Remover avaliação" onClick={() => deleteRecord(item)}><Trash2 size={17} /></button></div>; })}</div></div> : <div className="card"><EmptyState icon={<Gauge size={25} />} title="Você ainda não fez uma avaliação." description="Quando responder às perguntas, sua avaliação inicial aparecerá aqui." />{vehicles.length === 0 && <p style={{ textAlign: "center", paddingBottom: 18 }}><Link className="text-link" href="/app/vehicles">Cadastrar um veículo <Wrench size={15} /></Link></p>}</div>}
    </section>
    {toast && <div className="toast" role="status"><CheckCircle2 size={17} />{toast}</div>}
  </>;
}
