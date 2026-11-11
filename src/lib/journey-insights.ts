// Didactic dashboard logic over the exported contact base (src/data/leads.json). Browser-safe and pure.
import type { Lead } from "@/lib/leads";
import type { EmailRow } from "@/lib/journey-data";

export const fmtInt = (n: number) => n.toLocaleString("pt-BR");
/** Formats a 0–1 ratio as a pt-BR percentage. */
export const fmtPct = (ratio: number, digits = 1) =>
  (ratio * 100).toLocaleString("pt-BR", { minimumFractionDigits: digits, maximumFractionDigits: digits }) + "%";
/** Formats a value already expressed in percent (e.g. 26.54) as a pt-BR percentage. */
export const fmtRate = (value: number) =>
  value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + "%";

/** Parses Salesforce export dates such as "8/19/2026 7:00:32 AM" (month/day/year) as UTC. */
export function parseSfDate(value: string): Date | null {
  const m = value.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2}):(\d{2})\s*(AM|PM)$/i);
  if (!m) return null;
  let hour = Number(m[4]) % 12;
  if (m[7]?.toUpperCase() === "PM") hour += 12;
  return new Date(Date.UTC(Number(m[3]), Number(m[1]) - 1, Number(m[2]), hour, Number(m[5]), Number(m[6])));
}

const ddmm = (d: Date) => `${String(d.getUTCDate()).padStart(2, "0")}/${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
export const fmtDate = (d: Date) => `${ddmm(d)}/${d.getUTCFullYear()}`;

export type Outcome = "active" | "goal" | "student" | "noEngage" | "noQualify" | "other";

export const OUTCOME_LABEL: Record<Outcome, string> = {
  active: "Ainda na jornada",
  goal: "Preencheu CNPJ (meta)",
  student: "Preencheu como estudante",
  noEngage: "Não engajou",
  noQualify: "Não qualificou",
  other: "Saiu sem motivo registrado",
};

/** Meta (goal) = preencheu o CNPJ. Estudantes preenchem o formulário, mas não são MQL de empresa. */
export function outcomeOf(lead: Lead): { outcome: Outcome; exitEmail: number | null } {
  if (!lead.saida.trim()) return { outcome: "active", exitEmail: null };
  const match = lead.status.match(/após E-mail (\d+)/i);
  const exitEmail = match ? Number(match[1]) : null;
  const s = lead.status.trim().toLowerCase();
  const outcome: Outcome = s.startsWith("preencheu cnpj") ? "goal"
    : s.startsWith("preencheu como estudante") ? "student"
    : s.startsWith("não engajou") ? "noEngage"
    : s.startsWith("não qualificou") ? "noQualify"
    : "other";
  return { outcome, exitEmail };
}

// ---------- Filters ----------

export type LeadFilters = { period: string; segment: string; version: string };
export const DEFAULT_FILTERS: LeadFilters = { period: "all", segment: "all", version: "all" };
export const isDefaultFilters = (f: LeadFilters) => f.period === "all" && f.segment === "all" && f.version === "all";

const MONTHS = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
const monthKey = (d: Date) => `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
const monthLabel = (key: string) => {
  const [y, m] = key.split("-");
  const name = MONTHS[Number(m) - 1] ?? key;
  return `${name.charAt(0).toUpperCase()}${name.slice(1)} de ${y}`;
};
export const sourceOf = (lead: Lead) => lead.leadSource.trim() || "Não informado";
export const categoryOf = (lead: Lead) => lead.categoria.trim() || "Não informado";

export type FilterOption = { value: string; label: string; count: number };
export type FilterOptions = {
  periods: FilterOption[];
  categories: FilterOption[];
  sources: FilterOption[];
  coverage: { first: Date; last: Date } | null;
};

const entered = (leads: Lead[]) => leads.filter((l) => parseSfDate(l.entrada) !== null);

