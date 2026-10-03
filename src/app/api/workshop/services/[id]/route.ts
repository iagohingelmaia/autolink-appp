import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { workshopServices, workshops } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

type Context = { params: Promise<{ id: string }> };
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function getOwnedService(userId: string, serviceId: string) {
  const [row] = await db
    .select({ service: workshopServices, workshop: workshops })
    .from(workshopServices)
    .innerJoin(workshops, eq(workshopServices.workshopId, workshops.id))
    .where(and(eq(workshopServices.id, serviceId), eq(workshops.ownerId, userId)))
    .limit(1);
  return row;
}

export async function PUT(request: Request, { params }: Context) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Entre na sua conta para continuar." }, { status: 401 });
  if (user.role !== "WORKSHOP" && user.role !== "ADMIN") return Response.json({ error: "Acesso exclusivo para oficinas." }, { status: 403 });
  const { id } = await params;
  if (!uuidPattern.test(id)) return Response.json({ error: "Serviço não encontrado." }, { status: 404 });
  const record = await getOwnedService(user.id, id);
  if (!record) return Response.json({ error: "Serviço não encontrado." }, { status: 404 });
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const description = typeof body.description === "string" ? body.description.trim() : "";
    const amount = Number(body.priceFrom);
    const durationMinutes = Number(body.durationMinutes);
    if (name.length < 2 || !Number.isFinite(amount) || amount < 0 || amount > 500000) {
      return Response.json({ error: "Confira o nome e o valor do serviço." }, { status: 400 });
    }
    const [service] = await db
      .update(workshopServices)
      .set({
        name,
        description,
        priceFrom: Math.round(amount * 100),
        durationMinutes: Number.isInteger(durationMinutes) && durationMinutes > 0 ? Math.min(durationMinutes, 1440) : 60,
      })
      .where(eq(workshopServices.id, id))
      .returning();
    return Response.json({ service });
  } catch {
    return Response.json({ error: "Não foi possível atualizar o serviço." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Context) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Entre na sua conta para continuar." }, { status: 401 });
  if (user.role !== "WORKSHOP" && user.role !== "ADMIN") return Response.json({ error: "Acesso exclusivo para oficinas." }, { status: 403 });
  const { id } = await params;
  if (!uuidPattern.test(id)) return Response.json({ error: "Serviço não encontrado." }, { status: 404 });
  const record = await getOwnedService(user.id, id);
  if (!record) return Response.json({ error: "Serviço não encontrado." }, { status: 404 });
  await db.delete(workshopServices).where(and(eq(workshopServices.id, id), eq(workshopServices.workshopId, record.workshop.id)));
  return Response.json({ ok: true });
}
