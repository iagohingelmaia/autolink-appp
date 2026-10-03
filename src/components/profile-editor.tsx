"use client";

import { Bell, CarFront, Check, Heart, LogOut, MapPin, Pencil, Phone, Save, ShieldCheck, Trash2, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import type { PublicUser } from "@/lib/auth";
import { initials } from "@/lib/format";

type Profile = { id: string; fullName: string; email: string; phone: string | null; address: string | null; notificationsEnabled: boolean; createdAt: Date | string };
type Vehicle = { id: string; make: string; model: string; year: number; plate: string | null };
type SavedItem = { id: string; workshopId: string; workshop: { id: string; name: string; address: string; city: string } };

export function ProfileEditor({ profile: initialProfile, vehicles, initialSaved }: { profile: Profile; vehicles: Vehicle[]; initialSaved: SavedItem[] }) {
  const router = useRouter();
  const [profile, setProfile] = useState(initialProfile);
  const [saved, setSaved] = useState(initialSaved);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  function notify(message: string) { setToast(message); window.setTimeout(() => setToast(""), 3200); }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const previous = profile;
    const body = {
      fullName: String(form.get("fullName") ?? "").trim(),
      phone: String(form.get("phone") ?? "").trim(),
      address: String(form.get("address") ?? "").trim(),
      notificationsEnabled: profile.notificationsEnabled,
    };
    const optimistic = { ...profile, ...body, phone: body.phone || null, address: body.address || null };
    setProfile(optimistic);
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const result = (await response.json()) as { profile?: Profile; error?: string };
      if (!response.ok || !result.profile) { setProfile(previous); setError(result.error ?? "Não foi possível salvar o perfil."); return; }
      setProfile({ ...profile, ...result.profile });
      setEditing(false);
      router.refresh();
      notify("Perfil atualizado com sucesso.");
    } catch { setProfile(previous); setError("Não foi possível conectar. Tente novamente."); }
    finally { setBusy(false); }
  }

  async function toggleNotifications() {
    const next = !profile.notificationsEnabled;
    setProfile((current) => ({ ...current, notificationsEnabled: next }));
    try {
      const response = await fetch("/api/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...profile, notificationsEnabled: next }) });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) { setProfile((current) => ({ ...current, notificationsEnabled: !next })); notify(result.error ?? "Não foi possível atualizar a preferência."); }
      else notify(next ? "Notificações ativadas." : "Notificações desativadas.");
    } catch { setProfile((current) => ({ ...current, notificationsEnabled: !next })); notify("Não foi possível salvar a preferência."); }
  }

  async function removeSaved(item: SavedItem) {
    const previous = saved;
    setSaved((current) => current.filter((entry) => entry.id !== item.id));
    try {
      const response = await fetch("/api/saved-workshops", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ workshopId: item.workshopId }) });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) { setSaved(previous); notify(result.error ?? "Não foi possível remover a oficina."); }
      else notify("Oficina removida dos salvos.");
    } catch { setSaved(previous); notify("Não foi possível conectar. Tente novamente."); }
  }

  async function logout() {
    setLoggingOut(true);
    try { await fetch("/api/auth/logout", { method: "POST" }); }
    finally { router.push("/"); router.refresh(); setLoggingOut(false); }
  }

  return <>
    <div className="page-heading"><div><h1>Meu perfil</h1><p>Cuide dos seus dados, veículos e preferências.</p></div></div>
    <div className="profile-grid">
      <section className="card">
        <div className="profile-hero"><div className="profile-avatar">{initials(profile.fullName)}</div><div><h2>{profile.fullName}</h2><p>{profile.email}</p></div></div>
        <div className="card-pad" style={{ paddingTop: 0 }}>
          {!editing ? <><div className="settings-row"><div><strong><UserRound size={15} style={{ verticalAlign: "middle", marginRight: 7 }} />Nome</strong><span>{profile.fullName}</span></div></div><div className="settings-row"><div><strong>E-mail</strong><span>{profile.email}</span></div><ShieldCheck size={17} color="var(--success)" /></div><div className="settings-row"><div><strong><Phone size={15} style={{ verticalAlign: "middle", marginRight: 7 }} />Telefone</strong><span>{profile.phone || "Não informado"}</span></div></div><div className="settings-row"><div><strong><MapPin size={15} style={{ verticalAlign: "middle", marginRight: 7 }} />Endereço</strong><span>{profile.address || "Não informado"}</span></div></div><button className="button button-outline button-wide" type="button" style={{ marginTop: 17 }} onClick={() => { setEditing(true); setError(""); }}><Pencil size={16} /> Editar meus dados</button></> : <form className="form-stack" onSubmit={saveProfile}>
            <div className="field"><label htmlFor="profile-name">Nome completo</label><input id="profile-name" name="fullName" defaultValue={profile.fullName} minLength={2} maxLength={100} required /></div><div className="field"><label htmlFor="profile-phone">Telefone</label><input id="profile-phone" name="phone" defaultValue={profile.phone ?? ""} type="tel" maxLength={30} placeholder="(11) 99999-9999" /></div><div className="field"><label htmlFor="profile-address">Endereço</label><input id="profile-address" name="address" defaultValue={profile.address ?? ""} maxLength={200} placeholder="Rua, número, bairro e cidade" /></div>{error && <p className="inline-error" role="alert">{error}</p>}<div className="card-actions"><button className="button button-primary" type="submit" disabled={busy}>{busy ? "Salvando..." : <><Save size={16} /> Salvar</>}</button><button className="button button-outline" type="button" onClick={() => { setEditing(false); setError(""); }}>Cancelar</button></div></form>}
        </div>
      </section>
      <div style={{ display: "grid", gap: 15, alignContent: "start" }}>
        <section className="card card-pad"><h2 className="card-title">Preferências</h2><div className="settings-row"><div><strong><Bell size={16} style={{ verticalAlign: "middle", marginRight: 7 }} />Notificações</strong><span>Receber atualizações sobre pedidos e orçamentos.</span></div><button type="button" className={`toggle${profile.notificationsEnabled ? " on" : ""}`} aria-pressed={profile.notificationsEnabled} aria-label="Ativar ou desativar notificações" onClick={toggleNotifications} /></div><div className="settings-row"><div><strong><ShieldCheck size={16} style={{ verticalAlign: "middle", marginRight: 7 }} />Segurança</strong><span>Senha protegida com hash seguro no servidor.</span></div></div></section>
        <section className="card card-pad"><div className="card-title"><span><CarFront size={18} style={{ verticalAlign: "middle", marginRight: 7 }} />Meus veículos</span><Link href="/app/vehicles" className="text-link">Gerenciar</Link></div>{vehicles.length ? vehicles.map((vehicle) => <div className="settings-row" key={vehicle.id}><div><strong>{vehicle.make} {vehicle.model} {vehicle.year}</strong><span>{vehicle.plate || "Placa não informada"}</span></div></div>) : <p className="field-hint">Nenhum veículo cadastrado.</p>}</section>
      </div>
    </div>
    <section className="section-block card card-pad"><div className="card-title"><span><Heart size={18} style={{ verticalAlign: "middle", marginRight: 7 }} />Oficinas salvas</span><Link href="/app/workshops" className="text-link">Encontrar oficinas</Link></div>{saved.length ? <div className="list-stack">{saved.map((item) => <div className="list-row" key={item.id}><div className="list-icon"><Heart size={18} /></div><div className="list-row-copy"><strong>{item.workshop.name}</strong><span>{item.workshop.address} · {item.workshop.city}</span></div><Link className="button button-outline button-small" href={`/app/workshops/${item.workshopId}`}>Ver</Link><button className="icon-button" type="button" aria-label={`Remover ${item.workshop.name} dos salvos`} onClick={() => removeSaved(item)}><Trash2 size={17} /></button></div>)}</div> : <div className="empty-state" style={{ padding: "25px 12px 10px" }}><div className="empty-icon"><Heart size={23} /></div><h3>Nenhuma oficina salva</h3><p>Toque em “Salvar oficina” nos detalhes para guardar uma opção.</p></div>}</section>
    <div style={{ marginTop: 20 }}><button className="button button-outline" type="button" onClick={logout} disabled={loggingOut}><LogOut size={16} />{loggingOut ? "Saindo..." : "Sair da conta"}</button></div>
    {toast && <div className="toast success" role="status"><Check size={17} />{toast}</div>}
  </>;
}
