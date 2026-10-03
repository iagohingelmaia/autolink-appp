import { randomBytes } from "node:crypto";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { notifications, serviceRequests, users, vehicles, workshops } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Entre na sua conta para continuar." }, { status: 401 });
  if (user.role !== "CUSTOMER") return Response.json({ error: "Acesso não autorizado." }, { status: 403 });
  try {
    const rows = await db
      .select({
        request: serviceRequests,
        vehicle: vehicles,
        workshop: workshops,
      })
      .from(serviceRequests)
      .leftJoin(vehicles, eq(serviceRequests.vehicleId, vehicles.id))
      .leftJoin(workshops, eq(serviceRequests.workshopId, workshops.id))
      .where(eq(serviceRequests.customerId, user.id))
      .orderBy(desc(serviceRequests.createdAt));
    return Response.json({
      requests: rows.map(({ request, vehicle, workshop }) => ({ ...request, vehicle, workshop })),
    });
  } catch {
    return Response.json({ error: "Não foi possível carregar seus serviços." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Entre na sua conta para continuar." }, { status: 401 });
  if (user.role !== "CUSTOMER") return Response.json({ error: "Acesso não autorizado." }, { status: 403 });

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const serviceType = typeof body.serviceType === "string" ? body.serviceType.trim() : "";
    const description = typeof body.description === "string" ? body.description.trim() : "";
    const vehicleId = typeof body.vehicleId === "string" ? body.vehicleId : "";
    const workshopId = typeof body.workshopId === "string" ? body.workshopId : "";
    const dateInput = typeof body.preferredAt === "string" ? body.preferredAt : "";
    const attachments = Array.isArray(body.attachments) && body.attachments.every((item) => typeof item === "string")
      ? (body.attachments as string[])
      : [];
    if (serviceType.length < 2 || serviceType.length > 80 || description.length < 5 || description.length > 1000) {
      return Response.json({ error: "Escolha o serviço e conte um pouco mais sobre o que aconteceu." }, { status: 400 });
    }
    if (!vehicleId || !workshopId) return Response.json({ error: "Escolha seu veículo e uma oficina." }, { status: 400 });
    if (attachments.length > 3 || attachments.some((item) => !/^data:image\/(png|jpeg|webp);base64,/i.test(item) || item.length > 1_000_000)) {
      return Response.json({ error: "Envie até 3 fotos JPG, PNG ou WEBP de até 700 KB cada." }, { status: 400 });
    }
    const [vehicle] = await db.select({ id: vehicles.id }).from(vehicles).where(and(eq(vehicles.id, vehicleId), eq(vehicles.userId, user.id))).limit(1);
    const [workshop] = await db.select().from(workshops).where(eq(workshops.id, workshopId)).limit(1);
    if (!vehicle) return Response.json({ error: "O veículo escolhido não pertence à sua conta." }, { status: 403 });
    if (!workshop) return Response.json({ error: "A oficina selecionada não foi encontrada." }, { status: 404 });
    const preferredAt = dateInput ? new Date(dateInput) : null;
    if (preferredAt && Number.isNaN(preferredAt.getTime())) return Response.json({ error: "Confira a data escolhida." }, { status: 400 });

    const protocol = `AL-${new Date().getFullYear()}-${randomBytes(3).toString("hex").toUpperCase()}`;
    const [created] = await db
      .insert(serviceRequests)
      .values({
        protocol,
        customerId: user.id,
        vehicleId,
        workshopId,
        serviceType,
        description,
        preferredAt,
        attachments,
      })
      .returning();
    if (workshop.ownerId) {
      await db.insert(notifications).values({
        userId: workshop.ownerId,
        title: "Nova solicitação de serviço",
        message: `${user.fullName} pediu atendimento para ${serviceType}.`,
      });
    }
    return Response.json({ request: { ...created, vehicle, workshop } }, { status: 201 });
  } catch {
    return Response.json({ error: "Não foi possível enviar sua solicitação. Tente novamente." }, { status: 500 });
  }
}
