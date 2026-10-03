import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { diagnosticRequests } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

type Context = { params: Promise<{ id: string }> };
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function DELETE(_request: Request, { params }: Context) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Entre na sua conta para continuar." }, { status: 401 });
  if (user.role !== "CUSTOMER") return Response.json({ error: "Acesso não autorizado." }, { status: 403 });
  const { id } = await params;
  if (!uuidPattern.test(id)) return Response.json({ error: "Avaliação não encontrada." }, { status: 404 });
  const [removed] = await db
    .delete(diagnosticRequests)
    .where(and(eq(diagnosticRequests.id, id), eq(diagnosticRequests.customerId, user.id)))
    .returning({ id: diagnosticRequests.id });
  if (!removed) return Response.json({ error: "Avaliação não encontrada." }, { status: 404 });
  return Response.json({ ok: true });
}
