import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { notifications, serviceOrders, serviceRequests, workshops } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

type Context = { params: Promise<{ id: string }> };
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const allowedStatuses = ["CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELED"] as const;

export async function PATCH(request: Request, { params }: Context) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Entre na sua conta para continuar." }, { status: 401 });
  if (user.role !== "WORKSHOP" && user.role !== "ADMIN") return Response.json({ error: "Acesso exclusivo para oficinas." }, { status: 403 });
  const { id } = await params;
  if (!uuidPattern.test(id)) return Response.json({ error: "Solicitação não encontrada." }, { status: 404 });
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const status = typeof body.status === "string" ? body.status : "";
    if (!allowedStatuses.includes(status as (typeof allowedStatuses)[number])) {
      return Response.json({ error: "Este status não é válido." }, { status: 400 });
    }
    const [requestRow] = await db
      .select({ request: serviceRequests, workshop: workshops })
      .from(serviceRequests)
      .innerJoin(workshops, eq(serviceRequests.workshopId, workshops.id))
      .where(and(eq(serviceRequests.id, id), eq(workshops.ownerId, user.id)))
      .limit(1);
    if (!requestRow) return Response.json({ error: "Solicitação não encontrada para esta oficina." }, { status: 404 });
    if (requestRow.request.status === "COMPLETED" || requestRow.request.status === "CANCELED") {
      return Response.json({ error: "Este atendimento já foi finalizado." }, { status: 409 });
    }
    const currentStatus = requestRow.request.status;
    const validTransition =
      (currentStatus === "REQUESTED" && ["CONFIRMED", "CANCELED"].includes(status)) ||
      (currentStatus === "CONFIRMED" && ["IN_PROGRESS", "CANCELED"].includes(status)) ||
      (currentStatus === "IN_PROGRESS" && status === "COMPLETED");
    if (!validTransition) return Response.json({ error: "Esta atualização não é permitida para o status atual." }, { status: 409 });

    const [updated] = await db
      .update(serviceRequests)
      .set({ status, updatedAt: new Date() })
      .where(eq(serviceRequests.id, id))
      .returning();
    const orderStatus = status === "CONFIRMED" ? "SCHEDULED" : status;
    if (status !== "CANCELED") {
      await db
        .insert(serviceOrders)
        .values({
          requestId: id,
          customerId: requestRow.request.customerId,
          workshopId: requestRow.workshop.id,
          title: requestRow.request.serviceType,
          status: orderStatus,
          scheduledAt: requestRow.request.preferredAt,
        })
        .onConflictDoUpdate({ target: serviceOrders.requestId, set: { status: orderStatus, updatedAt: new Date() } });
    }
    await db.insert(notifications).values({
      userId: requestRow.request.customerId,
      title: status === "CONFIRMED" ? "Oficina confirmou seu atendimento" : "Seu atendimento foi atualizado",
      message: `${requestRow.workshop.name} atualizou “${requestRow.request.serviceType}”.`,
    });
    return Response.json({ request: updated });
  } catch {
    return Response.json({ error: "Não foi possível atualizar o atendimento." }, { status: 500 });
  }
}
