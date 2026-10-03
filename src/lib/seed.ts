import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  quotes,
  serviceOrders,
  serviceRequests,
  users,
  vehicles,
  workshopServices,
  workshops,
} from "@/db/schema";
import { hashPassword } from "@/lib/auth";

const demoWorkshops = [
  {
    name: "Oficina Horizonte",
    slug: "oficina-horizonte",
    description: "Cuidado completo para o seu carro, com atendimento transparente e equipe experiente.",
    address: "Rua dos Pinheiros, 840",
    city: "São Paulo",
    phone: "(11) 3333-0148",
    rating: 4.9,
    reviewCount: 128,
    distanceKm: 2.4,
    services: ["Mecânica geral", "Freios", "Revisão", "Troca de óleo"],
  },
  {
    name: "Centro Automotivo Avenida",
    slug: "centro-automotivo-avenida",
    description: "Revisões, suspensão e alinhamento com orçamento explicado antes de começar.",
    address: "Av. Rebouças, 2140",
    city: "São Paulo",
    phone: "(11) 3333-0272",
    rating: 4.8,
    reviewCount: 94,
    distanceKm: 3.1,
    services: ["Suspensão", "Alinhamento", "Pneus", "Revisão"],
  },
  {
    name: "Auto Elétrica São Lucas",
    slug: "auto-eletrica-sao-lucas",
    description: "Diagnóstico elétrico, bateria e sistema de partida para veículos nacionais e importados.",
    address: "Rua Teodoro Sampaio, 1560",
    city: "São Paulo",
    phone: "(11) 3333-0391",
    rating: 4.7,
    reviewCount: 76,
    distanceKm: 4.6,
    services: ["Bateria", "Elétrica", "Injeção eletrônica", "Ar-condicionado"],
  },
];

async function getOrCreateUser(email: string, fullName: string, password: string, role: "CUSTOMER" | "WORKSHOP") {
  const [found] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (found) return found;

  const [inserted] = await db
    .insert(users)
    .values({ fullName, email, passwordHash: await hashPassword(password), role, phone: "(11) 99999-0000" })
    .onConflictDoNothing({ target: users.email })
    .returning();
  if (inserted) return inserted;
  const [raced] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!raced) throw new Error("Não foi possível preparar o acesso demonstrativo.");
  return raced;
}

