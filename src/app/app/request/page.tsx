import { asc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { vehicles, workshopServices, workshops } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { ensureDemoData } from "@/lib/seed";
import { RequestWizard } from "@/components/request-wizard";

type Props = { searchParams: Promise<{ workshop?: string }> };
export const dynamic = "force-dynamic";

export default async function RequestPage({ searchParams }: Props) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  await ensureDemoData();
  const params = await searchParams;
  const [userVehicles, shops, services] = await Promise.all([
    db.select().from(vehicles).where(eq(vehicles.userId, user.id)),
    db.select().from(workshops).orderBy(asc(workshops.name)),
    db.select().from(workshopServices),
  ]);
  const withServices = shops.map((shop) => ({ ...shop, services: services.filter((service) => service.workshopId === shop.id) }));
  return <>
    <div className="page-heading"><div><h1>Solicitar atendimento</h1><p>Conte o que seu carro precisa. A oficina responderá pelo AutoLink.</p></div></div>
    {userVehicles.length && withServices.length ? <RequestWizard vehicles={userVehicles} workshops={withServices} preselectedWorkshop={params.workshop} /> : <div className="card"><div className="empty-state"><h3>{!userVehicles.length ? "Cadastre seu veículo primeiro." : "Nenhuma oficina disponível."}</h3><p>{!userVehicles.length ? "Precisamos saber qual carro receberá o atendimento." : "Tente novamente mais tarde."}</p>{!userVehicles.length && <a className="button button-primary" href="/app/vehicles">Cadastrar veículo</a>}</div></div>}
  </>;
}
