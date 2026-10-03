export function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toLocaleUpperCase("pt-BR") ?? "")
    .join("");
}

const statusLabels: Record<string, string> = {
  REQUESTED: "Aguardando resposta",
  CONFIRMED: "Agendado",
  SCHEDULED: "Agendado",
  IN_PROGRESS: "Em andamento",
  COMPLETED: "Concluído",
  CANCELED: "Cancelado",
  PENDING: "Aguardando resposta",
  ACCEPTED: "Aceito",
  DECLINED: "Recusado",
  FOUND: "Motorista encontrado",
  ON_THE_WAY: "A caminho",
  ON_SITE: "No local",
};

export function statusLabel(status: string) {
  return statusLabels[status] ?? status.replaceAll("_", " ").toLocaleLowerCase("pt-BR");
}

export function statusClass(status: string) {
  if (["COMPLETED", "ACCEPTED"].includes(status)) return "status-success";
  if (["REQUESTED", "PENDING", "CONFIRMED", "SCHEDULED"].includes(status)) return "status-warning";
  if (["CANCELED", "DECLINED"].includes(status)) return "status-danger";
  if (["IN_PROGRESS", "FOUND", "ON_THE_WAY", "ON_SITE"].includes(status)) return "status-blue";
  return "";
}

export function formatDate(date: Date | string | null | undefined, options?: Intl.DateTimeFormatOptions) {
  if (!date) return "A combinar";
  const value = new Date(date);
  if (Number.isNaN(value.getTime())) return "A combinar";
  return new Intl.DateTimeFormat("pt-BR", options ?? { day: "2-digit", month: "short", year: "numeric" }).format(value);
}

export function formatCurrency(cents: number | null | undefined) {
  if (cents == null) return "A combinar";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}
