import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { serviceRequests } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

type Context = { params: Promise<{ id: string }> };
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function PATCH(request: Request, { params }: Context) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Entre na sua conta para continuar." }, { status: 401 });
  if (user.role !== "CUSTOMER") return Response.json({ error: "Acesso não autorizado." }, { status: 403 });
  const { id } = await params;
  if (!uuidPattern.test(id)) return Response.json({ error: "Solicitação não encontrada." }, { status: 404 });
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const [existing] = await db
      .select()
      .from(serviceRequests)
      .where(and(eq(serviceRequests.id, id), eq(serviceRequests.customerId, user.id)))
      .limit(1);
    if (!existing) return Response.json({ error: "Solicitação não encontrada." }, { status: 404 });
    if (existing.status !== "REQUESTED") {
      return Response.json({ error: "Esta solicitação já está em andamento e não pode mais ser alterada." }, { status: 409 });
    }
    const serviceType = typeof body.serviceType === "string" ? body.serviceType.trim() : existing.serviceType;
    const description = typeof body.description === "string" ? body.description.trim() : existing.description;
    const preferredAt = typeof body.preferredAt === "string" && body.preferredAt ? new Date(body.preferredAt) : null;
    if (serviceType.length < 2 || description.length < 5 || (preferredAt && Number.isNaN(preferredAt.getTime()))) {
      return Response.json({ error: "Confira as informações da solicitação." }, { status: 400 });
    }
    const [updated] = await db
      .update(serviceRequests)
      .set({ serviceType, description, preferredAt, updatedAt: new Date() })
      .where(and(eq(serviceRequests.id, id), eq(serviceRequests.customerId, user.id)))
      .returning();
    return Response.json({ request: updated });
  } catch {
    return Response.json({ error: "Não foi possível atualizar a solicitação." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Context) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Entre na sua conta para continuar." }, { status: 401 });
  if (user.role !== "CUSTOMER") return Response.json({ error: "Acesso não autorizado." }, { status: 403 });
  const { id } = await params;
  if (!uuidPattern.test(id)) return Response.json({ error: "Solicitação não encontrada." }, { status: 404 });
  const [existing] = await db
    .select({ id: serviceRequests.id, status: serviceRequests.status })
    .from(serviceRequests)
    .where(and(eq(serviceRequests.id, id), eq(serviceRequests.customerId, user.id)))
    .limit(1);
  if (!existing) return Response.json({ error: "Solicitação não encontrada." }, { status: 404 });
  if (existing.status !== "REQUESTED" && existing.status !== "CANCELED") {
    return Response.json({ error: "Só é possível remover uma solicitação que ainda não foi aceita." }, { status: 409 });
  }
  await db.delete(serviceRequests).where(and(eq(serviceRequests.id, id), eq(serviceRequests.customerId, user.id)));
  return Response.json({ ok: true });
}
