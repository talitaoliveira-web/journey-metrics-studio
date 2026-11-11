import { describe, expect, it } from "vitest";
import { defaultJourney, extractSpreadsheetId, parseJourneySheets, parseNumber, templateRows } from "@/lib/journey-data";

describe("journey sheet parsing", () => {
  it("uses the confirmed per-email sends", () => {
    expect(defaultJourney.emails.map(email => email.sends)).toEqual([4149, 2503, 2043, 1048, 931]);
  });

  it("corrects superseded sends from a loaded sheet without changing other metrics", () => {
    const tabs = templateRows();
    const superseded: Record<string, number> = { "EML 01": 12613, "EML 02": 4510, "EML 03": 4018, "EML 04": 2593, "EML 05": 2466 };
    for (const row of tabs.emails) { const old = superseded[String(row[0])]; if (old !== undefined) row[1] = old; }
    const { data } = parseJourneySheets(tabs);
    expect(data.emails).toEqual(defaultJourney.emails);
  });

  it("also corrects the earlier 1,923 reference for EML 01", () => {
    const tabs = templateRows();
    const row = tabs.emails.find(row => row[0] === "EML 01");
    if (!row) throw new Error("Missing EML 01 template row");
    row[1] = 1923;
    const { data } = parseJourneySheets(tabs);
    expect(data.emails.find(email => email.email === "EML 01")?.sends).toBe(4149);
  });

  it("parses pt-BR numbers and percents", () => {
    expect(parseNumber("1.923")).toBe(1923);
    expect(parseNumber("28,55%")).toBe(28.55);
    expect(parseNumber(3366)).toBe(3366);
  });

  it("round-trips the template back to the original report numbers", () => {
    const { data } = parseJourneySheets(templateRows());
    expect(data).toEqual(defaultJourney);
  });

  it("keeps original data for tabs that are missing", () => {
    const { data, loaded } = parseJourneySheets({ overview: [["Indicador", "Valor"], ["Entradas na Jornada", 2000]] });
    expect(data.overview.entradas).toBe(2000);
    expect(data.overview.base).toBe(9719);
    expect(data.emails).toEqual(defaultJourney.emails);
    expect(loaded).toEqual(["Visao_Geral"]);
  });

  it("extracts the spreadsheet id from a link", () => {
    expect(extractSpreadsheetId("https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms/edit#gid=0"))
      .toBe("1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms");
  });
});
