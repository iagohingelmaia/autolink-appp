import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { reviews, users, workshopServices, workshops } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

type Context = { params: Promise<{ id: string }> };
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(_request: Request, { params }: Context) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Entre na sua conta para continuar." }, { status: 401 });
  const { id } = await params;
  if (!uuidPattern.test(id)) return Response.json({ error: "Oficina não encontrada." }, { status: 404 });

  const [workshop] = await db.select().from(workshops).where(eq(workshops.id, id)).limit(1);
  if (!workshop) return Response.json({ error: "Oficina não encontrada." }, { status: 404 });
  const [services, workshopReviews] = await Promise.all([
    db.select().from(workshopServices).where(eq(workshopServices.workshopId, workshop.id)),
    db
      .select({ id: reviews.id, rating: reviews.rating, comment: reviews.comment, createdAt: reviews.createdAt, customerName: users.fullName })
      .from(reviews)
      .innerJoin(users, eq(reviews.customerId, users.id))
      .where(eq(reviews.workshopId, workshop.id)),
  ]);
  return Response.json({ workshop: { ...workshop, services, reviews: workshopReviews } });
}

export async function PUT(request: Request, { params }: Context) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Entre na sua conta para continuar." }, { status: 401 });
  if (user.role !== "WORKSHOP" && user.role !== "ADMIN") return Response.json({ error: "Acesso não autorizado." }, { status: 403 });
  const { id } = await params;
  if (!uuidPattern.test(id)) return Response.json({ error: "Oficina não encontrada." }, { status: 404 });
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const description = typeof body.description === "string" ? body.description.trim() : "";
    const address = typeof body.address === "string" ? body.address.trim() : "";
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";
    if (name.length < 2 || !description || !address) {
      return Response.json({ error: "Informe o nome, o endereço e uma descrição para a oficina." }, { status: 400 });
    }
    const [updated] = await db
      .update(workshops)
      .set({ name, description, address, phone: phone || null, updatedAt: new Date() })
      .where(and(eq(workshops.id, id), eq(workshops.ownerId, user.id)))
      .returning();
    if (!updated) return Response.json({ error: "Oficina não encontrada." }, { status: 404 });
    return Response.json({ workshop: updated });
  } catch {
    return Response.json({ error: "Não foi possível atualizar os dados da oficina." }, { status: 500 });
  }
}