const countBy = (items: string[], prefix: string, label: (v: string) => string = (v) => v): FilterOption[] => {
  const map = new Map<string, number>();
  for (const item of items) map.set(item, (map.get(item) ?? 0) + 1);
  return [...map.entries()].sort((a, b) => b[1] - a[1]).map(([v, count]) => ({ value: `${prefix}${v}`, label: label(v), count }));
};

export function filterOptions(leads: Lead[]): FilterOptions {
  const list = entered(leads);
  const dates = list.map((l) => parseSfDate(l.entrada)).filter((d): d is Date => d !== null);
  const periods = countBy(dates.map(monthKey), "", monthLabel).sort((a, b) => a.value.localeCompare(b.value));
  const times = dates.map((d) => d.getTime());
  return {
    periods,
    categories: countBy(list.map(categoryOf), "cat:"),
    sources: countBy(list.map(sourceOf), "src:"),
    coverage: times.length ? { first: new Date(Math.min(...times)), last: new Date(Math.max(...times)) } : null,
  };
}

/** Returns only contacts that entered the journey and match the filters. */
export function applyFilters(leads: Lead[], filters: LeadFilters): Lead[] {
  return entered(leads).filter((lead) => {
    const date = parseSfDate(lead.entrada);
    if (filters.period !== "all" && (!date || monthKey(date) !== filters.period)) return false;
    if (filters.segment.startsWith("cat:") && categoryOf(lead) !== filters.segment.slice(4)) return false;
    if (filters.segment.startsWith("src:") && sourceOf(lead) !== filters.segment.slice(4)) return false;
    return true;
  });
}

// ---------- KPIs ----------

export type Kpis = {
  entered: number; active: number; concluded: number; goal: number; student: number; abandoned: number;
  activeRate: number; concludedRate: number; goalRate: number; abandonRate: number; avgDays: number | null;
};

export function computeKpis(leads: Lead[]): Kpis {
  let active = 0, goal = 0, student = 0, abandoned = 0, days = 0, timed = 0;
  for (const lead of leads) {
    const { outcome, exitEmail } = outcomeOf(lead);
    if (outcome === "active") { active++; continue; }
    if (outcome === "goal") goal++;
    if (outcome === "student") student++;
    if (outcome !== "goal" && exitEmail !== null && exitEmail < 5) abandoned++;
    const a = parseSfDate(lead.entrada), b = parseSfDate(lead.saida);
    if (a && b && b >= a) { days += (b.getTime() - a.getTime()) / 86_400_000; timed++; }
  }
  const total = leads.length;
  const ratio = (n: number) => (total ? n / total : 0);
  const concluded = total - active;
  return {
    entered: total, active, concluded, goal, student, abandoned,
    activeRate: ratio(active), concludedRate: ratio(concluded), goalRate: ratio(goal), abandonRate: ratio(abandoned),
    avgDays: timed ? days / timed : null,
  };
}

// ---------- Journey path ----------

export type StepKind = "entry" | "email" | "wait" | "decision" | "goal" | "exit";

export type PathStep = {
  id: string;
  kind: StepKind;
  label: string;
  emailIndex: number | null;
  /** Contacts that reached this step. */
  count: number;
  /** Share that moved on (for the final decision: share that reached the goal). */
  advanceRate: number | null;
  /** Contacts that left here without reaching the goal. */
  lost: number;
  goals: number;
  reasons: { label: string; count: number }[];
  isFinal: boolean;
};

export type JourneyPath = { finished: number; active: number; steps: PathStep[]; biggestLossId: string | null };

const step = (s: Omit<PathStep, "reasons" | "isFinal" | "lost" | "goals"> & Partial<Pick<PathStep, "reasons" | "isFinal" | "lost" | "goals">>): PathStep => ({
  reasons: [], isFinal: false, lost: 0, goals: 0, ...s,
});

