"use client";

import { ArrowLeft, ArrowRight, Check, CheckCircle2, ImagePlus, Trash2, Wrench } from "lucide-react";
import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";

type Vehicle = { id: string; make: string; model: string; year: number; plate: string | null };
type Workshop = { id: string; name: string; address: string; city: string; services: { name: string }[] };
type Attachment = { name: string; data: string };
type Result = { request?: { id: string; protocol: string }; error?: string };

const serviceTypes = ["Revisão preventiva", "Mecânica geral", "Freios", "Motor", "Bateria e elétrica", "Suspensão e rodas", "Troca de óleo", "Outro problema"];

export function RequestWizard({ vehicles, workshops, preselectedWorkshop }: { vehicles: Vehicle[]; workshops: Workshop[]; preselectedWorkshop?: string }) {
  const [step, setStep] = useState(1);
  const [vehicleId, setVehicleId] = useState(vehicles[0]?.id ?? "");
  const [workshopId, setWorkshopId] = useState(preselectedWorkshop && workshops.some((item) => item.id === preselectedWorkshop) ? preselectedWorkshop : "");
  const [serviceType, setServiceType] = useState("");
  const [description, setDescription] = useState("");
  const [preferredAt, setPreferredAt] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const selectedVehicle = useMemo(() => vehicles.find((item) => item.id === vehicleId), [vehicleId, vehicles]);
  const selectedWorkshop = useMemo(() => workshops.find((item) => item.id === workshopId), [workshopId, workshops]);

  function continueStep() {
    setError("");
    if (step === 1) {
      if (!vehicleId || !serviceType) { setError("Escolha seu veículo e o tipo de serviço."); return; }
      setStep(2);
      return;
    }
    if (step === 2) {
      if (description.trim().length < 5) { setError("Conte em poucas palavras o que está acontecendo."); return; }
      if (!workshopId) { setError("Escolha a oficina que vai receber seu pedido."); return; }
      setStep(3);
    }
  }

  async function addPhotos(event: React.ChangeEvent<HTMLInputElement>) {
    const inputFiles = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (attachments.length + inputFiles.length > 3) { setError("Você pode adicionar até 3 fotos."); return; }
    setError("");
    try {
      const converted = await Promise.all(inputFiles.map((file) => new Promise<Attachment>((resolve, reject) => {
        if (!file.type.startsWith("image/")) { reject(new Error("Escolha arquivos de imagem.")); return; }
        if (file.size > 700 * 1024) { reject(new Error("Cada foto pode ter até 700 KB.")); return; }
        const reader = new FileReader();
        reader.onload = () => resolve({ name: file.name, data: String(reader.result) });
        reader.onerror = () => reject(new Error("Não foi possível carregar esta foto."));
        reader.readAsDataURL(file);
      })));
      setAttachments((current) => [...current, ...converted]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível adicionar a foto.");
    }
  }

  async function submitRequest(event?: FormEvent) {
    event?.preventDefault();
    if (!vehicleId || !workshopId || !serviceType || description.trim().length < 5) {
      setError("Confira os dados do pedido antes de enviar.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/service-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicleId,
          workshopId,
          serviceType,
          description: description.trim(),
          preferredAt: preferredAt ? new Date(preferredAt).toISOString() : null,
          attachments: attachments.map((item) => item.data),
        }),
      });
      const payload = (await response.json()) as Result;
      if (!response.ok) { setError(payload.error ?? "Não foi possível enviar o pedido."); return; }
      setResult(payload);
    } catch {
      setError("Não foi possível conectar. Confira sua internet e tente novamente.");
    } finally {
      setBusy(false);
    }
  }

  if (result?.request) return <div className="card confirmation"><div className="confirmation-icon"><CheckCircle2 size={32} /></div><h2>Solicitação enviada!</h2><p>Seu pedido foi enviado para {selectedWorkshop?.name}. A oficina responderá pela AutoLink.</p><div className="protocol-box">Protocolo {result.request.protocol}</div><div style={{ display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap", marginTop: 21 }}><Link className="button button-primary" href="/app/services">Acompanhar solicitação <ArrowRight size={16} /></Link><Link className="button button-outline" href="/app/home">Voltar ao início</Link></div></div>;

  return <section className="card card-pad" style={{ maxWidth: 790, marginInline: "auto" }}>
    <div className="step-row" aria-label={`Etapa ${step} de 3`}><div className={`step-item ${step === 1 ? "current" : "done"}`}><span className="step-number">{step > 1 ? <Check size={14} /> : "1"}</span><span>Seu veículo</span></div><div className="step-line" /><div className={`step-item ${step === 2 ? "current" : step > 2 ? "done" : ""}`}><span className="step-number">{step > 2 ? <Check size={14} /> : "2"}</span><span>O que aconteceu</span></div><div className="step-line" /><div className={`step-item ${step === 3 ? "current" : ""}`}><span className="step-number">3</span><span>Confirmar</span></div></div>

    {step === 1 && <div><h2 style={{ color: "var(--navy)", margin: "0 0 5px", fontSize: 21 }}>Qual serviço você precisa?</h2><p className="field-hint" style={{ margin: "0 0 17px" }}>Selecione o carro e o serviço que melhor descreve seu pedido.</p>
      <div className="field" style={{ marginBottom: 17 }}><label htmlFor="request-vehicle">Seu veículo</label>{vehicles.length ? <select id="request-vehicle" value={vehicleId} onChange={(event) => setVehicleId(event.target.value)}><option value="">Escolha um veículo</option>{vehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.make} {vehicle.model} {vehicle.year} {vehicle.plate ? `· ${vehicle.plate}` : ""}</option>)}</select> : <div className="note note-warning">Você ainda não tem um veículo cadastrado. <Link className="text-link" href="/app/vehicles">Cadastrar veículo</Link></div>}</div>
      <div className="field"><label>Tipo de serviço</label><div className="choice-grid">{serviceTypes.map((item) => <button type="button" key={item} className={`choice-button${serviceType === item ? " selected" : ""}`} onClick={() => setServiceType(item)} aria-pressed={serviceType === item}><Wrench size={17} />{item}</button>)}</div></div>
    </div>}

    {step === 2 && <div><h2 style={{ color: "var(--navy)", margin: "0 0 5px", fontSize: 21 }}>Conte o que aconteceu</h2><p className="field-hint" style={{ margin: "0 0 17px" }}>Uma boa descrição ajuda a oficina a se preparar.</p>
      <div className="form-stack"><div className="field"><label htmlFor="request-description">Descreva o problema ou serviço</label><textarea id="request-description" value={description} onChange={(event) => setDescription(event.target.value)} maxLength={1000} placeholder="Ex.: Ao frear, percebi um ruído na roda dianteira..." rows={4} required /><span className="field-hint">{description.length}/1000 caracteres</span></div>
        <div className="field"><label htmlFor="request-workshop">Oficina</label><select id="request-workshop" value={workshopId} onChange={(event) => setWorkshopId(event.target.value)} required><option value="">Escolha uma oficina</option>{workshops.map((workshop) => <option key={workshop.id} value={workshop.id}>{workshop.name} · {workshop.city}</option>)}</select></div>
        <div className="field"><label htmlFor="request-date">Data e horário preferidos <span style={{ color: "#79848d", fontWeight: 450 }}>(opcional)</span></label><input id="request-date" type="datetime-local" value={preferredAt} onChange={(event) => setPreferredAt(event.target.value)} min={new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)} /><span className="field-hint">A oficina confirmará a disponibilidade.</span></div>
        <div className="field"><label>Fotos <span style={{ color: "#79848d", fontWeight: 450 }}>(opcional)</span></label><div className="photo-picker"><label className="button button-outline button-small" htmlFor="request-photos"><ImagePlus size={16} /> Adicionar fotos</label><input id="request-photos" type="file" accept="image/*" multiple hidden onChange={addPhotos} disabled={attachments.length >= 3} /><span className="field-hint">Até 3 fotos, 700 KB por foto.</span></div>{attachments.length > 0 && <div style={{ display: "flex", gap: 8, marginTop: 10 }}>{attachments.map((item, index) => <div className="photo-preview" key={`${item.name}-${index}`}><img src={item.data} alt={`Foto anexada ${index + 1}`} /><button type="button" aria-label={`Remover foto ${index + 1}`} onClick={() => setAttachments((current) => current.filter((_, photoIndex) => photoIndex !== index))}><Trash2 size={13} /></button></div>)}</div>}</div>
      </div>
    </div>}

    {step === 3 && <div><h2 style={{ color: "var(--navy)", margin: "0 0 5px", fontSize: 21 }}>Confira seu pedido</h2><p className="field-hint" style={{ margin: "0 0 17px" }}>A solicitação só será enviada depois da sua confirmação.</p><div className="card" style={{ padding: 18, background: "#fafbfc" }}><div className="settings-row"><div><strong>Veículo</strong><span>{selectedVehicle ? `${selectedVehicle.make} ${selectedVehicle.model} ${selectedVehicle.year}${selectedVehicle.plate ? ` · ${selectedVehicle.plate}` : ""}` : "Não selecionado"}</span></div></div><div className="settings-row"><div><strong>Serviço</strong><span>{serviceType}</span></div></div><div className="settings-row"><div><strong>Oficina</strong><span>{selectedWorkshop?.name ?? "Não selecionada"} · {selectedWorkshop?.address}, {selectedWorkshop?.city}</span></div></div><div className="settings-row"><div><strong>Data preferida</strong><span>{preferredAt ? new Date(preferredAt).toLocaleString("pt-BR") : "A combinar"}</span></div></div><div className="settings-row"><div><strong>Descrição</strong><span>{description}</span></div></div><div className="settings-row"><div><strong>Fotos anexadas</strong><span>{attachments.length ? `${attachments.length} foto(s)` : "Nenhuma"}</span></div></div></div><div className="note" style={{ marginTop: 13 }}><CheckCircle2 size={17} /><span>A AutoLink encaminhará sua solicitação à oficina. Nenhum pagamento será feito neste momento.</span></div></div>}

    {error && <div className="alert alert-error" role="alert" style={{ marginTop: 16 }}>{error}</div>}
    <div className="modal-actions" style={{ justifyContent: "space-between", marginTop: 23 }}>
      {step > 1 ? <button className="button button-outline" type="button" onClick={() => { setError(""); setStep((current) => current - 1); }}><ArrowLeft size={16} /> Voltar</button> : <Link className="button button-ghost" href="/app/workshops">Cancelar</Link>}
      {step < 3 ? <button className="button button-primary" type="button" onClick={continueStep}>Continuar <ArrowRight size={16} /></button> : <button className="button button-primary" type="button" onClick={() => submitRequest()} disabled={busy}>{busy ? "Enviando..." : <>Confirmar solicitação <Check size={16} /></>}</button>}
    </div>
  </section>;
}
