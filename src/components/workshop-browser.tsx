"use client";

import { ArrowRight, Clock3, MapPin, Pin, Search, Star, Wrench } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { EmptyState } from "@/components/ui";

type Service = { id: string; name: string; description: string; priceFrom: number; durationMinutes: number };
type Workshop = { id: string; name: string; description: string; address: string; city: string; state: string; rating: number; reviewCount: number; distanceKm: number; isOpen: boolean; isDemo: boolean; services: Service[] };

export function WorkshopBrowser({ initialWorkshops }: { initialWorkshops: Workshop[] }) {
  const [query, setQuery] = useState("");
  const [specialty, setSpecialty] = useState("all");
  const [sort, setSort] = useState("distance");
  const [minimumRating, setMinimumRating] = useState("all");
  const [maximumPrice, setMaximumPrice] = useState("all");
  const [openOnly, setOpenOnly] = useState(false);
  const specialties = useMemo(() => [...new Set(initialWorkshops.flatMap((item) => item.services.map((service) => service.name)))].sort((a, b) => a.localeCompare(b, "pt-BR")), [initialWorkshops]);
  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("pt-BR");
    const values = initialWorkshops.filter((item) => {
      const haystack = `${item.name} ${item.address} ${item.city} ${item.services.map((service) => service.name).join(" ")}`.toLocaleLowerCase("pt-BR");
      const priceCents = item.services.length ? Math.min(...item.services.map((service) => service.priceFrom)) : 0;
      const passesRating = minimumRating === "all" || Number(item.rating) >= Number(minimumRating);
      const passesPrice = maximumPrice === "all" || priceCents <= Number(maximumPrice) * 100;
      return (!normalized || haystack.includes(normalized)) && (specialty === "all" || item.services.some((service) => service.name === specialty)) && (!openOnly || item.isOpen) && passesRating && passesPrice;
    });
    return values.sort((a, b) => sort === "rating" ? b.rating - a.rating : sort === "name" ? a.name.localeCompare(b.name, "pt-BR") : a.distanceKm - b.distanceKm);
  }, [initialWorkshops, maximumPrice, minimumRating, openOnly, query, sort, specialty]);

  return <>
    <div className="map-placeholder" role="img" aria-label="Ilustração esquemática, sem localização ou mapa em tempo real">
      <span className="map-pin pin-one"><Pin size={13} /></span><span className="map-pin pin-two"><Pin size={13} /></span><span className="map-pin pin-three"><Pin size={13} /></span>
      <span className="map-caption">Prévia esquemática · sem mapa ou localização em tempo real</span>
    </div>
    <div className="note" style={{ marginTop: 12, marginBottom: 17 }}><MapPin size={17} /><span>Oficinas, distâncias, avaliações e preços são dados de demonstração da região de São Paulo. O mapa será integrado futuramente.</span></div>
    <div className="toolbar">
      <label className="search-field"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por bairro, oficina ou serviço" aria-label="Buscar por bairro, oficina ou serviço" /></label>
      <select className="filter-select" value={specialty} onChange={(event) => setSpecialty(event.target.value)} aria-label="Filtrar por especialidade"><option value="all">Todas as especialidades</option>{specialties.map((item) => <option key={item} value={item}>{item}</option>)}</select>
      <select className="filter-select" value={minimumRating} onChange={(event) => setMinimumRating(event.target.value)} aria-label="Avaliação mínima"><option value="all">Qualquer avaliação</option><option value="4">Nota 4 ou mais</option><option value="4.5">Nota 4,5 ou mais</option></select>
      <select className="filter-select" value={maximumPrice} onChange={(event) => setMaximumPrice(event.target.value)} aria-label="Preço inicial máximo"><option value="all">Qualquer preço</option><option value="150">Até R$ 150</option><option value="250">Até R$ 250</option><option value="400">Até R$ 400</option></select>
      <select className="filter-select" value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Ordenar oficinas"><option value="distance">Menor distância</option><option value="rating">Melhor avaliação</option><option value="name">Nome A–Z</option></select>
      <button className={`button button-small ${openOnly ? "button-dark" : "button-outline"}`} type="button" onClick={() => setOpenOnly((current) => !current)} aria-pressed={openOnly}><Clock3 size={16} /> {openOnly ? "Apenas abertas" : "Abertas agora"}</button>
    </div>
    <div className="section-heading" style={{ marginBottom: 13 }}><div><h2>Oficinas para você</h2><p>{filtered.length} {filtered.length === 1 ? "opção encontrada" : "opções encontradas"}</p></div></div>
    {filtered.length ? <div className="workshop-grid">{filtered.map((workshop) => (
      <article className="card workshop-card" key={workshop.id}>
        <div className="workshop-card-head"><div className="workshop-avatar"><Wrench size={25} /></div><div className="workshop-title"><h2>{workshop.name}</h2><p>{workshop.address} · {workshop.city}</p></div><span className="rating"><Star size={15} /> {Number(workshop.rating).toFixed(1)}</span></div>
        <div className="workshop-meta"><span><MapPin size={15} /> ~{Number(workshop.distanceKm).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} km <span style={{ color: "#89949d" }}>(aprox.)</span></span><span><Star size={15} /> {workshop.reviewCount} avaliações demonstrativas</span><span>Serviços desde {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format((workshop.services.length ? Math.min(...workshop.services.map((service) => service.priceFrom)) : 0) / 100)}*</span></div>
        <p style={{ margin: "0 0 11px", color: "#586671", fontSize: 14 }}>{workshop.description}</p>
        <div className="tag-row">{workshop.services.slice(0, 4).map((service) => <span className="tag" key={service.id}>{service.name}</span>)}</div>
        <div className="workshop-card-foot"><span className={`open-label${workshop.isOpen ? "" : " closed"}`}><span className="eyebrow-dot" style={{ width: 7, height: 7, background: workshop.isOpen ? "#218739" : "#929ba3" }} />{workshop.isOpen ? "Aberta hoje" : "Fechada agora"}</span><Link className="button button-dark button-small" href={`/app/workshops/${workshop.id}`}>Ver oficina <ArrowRight size={15} /></Link></div>
      </article>
    ))}</div> : <div className="card"><EmptyState icon={<Search size={25} />} title="Não encontramos oficinas com esses filtros." description="Tente buscar por outro serviço ou limpe os filtros para ver todas as opções." action={<button className="button button-outline button-small" type="button" onClick={() => { setQuery(""); setSpecialty("all"); setMinimumRating("all"); setMaximumPrice("all"); setOpenOnly(false); }}>Limpar filtros</button>} /></div>}
  </>;
}
