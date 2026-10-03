import { desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { savedWorkshops, users, vehicles, workshops } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { ProfileEditor } from "@/components/profile-editor";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const [profile] = await db.select({ id: users.id, fullName: users.fullName, email: users.email, phone: users.phone, address: users.address, notificationsEnabled: users.notificationsEnabled, createdAt: users.createdAt }).from(users).where(eq(users.id, user.id)).limit(1);
  if (!profile) redirect("/login");
  const [userVehicles, savedRows] = await Promise.all([
    db.select().from(vehicles).where(eq(vehicles.userId, user.id)),
    db.select({ saved: savedWorkshops, workshop: workshops }).from(savedWorkshops).innerJoin(workshops, eq(savedWorkshops.workshopId, workshops.id)).where(eq(savedWorkshops.userId, user.id)).orderBy(desc(savedWorkshops.createdAt)),
  ]);
  return <ProfileEditor profile={profile} vehicles={userVehicles} initialSaved={savedRows.map(({ saved, workshop }) => ({ ...saved, workshop }))} />;
}
