import { eq } from "drizzle-orm";
import { db } from "@/db";
import { workshopServices, workshops } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Entre na sua conta para continuar." }, { status: 401 });
  if (user.role !== "WORKSHOP" && user.role !== "ADMIN") return Response.json({ error: "Acesso exclusivo para oficinas." }, { status: 403 });
  const [workshop] = await db.select().from(workshops).where(eq(workshops.ownerId, user.id)).limit(1);
  if (!workshop) return Response.json({ error: "Nenhuma oficina vinculada a esta conta." }, { status: 404 });
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const description = typeof body.description === "string" ? body.description.trim() : "";
    const amount = Number(body.priceFrom);
    const durationMinutes = Number(body.durationMinutes);
    if (name.length < 2 || name.length > 80 || !Number.isFinite(amount) || amount < 0 || amount > 500000) {
      return Response.json({ error: "Informe o nome do serviço e um preço válido." }, { status: 400 });
    }
    const [service] = await db
      .insert(workshopServices)
      .values({
        workshopId: workshop.id,
        name,
        description,
        priceFrom: Math.round(amount * 100),
        durationMinutes: Number.isInteger(durationMinutes) && durationMinutes > 0 ? Math.min(durationMinutes, 1440) : 60,
      })
      .returning();
    return Response.json({ service }, { status: 201 });
  } catch {
    return Response.json({ error: "Não foi possível adicionar o serviço." }, { status: 500 });
  }
}
