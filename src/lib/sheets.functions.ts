import { createServerFn } from "@tanstack/react-start";
import { parseJourneySheets, SHEET_TABS, templateRows } from "./journey-data";
import { sheetsFetch } from "./sheets.server";

type TabKey = keyof typeof SHEET_TABS;

export const loadJourneyFromSheet = createServerFn({ method: "POST" })
  .inputValidator((input: { spreadsheetId: string }) => {
    if (!/^[a-zA-Z0-9_-]{10,100}$/.test(input?.spreadsheetId ?? "")) throw new Error("Link de planilha inválido.");
    return input;
  })
  .handler(async ({ data }) => {
    const id = data.spreadsheetId;
    const meta = await sheetsFetch<{ properties?: { title?: string }; sheets?: { properties?: { title?: string } }[] }>(
      `/spreadsheets/${id}?fields=properties.title,sheets.properties.title`,
    );
    const titles = new Set((meta.sheets ?? []).map((s) => s.properties?.title ?? ""));
    const present = (Object.entries(SHEET_TABS) as [TabKey, string][]).filter(([, t]) => titles.has(t));
    if (!present.length) {
      return { ok: false as const, error: `Nenhuma aba reconhecida. Use as abas: ${Object.values(SHEET_TABS).join(", ")}.` };
    }
    const qs = present.map(([, t]) => `ranges=${t}!A1:J200`).join("&");
    const res = await sheetsFetch<{ valueRanges?: { values?: unknown[][] }[] }>(
      `/spreadsheets/${id}/values:batchGet?${qs}&valueRenderOption=UNFORMATTED_VALUE`,
    );
    const tabs: Partial<Record<TabKey, unknown[][]>> = {};
    present.forEach(([key], i) => { tabs[key] = res.valueRanges?.[i]?.values ?? []; });
    const parsed = parseJourneySheets(tabs);
    return { ok: true as const, title: meta.properties?.title ?? "Planilha", ...parsed };
  });

export const createTemplateSheet = createServerFn({ method: "POST" }).handler(async () => {
  const created = await sheetsFetch<{ spreadsheetId: string; spreadsheetUrl: string }>(`/spreadsheets`, {
    method: "POST",
    body: JSON.stringify({
      properties: { title: "Jornada inbound AON, métricas" },
      sheets: Object.values(SHEET_TABS).map((title) => ({ properties: { title } })),
    }),
  });
  const rows = templateRows();
  await sheetsFetch(`/spreadsheets/${created.spreadsheetId}/values:batchUpdate`, {
    method: "POST",
    body: JSON.stringify({
      valueInputOption: "RAW",
      data: (Object.entries(SHEET_TABS) as [TabKey, string][]).map(([key, title]) => ({ range: `${title}!A1`, values: rows[key] })),
    }),
  });
  return { spreadsheetId: created.spreadsheetId, url: created.spreadsheetUrl };
});
