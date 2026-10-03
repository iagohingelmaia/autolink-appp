import { ArrowRight, CalendarDays, CarFront, ClipboardCheck, Clock3, MapPin, PackageSearch, Plus, ShieldCheck, Wrench } from "lucide-react";
import Link from "next/link";
import { and, desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { serviceRequests, vehicles, workshops } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { formatDate, statusClass, statusLabel } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function DashboardHomePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const [vehicle] = await db.select().from(vehicles).where(eq(vehicles.userId, user.id)).orderBy(desc(vehicles.createdAt)).limit(1);
  const recent = await db
    .select({ request: serviceRequests, workshop: workshops })
    .from(serviceRequests)
    .leftJoin(workshops, eq(serviceRequests.workshopId, workshops.id))
    .where(eq(serviceRequests.customerId, user.id))
    .orderBy(desc(serviceRequests.createdAt))
    .limit(4);
  const firstName = user.fullName.split(" ")[0];
  const serviceCount = recent.filter(({ request }) => !["COMPLETED", "CANCELED"].includes(request.status)).length;

  return (
    <>
      <section className="welcome-panel">
        <div className="welcome-copy">
          <span className="welcome-kicker">Sua AutoLink está pronta para ajudar</span>
          <h1>Olá, {firstName}.<br />Como podemos ajudar?</h1>
          <p>Encontre um atendimento, organize os cuidados do carro ou peça ajuda quando precisar.</p>
          <Link className="button button-primary" href="/app/workshops">Encontrar uma oficina <ArrowRight size={17} /></Link>
        </div>
        {vehicle ? (
          <div className="welcome-vehicle">
            <div className="vehicle-label"><CarFront size={16} /> SEU VEÍCULO PRINCIPAL</div>
            <div className="vehicle-main"><div className="vehicle-icon"><CarFront size={29} /></div><div><strong>{vehicle.make} {vehicle.model}</strong><span>{vehicle.year}{vehicle.version ? ` · ${vehicle.version}` : ""}</span></div></div>
            <div className="vehicle-footer">{vehicle.plate ? `${vehicle.plate} · ` : ""}{vehicle.mileage ? `${new Intl.NumberFormat("pt-BR").format(vehicle.mileage)} km` : "Pronto para receber atendimento"}</div>
            <Link href="/app/vehicles" className="text-link" style={{ color: "#fff", marginTop: 11, fontSize: 13 }}>Ver meu veículo <ArrowRight size={14} /></Link>
          </div>
        ) : (
          <div className="welcome-vehicle"><div className="vehicle-label"><CarFront size={16} /> CADASTRE SEU VEÍCULO</div><p style={{ color: "white", margin: "9px 0 14px" }}>Adicione seu carro para solicitar atendimentos com mais facilidade.</p><Link className="button button-primary button-small" href="/app/vehicles"><Plus size={16} /> Cadastrar veículo</Link></div>
        )}
      </section>

      <section className="section-block" aria-labelledby="quick-title">
        <div className="section-heading"><div><h2 id="quick-title">O que você precisa?</h2><p>Acesse o que precisa em um toque.</p></div></div>
        <div className="quick-grid">
          <Link className="quick-card" href="/app/workshops"><span className="quick-icon"><Wrench size={23} /></span><h3>Encontrar oficina</h3><p>Veja opções próximas ao seu bairro.</p></Link>
          <Link className="quick-card emergency" href="/app/tow"><span className="quick-icon"><MapPin size={23} /></span><h3>Preciso de um guincho</h3><p>Peça assistência na estrada.</p></Link>
          <Link className="quick-card" href="/app/diagnosis"><span className="quick-icon"><ShieldCheck size={23} /></span><h3>Diagnosticar problema</h3><p>Conte o que está acontecendo.</p></Link>
          <Link className="quick-card" href="/app/services"><span className="quick-icon"><ClipboardCheck size={23} /></span><h3>Meus serviços</h3><p>Acompanhe pedidos e histórico.</p></Link>
          <Link className="quick-card" href="/app/parts"><span className="quick-icon"><PackageSearch size={23} /></span><h3>Encontrar peça</h3><p>Consulte disponibilidade com uma oficina.</p></Link>
        </div>
      </section>

      <section className="section-block dashboard-grid">
        <div className="card card-pad">
          <div className="card-title"><span>Serviços recentes</span><Link className="text-link" href="/app/services">Ver todos <ArrowRight size={15} /></Link></div>
          {recent.length ? <div className="list-stack">{recent.map(({ request, workshop }) => (
            <div className="list-row" key={request.id}>
              <div className="list-icon"><Wrench size={19} /></div>
              <div className="list-row-copy"><strong>{request.serviceType}</strong><span>{workshop?.name ?? "Oficina a definir"} · {formatDate(request.preferredAt ?? request.createdAt)}</span></div>
              <span className={`status-pill ${statusClass(request.status)}`}>{statusLabel(request.status)}</span>
            </div>
          ))}</div> : <div className="empty-state"><div className="empty-icon"><ClipboardCheck size={24} /></div><h3>Nenhum serviço por aqui, ainda.</h3><p>Quando você solicitar um atendimento, ele aparecerá nesta lista.</p><Link className="button button-outline button-small" href="/app/workshops">Encontrar oficina</Link></div>}
        </div>
        <div className="card card-pad">
          <div className="card-title">Seu resumo <small>Atividade da conta</small></div>
          <div className="stat-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <div className="stat-card" style={{ padding: "12px 0" }}><div className="stat-icon"><CarFront size={18} /></div><strong>{vehicle ? "1" : "0"}</strong><span>Veículo cadastrado</span></div>
            <div className="stat-card" style={{ padding: "12px 0" }}><div className="stat-icon"><Clock3 size={18} /></div><strong>{serviceCount}</strong><span>Atendimento(s) ativo(s)</span></div>
          </div>
          <div className="note" style={{ marginTop: 10 }}><CalendarDays size={17} /><span>Seus pedidos e datas ficam organizados aqui. A confirmação é enviada pela oficina.</span></div>
          <Link className="button button-dark button-wide" href="/app/services" style={{ marginTop: 16 }}>Acompanhar meus serviços <ArrowRight size={16} /></Link>
        </div>
      </section>
    </>
  );
}
