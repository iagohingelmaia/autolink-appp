import { asc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/db";
import { vehicles, workshops } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { PartInquiry } from "@/components/part-inquiry";

export const dynamic = "force-dynamic";

export default async function PartsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const [userVehicles, shops] = await Promise.all([
    db.select().from(vehicles).where(eq(vehicles.userId, user.id)),
    db.select({ id: workshops.id, name: workshops.name, city: workshops.city }).from(workshops).orderBy(asc(workshops.name)),
  ]);
  return <><div className="page-heading"><div><h1>Encontrar peça</h1><p>Peça a uma oficina para consultar a disponibilidade para o seu carro.</p></div></div>{userVehicles.length && shops.length ? <PartInquiry vehicles={userVehicles} workshops={shops} /> : <div className="card"><div className="empty-state"><h3>{!userVehicles.length ? "Cadastre seu veículo primeiro." : "Nenhuma oficina disponível."}</h3><p>{!userVehicles.length ? "Precisamos saber qual carro receberá o atendimento." : "Tente novamente mais tarde."}</p>{!userVehicles.length && <Link className="button button-primary" href="/app/vehicles">Cadastrar veículo</Link>}</div></div>}</>;
}
