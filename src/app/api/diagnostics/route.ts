import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { diagnosticRequests, vehicles } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { createAssessment, symptomOptions, type SymptomId } from "@/lib/diagnostics";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Entre na sua conta para continuar." }, { status: 401 });
  if (user.role !== "CUSTOMER") return Response.json({ error: "Acesso não autorizado." }, { status: 403 });
  const rows = await db
    .select({ diagnostic: diagnosticRequests, vehicle: vehicles })
    .from(diagnosticRequests)
    .leftJoin(vehicles, eq(diagnosticRequests.vehicleId, vehicles.id))
    .where(eq(diagnosticRequests.customerId, user.id))
    .orderBy(desc(diagnosticRequests.createdAt));
  return Response.json({ diagnostics: rows.map(({ diagnostic, vehicle }) => ({ ...diagnostic, vehicle })) });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Entre na sua conta para continuar." }, { status: 401 });
  if (user.role !== "CUSTOMER") return Response.json({ error: "Acesso não autorizado." }, { status: 403 });
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const symptom = typeof body.symptom === "string" ? body.symptom : "";
    const vehicleId = typeof body.vehicleId === "string" ? body.vehicleId : "";
    const answers = body.answers && typeof body.answers === "object" && !Array.isArray(body.answers)
      ? Object.fromEntries(Object.entries(body.answers as Record<string, unknown>).filter((entry): entry is [string, string] => typeof entry[1] === "string"))
      : {};
    if (!symptomOptions.some((option) => option.id === symptom)) {
      return Response.json({ error: "Escolha o que está acontecendo com o carro." }, { status: 400 });
    }
    let selectedVehicleId: string | null = null;
    if (vehicleId) {
      const [ownedVehicle] = await db
        .select({ id: vehicles.id })
        .from(vehicles)
        .where(and(eq(vehicles.id, vehicleId), eq(vehicles.userId, user.id)))
        .limit(1);
      if (!ownedVehicle) return Response.json({ error: "Veículo não encontrado na sua conta." }, { status: 403 });
      selectedVehicleId = ownedVehicle.id;
    } else {
      const [defaultVehicle] = await db
        .select({ id: vehicles.id })
        .from(vehicles)
        .where(eq(vehicles.userId, user.id))
        .limit(1);
      selectedVehicleId = defaultVehicle?.id ?? null;
    }
    const assessment = createAssessment(symptom as SymptomId, answers);
    const [diagnostic] = await db
      .insert(diagnosticRequests)
      .values({
        customerId: user.id,
        vehicleId: selectedVehicleId,
        symptom,
        answers,
        possibleCauses: assessment.possibleCauses,
        attentionLevel: assessment.attentionLevel,
        recommendation: assessment.recommendation,
      })
      .returning();
    return Response.json({ diagnostic }, { status: 201 });
  } catch {
    return Response.json({ error: "Não foi possível salvar sua avaliação inicial." }, { status: 500 });
  }
}