/**
 * Builds the real journey order (entry > e-mail > wait > decision … > goal/exit) for contacts that already
 * left the journey. Active contacts have no recorded position, so they are reported separately.
 */
export function buildPath(leads: Lead[]): JourneyPath {
  const finished = leads.map(outcomeOf).filter((o) => o.outcome !== "active");
  const active = leads.length - finished.length;
  const steps: PathStep[] = [];
  let remaining = finished.length;
  const rate = (num: number, den: number) => (den ? num / den : null);

  steps.push(step({ id: "entry", kind: "entry", label: "Entrada na jornada", emailIndex: null, count: remaining, advanceRate: rate(remaining, remaining) }));
  for (let n = 1; n <= 5; n++) {
    const at = remaining;
    const id = String(n).padStart(2, "0");
    steps.push(step({ id: `email-${n}`, kind: "email", label: `E-mail ${id}`, emailIndex: n, count: at, advanceRate: rate(at, at) }));
    steps.push(step({ id: `wait-${n}`, kind: "wait", label: n === 5 ? "Espera final" : `Espera após o E-mail ${id}`, emailIndex: n, count: at, advanceRate: rate(at, at) }));
    const isFinal = n === 5;
    // Exits without a recorded e-mail are treated as leaving at the final classification.
    const exits = finished.filter((o) => (isFinal ? o.exitEmail === null || o.exitEmail >= 5 : o.exitEmail === n));
    const goals = exits.filter((o) => o.outcome === "goal").length;
    const reasonMap = new Map<string, number>();
    for (const o of exits) reasonMap.set(OUTCOME_LABEL[o.outcome], (reasonMap.get(OUTCOME_LABEL[o.outcome]) ?? 0) + 1);
    const next = at - exits.length;
    steps.push(step({
      id: `decision-${n}`, kind: "decision", label: isFinal ? "Classificação final" : `Decisão após o E-mail ${id}`, emailIndex: n,
      count: at, advanceRate: isFinal ? rate(goals, at) : rate(next, at), lost: exits.length - goals, goals,
      reasons: [...reasonMap.entries()].sort((a, b) => b[1] - a[1]).map(([label, count]) => ({ label, count })), isFinal,
    }));
    remaining = next;
  }
  const totalGoals = finished.filter((o) => o.outcome === "goal").length;
  steps.push(step({ id: "goal", kind: "goal", label: "Meta atingida: preencheu o CNPJ", emailIndex: null, count: totalGoals, advanceRate: null }));
  steps.push(step({ id: "exit", kind: "exit", label: "Saída sem meta", emailIndex: null, count: finished.length - totalGoals, advanceRate: null }));

  const candidates = steps.filter((s) => s.kind === "decision" && !s.isFinal && s.lost > 0);
  const biggest = candidates.reduce<PathStep | null>((best, s) => (!best || s.lost > best.lost ? s : best), null);
  return { finished: finished.length, active, steps, biggestLossId: biggest?.id ?? null };
}

// ---------- Weekly evolution ----------

export type WeekPoint = { week: string; label: string; entradas: number; conclusoes: number; metas: number };

const weekStart = (d: Date) => {
  const offset = (d.getUTCDay() + 6) % 7; // Monday-based weeks
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - offset));
};

export function weeklySeries(leads: Lead[]): WeekPoint[] {
  const points = new Map<number, WeekPoint>();
  const bump = (d: Date | null, key: "entradas" | "conclusoes" | "metas") => {
    if (!d) return;
    const w = weekStart(d);
    const t = w.getTime();
    const p = points.get(t) ?? { week: w.toISOString().slice(0, 10), label: ddmm(w), entradas: 0, conclusoes: 0, metas: 0 };
    p[key]++;
    points.set(t, p);
  };
  for (const lead of leads) {
    bump(parseSfDate(lead.entrada), "entradas");
    const { outcome } = outcomeOf(lead);
    if (outcome === "active") continue;
    const exit = parseSfDate(lead.saida);
    bump(exit, "conclusoes");
    if (outcome === "goal") bump(exit, "metas");
  }
  if (!points.size) return [];
  const keys = [...points.keys()];
  const out: WeekPoint[] = [];
  for (let t = Math.min(...keys); t <= Math.max(...keys); t += 7 * 86_400_000) {
    const w = new Date(t);
    out.push(points.get(t) ?? { week: w.toISOString().slice(0, 10), label: ddmm(w), entradas: 0, conclusoes: 0, metas: 0 });
  }
  return out;
}

