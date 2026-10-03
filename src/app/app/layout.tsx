import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function CustomerLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "CUSTOMER" && user.role !== "ADMIN") redirect("/workshop/dashboard");
  return <DashboardShell user={user}>{children}</DashboardShell>;
}
