import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { towRequests } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

type Context = { params: Promise<{ id: string }> };
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function DELETE(_request: Request, { params }: Context) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Entre na sua conta para continuar." }, { status: 401 });
  if (user.role !== "CUSTOMER") return Response.json({ error: "Acesso não autorizado." }, { status: 403 });
  const { id } = await params;
  if (!uuidPattern.test(id)) return Response.json({ error: "Pedido não encontrado." }, { status: 404 });
  const [updated] = await db
    .update(towRequests)
    .set({ status: "CANCELED", updatedAt: new Date() })
    .where(and(eq(towRequests.id, id), eq(towRequests.customerId, user.id), eq(towRequests.status, "REQUESTED")))
    .returning({ id: towRequests.id });
  if (!updated) return Response.json({ error: "Este pedido não pode mais ser cancelado." }, { status: 409 });
  return Response.json({ ok: true });
}
