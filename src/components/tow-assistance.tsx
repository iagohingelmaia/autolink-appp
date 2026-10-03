"use client";

import { AlertTriangle, CheckCircle2, Crosshair, MapPin, Truck } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { formatDate, statusLabel } from "@/lib/format";
import { StatusBadge } from "@/components/ui";

type Vehicle = { id: string; make: string; model: string; year: number; plate: string | null };
type Tow = { id: string; protocol: string; vehicleId: string | null; location: string; problem: string; status: string; createdAt: Date | string; vehicle: Vehicle | null };

export function TowAssistance({ vehicles, initialRequests }: { vehicles: Vehicle[]; initialRequests: Tow[] }) {
  const [showForm, setShowForm] = useState(false);
  const [requests, setRequests] = useState(initialRequests);
  const [vehicleId, setVehicleId] = useState(vehicles[0]?.id ?? "");
  const [location, setLocation] = useState("");
  const [problem, setProblem] = useState("");
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [geoBusy, setGeoBusy] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [createdProtocol, setCreatedProtocol] = useState("");

  function useLocation() {
    setError("");
    if (!navigator.geolocation) { setError("Seu navegador não oferece acesso à localização. Informe o endereço manualmente."); return; }
    setGeoBusy(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords: position }) => {
        setCoords({ latitude: position.latitude, longitude: position.longitude });
        if (!location.trim()) setLocation("Localização atual informada pelo aparelho");
        setGeoBusy(false);
      },
      () => { setGeoBusy(false); setError("Não conseguimos acessar sua localização. Confira a permissão do navegador ou informe o endereço manualmente."); },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
    );
  }

  async function submit() {
    if (!vehicleId || location.trim().length < 5 || problem.trim().length < 3) { setError("Informe seu veículo, onde você está e o que aconteceu."); return; }
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/tow", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ vehicleId, location: location.trim(), problem: problem.trim(), latitude: coords?.latitude, longitude: coords?.longitude }) });
      const result = (await response.json()) as { request?: Tow; error?: string };
      if (!response.ok || !result.request) { setError(result.error ?? "Não foi possível registrar o pedido."); return; }
      setCreatedProtocol(result.request.protocol);
      setRequests((current) => [{ ...result.request!, vehicle: vehicles.find((vehicle) => vehicle.id === vehicleId) ?? null }, ...current]);
      setShowForm(false);
      setLocation("");
      setProblem("");
      setCoords(null);
    } catch { setError("Não foi possível conectar. Tente novamente."); }
    finally { setBusy(false); }
  }

  return <>
    <section className="tow-hero"><div><span className="eyebrow" style={{ color: "white", borderColor: "rgba(255,255,255,.18)", background: "rgba(255,255,255,.08)" }}><span className="eyebrow-dot" /> Assistência</span><h2>Precisa de ajuda na estrada?</h2><p>Conte onde você está e o que aconteceu. Seu pedido ficará registrado para acompanhamento.</p><button type="button" className="button button-primary" style={{ marginTop: 18 }} onClick={() => { setShowForm(true); setError(""); }}><Truck size={19} /> CHAMAR GUINCHO</button></div><div className="tow-hero-illustration"><Truck size={67} strokeWidth={1.6} /></div></section>
    <div className="note note-warning" style={{ marginTop: 15 }}><AlertTriangle size={18} /><span><strong>Importante:</strong> a AutoLink ainda não está conectada a uma central de guincho. O pedido será salvo, mas nenhum motorista será enviado automaticamente. Não há rastreamento em tempo real.</span></div>

    {createdProtocol && <div className="card confirmation" style={{ marginTop: 18 }}><div className="confirmation-icon"><CheckCircle2 size={31} /></div><h2>Pedido registrado.</h2><p>Seu protocolo é <strong>{createdProtocol}</strong>. O registro está salvo na AutoLink, mas a plataforma ainda não envia assistência real.</p><Link className="button button-outline button-small" href="/app/services">Ver meus serviços</Link></div>}

    {showForm && <section className="card card-pad" style={{ maxWidth: 730, margin: "20px auto 0" }}><div className="modal-head"><div><h2 style={{ color: "var(--navy)", margin: 0 }}>Pedir um guincho</h2><p>Confira as informações antes de registrar.</p></div><button className="button button-ghost button-small" type="button" onClick={() => setShowForm(false)}>Cancelar</button></div>
      <div className="form-stack"><div className="field"><label htmlFor="tow-vehicle">Veículo</label><select id="tow-vehicle" value={vehicleId} onChange={(event) => setVehicleId(event.target.value)}><option value="">Escolha seu veículo</option>{vehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.make} {vehicle.model} {vehicle.year} {vehicle.plate ? `· ${vehicle.plate}` : ""}</option>)}</select>{!vehicles.length && <Link className="text-link" href="/app/vehicles">Cadastre um veículo primeiro</Link>}</div>
        <div className="field"><label htmlFor="tow-location">Onde você está?</label><input id="tow-location" value={location} onChange={(event) => { setLocation(event.target.value); setCoords(null); }} placeholder="Rua, número, bairro e cidade" required /><button type="button" className="button button-outline button-small" style={{ alignSelf: "flex-start" }} onClick={useLocation} disabled={geoBusy}><Crosshair size={16} />{geoBusy ? "Buscando localização..." : "Usar minha localização"}</button>{coords && <span className="field-hint" role="status"><MapPin size={14} style={{ verticalAlign: "middle" }} /> Localização obtida. Você autorizou o uso neste pedido.</span>}</div>
        <div className="field"><label htmlFor="tow-problem">O que aconteceu?</label><select id="tow-problem" value={problem} onChange={(event) => setProblem(event.target.value)}><option value="">Escolha uma opção</option><option>Carro não liga</option><option>Pneu furado</option><option>Pane mecânica</option><option>Acidente</option><option>Superaquecimento</option><option>Outro problema</option></select></div>
      </div>
      {error && <div className="alert alert-error" role="alert" style={{ marginTop: 14 }}>{error}</div>}
      <div className="note" style={{ marginTop: 15 }}><MapPin size={17} /><span>Você está solicitando assistência para: <strong>{vehicles.find((vehicle) => vehicle.id === vehicleId)?.make} {vehicles.find((vehicle) => vehicle.id === vehicleId)?.model}</strong> · {location || "localização não informada"}</span></div>
      <div className="modal-actions"><button type="button" className="button button-outline" onClick={() => setShowForm(false)}>Voltar</button><button type="button" className="button button-primary" onClick={submit} disabled={busy || !vehicles.length}>{busy ? "Registrando..." : "CONFIRMAR SOLICITAÇÃO"}</button></div>
    </section>}

    <section className="section-block"><div className="section-heading"><div><h2>Pedidos recentes</h2><p>O status mostra apenas as atualizações registradas na plataforma.</p></div></div>
      {requests.length ? <div className="card card-pad"><div className="list-stack">{requests.map((item) => <div className="list-row" key={item.id}><div className="list-icon"><Truck size={20} /></div><div className="list-row-copy"><strong>{item.vehicle ? `${item.vehicle.make} ${item.vehicle.model}` : "Assistência ao veículo"}</strong><span>{item.location} · {item.protocol} · {formatDate(item.createdAt)}</span></div><StatusBadge status={item.status} label={statusLabel(item.status)} /></div>)}</div></div> : <div className="card"><div className="empty-state"><div className="empty-icon"><Truck size={26} /></div><h3>Nenhum pedido de guincho ainda.</h3><p>Quando você registrar um pedido, poderá consultá-lo por aqui.</p></div></div>}
    </section>
  </>;
}
