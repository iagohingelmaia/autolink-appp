import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, vehicles } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Entre na sua conta para continuar." }, { status: 401 });
  const [profile] = await db
    .select({ id: users.id, fullName: users.fullName, email: users.email, phone: users.phone, address: users.address, notificationsEnabled: users.notificationsEnabled, createdAt: users.createdAt })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);
  const userVehicles = user.role === "CUSTOMER" ? await db.select().from(vehicles).where(eq(vehicles.userId, user.id)) : [];
  return Response.json({ profile, vehicles: userVehicles });
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Entre na sua conta para continuar." }, { status: 401 });
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const fullName = typeof body.fullName === "string" ? body.fullName.trim() : "";
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";
    const address = typeof body.address === "string" ? body.address.trim() : "";
    const notificationsEnabled = typeof body.notificationsEnabled === "boolean" ? body.notificationsEnabled : true;
    if (fullName.length < 2 || fullName.length > 100) return Response.json({ error: "Informe seu nome completo." }, { status: 400 });
    if (phone.length > 30 || address.length > 200) return Response.json({ error: "Confira o telefone e o endereço informados." }, { status: 400 });
    const [updated] = await db
      .update(users)
      .set({ fullName, phone: phone || null, address: address || null, notificationsEnabled, updatedAt: new Date() })
      .where(eq(users.id, user.id))
      .returning({ id: users.id, fullName: users.fullName, email: users.email, phone: users.phone, address: users.address, notificationsEnabled: users.notificationsEnabled });
    return Response.json({ profile: updated });
  } catch {
    return Response.json({ error: "Não foi possível salvar seu perfil." }, { status: 500 });
  }
}
