import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { quotes, serviceRequests, workshops } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Entre na sua conta para continuar." }, { status: 401 });
  if (user.role !== "CUSTOMER") return Response.json({ error: "Acesso não autorizado." }, { status: 403 });
  const rows = await db
    .select({ quote: quotes, request: serviceRequests, workshop: workshops })
    .from(quotes)
    .innerJoin(serviceRequests, eq(quotes.requestId, serviceRequests.id))
    .innerJoin(workshops, eq(quotes.workshopId, workshops.id))
    .where(eq(serviceRequests.customerId, user.id))
    .orderBy(desc(quotes.createdAt));
  return Response.json({ quotes: rows.map(({ quote, request, workshop }) => ({ ...quote, request, workshop })) });
}
