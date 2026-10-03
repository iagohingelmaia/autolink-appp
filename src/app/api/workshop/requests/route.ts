import { desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { serviceRequests, users, vehicles, workshops } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Entre na sua conta para continuar." }, { status: 401 });
  if (user.role !== "WORKSHOP" && user.role !== "ADMIN") return Response.json({ error: "Acesso exclusivo para oficinas." }, { status: 403 });
  try {
    const owned = await db.select().from(workshops).where(eq(workshops.ownerId, user.id));
    if (!owned.length) return Response.json({ requests: [], workshop: null });
    const rows = await db
      .select({ request: serviceRequests, customer: users, vehicle: vehicles, workshop: workshops })
      .from(serviceRequests)
      .innerJoin(users, eq(serviceRequests.customerId, users.id))
      .leftJoin(vehicles, eq(serviceRequests.vehicleId, vehicles.id))
      .innerJoin(workshops, eq(serviceRequests.workshopId, workshops.id))
      .where(inArray(serviceRequests.workshopId, owned.map((item) => item.id)))
      .orderBy(desc(serviceRequests.createdAt));
    return Response.json({
      workshop: owned[0],
      requests: rows.map(({ request, customer, vehicle, workshop }) => ({
        ...request,
        customer: { id: customer.id, fullName: customer.fullName, phone: customer.phone },
        vehicle,
        workshop,
      })),
    });
  } catch {
    return Response.json({ error: "Não foi possível carregar as solicitações da oficina." }, { status: 500 });
  }
}
