import { eq } from "drizzle-orm";
import { BriefcaseBusiness } from "lucide-react";
import { db } from "@/db";
import { workshopServices, workshops } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { WorkshopProfileManager } from "@/components/workshop-profile-manager";

export const dynamic = "force-dynamic";

export default async function WorkshopProfilePage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const [workshop] = await db.select().from(workshops).where(eq(workshops.ownerId, user.id)).limit(1);
  if (!workshop) return <div className="card"><div className="empty-state"><div className="empty-icon"><BriefcaseBusiness size={25} /></div><h3>Perfil de oficina não encontrado.</h3><p>Esta conta ainda não possui uma oficina vinculada.</p></div></div>;
  const services = await db.select().from(workshopServices).where(eq(workshopServices.workshopId, workshop.id));
  return <WorkshopProfileManager initialWorkshop={workshop} initialServices={services} />;
}
