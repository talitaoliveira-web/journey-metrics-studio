import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, LabelList, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ShieldAlert, ThumbsDown, Trophy } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { AssetImage } from "@/components/asset-image";
import type { EmailRow } from "@/lib/journey-data";
import {
  bestAndWorst, compareToAverage, emailAverages, estimatedDelivered, fmtInt, fmtRate, RATE_METRICS, type Comparison, type MetricKey,
} from "@/lib/journey-insights";
import { DidacticSection, HelpTip } from "@/components/didactic/shared";
import type { EmailPiece } from "@/components/didactic/journey-path";

const EMAIL_COLORS = ["var(--globo-blue)", "var(--globo-purple)", "var(--globo-pink)", "var(--globo-orange)", "var(--color-success)"];
const tick = { fontSize: 14, fill: "var(--color-muted-foreground)" };

function Delta({ c, testId }: { c: Comparison; testId: string }) {
  const symbol = c.direction === "up" ? "▲" : c.direction === "down" ? "▼" : "●";
  const color = c.tone === "good" ? "text-success" : c.tone === "bad" ? "text-destructive" : "text-muted-foreground";
  return (
    <span data-testid={testId} data-tone={c.tone} title={c.label} className={`ml-1.5 inline-flex items-center text-xs font-semibold ${color}`}>
      <span aria-hidden="true">{symbol}</span><span className="sr-only">{c.label}</span>
    </span>
  );
}

const METRIC_HELP: Record<MetricKey, string> = {
  openRate: "Percentual de envios abertos. Pode estar inflada por proteções de privacidade.",
  ctr: "Cliques divididos pelos envios. Mostra quantos agiram a partir do e-mail.",
  ctor: "Cliques divididos pelas aberturas. Mostra se quem abriu achou o conteúdo interessante.",
  bounce: "Envios que não chegaram à caixa de entrada. Quanto menor, melhor.",
  unsub: "Pessoas que pediram para não receber mais e-mails. Quanto menor, melhor.",
};

