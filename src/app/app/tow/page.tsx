import { desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { towRequests, vehicles } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { TowAssistance } from "@/components/tow-assistance";

export const dynamic = "force-dynamic";

export default async function TowPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const [userVehicles, rows] = await Promise.all([
    db.select().from(vehicles).where(eq(vehicles.userId, user.id)),
    db.select({ request: towRequests, vehicle: vehicles }).from(towRequests).leftJoin(vehicles, eq(towRequests.vehicleId, vehicles.id)).where(eq(towRequests.customerId, user.id)).orderBy(desc(towRequests.createdAt)),
  ]);
  const requests = rows.map(({ request, vehicle }) => ({ ...request, vehicle }));
  return <><div className="page-heading"><div><h1>Ajuda na estrada</h1><p>Registre onde você está e o que seu veículo precisa.</p></div></div><TowAssistance vehicles={userVehicles} initialRequests={requests} /></>;
}
