import { desc, eq } from "drizzle-orm";
import { BriefcaseBusiness } from "lucide-react";
import { db } from "@/db";
import { quotes, serviceRequests, users, vehicles, workshops } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { WorkshopDashboard } from "@/components/workshop-dashboard";

export const dynamic = "force-dynamic";

export default async function WorkshopDashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const [workshop] = await db.select().from(workshops).where(eq(workshops.ownerId, user.id)).limit(1);
  if (!workshop) return <div className="card"><div className="empty-state"><div className="empty-icon"><BriefcaseBusiness size={25} /></div><h3>Nenhuma oficina vinculada</h3><p>Esta conta ainda não está associada a um perfil de oficina.</p></div></div>;
  const [requestRows, workshopQuotes] = await Promise.all([
    db.select({ request: serviceRequests, customer: users, vehicle: vehicles }).from(serviceRequests).innerJoin(users, eq(serviceRequests.customerId, users.id)).leftJoin(vehicles, eq(serviceRequests.vehicleId, vehicles.id)).where(eq(serviceRequests.workshopId, workshop.id)).orderBy(desc(serviceRequests.createdAt)),
    db.select().from(quotes).where(eq(quotes.workshopId, workshop.id)).orderBy(desc(quotes.createdAt)),
  ]);
  const requests = requestRows.map(({ request, customer, vehicle }) => ({
    ...request,
    customer: { id: customer.id, fullName: customer.fullName, phone: customer.phone },
    vehicle,
    quote: workshopQuotes.find((quote) => quote.requestId === request.id) ?? null,
  }));
  return <WorkshopDashboard workshop={workshop} initialRequests={requests} initialQuotes={workshopQuotes} />;
}
