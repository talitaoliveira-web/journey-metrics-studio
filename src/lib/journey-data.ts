// Journey metrics shape, defaults (from the original report) and spreadsheet parsing.
// Browser-safe: no secrets or server-only imports.

export type FlowKind = "entry" | "email" | "wait" | "split" | "end";
export type FlowStep = { step: string; v: number; kind: FlowKind };
export type EmailRow = {
  email: string; sends: number; openRate: number; uniqueOpens: number; clicks: number;
  ctr: number; ctor: number; bounce: number; unsub: number;
};
export type Overview = { base: number; entradas: number; envios: number; mql: number };
export type ConsolidatedItem = { label: string; value: number; isRate: boolean };

export type JourneyData = {
  overview: Overview;
  flow: FlowStep[];
  emails: EmailRow[];
  consolidated: ConsolidatedItem[];
};

export const SHEET_TABS = {
  overview: "Visao_Geral",
  flow: "Fluxo",
  emails: "Emails",
  consolidated: "Consolidado",
} as const;

export const OVERVIEW_KEYS: { key: keyof Overview; label: string }[] = [
  { key: "base", label: "Base da Data Extension" },
  { key: "entradas", label: "Entradas na Jornada" },
  { key: "envios", label: "Total de Envios" },
  { key: "mql", label: "MQL" },
];

const KIND_LABELS: Record<FlowKind, string> = {
  entry: "entrada", email: "email", wait: "espera", split: "validacao", end: "saida",
};

export const EMAIL_HEADERS = ["Email", "Sends", "Open Rate", "Unique Opens", "Clicks", "CTR", "CTOR", "Bounce Rate", "Unsub Rate"];

export const defaultJourney: JourneyData = {
  overview: { base: 7425, entradas: 1923, envios: 3366, mql: 546 },
  flow: [
    { step: "Entradas", v: 1923, kind: "entry" },
    { step: "Email 01", v: 1923, kind: "email" },
    { step: "Aguardando próximo envio", v: 1899, kind: "wait" },
    { step: "Validação do MQL", v: 1646, kind: "split" },
    { step: "Email 02", v: 1188, kind: "email" },
    { step: "Aguardando próximo envio", v: 1098, kind: "wait" },
    { step: "Validação do MQL", v: 376, kind: "split" },
    { step: "Email 03", v: 867, kind: "email" },
    { step: "Aguardando próximo envio", v: 862, kind: "wait" },
    { step: "Validação do MQL", v: 692, kind: "split" },
    { step: "Email 04", v: 573, kind: "email" },
    { step: "Aguardando próximo envio", v: 573, kind: "wait" },
    { step: "Validação do MQL", v: 483, kind: "split" },
    { step: "Email 05", v: 483, kind: "email" },
    { step: "Aguardando próximo envio", v: 470, kind: "wait" },
    { step: "Última validação do MQL", v: 352, kind: "split" },
    { step: "Não Convertido", v: 352, kind: "end" },
  ],
  emails: [
    { email: "EML 01", sends: 1252, openRate: 28.55, uniqueOpens: 338, clicks: 15, ctr: 1.27, ctor: 4.44, bounce: 5.43, unsub: 1.01 },
    { email: "EML 02", sends: 786, openRate: 10.09, uniqueOpens: 79, clicks: 5, ctr: 0.64, ctor: 6.33, bounce: 0.38, unsub: 0.77 },
    { email: "EML 03", sends: 570, openRate: 4.59, uniqueOpens: 26, clicks: 2, ctr: 0.35, ctor: 7.69, bounce: 0.53, unsub: 0.35 },
    { email: "EML 04", sends: 418, openRate: 62.92, uniqueOpens: 263, clicks: 15, ctr: 3.59, ctor: 5.7, bounce: 0.0, unsub: 1.44 },
    { email: "EML 05", sends: 340, openRate: 59.29, uniqueOpens: 201, clicks: 8, ctr: 2.36, ctor: 3.98, bounce: 0.29, unsub: 0.88 },
  ],
  consolidated: [
    { label: "Total Sends", value: 3366, isRate: false },
    { label: "Unique Opens", value: 907, isRate: false },
    { label: "Open Rate", value: 27.56, isRate: true },
    { label: "Unique Clicks", value: 45, isRate: false },
    { label: "CTR", value: 1.37, isRate: true },
    { label: "CTOR", value: 4.96, isRate: true },
    { label: "Bounces", value: 75, isRate: false },
    { label: "Bounce Rate", value: 2.23, isRate: true },
    { label: "Unsubscribes", value: 29, isRate: false },
    { label: "Unsubscribe Rate", value: 0.88, isRate: true },
  ],
};

