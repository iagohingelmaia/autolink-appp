import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { vehicles } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

type Context = { params: Promise<{ id: string }> };
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function PUT(request: Request, { params }: Context) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Entre na sua conta para continuar." }, { status: 401 });
  if (user.role !== "CUSTOMER") return Response.json({ error: "Acesso não autorizado." }, { status: 403 });
  const { id } = await params;
  if (!uuidPattern.test(id)) return Response.json({ error: "Veículo não encontrado." }, { status: 404 });

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const make = typeof body.make === "string" ? body.make.trim() : "";
    const model = typeof body.model === "string" ? body.model.trim() : "";
    const year = Number(body.year);
    const mileage = body.mileage === "" || body.mileage == null ? null : Number(body.mileage);
    if (!make || !model || !Number.isInteger(year) || year < 1950 || year > new Date().getFullYear() + 1) {
      return Response.json({ error: "Informe marca, modelo e um ano válido." }, { status: 400 });
    }
    if (mileage !== null && (!Number.isInteger(mileage) || mileage < 0 || mileage > 2_000_000)) {
      return Response.json({ error: "Confira a quilometragem informada." }, { status: 400 });
    }

    const [vehicle] = await db
      .update(vehicles)
      .set({
        make,
        model,
        year,
        version: typeof body.version === "string" ? body.version.trim() || null : null,
        plate: typeof body.plate === "string" ? body.plate.trim().toUpperCase() || null : null,
        mileage,
        fuel: typeof body.fuel === "string" && body.fuel.trim() ? body.fuel.trim() : "Flex",
        updatedAt: new Date(),
      })
      .where(and(eq(vehicles.id, id), eq(vehicles.userId, user.id)))
      .returning();
    if (!vehicle) return Response.json({ error: "Veículo não encontrado." }, { status: 404 });
    return Response.json({ vehicle });
  } catch {
    return Response.json({ error: "Não foi possível atualizar o veículo." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Context) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Entre na sua conta para continuar." }, { status: 401 });
  if (user.role !== "CUSTOMER") return Response.json({ error: "Acesso não autorizado." }, { status: 403 });
  const { id } = await params;
  if (!uuidPattern.test(id)) return Response.json({ error: "Veículo não encontrado." }, { status: 404 });
  const [removed] = await db
    .delete(vehicles)
    .where(and(eq(vehicles.id, id), eq(vehicles.userId, user.id)))
    .returning({ id: vehicles.id });
  if (!removed) return Response.json({ error: "Veículo não encontrado." }, { status: 404 });
  return Response.json({ ok: true });
}
