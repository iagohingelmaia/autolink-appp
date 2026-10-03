import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { CarFront } from "lucide-react";
import { db } from "@/db";
import { vehicles } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { VehiclesManager } from "@/components/vehicles-manager";

export const dynamic = "force-dynamic";

export default async function VehiclesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const items = await db.select().from(vehicles).where(eq(vehicles.userId, user.id));
  return <>
    <div className="page-heading"><div><h1>Meus veículos</h1><p>Cadastre seus carros para solicitar serviços com mais rapidez.</p></div></div>
    <div className="note" style={{ marginBottom: 20 }}><CarFront size={18} /><span>Suas informações são usadas apenas para facilitar o atendimento e ficam visíveis para a oficina escolhida.</span></div>
    <VehiclesManager initialVehicles={items} />
  </>;
}
