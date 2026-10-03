import { asc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { workshopServices, workshops } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { ensureDemoData } from "@/lib/seed";
import { WorkshopBrowser } from "@/components/workshop-browser";

export const dynamic = "force-dynamic";

export default async function WorkshopsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  await ensureDemoData();
  const [items, services] = await Promise.all([
    db.select().from(workshops).orderBy(asc(workshops.distanceKm)),
    db.select().from(workshopServices),
  ]);
  const withServices = items.map((item) => ({ ...item, services: services.filter((service) => service.workshopId === item.id) }));
  return <>
    <div className="page-heading"><div><h1>Encontrar oficina</h1><p>Encontre uma oficina para cuidar do seu carro com confiança.</p></div></div>
    {withServices.length ? <WorkshopBrowser initialWorkshops={withServices} /> : <div className="card"><div className="empty-state"><h3>Nenhuma oficina disponível agora.</h3><p>Volte em alguns instantes para ver novas opções.</p></div></div>}
  </>;
}
