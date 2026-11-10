import { describe, expect, it } from "vitest";
import { defaultJourney, extractSpreadsheetId, parseJourneySheets, parseNumber, templateRows } from "@/lib/journey-data";

describe("journey sheet parsing", () => {
  it("uses the confirmed 1,923 sends for EML 01", () => {
    expect(defaultJourney.emails.find(email => email.email === "EML 01")?.sends).toBe(1923);
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
    expect(data.overview.base).toBe(7425);
    expect(data.emails).toEqual(defaultJourney.emails);
    expect(loaded).toEqual(["Visao_Geral"]);
  });

  it("extracts the spreadsheet id from a link", () => {
    expect(extractSpreadsheetId("https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms/edit#gid=0"))
      .toBe("1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms");
  });
});
