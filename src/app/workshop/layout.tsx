import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function WorkshopLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?perfil=oficina");
  if (user.role !== "WORKSHOP" && user.role !== "ADMIN") redirect("/app/home");
  return <DashboardShell user={user} workspace>{children}</DashboardShell>;
}
