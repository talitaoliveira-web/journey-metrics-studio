import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { EmailGallery } from "@/components/email-gallery";
import { SheetSource } from "@/components/sheet-source";
import { LeadsSection } from "@/components/leads-section";
import { defaultJourney, type JourneyData, type Overview } from "@/lib/journey-data";
import {
  Bar, BarChart, CartesianGrid, LabelList, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import {
  Database, LogIn, Send, Target, GitBranch, TrendingUp, Lightbulb, ShieldAlert, Activity, Info, Calendar, Mail,
} from "lucide-react";
import e1 from "@/assets/eml01.jpg.asset.json";
import e2 from "@/assets/eml02.jpg.asset.json";
import e3 from "@/assets/eml03.jpg.asset.json";
import e4 from "@/assets/eml04.jpg.asset.json";
import e5 from "@/assets/eml05.jpg.asset.json";

const pieces = [
  { id: "EML 01", img: e1, subject: "O que é Globo Ads? A gente te mostra", pre: "Conheça soluções para diferentes objetivos de marca", desc: "Apresenta a proposta de valor da Globo Ads e quebra a objeção de que a Globo é só TV, com CTA para o formulário." },
  { id: "EML 02", img: e2, subject: "O que acontece quando marcas se conectam à Globo?", pre: "Resultados e insights para inspirar sua estratégia", desc: "Reforça o valor com cases de sucesso e big numbers, levando novamente ao formulário." },
  { id: "EML 03", img: e3, subject: "Anunciar com a Globo é mais simples do que parece", pre: "Entenda como funciona na prática", desc: "Mantém a quebra de objeções com argumentos, benefícios e cases." },
  { id: "EML 04", img: e4, subject: "Vamos avançar com Globo Ads?", pre: "Falta só um próximo passo!", desc: "Tom mais personalizado e consultivo; desempenho superior ao EML 03." },
  { id: "EML 05", img: e5, subject: "O mercado está se movendo. E sua marca?", pre: "Veja onde estão as novas oportunidades", desc: "Última etapa: estrutura visual diferente, grandes cases e última chance de preencher o formulário." },
];

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Jornada inbound AON" },
      { name: "description", content: "Visão executiva da jornada JNY_INBOUND_LEADS_AON: fluxo, performance de e-mails, consolidado e insights." },
      { property: "og:title", content: "Jornada inbound AON" },
      { property: "og:description", content: "Visão executiva da jornada JNY_INBOUND_LEADS_AON no Salesforce Marketing Cloud." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

const BLUE = "var(--globo-blue)";
const fmt = (n: number) => n.toLocaleString("pt-BR");
const pct = (n: number) => n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + "%";

const overviewMeta: { key: keyof Overview; icon: typeof Database; label: string; desc: string; tone: string }[] = [
  { key: "base", icon: Database, label: "Base da Data Extension", desc: "Contatos elegíveis disponíveis na base de origem.", tone: "blue" },
  { key: "entradas", icon: LogIn, label: "Entradas na Jornada", desc: "Contatos que iniciaram a jornada no período.", tone: "purple" },
  { key: "envios", icon: Send, label: "Total de Envios", desc: "E-mails disparados ao longo das comunicações.", tone: "pink" },
  { key: "mql", icon: Target, label: "MQL", desc: "Leads qualificados pelo marketing.", tone: "orange" },
];

const kpiChip: Record<string, string> = {
  blue: "bg-globo-blue/10 text-globo-blue",
  purple: "bg-globo-purple/10 text-globo-purple",
  pink: "bg-globo-pink/10 text-globo-pink",
  orange: "bg-globo-orange/10 text-globo-orange",
};

const emailColors = ["var(--globo-blue)", "var(--globo-purple)", "var(--globo-pink)", "var(--globo-orange)", "var(--color-success)"];

const consolidatedTone = (label: string) =>
  /bounce rate|unsubscribe rate/i.test(label) ? "warning" : /open rate|^ctr$|^ctor$/i.test(label) ? "primary" : undefined;

const insights = [
  { icon: GitBranch, title: "Fluxo da Jornada", tone: "primary", text: "A jornada apresenta redução gradual do volume de contatos ao longo das etapas, refletindo a evolução pelos diferentes caminhos configurados." },
  { icon: TrendingUp, title: "Performance", tone: "success", text: "Os e-mails 4 e 5 apresentaram as maiores taxas de abertura da jornada." },
  { icon: Lightbulb, title: "Oportunidade de Otimização", tone: "warning", text: "Os e-mails 2 e 3 apresentam oportunidade de revisão de assunto, conteúdo, CTA e momento do envio para ampliar o engajamento." },
  { icon: ShieldAlert, title: "Entregabilidade", tone: "warning", text: "O primeiro envio concentrou a maior taxa de bounce da jornada, reforçando a importância do monitoramento da qualidade da base." },
  { icon: Activity, title: "Monitoramento", tone: "primary", text: "Recomenda-se acompanhar continuamente os principais KPIs para apoiar otimizações futuras da jornada." },
];

const toneText: Record<string, string> = { primary: "text-primary", success: "text-success", warning: "text-warning" };
const toneBg: Record<string, string> = { primary: "bg-primary-soft text-primary", success: "bg-success-soft text-success", warning: "bg-warning-soft text-warning" };

function SectionTitle({ n, title, sub, color = "bg-globo-blue" }: { n: string; title: string; sub?: string; color?: string }) {
  return (
    <div className="col-span-12 mt-4 flex items-end justify-between border-b border-border pb-3">
      <div className="flex items-center gap-3">
        <span className={`flex h-7 min-w-9 items-center justify-center rounded-md px-1.5 text-xs font-bold text-primary-foreground ${color}`}>{n}</span>
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      </div>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function Panel({ className = "", title, children }: { className?: string; title?: string; children: React.ReactNode }) {
  return (
    <div className={`rounded-md border border-border bg-card p-5 ${className}`}>
      {title && <h3 className="mb-4 text-sm font-semibold text-foreground">{title}</h3>}
      {children}
    </div>
  );
}

const axis = { fontSize: 11, fill: "var(--color-muted-foreground)" };

function Dashboard() {
  const [selected, setSelected] = useState("all");
  const [sheetData, setSheetData] = useState<JourneyData | null>(null);
  const [sheetInfo, setSheetInfo] = useState<{ title: string; at: Date } | null>(null);
  const data = sheetData ?? defaultJourney;
  const { flow, emails, consolidated } = data;
  const rows = selected === "all" ? emails : emails.filter((e) => e.email === selected);
  const maxFlow = Math.max(1, ...flow.map((f) => f.v));
  const lastEmail = [...flow].reverse().find((f) => f.kind === "email");
  const lastSplit = [...flow].reverse().find((f) => f.kind === "split");

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto grid max-w-[1600px] grid-cols-12 gap-5 px-10 py-10">
        {/* Header */}
        <header className="col-span-12 overflow-hidden rounded-2xl globo-gradient p-8 text-primary-foreground shadow-lg">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-primary-foreground/70">Globo • CRM • WPP Commerce</p>
              <h1 className="mt-2 text-4xl font-bold tracking-tight">Jornada inbound AON</h1>
              <p className="mt-1 text-base text-primary-foreground/80">Salesforce Marketing Cloud • JNY_INBOUND_LEADS_AON</p>
            </div>
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-primary-foreground/70">Data de início</label>
                <div className="flex h-9 items-center gap-2 rounded-md border border-primary-foreground/25 bg-primary-foreground/10 px-3 text-sm">
                  <Calendar className="h-4 w-4 text-primary-foreground/70" /> 26/08/2026
                </div>
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-primary-foreground/70">Email</label>
                <div className="flex h-9 items-center gap-2 rounded-md border border-primary-foreground/25 bg-primary-foreground/10 px-3 text-sm">
                  <Mail className="h-4 w-4 text-primary-foreground/70" />
                  <select value={selected} onChange={(e) => setSelected(e.target.value)} className="bg-transparent outline-none">
                    <option value="all">Todos</option>
                    {emails.map((e) => <option key={e.email} value={e.email}>{e.email}</option>)}
                  </select>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[11px] font-medium uppercase tracking-wide text-primary-foreground/70">Última atualização</p>
                <p className="mt-1 text-sm font-medium">
                  {sheetInfo
                    ? `${sheetInfo.at.toLocaleDateString("pt-BR")} • ${sheetInfo.at.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`
                    : "16/10/2026 • 15:30"}
                </p>
              </div>
            </div>
          </div>
        </header>

        <SheetSource
          onData={(d, info) => {
            setSheetData(d);
            setSheetInfo(info);
            setSelected("all");
          }}
        />

        {/* Block 0 - Context */}
        <SectionTitle n="00" title="Contexto da Jornada" sub="Objetivo, lógica e cadência" color="bg-globo-blue" />
        <Panel className="col-span-12 xl:col-span-7" title="Objetivo">
          <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>Qualificar novos leads, estimular o preenchimento dos dados e atualizar a base de CRM, principalmente com o <span className="font-semibold text-foreground">CNPJ da empresa</span>. Quanto mais dados obtidos, melhor entendemos o lead para direcioná-lo a ações de relacionamento e oportunidades comerciais.</p>
            <p>Os leads chegam à Data Extension por diversos canais: site da Globo, eventos, campanhas de marketing e outras ações internas e externas.</p>
            <p>A jornada também tem papel <span className="font-semibold text-foreground">educativo</span>: o lead conhece a Globo Ads, entende como a plataforma funciona, acessa casos de sucesso e descobre como usar as soluções de forma estratégica.</p>
          </div>
        </Panel>
        <div className="col-span-12 flex flex-col gap-5 xl:col-span-5">
          <Panel title="Lógica do fluxo">
            <ol className="space-y-2 text-sm text-muted-foreground">
              {[
                "O contato entra na jornada e recebe o Email 01. Não existe exclusão automática por falta de engajamento.",
                "A cada etapa, a jornada verifica se o MQL foi preenchido. Se sim, o objetivo é atingido e o contato sai do fluxo rumo ao comercial.",
                "Se ainda não preencheu o MQL, ele avança para um novo fluxo de comunicação, com conteúdos mais aprofundados sobre o ecossistema Globo Ads.",
                "Abrir ou clicar nos e-mails não tira o contato da jornada: ele segue para as próximas etapas até preencher o MQL.",
              ].map((t, i) => (
                <li key={i} className="flex gap-3">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-sm bg-primary-soft text-[11px] font-semibold text-primary">{i + 1}</span>
                  <span>{t}</span>
                </li>
              ))}
            </ol>
            <p className="mt-3 rounded-md border border-border bg-muted p-3 text-xs leading-relaxed text-muted-foreground">
              A jornada não é um fluxo linear de exclusão por engajamento: é um processo contínuo de nutrição que só termina quando o contato converte em MQL.
            </p>
          </Panel>
          <Panel title="Cadência e horário de envio">
            <p className="globo-gradient bg-clip-text text-3xl font-semibold text-transparent">6 dias</p>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">Intervalo entre envios: dá tempo ao lead para consumir o conteúdo e agir, mantendo a marca presente sem excesso de contatos.</p>
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              <span className="font-semibold text-foreground">Einstein Send Time Optimization (STO):</span> o horário de disparo de cada e-mail é definido automaticamente por inteligência preditiva, aumentando a chance de abertura e engajamento de cada contato.
            </p>
          </Panel>
        </div>
        <Panel className="col-span-12" title="Lógica da SQL de entrada">
          <p className="mb-4 text-sm leading-relaxed text-muted-foreground">A partir da base de Leads sincronizada com o Salesforce, a SQL aplica regras de negócio para construir a audiência elegível da Journey.</p>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {[
              ["Proprietário", "Leads do proprietário Relacionamento com Mercado"],
              ["E-mail válido", "Apenas contatos com e-mail válido"],
              ["Sem opt-out", "Respeito às preferências de comunicação"],
              ["Status elegíveis", "Ativo, Conhecendo, Novo e Qualificando"],
              ["Sem CNPJ", "Leads sem CNPJ cadastrado, foco da qualificação B2B"],
              ["Sem reentrada", "Exclui quem já participou da jornada"],
              ["Deduplicação", "Um registro por e-mail"],
              ["Resultado", "Audiência qualificada e validada antes do 1º envio"],
            ].map(([t, d], i) => (
              <div key={t} className="rounded-md border border-border p-3">
                <p className={`text-[11px] font-semibold uppercase tracking-wide ${["text-globo-blue", "text-globo-purple", "text-globo-pink", "text-globo-orange"][i % 4]}`}>{String(i + 1).padStart(2, "0")} · {t}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{d}</p>
              </div>
            ))}
          </div>
        </Panel>

        {/* Block 1 */}
        <SectionTitle n="01" title="Visão Geral da Jornada" sub="JNY_INBOUND_LEADS_AON" color="bg-globo-purple" />
        {overviewMeta.map((k) => (
          <Panel key={k.label} className="col-span-12 md:col-span-6 xl:col-span-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{k.label}</p>
              <span className={`flex h-8 w-8 items-center justify-center rounded-md ${kpiChip[k.tone]}`}>
                <k.icon className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-3 text-4xl font-semibold tracking-tight text-foreground">{fmt(data.overview[k.key])}</p>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{k.desc}</p>
          </Panel>
        ))}

        {/* Block 2 */}
        <SectionTitle n="02" title="Fluxo da Jornada" sub="Contatos por atividade" color="bg-globo-pink" />
        <Panel className="col-span-12 xl:col-span-8" title="Contatos por etapa">
          <div className="space-y-1.5">
            {flow.map((f, i) => {
              const emailIdx = flow.slice(0, i).filter((x) => x.kind === "email").length;
              const barStyle =
                f.kind === "email"
                  ? { background: emailColors[emailIdx] }
                  : f.kind === "entry"
                    ? { background: "var(--color-foreground)" }
                    : f.kind === "end"
                      ? { background: "var(--color-warning)" }
                      : { background: "var(--color-muted-foreground)", opacity: 0.25 };
              return (
                <div key={i} className="grid grid-cols-12 items-center gap-3 text-sm">
                  <span className="col-span-1 text-right text-xs tabular-nums text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                  <span className={`col-span-3 ${f.kind === "email" || f.kind === "entry" ? "font-semibold text-foreground" : "text-muted-foreground"}`}>{f.step}</span>
                  <div className="col-span-6 h-5 rounded-sm bg-muted">
                    <div className="h-5 rounded-sm" style={{ width: `${(f.v / maxFlow) * 100}%`, ...barStyle }} />
                  </div>
                  <span className="col-span-2 text-right font-medium tabular-nums text-foreground">{fmt(f.v)}</span>
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t border-border pt-3 text-[11px] text-muted-foreground">
            {[
              ["Entrada", "var(--color-foreground)"],
              ["E-mails (cada cor é um envio)", "var(--globo-purple)"],
              ["Aguardando / Validação do MQL", "var(--color-muted-foreground)"],
              ["Saída sem conversão", "var(--color-warning)"],
            ].map(([label, color]) => (
              <span key={label} className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ background: color }} /> {label}
              </span>
            ))}
          </div>
        </Panel>
        <div className="col-span-12 flex flex-col gap-5 xl:col-span-4">
          <Panel title="Resumo do fluxo">
            <dl className="space-y-4 text-sm">
              {[
                ["Entradas", fmt(data.overview.entradas)],
                ["MQL preenchido", fmt(data.overview.mql)],
                [`Chegaram ao ${lastEmail?.step ?? "último e-mail"}`, fmt(lastEmail?.v ?? 0)],
                ["Última validação do MQL", fmt(lastSplit?.v ?? 0)],
                ["Etapas mapeadas", sheetData ? String(flow.length) : "17"],
              ].map(([a, b]) => (
                <div key={a} className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0">
                  <dt className="text-muted-foreground">{a}</dt>
                  <dd className="text-lg font-semibold text-foreground">{b}</dd>
                </div>
              ))}
            </dl>
          </Panel>
          <Panel>
            <div className="flex gap-3">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div>
                <p className="text-sm font-semibold text-foreground">Observação técnica</p>
                 <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                   Os volumes representam os contatos que passaram por cada etapa da jornada. Como existem validações do MQL, intervalos entre envios e critérios de saída, esses valores não representam um funil linear.
                 </p>
              </div>
            </div>
          </Panel>
        </div>

        {/* Peças */}
        <SectionTitle n="02.1" title="Peças da Jornada" sub="Os 5 e-mails enviados" color="bg-globo-orange" />
        <EmailGallery pieces={pieces} />

        {/* Block 3 */}
        <SectionTitle n="03" title="Performance dos Emails" sub="Resultados operacionais dos disparos" color="bg-globo-blue" />
        <Panel className="col-span-12 overflow-x-auto" title="Comparativo por e-mail">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                {["Email", "Sends", "Open Rate", "Unique Opens", "Clicks", "CTR", "CTOR", "Bounce Rate", "Unsub. Rate"].map((h, i) => (
                  <th key={h} className={`py-3 font-medium ${i ? "text-right" : ""}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((e) => (
                <tr key={e.email} className="border-b border-border last:border-0">
                  <td className="py-3 font-semibold text-foreground">{e.email}</td>
                  <td className="py-3 text-right tabular-nums">{fmt(e.sends)}</td>
                  <td className={`py-3 text-right font-medium tabular-nums ${e.openRate > 50 ? "text-success" : ""}`}>{pct(e.openRate)}</td>
                  <td className="py-3 text-right tabular-nums">{fmt(e.uniqueOpens)}</td>
                  <td className="py-3 text-right tabular-nums">{e.clicks}</td>
                  <td className="py-3 text-right tabular-nums">{pct(e.ctr)}</td>
                  <td className="py-3 text-right tabular-nums">{pct(e.ctor)}</td>
                  <td className={`py-3 text-right tabular-nums ${e.bounce > 5 ? "font-medium text-warning" : ""}`}>{pct(e.bounce)}</td>
                  <td className="py-3 text-right tabular-nums">{pct(e.unsub)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <Panel className="col-span-12">
          <div className="flex gap-3">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div>
              <p className="text-sm font-semibold text-foreground">Por que os envios diferem do fluxo?</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                O fluxo da jornada mostra quantos contatos chegaram a cada etapa, enquanto esta tabela mostra os disparos efetivamente realizados até a extração dos dados. Como o envio usa Einstein Send Time Optimization, os disparos se distribuem ao longo do tempo no horário ideal de cada contato. Por isso, parte dos contatos que já chegou à etapa ainda estava aguardando o horário otimizado de envio, além de eventuais falhas por bounce ou supressão.
              </p>
            </div>
          </div>
        </Panel>

        <Panel className="col-span-12 lg:col-span-4" title="Sends por e-mail">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={rows} margin={{ top: 20, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--color-border)" />
              <XAxis dataKey="email" tick={axis} axisLine={false} tickLine={false} />
              <YAxis tick={axis} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: "var(--color-muted)" }} />
              <Bar dataKey="sends" name="Sends" fill={BLUE} radius={[2, 2, 0, 0]} barSize={32}>
                <LabelList dataKey="sends" position="top" style={axis} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Panel>
        <Panel className="col-span-12 lg:col-span-4" title="Open Rate (%)">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={rows} margin={{ top: 20, right: 16, left: -16, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--color-border)" />
              <XAxis dataKey="email" tick={axis} axisLine={false} tickLine={false} />
              <YAxis tick={axis} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v: number) => pct(v)} />
              <Line type="linear" dataKey="openRate" name="Open Rate" stroke={BLUE} strokeWidth={2} dot={{ r: 4, fill: BLUE }}>
                <LabelList dataKey="openRate" position="top" style={axis} formatter={(v: number) => pct(v)} />
              </Line>
            </LineChart>
          </ResponsiveContainer>
        </Panel>
        <Panel className="col-span-12 lg:col-span-4" title="CTR (%)">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={rows} layout="vertical" margin={{ top: 0, right: 40, left: 0, bottom: 0 }}>
              <CartesianGrid horizontal={false} stroke="var(--color-border)" />
              <XAxis type="number" tick={axis} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="email" tick={axis} axisLine={false} tickLine={false} width={56} />
              <Tooltip formatter={(v: number) => pct(v)} cursor={{ fill: "var(--color-muted)" }} />
              <Bar dataKey="ctr" name="CTR" fill={BLUE} radius={[0, 2, 2, 0]} barSize={20}>
                <LabelList dataKey="ctr" position="right" style={axis} formatter={(v: number) => pct(v)} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Panel>

        {/* Block 4 */}
        <SectionTitle n="04" title="Consolidado" sub="Total da jornada" color="bg-globo-purple" />
        <div className="col-span-12 grid grid-cols-2 gap-5 md:grid-cols-5">
          {consolidated.map((c) => {
            const tone = consolidatedTone(c.label);
            return (
              <Panel key={c.label}>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{c.label}</p>
                <p className={`mt-2 text-2xl font-semibold tracking-tight ${tone ? toneText[tone] : "text-foreground"}`}>{c.isRate ? pct(c.value) : fmt(c.value)}</p>
              </Panel>
            );
          })}
        </div>

        {/* Block 5 */}
        <SectionTitle n="05" title="Principais Insights" color="bg-globo-pink" />
        <div className="col-span-12 grid gap-5 md:grid-cols-2 xl:grid-cols-5">
          {insights.map((i) => (
            <Panel key={i.title}>
              <div className={`mb-3 inline-flex h-8 w-8 items-center justify-center rounded-md ${toneBg[i.tone]}`}>
                <i.icon className="h-4 w-4" />
              </div>
              <p className="text-sm font-semibold text-foreground">{i.title}</p>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{i.text}</p>
            </Panel>
          ))}
        </div>

        <LeadsSection envios={data.overview.envios} />

        {/* Block 6 */}
        <footer className="col-span-12 mt-6 border-t border-border pt-5">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">06 · Observações Técnicas</p>
          <p className="mt-2 max-w-5xl text-xs leading-relaxed text-muted-foreground">
            As métricas de Fluxo da Jornada representam os contatos que passaram pelas atividades configuradas no Journey Builder. As métricas de Performance dos E-mails representam os resultados operacionais dos disparos. Esses conjuntos possuem granularidades distintas e não devem ser comparados diretamente.
          </p>
        </footer>
      </div>
    </div>
  );
}