export function EmailPerformance({ emails, pieces }: { emails: EmailRow[]; pieces: EmailPiece[] }) {
  const [metric, setMetric] = useState<MetricKey>("ctr");
  const avg = emailAverages(emails);
  const { best, worst } = bestAndWorst(emails);
  const meta = RATE_METRICS.find((m) => m.key === metric) ?? RATE_METRICS[0]!;
  const pieceOf = (id: string) => pieces.find((p) => p.id === id);
  const chartData = emails.map((e) => ({ email: e.email, value: e[metric] }));

  return (
    <DidacticSection id="desempenho" n={3} title="Desempenho das comunicações"
      lead="Como cada um dos cinco e-mails se saiu, comparado com a média da jornada. Estes números vêm do tracking de e-mails e não mudam com os filtros."
      help={{ title: "Desempenho das comunicações", what: "Indicadores de cada envio: enviados, entregues, abertura, clique, cliques sobre aberturas, bounce e descadastro.", how: "▲ acima da média, ▼ abaixo, ● na média (diferença menor que 5%). Verde é melhor e vermelho é pior; em bounce e descadastro, ficar acima da média é pior.", why: "Mostra quais mensagens funcionam melhor e quais precisam de ajustes." }}>
      {emails.length === 0 ? (
        <div role="status" data-testid="performance-empty" className="rounded-xl border border-dashed border-border bg-muted/50 p-6 text-sm text-muted-foreground">
          A fonte carregada não tem indicadores de e-mail. Carregue uma planilha com a aba Emails para ver esta seção.
        </div>
      ) : (
        <>
          <div role="note" data-testid="mpp-warning" className="mb-4 flex gap-3 rounded-xl border border-warning bg-warning-soft p-4 text-sm leading-6 text-foreground">
            <ShieldAlert aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
            <p><strong>Atenção à taxa de abertura:</strong> proteções de privacidade, como a Apple Mail Privacy Protection, abrem os e-mails automaticamente e podem inflar esse número. Prefira o clique (CTR e CTOR) para avaliar o interesse. As taxas foram mantidas como registradas na fonte, sem recálculo pelos novos envios.</p>
          </div>

          <div className="mb-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground" data-testid="performance-legend">
            <span><span className="font-semibold text-success">▲</span> / <span className="font-semibold text-success">▼</span> verde: melhor que a média</span>
            <span><span className="font-semibold text-destructive">▲</span> / <span className="font-semibold text-destructive">▼</span> vermelho: pior que a média</span>
            <span><span className="font-semibold">●</span> cinza: na média (±5%)</span>
            <span>≈ entregues estimados: enviados menos bounce</span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-border bg-card">
            <table className="w-full min-w-[920px] text-sm" data-testid="performance-table">
              <caption className="sr-only">Indicadores por e-mail comparados com a média da jornada</caption>
              <thead>
                <tr className="border-b border-border bg-muted/60 text-left text-muted-foreground">
                  <th scope="col" className="p-3 font-semibold">E-mail</th>
                  <th scope="col" className="p-3 text-right font-semibold">Enviados</th>
                  <th scope="col" className="p-3 text-right font-semibold">Entregues ≈</th>
                  {RATE_METRICS.map((m) => (
                    <th key={m.key} scope="col" className="p-3 text-right font-semibold">
                      <span className="inline-flex items-center justify-end gap-1">{m.short}
                        <HelpTip id={`metric-${m.key}`} help={{ title: m.label, what: METRIC_HELP[m.key], how: m.higherIsBetter ? "Quanto maior, melhor. Compare com a média da jornada na última linha." : "Quanto menor, melhor. Compare com a média da jornada na última linha.", why: "Ajuda a decidir qual e-mail ajustar primeiro." }} />
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {emails.map((e) => {
                  const piece = pieceOf(e.email);
                  const slug = e.email.toLowerCase().replace(/\s+/g, "-");
                  return (
                    <tr key={e.email} data-testid={`performance-row-${slug}`} className="border-b border-border transition-colors duration-150 hover:bg-muted/40">
                      <th scope="row" className="p-3 text-left font-normal">
                        <div className="flex items-center gap-3">
                          {piece && <AssetImage src={piece.img.url} alt={`Miniatura do ${e.email}`} label={e.email} testId={`performance-thumb-${slug}`}
                            className="h-14 w-10 shrink-0 rounded-md border border-border object-cover object-top" fallbackClassName="!min-h-14 !w-10 !p-1" />}
                          <div>
                            <p className="font-semibold text-foreground">{e.email}</p>
                            {piece && <p className="max-w-[220px] truncate text-muted-foreground" title={piece.subject}>{piece.subject}</p>}
                            {e.email === best && <span data-testid="badge-best" className="mt-1 inline-flex items-center gap-1 rounded-full bg-success px-2 py-0.5 text-xs font-semibold text-primary-foreground"><Trophy aria-hidden="true" className="h-3.5 w-3.5" /> Melhor desempenho</span>}
                            {e.email === worst && <span data-testid="badge-worst" className="mt-1 inline-flex items-center gap-1 rounded-full bg-destructive px-2 py-0.5 text-xs font-semibold text-destructive-foreground"><ThumbsDown aria-hidden="true" className="h-3.5 w-3.5" /> Pior desempenho</span>}
                          </div>
                        </div>
                      </th>
                      <td className="p-3 text-right tabular-nums text-foreground">{fmtInt(e.sends)}</td>
                      <td className="p-3 text-right tabular-nums text-foreground" title="Estimativa: enviados menos bounce">≈ {fmtInt(estimatedDelivered(e))}</td>
                      {RATE_METRICS.map((m) => (
                        <td key={m.key} className="whitespace-nowrap p-3 text-right tabular-nums text-foreground">
                          {fmtRate(e[m.key])}<Delta c={compareToAverage(e[m.key], avg[m.key], m.higherIsBetter)} testId={`delta-${slug}-${m.key}`} />
                        </td>
                      ))}
                    </tr>
                  );
                })}
                <tr className="bg-muted/60 font-semibold" data-testid="performance-average-row">
                  <th scope="row" className="p-3 text-left text-foreground">Média da jornada</th>
                  <td className="p-3 text-right tabular-nums">{fmtInt(Math.round(emails.reduce((s, e) => s + e.sends, 0) / emails.length))}</td>
                  <td className="p-3 text-right tabular-nums">≈ {fmtInt(Math.round(emails.reduce((s, e) => s + estimatedDelivered(e), 0) / emails.length))}</td>
                  {RATE_METRICS.map((m) => <td key={m.key} className="p-3 text-right tabular-nums">{fmtRate(avg[m.key])}</td>)}
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">Selos calculados pelo CTR (cliques ÷ envios), o indicador mais próximo do objetivo de levar o contato ao formulário.</p>

          <div className="mt-5 rounded-xl border border-border bg-card p-5" data-testid="performance-chart">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-semibold text-foreground">{meta.label} por e-mail</h3>
              <ToggleGroup type="single" value={metric} onValueChange={(v) => v && setMetric(v as MetricKey)} aria-label="Escolha o indicador do gráfico" className="flex-wrap justify-start">
                {RATE_METRICS.map((m) => <ToggleGroupItem key={m.key} value={m.key} data-testid={`chart-metric-${m.key}`} className="h-9 px-3 text-sm">{m.short}</ToggleGroupItem>)}
              </ToggleGroup>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData} margin={{ top: 28, right: 16, left: 8, bottom: 8 }}>
                <CartesianGrid vertical={false} stroke="var(--color-border)" />
                <XAxis dataKey="email" tick={tick} axisLine={false} tickLine={false} />
                <YAxis tick={tick} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} width={56} />
                <Tooltip cursor={{ fill: "var(--color-muted)" }} formatter={(v) => [fmtRate(Number(v)), meta.short]} contentStyle={{ fontSize: 14 }} />
                <ReferenceLine y={avg[metric]} stroke="var(--color-foreground)" strokeDasharray="6 4"
                  label={{ value: `Média ${fmtRate(avg[metric])}`, position: "insideTopRight", fontSize: 14, fill: "var(--color-foreground)" }} />
                <Bar dataKey="value" name={meta.short} radius={[4, 4, 0, 0]} maxBarSize={56}>
                  {chartData.map((d, i) => <Cell key={d.email} fill={EMAIL_COLORS[i % EMAIL_COLORS.length]} />)}
                  <LabelList dataKey="value" position="top" style={tick} formatter={(v: unknown) => fmtRate(Number(v))} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <p className="mt-2 text-sm text-muted-foreground">Passe o mouse sobre as barras para ver o valor exato. A linha tracejada é a média dos cinco e-mails.</p>
          </div>
        </>
      )}
    </DidacticSection>
  );
}