export function weeklyInsights(series: WeekPoint[]): string[] {
  const lastEntryIdx = series.map((p) => p.entradas > 0).lastIndexOf(true);
  if (lastEntryIdx < 1) return ["Ainda não há semanas suficientes para comparar as entradas."];
  const last = series[lastEntryIdx];
  const prev = series[lastEntryIdx - 1];
  if (!last || !prev) return [];
  const out: string[] = [];
  if (prev.entradas === 0) {
    out.push(`A semana de ${last.label} teve ${fmtInt(last.entradas)} entradas, depois de uma semana sem novos contatos.`);
  } else {
    const change = (last.entradas - prev.entradas) / prev.entradas;
    const verb = change > 0 ? "subiram" : change < 0 ? "caíram" : "ficaram estáveis";
    out.push(change === 0
      ? `As entradas ficaram estáveis na última semana com entradas (${fmtInt(last.entradas)} contatos na semana de ${last.label}).`
      : `As entradas ${verb} ${fmtPct(Math.abs(change), 0)} na última semana com entradas: de ${fmtInt(prev.entradas)} para ${fmtInt(last.entradas)} contatos (semana de ${last.label}).`);
  }
  const peak = series.reduce((best, p) => (p.conclusoes > best.conclusoes ? p : best), series[0] ?? last);
  if (peak.conclusoes > 0) out.push(`O maior volume de conclusões foi na semana de ${peak.label}: ${fmtInt(peak.conclusoes)} contatos saíram da jornada.`);
  return out;
}

// ---------- E-mail performance ----------

export type MetricKey = "openRate" | "ctr" | "ctor" | "bounce" | "unsub";

export const RATE_METRICS: { key: MetricKey; label: string; short: string; higherIsBetter: boolean }[] = [
  { key: "openRate", label: "Taxa de abertura", short: "Abertura", higherIsBetter: true },
  { key: "ctr", label: "Clique sobre envios (CTR)", short: "CTR", higherIsBetter: true },
  { key: "ctor", label: "Cliques sobre aberturas (CTOR)", short: "CTOR", higherIsBetter: true },
  { key: "bounce", label: "Bounce (falha de entrega)", short: "Bounce", higherIsBetter: false },
  { key: "unsub", label: "Descadastro", short: "Descadastro", higherIsBetter: false },
];

/** Simple mean of the e-mails' recorded rates ("média da jornada"). */
export function emailAverages(emails: EmailRow[]): Record<MetricKey, number> {
  const mean = (k: MetricKey) => (emails.length ? emails.reduce((s, e) => s + e[k], 0) / emails.length : 0);
  return { openRate: mean("openRate"), ctr: mean("ctr"), ctor: mean("ctor"), bounce: mean("bounce"), unsub: mean("unsub") };
}

export type Comparison = { direction: "up" | "down" | "neutral"; tone: "good" | "bad" | "neutral"; label: string };

/** Within ±5% of the average counts as neutral (gray). */
export function compareToAverage(value: number, avg: number, higherIsBetter: boolean): Comparison {
  const neutral = avg === 0 ? value === 0 : Math.abs(value - avg) / avg < 0.05;
  if (neutral) return { direction: "neutral", tone: "neutral", label: "Na média da jornada" };
  const up = value > avg;
  const good = up === higherIsBetter;
  return {
    direction: up ? "up" : "down",
    tone: good ? "good" : "bad",
    label: `${up ? "Acima" : "Abaixo"} da média da jornada (${good ? "melhor" : "pior"})`,
  };
}

