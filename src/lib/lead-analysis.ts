import type { Lead } from "@/lib/leads";

export type Identification = "all" | "cpf" | "cnpj" | "none";
export type Question = "q004" | "q005" | "q006";
export const hasDocument = (value: string) => Boolean(value.trim());
export const percentage = (count: number, total: number) => total ? count / total * 100 : 0;

export function selectIdentification(leads: Lead[], group: Identification) {
  return leads.filter((lead) => group === "all" || (group === "cpf" ? hasDocument(lead.cpf)
    : group === "cnpj" ? hasDocument(lead.cnpj) : !hasDocument(lead.cpf) && !hasDocument(lead.cnpj)));
}

export function documentSummary(leads: Lead[]) {
  const cpf = selectIdentification(leads, "cpf").length;
  const cnpj = selectIdentification(leads, "cnpj").length;
  const none = selectIdentification(leads, "none").length;
  const both = leads.filter((lead) => hasDocument(lead.cpf) && hasDocument(lead.cnpj)).length;
  return { total: leads.length, cpf, cnpj, none, both, identified: leads.length - none };
}

export function questionSummary(leads: Lead[], key: Question) {
  const counts = new Map<string, number>();
  for (const lead of leads) {
    const answer = lead[key].trim() || "Não informado";
    counts.set(answer, (counts.get(answer) ?? 0) + 1);
  }
  return [...counts].map(([answer, count]) => ({ answer, count, percent: percentage(count, leads.length) }))
    .sort((a, b) => a.answer === "Não informado" ? 1 : b.answer === "Não informado" ? -1 : b.count - a.count);
}