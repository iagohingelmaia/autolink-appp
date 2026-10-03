"use client";

import { CarFront, Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { FormEvent, useState } from "react";
import { EmptyState } from "@/components/ui";

type Vehicle = {
  id: string;
  make: string;
  model: string;
  year: number;
  version: string | null;
  plate: string | null;
  mileage: number | null;
  fuel: string;
};

type VehicleDraft = Omit<Vehicle, "id">;

export function VehiclesManager({ initialVehicles }: { initialVehicles: Vehicle[] }) {
  const [items, setItems] = useState(initialVehicles);
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const currentYear = new Date().getFullYear();

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 3200);
  }

  function openNew() { setError(""); setEditing(null); setCreating(true); }
  function closeForm() { setCreating(false); setEditing(null); setError(""); }

  async function saveVehicle(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const draft: VehicleDraft = {
      make: String(form.get("make") ?? "").trim(),
      model: String(form.get("model") ?? "").trim(),
      year: Number(form.get("year")),
      version: String(form.get("version") ?? "").trim() || null,
      plate: String(form.get("plate") ?? "").trim().toUpperCase() || null,
      mileage: form.get("mileage") ? Number(form.get("mileage")) : null,
      fuel: String(form.get("fuel") ?? "Flex"),
    };
    if (!draft.make || !draft.model || !Number.isInteger(draft.year)) {
      setError("Informe a marca, o modelo e o ano do veículo.");
      return;
    }

    const previous = items;
    const isEditing = Boolean(editing);
    const temporaryId = `temporary-${Date.now()}`;
    const optimistic: Vehicle = { id: editing?.id ?? temporaryId, ...draft };
    if (editing) setItems((current) => current.map((item) => item.id === editing.id ? optimistic : item));
    else setItems((current) => [optimistic, ...current]);
    setSaving(true);
    setError("");
    try {
      const response = await fetch(editing ? `/api/vehicles/${editing.id}` : "/api/vehicles", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const result = (await response.json()) as { vehicle?: Vehicle; error?: string };
      if (!response.ok || !result.vehicle) {
        setItems(previous);
        setError(result.error ?? "Não foi possível salvar o veículo.");
        return;
      }
      setItems((current) => current.map((item) => item.id === optimistic.id ? result.vehicle! : item));
      closeForm();
      showToast(isEditing ? "Veículo atualizado com sucesso." : "Veículo cadastrado com sucesso.");
    } catch {
      setItems(previous);
      setError("Não foi possível conectar ao AutoLink. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  async function removeVehicle(vehicle: Vehicle) {
    if (!window.confirm(`Remover ${vehicle.make} ${vehicle.model} da sua conta?`)) return;
    const previous = items;
    setItems((current) => current.filter((item) => item.id !== vehicle.id));
    setDeleting(vehicle.id);
    try {
      const response = await fetch(`/api/vehicles/${vehicle.id}`, { method: "DELETE" });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        setItems(previous);
        showToast(result.error ?? "Não foi possível remover o veículo.");
        return;
      }
      showToast("Veículo removido.");
    } catch {
      setItems(previous);
      showToast("Não foi possível conectar. O veículo foi restaurado.");
    } finally {
      setDeleting(null);
    }
  }

  return <>
    <div className="page-heading" style={{ marginTop: -6, marginBottom: 17 }}><div><span style={{ color: "var(--muted)", fontSize: 14 }}>{items.length} {items.length === 1 ? "veículo cadastrado" : "veículos cadastrados"}</span></div><button className="button button-primary" type="button" onClick={openNew}><Plus size={18} /> Adicionar veículo</button></div>
    {items.length ? <div className="vehicle-grid">{items.map((vehicle) => (
      <article className="card vehicle-card" key={vehicle.id}>
        <div className="vehicle-card-top"><div className="vehicle-large-icon"><CarFront size={30} /></div><span className="status-pill status-success">Cadastrado</span></div>
        <h2>{vehicle.make} {vehicle.model}</h2>
        <p>{vehicle.year}{vehicle.version ? ` · ${vehicle.version}` : ""}</p>
        <div className="vehicle-specs">
          <div><span>Placa</span><strong>{vehicle.plate || "Não informada"}</strong></div>
          <div><span>Combustível</span><strong>{vehicle.fuel || "Flex"}</strong></div>
          <div><span>Quilometragem</span><strong>{vehicle.mileage != null ? `${new Intl.NumberFormat("pt-BR").format(vehicle.mileage)} km` : "Não informada"}</strong></div>
          <div><span>Versão</span><strong>{vehicle.version || "Não informada"}</strong></div>
        </div>
        <div className="card-actions"><button className="button button-outline button-small" type="button" onClick={() => { setError(""); setEditing(vehicle); }}><Pencil size={15} /> Editar</button><button className="button button-ghost button-small" type="button" onClick={() => removeVehicle(vehicle)} disabled={deleting === vehicle.id}><Trash2 size={15} /> {deleting === vehicle.id ? "Removendo..." : "Remover"}</button></div>
      </article>
    ))}</div> : <div className="card"><EmptyState icon={<CarFront size={27} />} title="Você ainda não cadastrou um veículo." description="Cadastre seu carro para pedir atendimento e receber recomendações mais adequadas." action={<button className="button button-primary" type="button" onClick={openNew}><Plus size={17} /> Cadastrar meu veículo</button>} /></div>}

    {(creating || editing) && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeForm(); }}><section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="vehicle-modal-title"><div className="modal-head"><div><h2 id="vehicle-modal-title">{editing ? "Editar veículo" : "Adicionar veículo"}</h2><p>Preencha as informações do seu carro.</p></div><button className="icon-button" type="button" onClick={closeForm} aria-label="Fechar"><X size={20} /></button></div>
      <form className="form-stack" onSubmit={saveVehicle}>
        <div className="form-grid"><div className="field"><label htmlFor="vehicle-make">Marca</label><input id="vehicle-make" name="make" required maxLength={50} defaultValue={editing?.make ?? ""} placeholder="Ex.: Toyota" /></div><div className="field"><label htmlFor="vehicle-model">Modelo</label><input id="vehicle-model" name="model" required maxLength={60} defaultValue={editing?.model ?? ""} placeholder="Ex.: Corolla" /></div></div>
        <div className="form-grid"><div className="field"><label htmlFor="vehicle-year">Ano</label><input id="vehicle-year" name="year" type="number" min="1950" max={currentYear + 1} required defaultValue={editing?.year ?? ""} placeholder="2020" /></div><div className="field"><label htmlFor="vehicle-version">Versão <span style={{ fontWeight: 450, color: "#79848d" }}>(opcional)</span></label><input id="vehicle-version" name="version" maxLength={60} defaultValue={editing?.version ?? ""} placeholder="Ex.: XEi 2.0" /></div></div>
        <div className="form-grid"><div className="field"><label htmlFor="vehicle-plate">Placa <span style={{ fontWeight: 450, color: "#79848d" }}>(opcional)</span></label><input id="vehicle-plate" name="plate" maxLength={8} defaultValue={editing?.plate ?? ""} placeholder="ABC-1D23" /></div><div className="field"><label htmlFor="vehicle-fuel">Combustível</label><select id="vehicle-fuel" name="fuel" defaultValue={editing?.fuel ?? "Flex"}><option>Flex</option><option>Gasolina</option><option>Diesel</option><option>Etanol</option><option>Elétrico</option><option>Híbrido</option></select></div></div>
        <div className="field"><label htmlFor="vehicle-mileage">Quilometragem <span style={{ fontWeight: 450, color: "#79848d" }}>(opcional)</span></label><input id="vehicle-mileage" name="mileage" type="number" min="0" max="2000000" defaultValue={editing?.mileage ?? ""} placeholder="Ex.: 48500" /></div>
        {error && <p className="inline-error" role="alert">{error}</p>}
        <div className="modal-actions"><button className="button button-outline" type="button" onClick={closeForm}>Cancelar</button><button className="button button-primary" type="submit" disabled={saving}>{saving ? "Salvando..." : <><Check size={17} /> Salvar veículo</>}</button></div>
      </form>
    </section></div>}
    {toast && <div className="toast success" role="status"><Check size={18} />{toast}</div>}
  </>;
}
