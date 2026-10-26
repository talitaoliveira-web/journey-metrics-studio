// Lead base (Salesforce DE export) types and consolidation helpers. Browser-safe.
export type LeadRow = [
  email: string, empresa: string, categoria: string, cnpj: string, cpf: string, leadSource: string, campanha: string,
  createdDate: string, entrada: string, saida: string, status: string, sentToCrm: string, sentToCrmAt: string,
  abriu: string, q004: string, q005: string, q006: string,
];

export type Lead = {
  email: string; empresa: string; categoria: string; cnpj: string; cpf: string; leadSource: string; campanha: string;
  createdDate: string; entrada: string; saida: string; status: string; sentToCrm: string; sentToCrmAt: string;
  abriu: string; q004: string; q005: string; q006: string;
};

export const toLead = (r: LeadRow): Lead => ({
  email: r[0], empresa: r[1], categoria: r[2], cnpj: r[3], cpf: r[4], leadSource: r[5], campanha: r[6],
  createdDate: r[7], entrada: r[8], saida: r[9], status: r[10], sentToCrm: r[11], sentToCrmAt: r[12],
  abriu: r[13], q004: r[14], q005: r[15], q006: r[16],
});

/** Splits "Motivo e saiu da jornada após E-mail 03" into exit step and reason. */
export function splitStatus(status: string): { etapa: string; motivo: string } {
  const m = status.match(/^(.*?)\s*e?\s*saiu da jornada após (E-mail \d+)$/i);
  if (!m) return { etapa: "Não informado", motivo: "Não informado" };
  return { etapa: m[2], motivo: m[1].trim() || "Não informado" };
}

export function consolidateLeads(leads: Lead[]) {
  const funnelMap = new Map<string, { status: string; etapa: string; motivo: string; qtde: number }>();
  for (const l of leads) {
    const cur = funnelMap.get(l.status);
    if (cur) cur.qtde++;
    else funnelMap.set(l.status, { status: l.status, ...splitStatus(l.status), qtde: 1 });
  }
  const byEtapa = new Map<string, number>();
  for (const f of funnelMap.values()) if (f.etapa !== "Não informado") byEtapa.set(f.etapa, (byEtapa.get(f.etapa) ?? 0) + f.qtde);
  return {
    base: leads.length,
    entradas: leads.filter((l) => l.entrada).length,
    mql: leads.filter((l) => l.sentToCrm === "Sim").length,
    cnpj: leads.filter((l) => l.cnpj).length,
    q004: leads.filter((l) => l.q004).length,
    q005: leads.filter((l) => l.q005).length,
    funnel: [...funnelMap.values()].sort((a, b) => b.qtde - a.qtde),
    saidasPorEtapa: [...byEtapa.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([etapa, qtde]) => ({ etapa, qtde })),
  };
}
