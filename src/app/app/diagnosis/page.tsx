import { desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { diagnosticRequests, vehicles } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { DiagnosticFlow } from "@/components/diagnostic-flow";

export const dynamic = "force-dynamic";

export default async function DiagnosisPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const [userVehicles, rows] = await Promise.all([
    db.select().from(vehicles).where(eq(vehicles.userId, user.id)),
    db.select({ diagnostic: diagnosticRequests, vehicle: vehicles }).from(diagnosticRequests).leftJoin(vehicles, eq(diagnosticRequests.vehicleId, vehicles.id)).where(eq(diagnosticRequests.customerId, user.id)).orderBy(desc(diagnosticRequests.createdAt)),
  ]);
  const diagnostics = rows.map(({ diagnostic, vehicle }) => ({ ...diagnostic, vehicle }));
  return <><div className="page-heading"><div><h1>Diagnóstico AutoLink</h1><p>Uma orientação inicial para ajudar você a entender o que pode estar acontecendo.</p></div></div><DiagnosticFlow vehicles={userVehicles} initialDiagnostics={diagnostics} /></>;
}
