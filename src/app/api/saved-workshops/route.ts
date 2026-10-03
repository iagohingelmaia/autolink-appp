import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { savedWorkshops, workshops } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Entre na sua conta para continuar." }, { status: 401 });
  if (user.role !== "CUSTOMER") return Response.json({ error: "Acesso não autorizado." }, { status: 403 });
  const rows = await db
    .select({ saved: savedWorkshops, workshop: workshops })
    .from(savedWorkshops)
    .innerJoin(workshops, eq(savedWorkshops.workshopId, workshops.id))
    .where(eq(savedWorkshops.userId, user.id))
    .orderBy(desc(savedWorkshops.createdAt));
  return Response.json({ saved: rows.map(({ saved, workshop }) => ({ ...saved, workshop })) });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Entre na sua conta para continuar." }, { status: 401 });
  if (user.role !== "CUSTOMER") return Response.json({ error: "Acesso não autorizado." }, { status: 403 });
  try {
    const body = (await request.json()) as { workshopId?: unknown };
    const workshopId = typeof body.workshopId === "string" ? body.workshopId : "";
    if (!workshopId) return Response.json({ error: "Escolha uma oficina." }, { status: 400 });
    const [workshop] = await db.select({ id: workshops.id }).from(workshops).where(eq(workshops.id, workshopId)).limit(1);
    if (!workshop) return Response.json({ error: "Oficina não encontrada." }, { status: 404 });
    await db.insert(savedWorkshops).values({ userId: user.id, workshopId }).onConflictDoNothing();
    return Response.json({ ok: true }, { status: 201 });
  } catch {
    return Response.json({ error: "Não foi possível salvar a oficina." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Entre na sua conta para continuar." }, { status: 401 });
  if (user.role !== "CUSTOMER") return Response.json({ error: "Acesso não autorizado." }, { status: 403 });
  try {
    const body = (await request.json()) as { workshopId?: unknown };
    const workshopId = typeof body.workshopId === "string" ? body.workshopId : "";
    if (!workshopId) return Response.json({ error: "Escolha uma oficina." }, { status: 400 });
    await db.delete(savedWorkshops).where(and(eq(savedWorkshops.userId, user.id), eq(savedWorkshops.workshopId, workshopId)));
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Não foi possível remover a oficina dos favoritos." }, { status: 500 });
  }
}
