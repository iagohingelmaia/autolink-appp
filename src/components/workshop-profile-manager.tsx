"use client";

import { Check, Pencil, Plus, Save, Trash2, Wrench, X } from "lucide-react";
import { FormEvent, useState } from "react";
import { formatCurrency } from "@/lib/format";

type Workshop = { id: string; name: string; description: string; address: string; city: string; state: string; phone: string | null; rating: number; reviewCount: number };
type Service = { id: string; workshopId: string; name: string; description: string; priceFrom: number; durationMinutes: number };
type ServiceDraft = Omit<Service, "id" | "workshopId">;

export function WorkshopProfileManager({ initialWorkshop, initialServices }: { initialWorkshop: Workshop; initialServices: Service[] }) {
  const [workshop, setWorkshop] = useState(initialWorkshop);
  const [services, setServices] = useState(initialServices);
  const [editingProfile, setEditingProfile] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [creatingService, setCreatingService] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  function notify(message: string) { setToast(message); window.setTimeout(() => setToast(""), 3200); }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const body = { name: String(form.get("name") ?? "").trim(), description: String(form.get("description") ?? "").trim(), address: String(form.get("address") ?? "").trim(), phone: String(form.get("phone") ?? "").trim() };
    const old = workshop;
    setWorkshop((current) => ({ ...current, ...body, phone: body.phone || null }));
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/workshop/profile", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const result = (await response.json()) as { workshop?: Workshop; error?: string };
      if (!response.ok || !result.workshop) { setWorkshop(old); setError(result.error ?? "Não foi possível salvar os dados."); return; }
      setWorkshop((current) => ({ ...current, ...result.workshop }));
      setEditingProfile(false); notify("Perfil da oficina atualizado.");
    } catch { setWorkshop(old); setError("Não foi possível conectar. Tente novamente."); }
    finally { setBusy(false); }
  }

  async function saveService(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const draft: ServiceDraft = { name: String(form.get("name") ?? "").trim(), description: String(form.get("description") ?? "").trim(), priceFrom: Math.round(Number(form.get("priceFrom")) * 100), durationMinutes: Number(form.get("durationMinutes")) || 60 };
    if (!draft.name || !Number.isFinite(draft.priceFrom) || draft.priceFrom < 0) { setError("Confira o nome e o valor do serviço."); return; }
    const previous = services;
    const isEdit = Boolean(editingService);
    const temporaryId = `temporary-${Date.now()}`;
    const optimistic: Service = { id: editingService?.id ?? temporaryId, workshopId: workshop.id, ...draft };
    setServices((current) => editingService ? current.map((item) => item.id === editingService.id ? optimistic : item) : [optimistic, ...current]);
    setBusy(true); setError("");
    try {
      const response = await fetch(editingService ? `/api/workshop/services/${editingService.id}` : "/api/workshop/services", { method: editingService ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...draft, priceFrom: draft.priceFrom / 100 }) });
      const result = (await response.json()) as { service?: Service; error?: string };
      if (!response.ok || !result.service) { setServices(previous); setError(result.error ?? "Não foi possível salvar o serviço."); return; }
      setServices((current) => current.map((item) => item.id === optimistic.id ? result.service! : item));
      setCreatingService(false); setEditingService(null); notify(isEdit ? "Serviço atualizado." : "Serviço adicionado.");
    } catch { setServices(previous); setError("Não foi possível conectar. Tente novamente."); }
    finally { setBusy(false); }
  }

  async function deleteService(service: Service) {
    if (!window.confirm(`Remover “${service.name}” do catálogo?`)) return;
    const previous = services;
    setServices((current) => current.filter((item) => item.id !== service.id));
    try {
      const response = await fetch(`/api/workshop/services/${service.id}`, { method: "DELETE" });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) { setServices(previous); notify(result.error ?? "Não foi possível remover o serviço."); }
      else notify("Serviço removido do catálogo.");
    } catch { setServices(previous); notify("Não foi possível conectar. O serviço foi restaurado."); }
  }

  return <>
    <div className="page-heading"><div><h1>Perfil da oficina</h1><p>Mantenha suas informações e serviços atualizados para os clientes.</p></div></div>
    <div className="note note-warning" style={{ marginBottom: 17 }}><Wrench size={17} /><span>Este é um perfil de demonstração. As alterações são salvas no banco deste ambiente e não são publicadas para clientes reais.</span></div>
    <section className="card card-pad" style={{ marginBottom: 17 }}><div className="card-title"><span>Informações da oficina</span>{!editingProfile && <button className="button button-outline button-small" type="button" onClick={() => { setEditingProfile(true); setError(""); }}><Pencil size={15} /> Editar dados</button>}</div>
      {editingProfile ? <form className="form-stack" onSubmit={saveProfile}><div className="field"><label htmlFor="shop-name">Nome da oficina</label><input id="shop-name" name="name" defaultValue={workshop.name} minLength={2} required /></div><div className="field"><label htmlFor="shop-description">Descrição</label><textarea id="shop-description" name="description" defaultValue={workshop.description} minLength={10} required /></div><div className="form-grid"><div className="field"><label htmlFor="shop-address">Endereço</label><input id="shop-address" name="address" defaultValue={workshop.address} minLength={5} required /></div><div className="field"><label htmlFor="shop-phone">Telefone</label><input id="shop-phone" name="phone" defaultValue={workshop.phone ?? ""} type="tel" /></div></div>{error && <p className="inline-error" role="alert">{error}</p>}<div className="card-actions"><button className="button button-primary" type="submit" disabled={busy}>{busy ? "Salvando..." : <><Save size={16} /> Salvar alterações</>}</button><button className="button button-outline" type="button" onClick={() => { setEditingProfile(false); setError(""); }}>Cancelar</button></div></form> : <div className="profile-grid"><div className="settings-row"><div><strong>Nome</strong><span>{workshop.name}</span></div></div><div className="settings-row"><div><strong>Endereço</strong><span>{workshop.address}, {workshop.city} - {workshop.state}</span></div></div><div className="settings-row"><div><strong>Telefone</strong><span>{workshop.phone || "Não informado"}</span></div></div><div className="settings-row"><div><strong>Descrição</strong><span>{workshop.description}</span></div></div></div>}
    </section>

    <section className="card card-pad"><div className="card-title"><span>Serviços oferecidos</span><button className="button button-primary button-small" type="button" onClick={() => { setError(""); setCreatingService(true); }}><Plus size={16} /> Adicionar serviço</button></div>
      {services.length ? <div className="list-stack">{services.map((service) => <div className="list-row" key={service.id}><div className="list-icon"><Wrench size={19} /></div><div className="list-row-copy"><strong>{service.name}</strong><span>{service.description || "Sem descrição"}</span><span>Valor de referência: {formatCurrency(service.priceFrom)} · {service.durationMinutes} min</span></div><button className="icon-button" type="button" aria-label={`Editar ${service.name}`} onClick={() => { setError(""); setEditingService(service); }}><Pencil size={17} /></button><button className="icon-button" type="button" aria-label={`Remover ${service.name}`} onClick={() => deleteService(service)}><Trash2 size={17} /></button></div>)}</div> : <div className="empty-state"><div className="empty-icon"><Wrench size={24} /></div><h3>Nenhum serviço cadastrado.</h3><p>Adicione serviços para os clientes saberem como sua oficina pode ajudar.</p><button className="button button-primary button-small" type="button" onClick={() => setCreatingService(true)}><Plus size={16} /> Adicionar serviço</button></div>}
    </section>

    {(creatingService || editingService) && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) { setCreatingService(false); setEditingService(null); } }}><section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="service-title"><div className="modal-head"><div><h2 id="service-title">{editingService ? "Editar serviço" : "Adicionar serviço"}</h2><p>Preencha os dados que serão mostrados aos clientes.</p></div><button className="icon-button" type="button" aria-label="Fechar" onClick={() => { setCreatingService(false); setEditingService(null); }}><X size={19} /></button></div><form className="form-stack" onSubmit={saveService}><div className="field"><label htmlFor="service-name">Nome do serviço</label><input id="service-name" name="name" defaultValue={editingService?.name ?? ""} minLength={2} maxLength={80} required placeholder="Ex.: Revisão preventiva" /></div><div className="field"><label htmlFor="service-description">Descrição</label><textarea id="service-description" name="description" defaultValue={editingService?.description ?? ""} maxLength={400} placeholder="Explique em poucas palavras o que está incluído." /></div><div className="form-grid"><div className="field"><label htmlFor="service-price">Preço a partir de (R$)</label><input id="service-price" name="priceFrom" type="number" step="0.01" min="0" max="500000" defaultValue={editingService ? (editingService.priceFrom / 100).toFixed(2) : ""} placeholder="Ex.: 150,00" required /></div><div className="field"><label htmlFor="service-duration">Duração (minutos)</label><input id="service-duration" name="durationMinutes" type="number" min="1" max="1440" defaultValue={editingService?.durationMinutes ?? 60} required /></div></div>{error && <p className="inline-error" role="alert">{error}</p>}<div className="modal-actions"><button className="button button-outline" type="button" onClick={() => { setCreatingService(false); setEditingService(null); }}>Cancelar</button><button className="button button-primary" type="submit" disabled={busy}>{busy ? "Salvando..." : <><Check size={16} /> Salvar serviço</>}</button></div></form></section></div>}
    {toast && <div className="toast success" role="status"><Check size={17} />{toast}</div>}
  </>;
}