export async function ensureDemoData() {
  const customer = await getOrCreateUser("demo@autolink.com", "João Mendes", "AutoLink2026!", "CUSTOMER");
  const workshopOwner = await getOrCreateUser("oficina@autolink.com", "Marcos Almeida", "Oficina2026!", "WORKSHOP");

  const seededWorkshops = [];
  for (const [index, item] of demoWorkshops.entries()) {
    let [workshop] = await db.select().from(workshops).where(eq(workshops.slug, item.slug)).limit(1);
    if (!workshop) {
      const [created] = await db
        .insert(workshops)
        .values({
          ownerId: index === 0 ? workshopOwner.id : null,
          name: item.name,
          slug: item.slug,
          description: item.description,
          address: item.address,
          city: item.city,
          phone: item.phone,
          rating: item.rating,
          reviewCount: item.reviewCount,
          distanceKm: item.distanceKm,
          isOpen: true,
          isDemo: true,
        })
        .onConflictDoNothing({ target: workshops.slug })
        .returning();
      workshop = created;
    }
    if (!workshop) {
      [workshop] = await db.select().from(workshops).where(eq(workshops.slug, item.slug)).limit(1);
    }
    if (workshop) {
      seededWorkshops.push(workshop);
      const [existingService] = await db
        .select({ id: workshopServices.id })
        .from(workshopServices)
        .where(eq(workshopServices.workshopId, workshop.id))
        .limit(1);
      if (!existingService) {
        await db.insert(workshopServices).values(
          item.services.map((name, serviceIndex) => ({
            workshopId: workshop.id,
            name,
            description: `Atendimento profissional em ${name.toLocaleLowerCase("pt-BR")} para o seu veículo.`,
            priceFrom: 8900 + index * 6500 + serviceIndex * 2500,
            durationMinutes: 60 + serviceIndex * 30,
          })),
        );
      }
    }
  }

  const [existingVehicle] = await db.select().from(vehicles).where(eq(vehicles.userId, customer.id)).limit(1);
  let vehicle = existingVehicle;
  if (!vehicle) {
    [vehicle] = await db
      .insert(vehicles)
      .values({
        userId: customer.id,
        make: "Toyota",
        model: "Corolla",
        year: 2020,
        version: "XEi 2.0",
        plate: "ABC-1D23",
        mileage: 48500,
        fuel: "Flex",
      })
      .returning();
  }

  if (vehicle && seededWorkshops[0]) {
    const [existingRequest] = await db
      .select({ id: serviceRequests.id })
      .from(serviceRequests)
      .where(eq(serviceRequests.customerId, customer.id))
      .limit(1);
    if (!existingRequest) {
      const [completedRequest] = await db
        .insert(serviceRequests)
        .values({
          protocol: "AL-DEMO-001",
          customerId: customer.id,
          vehicleId: vehicle.id,
          workshopId: seededWorkshops[0].id,
          serviceType: "Troca de óleo",
          description: "Troca de óleo e filtro realizada na última revisão.",
          status: "COMPLETED",
          preferredAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        })
        .onConflictDoNothing({ target: serviceRequests.protocol })
        .returning();
      if (completedRequest) {
        await db.insert(serviceOrders).values({
          requestId: completedRequest.id,
          customerId: customer.id,
          workshopId: seededWorkshops[0].id,
          title: "Troca de óleo",
          status: "COMPLETED",
          scheduledAt: completedRequest.preferredAt,
          priceInCents: 18900,
        });
      }

      const nextVisit = new Date();
      nextVisit.setDate(nextVisit.getDate() + 4);
      const [scheduledRequest] = await db
        .insert(serviceRequests)
        .values({
          protocol: "AL-DEMO-002",
          customerId: customer.id,
          vehicleId: vehicle.id,
          workshopId: seededWorkshops[1]?.id ?? seededWorkshops[0].id,
          serviceType: "Revisão preventiva",
          description: "Revisão preventiva agendada para conferir os principais itens do veículo.",
          status: "CONFIRMED",
          preferredAt: nextVisit,
        })
        .onConflictDoNothing({ target: serviceRequests.protocol })
        .returning();
      if (scheduledRequest && seededWorkshops[1]) {
        await db.insert(serviceOrders).values({
          requestId: scheduledRequest.id,
          customerId: customer.id,
          workshopId: seededWorkshops[1].id,
          title: "Revisão preventiva",
          status: "SCHEDULED",
          scheduledAt: nextVisit,
          priceInCents: null,
        });
      }
    }
  }

  if (vehicle && seededWorkshops[0]) {
    const [demoRequest] = await db.select({ id: serviceRequests.id }).from(serviceRequests).where(eq(serviceRequests.protocol, "AL-DEMO-003")).limit(1);
    if (!demoRequest) {
      const [pendingRequest] = await db.insert(serviceRequests).values({
        protocol: "AL-DEMO-003",
        customerId: customer.id,
        vehicleId: vehicle.id,
        workshopId: seededWorkshops[0].id,
        serviceType: "Avaliação dos freios",
        description: "O cliente percebeu um ruído ao frear e gostaria de uma avaliação.",
        status: "REQUESTED",
      }).onConflictDoNothing({ target: serviceRequests.protocol }).returning();
      if (pendingRequest) {
        await db.insert(quotes).values({
          requestId: pendingRequest.id,
          workshopId: seededWorkshops[0].id,
          description: "Inspeção inicial do sistema de freios e orçamento detalhado após a avaliação.",
          totalPriceInCents: 23900,
          status: "PENDING",
        });
      }
    }
  }
}
