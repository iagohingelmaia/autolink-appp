import { desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { diagnosticRequests, serviceRequests, towRequests, vehicles, workshops } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { ServicesHub } from "@/components/services-hub";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const [requestRows, towRows, diagnostics] = await Promise.all([
    db.select({ request: serviceRequests, vehicle: vehicles, workshop: workshops }).from(serviceRequests).leftJoin(vehicles, eq(serviceRequests.vehicleId, vehicles.id)).leftJoin(workshops, eq(serviceRequests.workshopId, workshops.id)).where(eq(serviceRequests.customerId, user.id)).orderBy(desc(serviceRequests.createdAt)),
    db.select({ tow: towRequests, vehicle: vehicles }).from(towRequests).leftJoin(vehicles, eq(towRequests.vehicleId, vehicles.id)).where(eq(towRequests.customerId, user.id)).orderBy(desc(towRequests.createdAt)),
    db.select().from(diagnosticRequests).where(eq(diagnosticRequests.customerId, user.id)).orderBy(desc(diagnosticRequests.createdAt)),
  ]);
  return <ServicesHub
    initialRequests={requestRows.map(({ request, vehicle, workshop }) => ({ ...request, vehicle, workshop }))}
    initialQuotes={[]}
    initialTows={towRows.map(({ tow, vehicle }) => ({ ...tow, vehicle }))}
    initialDiagnostics={diagnostics}
    initialTab="history"
  />;
}
