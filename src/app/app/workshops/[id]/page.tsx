import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { db } from "@/db";
import { reviews, users, workshopServices, workshops } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { WorkshopDetails } from "@/components/workshop-details";

type Context = { params: Promise<{ id: string }> };
export const dynamic = "force-dynamic";

export default async function WorkshopDetailPage({ params }: Context) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { id } = await params;
  const [workshop] = await db.select().from(workshops).where(eq(workshops.id, id)).limit(1);
  if (!workshop) notFound();
  const [services, workshopReviews] = await Promise.all([
    db.select().from(workshopServices).where(eq(workshopServices.workshopId, id)),
    db.select({ id: reviews.id, rating: reviews.rating, comment: reviews.comment, customerName: users.fullName }).from(reviews).innerJoin(users, eq(reviews.customerId, users.id)).where(eq(reviews.workshopId, id)),
  ]);
  return <WorkshopDetails workshop={{ ...workshop, services, reviews: workshopReviews }} />;
}
