import { db } from "@/db";
import { users, vehicles } from "@/db/schema";
import { createSession, hashPassword } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const fullName = typeof body.fullName === "string" ? body.fullName.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const make = typeof body.make === "string" ? body.make.trim() : "";
    const model = typeof body.model === "string" ? body.model.trim() : "";
    const year = Number(body.year);
    const version = typeof body.version === "string" ? body.version.trim() : "";
    const plate = typeof body.plate === "string" ? body.plate.trim().toUpperCase() : "";
    const fuel = typeof body.fuel === "string" ? body.fuel.trim() : "Flex";

    if (fullName.length < 2 || fullName.length > 100) return Response.json({ error: "Informe seu nome completo." }, { status: 400 });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return Response.json({ error: "Informe um e-mail válido." }, { status: 400 });
    if (password.length < 8) return Response.json({ error: "Sua senha precisa ter pelo menos 8 caracteres." }, { status: 400 });
    if (!make || !model || !Number.isInteger(year) || year < 1950 || year > new Date().getFullYear() + 1) {
      return Response.json({ error: "Para criar sua conta, informe a marca, o modelo e o ano do seu carro." }, { status: 400 });
    }

    const [created] = await db.transaction(async (tx) => {
      const [user] = await tx
        .insert(users)
        .values({ fullName, email, phone: phone || null, passwordHash: await hashPassword(password), role: "CUSTOMER" })
        .onConflictDoNothing({ target: users.email })
        .returning({ id: users.id, fullName: users.fullName, email: users.email, role: users.role });
      if (!user) return [];
      await tx.insert(vehicles).values({
        userId: user.id,
        make,
        model,
        year,
        version: version || null,
        plate: plate || null,
        fuel,
      });
      return [user];
    });

    if (!created) return Response.json({ error: "Este e-mail já está cadastrado. Entre na sua conta." }, { status: 409 });
    await createSession(created.id);
    return Response.json({ user: created }, { status: 201 });
  } catch {
    return Response.json({ error: "Não foi possível criar sua conta agora. Tente novamente." }, { status: 500 });
  }
}
