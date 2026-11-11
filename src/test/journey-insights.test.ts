import { describe, expect, it } from "vitest";
import leadRows from "@/data/leads.json";
import { toLead, type Lead, type LeadRow } from "@/lib/leads";
import { defaultJourney } from "@/lib/journey-data";
import {
  applyFilters, bestAndWorst, buildPath, compareToAverage, computeKpis, DEFAULT_FILTERS, emailAverages, estimatedDelivered,
  filterOptions, outcomeOf, parseSfDate, recommendations, weeklyInsights, weeklySeries,
} from "@/lib/journey-insights";

const lead = (entrada: string, saida: string, status: string, categoria = "Visitante", leadSource = "Portal GloboAds"): Lead => ({
  email: "a@b.com", empresa: "", categoria, cnpj: "", cpf: "", leadSource, campanha: "Jornada de Leads", createdDate: "",
  entrada, saida, status, sentToCrm: "Não", sentToCrmAt: "", abriu: "Não", q004: "", q005: "", q006: "",
});

const fixture: Lead[] = [
  lead("8/19/2026 7:00:32 AM", "8/21/2026 9:00:00 AM", "Preencheu CNPJ e saiu da jornada após E-mail 01", "Empresa"),
  lead("8/19/2026 7:00:32 AM", "9/8/2026 5:02:05 PM", "Não engajou e saiu da jornada após E-mail 03"),
  lead("8/19/2026 7:00:32 AM", "9/8/2026 5:02:05 PM", "Não engajou e saiu da jornada após E-mail 03"),
  lead("9/2/2026 7:00:32 AM", "9/30/2026 5:02:05 PM", "Não qualificou e saiu da jornada após E-mail 05", "Estudante", "Portal de Negócios"),
  lead("9/2/2026 7:00:32 AM", "", "Não informado"),
  lead("", "", "Não informado"),
];

describe("journey insights", () => {
  it("parses Salesforce US dates as UTC", () => {
    expect(parseSfDate("8/19/2026 7:00:32 PM")?.toISOString()).toBe("2026-08-19T19:00:32.000Z");
    expect(parseSfDate("12/1/2026 12:05:00 AM")?.toISOString()).toBe("2026-12-01T00:05:00.000Z");
    expect(parseSfDate("")).toBeNull();
  });

  it("classifies outcomes with CNPJ as the goal", () => {
    expect(outcomeOf(fixture[0]!)).toEqual({ outcome: "goal", exitEmail: 1 });
    expect(outcomeOf(fixture[1]!)).toEqual({ outcome: "noEngage", exitEmail: 3 });
    expect(outcomeOf(fixture[4]!)).toEqual({ outcome: "active", exitEmail: null });
  });

  it("computes KPIs only for contacts that entered", () => {
    const kpis = computeKpis(applyFilters(fixture, DEFAULT_FILTERS));
    expect(kpis).toMatchObject({ entered: 5, active: 1, concluded: 4, goal: 1, abandoned: 2 });
    expect(kpis.goalRate).toBeCloseTo(0.2);
  });

  it("filters by period and segment", () => {
    expect(applyFilters(fixture, { ...DEFAULT_FILTERS, period: "2026-09" })).toHaveLength(2);
    expect(applyFilters(fixture, { ...DEFAULT_FILTERS, segment: "cat:Empresa" })).toHaveLength(1);
    expect(applyFilters(fixture, { ...DEFAULT_FILTERS, segment: "src:Portal de Negócios" })).toHaveLength(1);
  });

  it("builds the path in journey order and flags the biggest loss", () => {
    const path = buildPath(applyFilters(fixture, DEFAULT_FILTERS));
    expect(path.finished).toBe(4);
    expect(path.active).toBe(1);
    expect(path.steps.slice(0, 4).map((s) => s.kind)).toEqual(["entry", "email", "wait", "decision"]);
    expect(path.biggestLossId).toBe("decision-3");
    const d3 = path.steps.find((s) => s.id === "decision-3");
    expect(d3).toMatchObject({ count: 3, lost: 2 });
    expect(path.steps.find((s) => s.id === "goal")?.count).toBe(1);
    expect(path.steps.find((s) => s.id === "exit")?.count).toBe(3);
  });

  it("builds continuous weekly series with an insight sentence", () => {
    const series = weeklySeries(applyFilters(fixture, DEFAULT_FILTERS));
    expect(series[0]).toMatchObject({ week: "2026-08-17", entradas: 3, metas: 1 });
    expect(series.map((p) => p.week)).toContain("2026-08-24"); // empty week kept
    expect(weeklyInsights(series)[0]).toMatch(/semana de 31\/08/);
  });

  it("compares rates with the journey average, inverting bounce", () => {
    expect(compareToAverage(3, 2, true).tone).toBe("good");
    expect(compareToAverage(3, 2, false)).toMatchObject({ direction: "up", tone: "bad" });
    expect(compareToAverage(2.04, 2, true).direction).toBe("neutral");
  });

  it("estimates delivered sends and picks best and worst by CTR", () => {
    const e1 = defaultJourney.emails[0]!;
    expect(estimatedDelivered(e1)).toBe(Math.round(4149 * (1 - 0.0323)));
    expect(bestAndWorst(defaultJourney.emails)).toEqual({ best: "EML 04", worst: "EML 03" });
    expect(emailAverages(defaultJourney.emails).bounce).toBeCloseTo((3.23 + 0.33 + 0.35 + 0.27 + 0.24) / 5);
  });

  it("derives three recommendations from the real base", () => {
    const leads = (leadRows as LeadRow[]).map(toLead);
    const filtered = applyFilters(leads, DEFAULT_FILTERS);
    const kpis = computeKpis(filtered);
    expect(kpis).toMatchObject({ entered: 8385, active: 2270, goal: 10 });
    const path = buildPath(filtered);
    expect(path.biggestLossId).toBe("decision-3");
    const recs = recommendations(path, kpis, defaultJourney.emails);
    expect(recs.map((r) => r.id)).toEqual(["loss", "bounce", "ctr"]);
    expect(recs[1]?.title).toContain("EML 01");
    expect(filterOptions(leads).periods.map((p) => p.value)).toEqual(["2026-08", "2026-09", "2026-10"]);
  });
});