const norm = (s: unknown) =>
  String(s ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();

/** Accepts numbers or pt-BR/en strings like "1.923", "28,55%", "3366". */
export function parseNumber(raw: unknown): number | null {
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : null;
  let s = String(raw ?? "").replace(/[%\s]/g, "");
  if (!s) return null;
  if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
  else if (/^-?\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, "");
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

const isRateLabel = (l: string) => /rate|ctr|ctor|taxa/i.test(l);

function kindFrom(raw: unknown): FlowKind | null {
  const v = norm(raw);
  const found = (Object.entries(KIND_LABELS) as [FlowKind, string][]).find(([k, l]) => v === l || v === k);
  return found ? found[0] : null;
}

type Rows = unknown[][];

/** Builds journey data from sheet tabs; any tab missing or invalid keeps the default. */
export function parseJourneySheets(tabs: Partial<Record<keyof typeof SHEET_TABS, Rows>>): {
  data: JourneyData; loaded: string[]; warnings: string[];
} {
  const data: JourneyData = structuredClone(defaultJourney);
  const loaded: string[] = [];
  const warnings: string[] = [];

  if (tabs.overview) {
    const next = { ...data.overview };
    let hits = 0;
    for (const row of tabs.overview) {
      const match = OVERVIEW_KEYS.find((k) => norm(k.label) === norm(row[0]));
      const n = parseNumber(row[1]);
      if (match && n !== null) { next[match.key] = n; hits++; }
    }
    if (hits) { data.overview = next; loaded.push(SHEET_TABS.overview); }
    else warnings.push(`Aba ${SHEET_TABS.overview} sem indicadores reconhecidos.`);
  }

  if (tabs.flow) {
    const steps: FlowStep[] = [];
    for (const row of tabs.flow.slice(1)) {
      const n = parseNumber(row[1]);
      const kind = kindFrom(row[2]);
      if (String(row[0] ?? "").trim() && n !== null && kind) steps.push({ step: String(row[0]).trim(), v: n, kind });
    }
    if (steps.length) { data.flow = steps; loaded.push(SHEET_TABS.flow); }
    else warnings.push(`Aba ${SHEET_TABS.flow} sem etapas válidas.`);
  }

  if (tabs.emails) {
    const list: EmailRow[] = [];
    for (const row of tabs.emails.slice(1)) {
      const name = String(row[0] ?? "").trim();
      const nums = row.slice(1, 9).map(parseNumber);
      if (!name || nums.length < 8 || nums.some((x) => x === null)) continue;
      const [sends, openRate, uniqueOpens, clicks, ctr, ctor, bounce, unsub] = nums as [number, number, number, number, number, number, number, number];
      list.push({ email: name, sends, openRate, uniqueOpens, clicks, ctr, ctor, bounce, unsub });
    }
    if (list.length) { data.emails = list; loaded.push(SHEET_TABS.emails); }
    else warnings.push(`Aba ${SHEET_TABS.emails} sem linhas completas.`);
  }

  if (tabs.consolidated) {
    const items: ConsolidatedItem[] = [];
    for (const row of tabs.consolidated.slice(1)) {
      const label = String(row[0] ?? "").trim();
      const n = parseNumber(row[1]);
      if (label && n !== null) items.push({ label, value: n, isRate: isRateLabel(label) });
    }
    if (items.length) { data.consolidated = items; loaded.push(SHEET_TABS.consolidated); }
    else warnings.push(`Aba ${SHEET_TABS.consolidated} sem indicadores válidos.`);
  }

  return { data, loaded, warnings };
}

/** Template rows mirroring the defaults, used to create a ready-to-edit spreadsheet. */
export function templateRows(d: JourneyData = defaultJourney): Record<keyof typeof SHEET_TABS, (string | number)[][]> {
  return {
    overview: [["Indicador", "Valor"], ...OVERVIEW_KEYS.map((k) => [k.label, d.overview[k.key]])],
    flow: [["Etapa", "Contatos", "Tipo (entrada, email, espera, validacao, saida)"], ...d.flow.map((f) => [f.step, f.v, KIND_LABELS[f.kind]])],
    emails: [EMAIL_HEADERS, ...d.emails.map((e) => [e.email, e.sends, e.openRate, e.uniqueOpens, e.clicks, e.ctr, e.ctor, e.bounce, e.unsub])],
    consolidated: [["Indicador", "Valor"], ...d.consolidated.map((c) => [c.label, c.value])],
  };
}

export function extractSpreadsheetId(input: string): string | null {
  const s = input.trim();
  const m = s.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  if (m?.[1]) return m[1];
  return /^[a-zA-Z0-9_-]{20,}$/.test(s) ? s : null;
}
