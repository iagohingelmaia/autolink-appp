import { desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { diagnosticRequests, quotes, serviceRequests, towRequests, vehicles, workshops } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { ServicesHub } from "@/components/services-hub";

type Props = { searchParams: Promise<{ tab?: string }> };
export const dynamic = "force-dynamic";

export default async function ServicesPage({ searchParams }: Props) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const params = await searchParams;
  const initialTab = ["active", "requests", "history", "quotes"].includes(params.tab ?? "") ? params.tab as "active" | "requests" | "history" | "quotes" : "active";
  const [requestRows, quoteRows, towRows, diagnostics] = await Promise.all([
    db.select({ request: serviceRequests, vehicle: vehicles, workshop: workshops }).from(serviceRequests).leftJoin(vehicles, eq(serviceRequests.vehicleId, vehicles.id)).leftJoin(workshops, eq(serviceRequests.workshopId, workshops.id)).where(eq(serviceRequests.customerId, user.id)).orderBy(desc(serviceRequests.createdAt)),
    db.select({ quote: quotes, request: serviceRequests, workshop: workshops }).from(quotes).innerJoin(serviceRequests, eq(quotes.requestId, serviceRequests.id)).innerJoin(workshops, eq(quotes.workshopId, workshops.id)).where(eq(serviceRequests.customerId, user.id)).orderBy(desc(quotes.createdAt)),
    db.select({ tow: towRequests, vehicle: vehicles }).from(towRequests).leftJoin(vehicles, eq(towRequests.vehicleId, vehicles.id)).where(eq(towRequests.customerId, user.id)).orderBy(desc(towRequests.createdAt)),
    db.select().from(diagnosticRequests).where(eq(diagnosticRequests.customerId, user.id)).orderBy(desc(diagnosticRequests.createdAt)),
  ]);
  const requests = requestRows.map(({ request, vehicle, workshop }) => ({ ...request, vehicle, workshop }));
  const customerQuotes = quoteRows.map(({ quote, request, workshop }) => ({ ...quote, request, workshop }));
  const tows = towRows.map(({ tow, vehicle }) => ({ ...tow, vehicle }));
  return <ServicesHub initialRequests={requests} initialQuotes={customerQuotes} initialTows={tows} initialDiagnostics={diagnostics} initialTab={initialTab} />;
}
