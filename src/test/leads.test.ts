import { describe, expect, it } from "vitest";
import rows from "@/data/leads.json";
import { consolidateLeads, splitStatus, toLead, type LeadRow } from "@/lib/leads";

const c = consolidateLeads((rows as LeadRow[]).map(toLead));

describe("lead base consolidation", () => {
  it("counts the uploaded base", () => {
    expect(c.base).toBe(8395);
    expect(c.entradas).toBe(8385);
    expect(c.mql).toBe(16);
  });
  it("counts CNPJ and form answers", () => {
    expect(c.cnpj).toBe(12);
    expect(c.q004).toBe(10);
    expect(c.q005).toBe(10);
  });
  it("splits exit status into step and reason", () => {
    expect(splitStatus("Não engajou e saiu da jornada após E-mail 03")).toEqual({ etapa: "E-mail 03", motivo: "Não engajou" });
    expect(splitStatus("Saiu da jornada após E-mail 01").etapa).toBe("E-mail 01");
  });
});
