import type { EmailRow } from "@/lib/journey-data";

export type EmailIssue = { code: string; message: string };
const fmt = (value: number) => value.toLocaleString("pt-BR");
const pct = (value: number) => `${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
const rounded = (value: number) => Math.round(value * 100) / 100;

/** Diagnostics only: never changes the source metrics. Delivery counts are unavailable. */
export function validateEmail01(row: EmailRow): EmailIssue[] {
  if (row.email !== "EML 01") return [];
  const issues: EmailIssue[] = [];
  const sends = 1923;
  if (row.sends !== sends) issues.push({ code: "sends", message: `Envios registrados: ${fmt(row.sends)}. A referência confirmada é 1.923.` });
  if (!Number.isInteger(row.uniqueOpens) || row.uniqueOpens < 0 || row.uniqueOpens > sends) {
    issues.push({ code: "uniqueOpens", message: `${fmt(row.uniqueOpens)} aberturas únicas não são compatíveis com 1.923 envios na mesma base.` });
  }
  const rates = [
    ["openRate", "Abertura", row.openRate], ["ctr", "CTR", row.ctr],
    ["ctor", "CTOR", row.ctor], ["bounce", "Falhas de entrega", row.bounce],
    ["unsub", "Descadastros", row.unsub],
  ] as const;
  for (const [code, label, rate] of rates) {
    if (!Number.isFinite(rate) || rate < 0 || rate > 100) issues.push({ code, message: `${label}: ${pct(rate)} está fora do intervalo de 0% a 100%.` });
  }
  if (row.uniqueOpens > sends && row.openRate >= 0 && row.openRate <= 100) {
    issues.push({ code: "openRate", message: `A abertura de ${pct(row.openRate)} não pode ser conciliada com ${fmt(row.uniqueOpens)} aberturas únicas e 1.923 envios. As entregas não estão disponíveis para validar a taxa exata.` });
  }
  if (Number.isFinite(row.clicks) && row.clicks >= 0) {
    const expectedCtr = rounded(row.clicks / sends * 100);
    if (row.ctr >= 0 && row.ctr <= 100 && Math.abs(rounded(row.ctr) - expectedCtr) > 0.005) {
      issues.push({ code: "ctr", message: `CTR registrado: ${pct(row.ctr)}. Pela relação entre ${fmt(row.clicks)} cliques e 1.923 envios, a conferência resulta em ${pct(expectedCtr)}; confirmar a regra de contagem na fonte.` });
    }
    if (row.uniqueOpens > 0 && Number.isFinite(row.uniqueOpens) && row.ctor >= 0 && row.ctor <= 100) {
      const expectedCtor = rounded(row.clicks / row.uniqueOpens * 100);
      if (Math.abs(rounded(row.ctor) - expectedCtor) > 0.005) issues.push({ code: "ctor", message: `CTOR registrado: ${pct(row.ctor)}. A relação entre cliques e aberturas únicas resulta em ${pct(expectedCtor)}; confirmar a regra de contagem na fonte.` });
    }
  }
  return issues;
}