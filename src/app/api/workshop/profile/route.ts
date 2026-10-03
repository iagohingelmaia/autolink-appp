import { eq } from "drizzle-orm";
import { db } from "@/db";
import { workshopServices, workshops } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

async function ownedWorkshop(userId: string) {
  const [workshop] = await db.select().from(workshops).where(eq(workshops.ownerId, userId)).limit(1);
  return workshop;
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Entre na sua conta para continuar." }, { status: 401 });
  if (user.role !== "WORKSHOP" && user.role !== "ADMIN") return Response.json({ error: "Acesso exclusivo para oficinas." }, { status: 403 });
  const workshop = await ownedWorkshop(user.id);
  if (!workshop) return Response.json({ error: "Nenhuma oficina vinculada a esta conta." }, { status: 404 });
  const services = await db.select().from(workshopServices).where(eq(workshopServices.workshopId, workshop.id));
  return Response.json({ workshop, services });
}

export async function PUT(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Entre na sua conta para continuar." }, { status: 401 });
  if (user.role !== "WORKSHOP" && user.role !== "ADMIN") return Response.json({ error: "Acesso exclusivo para oficinas." }, { status: 403 });
  const workshop = await ownedWorkshop(user.id);
  if (!workshop) return Response.json({ error: "Nenhuma oficina vinculada a esta conta." }, { status: 404 });
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const description = typeof body.description === "string" ? body.description.trim() : "";
    const address = typeof body.address === "string" ? body.address.trim() : "";
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";
    if (name.length < 2 || description.length < 10 || address.length < 5) {
      return Response.json({ error: "Informe nome, descrição e endereço da oficina." }, { status: 400 });
    }
    const [updated] = await db
      .update(workshops)
      .set({ name, description, address, phone: phone || null, updatedAt: new Date() })
      .where(eq(workshops.id, workshop.id))
      .returning();
    return Response.json({ workshop: updated });
  } catch {
    return Response.json({ error: "Não foi possível atualizar o perfil da oficina." }, { status: 500 });
  }
}
