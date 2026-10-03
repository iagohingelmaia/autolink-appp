import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { workshopServices, workshops } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { ensureDemoData } from "@/lib/seed";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Entre na sua conta para continuar." }, { status: 401 });
  if (user.role !== "CUSTOMER") return Response.json({ error: "Acesso não autorizado." }, { status: 403 });
  try {
    await ensureDemoData();
    const items = await db.select().from(workshops).orderBy(asc(workshops.distanceKm));
    const services = await db.select().from(workshopServices);
    return Response.json({
      workshops: items.map((item) => ({
        ...item,
        services: services.filter((service) => service.workshopId === item.id),
      })),
      demo: items.some((item) => item.isDemo),
    });
  } catch {
    return Response.json({ error: "Não foi possível carregar as oficinas." }, { status: 500 });
  }
}
