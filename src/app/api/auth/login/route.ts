import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createSession, verifyPassword } from "@/lib/auth";
import { ensureDemoData } from "@/lib/seed";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: unknown; password?: unknown };
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    if (!email || !password) return Response.json({ error: "Informe seu e-mail e sua senha." }, { status: 400 });

    await ensureDemoData();
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return Response.json({ error: "E-mail ou senha incorretos. Confira os dados e tente novamente." }, { status: 401 });
    }

    await createSession(user.id);
    return Response.json({
      user: { id: user.id, fullName: user.fullName, email: user.email, role: user.role },
    });
  } catch {
    return Response.json({ error: "Não foi possível entrar agora. Tente novamente em instantes." }, { status: 500 });
  }
}