/** Estimated delivered = sends minus bounced sends (the source has no delivered column). */
export const estimatedDelivered = (e: EmailRow) => Math.max(0, Math.round(e.sends * (1 - e.bounce / 100)));

/** Best and worst e-mail by CTR (clicks over sends), the rate closest to the form-invite goal. */
export function bestAndWorst(emails: EmailRow[]): { best: string | null; worst: string | null } {
  if (emails.length < 2) return { best: null, worst: null };
  const sorted = [...emails].sort((a, b) => b.ctr - a.ctr);
  const best = sorted[0], worst = sorted[sorted.length - 1];
  if (!best || !worst || best.ctr === worst.ctr) return { best: null, worst: null };
  return { best: best.email, worst: worst.email };
}

// ---------- Recommendations ----------

export type Recommendation = { id: string; title: string; text: string; basis: string };

export function recommendations(path: JourneyPath, kpis: Kpis, emails: EmailRow[]): Recommendation[] {
  const out: Recommendation[] = [];
  const loss = path.steps.find((s) => s.id === path.biggestLossId);
  if (loss && loss.emailIndex !== null) {
    const n = String(loss.emailIndex).padStart(2, "0");
    const reason = loss.reasons.find((r) => r.label !== OUTCOME_LABEL.goal)?.label ?? "";
    const share = fmtPct(loss.count ? loss.lost / loss.count : 0);
    out.push(reason === OUTCOME_LABEL.noEngage
      ? { id: "loss", title: `Muitos contatos saem depois do E-mail ${n}`, basis: "Caminho da jornada",
          text: `${fmtInt(loss.lost)} contatos (${share} dos que chegaram a essa etapa) saem após o E-mail ${n} por não engajarem. Revise o assunto e o conteúdo do E-mail ${n} e teste um intervalo de espera menor antes dele.` }
      : { id: "loss", title: `Maior perda depois do E-mail ${n}`, basis: "Caminho da jornada",
          text: `${fmtInt(loss.lost)} contatos (${share}) saem após o E-mail ${n}${reason ? ` (${reason.toLowerCase()})` : ""}. Revise a mensagem e o convite ao formulário dessa etapa.` });
  }
  if (emails.length) {
    const avg = emailAverages(emails);
    const bounce = [...emails].sort((a, b) => b.bounce - a.bounce)[0];
    if (bounce && bounce.bounce > avg.bounce * 1.05) out.push({
      id: "bounce", title: `O ${bounce.email} tem bounce alto`, basis: "Desempenho das comunicações",
      text: `${fmtRate(bounce.bounce)} dos envios do ${bounce.email} não foram entregues (média da jornada: ${fmtRate(avg.bounce)}). Revise a qualidade da lista: remova endereços inválidos e confirme a origem dos contatos antes do envio.`,
    });
    const ctr = [...emails].sort((a, b) => a.ctr - b.ctr)[0];
    if (ctr && ctr.ctr < avg.ctr * 0.95) out.push({
      id: "ctr", title: `O ${ctr.email} tem o menor clique`, basis: "Desempenho das comunicações",
      text: `Só ${fmtRate(ctr.ctr)} dos envios do ${ctr.email} geraram clique (média da jornada: ${fmtRate(avg.ctr)}). Teste um convite ao formulário mais claro e um botão mais visível no início da peça.`,
    });
  }
  if (kpis.entered > 0) out.push({
    id: "goal", title: "Poucos contatos atingem a meta", basis: "Visão geral",
    text: `${fmtPct(kpis.goalRate)} dos contatos que entraram preencheram o CNPJ. Teste levar o formulário de qualificação para os primeiros e-mails, com menos campos.`,
  });
  return out.slice(0, 3);
}
