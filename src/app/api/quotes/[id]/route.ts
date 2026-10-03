import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { notifications, quotes, serviceOrders, serviceRequests, workshops } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

type Context = { params: Promise<{ id: string }> };
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function PATCH(request: Request, { params }: Context) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Entre na sua conta para continuar." }, { status: 401 });
  if (user.role !== "CUSTOMER") return Response.json({ error: "Acesso não autorizado." }, { status: 403 });
  const { id } = await params;
  if (!uuidPattern.test(id)) return Response.json({ error: "Orçamento não encontrado." }, { status: 404 });
  try {
    const body = (await request.json()) as { status?: unknown };
    const status = body.status === "ACCEPTED" || body.status === "DECLINED" ? body.status : null;
    if (!status) return Response.json({ error: "Escolha aceitar ou recusar o orçamento." }, { status: 400 });
    const [item] = await db
      .select({ quote: quotes, request: serviceRequests, workshop: workshops })
      .from(quotes)
      .innerJoin(serviceRequests, eq(quotes.requestId, serviceRequests.id))
      .innerJoin(workshops, eq(quotes.workshopId, workshops.id))
      .where(and(eq(quotes.id, id), eq(serviceRequests.customerId, user.id)))
      .limit(1);
    if (!item) return Response.json({ error: "Orçamento não encontrado." }, { status: 404 });
    if (item.quote.status !== "PENDING") return Response.json({ error: "Este orçamento já recebeu uma resposta." }, { status: 409 });

    const result = await db.transaction(async (tx) => {
      const [updatedQuote] = await tx
        .update(quotes)
        .set({ status, updatedAt: new Date() })
        .where(eq(quotes.id, id))
        .returning();
      if (status === "ACCEPTED") {
        await tx
          .update(serviceRequests)
          .set({ status: "CONFIRMED", updatedAt: new Date() })
          .where(eq(serviceRequests.id, item.request.id));
        await tx
          .insert(serviceOrders)
          .values({
            requestId: item.request.id,
            customerId: user.id,
            workshopId: item.quote.workshopId,
            title: item.request.serviceType,
            status: "SCHEDULED",
            scheduledAt: item.request.preferredAt,
            priceInCents: item.quote.totalPriceInCents,
          })
          .onConflictDoUpdate({ target: serviceOrders.requestId, set: { status: "SCHEDULED", priceInCents: item.quote.totalPriceInCents, updatedAt: new Date() } });
      }
      if (item.workshop.ownerId) {
        await tx.insert(notifications).values({
          userId: item.workshop.ownerId,
          title: status === "ACCEPTED" ? "Orçamento aceito" : "Orçamento recusado",
          message: `O cliente respondeu ao orçamento de ${item.request.serviceType}.`,
        });
      }
      return updatedQuote;
    });
    return Response.json({ quote: result });
  } catch {
    return Response.json({ error: "Não foi possível responder ao orçamento." }, { status: 500 });
  }
}
