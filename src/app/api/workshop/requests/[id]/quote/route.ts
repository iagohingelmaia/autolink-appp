import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { notifications, quotes, serviceRequests, workshops } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

type Context = { params: Promise<{ id: string }> };
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: Request, { params }: Context) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Entre na sua conta para continuar." }, { status: 401 });
  if (user.role !== "WORKSHOP" && user.role !== "ADMIN") return Response.json({ error: "Acesso exclusivo para oficinas." }, { status: 403 });
  const { id } = await params;
  if (!uuidPattern.test(id)) return Response.json({ error: "Solicitação não encontrada." }, { status: 404 });
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const description = typeof body.description === "string" ? body.description.trim() : "";
    const amount = Number(body.amount);
    if (description.length < 4 || description.length > 500 || !Number.isFinite(amount) || amount <= 0 || amount > 500000) {
      return Response.json({ error: "Informe o serviço e um valor válido para o orçamento." }, { status: 400 });
    }
    const [record] = await db
      .select({ request: serviceRequests, workshop: workshops })
      .from(serviceRequests)
      .innerJoin(workshops, eq(serviceRequests.workshopId, workshops.id))
      .where(and(eq(serviceRequests.id, id), eq(workshops.ownerId, user.id)))
      .limit(1);
    if (!record) return Response.json({ error: "Solicitação não encontrada para esta oficina." }, { status: 404 });
    if (["COMPLETED", "CANCELED"].includes(record.request.status)) return Response.json({ error: "Não é possível orçar um atendimento finalizado." }, { status: 409 });
    const [quote] = await db
      .insert(quotes)
      .values({
        requestId: id,
        workshopId: record.workshop.id,
        description,
        totalPriceInCents: Math.round(amount * 100),
      })
      .returning();
    await db.insert(notifications).values({
      userId: record.request.customerId,
      title: "Você recebeu um orçamento",
      message: `${record.workshop.name} enviou um orçamento para ${record.request.serviceType}.`,
    });
    return Response.json({ quote }, { status: 201 });
  } catch {
    return Response.json({ error: "Não foi possível enviar o orçamento." }, { status: 500 });
  }
}
