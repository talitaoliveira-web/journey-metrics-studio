import { describe, expect, it } from "vitest";
import rows from "@/data/leads.json";
import { toLead, type LeadRow } from "@/lib/leads";
import { documentSummary, percentage, questionSummary, selectIdentification } from "@/lib/lead-analysis";

const leads = (rows as LeadRow[]).map(toLead);
describe("document and question analysis", () => {
  it("counts filled CPF independently from CNPJ, including overlaps", () => {
    expect(documentSummary(leads)).toEqual({ total: 8395, cpf: 7, cnpj: 12, none: 8378, both: 2, identified: 17 });
  });
  it("keeps original Q004 categories and uses every analyzed record as denominator", () => {
    const answers = questionSummary(leads, "q004");
    expect(answers.find((a) => a.answer === "Entre R$ 101 mil a R$ 1 milhão")?.count).toBe(6);
    expect(answers.find((a) => a.answer === "Não informado")?.count).toBe(8385);
    expect(answers.reduce((sum, a) => sum + a.count, 0)).toBe(8395);
    expect(answers.find((a) => a.count === 6)?.percent).toBe(6 / 8395 * 100);
  });
  it("keeps original Q005 investment ranges", () => {
    expect(questionSummary(leads, "q005").find((a) => a.answer === "Até R$ 49 mil")?.count).toBe(6);
  });
  it("does not invent negative Q006 answers", () => {
    expect(questionSummary(leads, "q006").map((a) => [a.answer, a.count])).toEqual([["Sim", 10], ["Não informado", 8385]]);
  });
  it("segments by documents without forcing dual-document records into one group", () => {
    expect(selectIdentification(leads, "cpf")).toHaveLength(7);
    expect(selectIdentification(leads, "cnpj")).toHaveLength(12);
    expect(selectIdentification(leads, "none")).toHaveLength(8378);
    expect(questionSummary(selectIdentification(leads, "cpf"), "q006").find((a) => a.answer === "Sim")?.count ?? 0).toBe(0);
  });
  it("returns zero percentages for an empty segment", () => {
    expect(percentage(5, 0)).toBe(0);
    expect(questionSummary([], "q004")).toEqual([]);
  });
});