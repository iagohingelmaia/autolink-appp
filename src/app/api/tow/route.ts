import { randomBytes } from "node:crypto";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { towRequests, vehicles } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Entre na sua conta para continuar." }, { status: 401 });
  if (user.role !== "CUSTOMER") return Response.json({ error: "Acesso não autorizado." }, { status: 403 });
  const rows = await db
    .select({ request: towRequests, vehicle: vehicles })
    .from(towRequests)
    .leftJoin(vehicles, eq(towRequests.vehicleId, vehicles.id))
    .where(eq(towRequests.customerId, user.id))
    .orderBy(desc(towRequests.createdAt));
  return Response.json({ requests: rows.map(({ request, vehicle }) => ({ ...request, vehicle })) });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Entre na sua conta para continuar." }, { status: 401 });
  if (user.role !== "CUSTOMER") return Response.json({ error: "Acesso não autorizado." }, { status: 403 });
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const location = typeof body.location === "string" ? body.location.trim() : "";
    const problem = typeof body.problem === "string" ? body.problem.trim() : "";
    const vehicleId = typeof body.vehicleId === "string" ? body.vehicleId : "";
    const latitude = typeof body.latitude === "number" && Number.isFinite(body.latitude) ? body.latitude : null;
    const longitude = typeof body.longitude === "number" && Number.isFinite(body.longitude) ? body.longitude : null;
    if ((latitude !== null && (latitude < -90 || latitude > 90)) || (longitude !== null && (longitude < -180 || longitude > 180))) {
      return Response.json({ error: "A localização informada não é válida." }, { status: 400 });
    }
    if (location.length < 5 || problem.length < 3 || !vehicleId) {
      return Response.json({ error: "Informe seu veículo, onde você está e o que aconteceu." }, { status: 400 });
    }
    const [ownedVehicle] = await db
      .select({ id: vehicles.id })
      .from(vehicles)
      .where(and(eq(vehicles.id, vehicleId), eq(vehicles.userId, user.id)))
      .limit(1);
    if (!ownedVehicle) return Response.json({ error: "Escolha um veículo cadastrado na sua conta." }, { status: 403 });
    const [created] = await db
      .insert(towRequests)
      .values({
        protocol: `GT-${new Date().getFullYear()}-${randomBytes(3).toString("hex").toUpperCase()}`,
        customerId: user.id,
        vehicleId,
        location,
        latitude,
        longitude,
        problem,
      })
      .returning();
    return Response.json({ request: created }, { status: 201 });
  } catch {
    return Response.json({ error: "Não foi possível enviar o pedido de guincho." }, { status: 500 });
  }
}
