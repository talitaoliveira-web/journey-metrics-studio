import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toLead, type Lead, type LeadRow } from "@/lib/leads";
import { EmailGallery } from "@/components/email-gallery";
import { JourneyStory, JourneyStructureInsights } from "@/components/journey-story";
import { SheetSource } from "@/components/sheet-source";
import { LeadsSection } from "@/components/leads-section";
import { defaultJourney, type JourneyData, type Overview } from "@/lib/journey-data";
import {
  Bar, BarChart, CartesianGrid, LabelList, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import {
  Database, LogIn, Send, GitBranch, TrendingUp, Lightbulb, ShieldAlert, Activity, Info, Calendar, Mail,
} from "lucide-react";
import e1 from "@/assets/eml01.jpg.asset.json";
import e2 from "@/assets/eml02.jpg.asset.json";
import e3 from "@/assets/eml03.jpg.asset.json";
import e4 from "@/assets/eml04.jpg.asset.json";
import e5 from "@/assets/eml05.jpg.asset.json";

const pieces = [
  { id: "EML 01", img: e1, subject: "O que é Globo Ads? A gente te mostra", pre: "Conheça soluções para diferentes objetivos de marca", desc: "Apresentação: introduz a Globo Ads e convida ao formulário de qualificação.", learning: "Investigar se a apresentação inicial leva ao formulário. Abertura e clique não comprovam qualificação." },
  { id: "EML 02", img: e2, subject: "O que acontece quando marcas se conectam à Globo?", pre: "Resultados e insights para inspirar sua estratégia", desc: "Inspiração: apresenta cases e resultados para dar continuidade à conversa.", learning: "Testar se os cases e o assunto despertam interesse. Menos envios não provam desinteresse: quem converte pode sair antes desta etapa." },
  { id: "EML 03", img: e3, subject: "Anunciar com a Globo é mais simples do que parece", pre: "Entenda como funciona na prática", desc: "Educação: aprofunda argumentos e benefícios sobre como anunciar.", learning: "Investigar a clareza da proposta e do convite ao formulário. A taxa de abertura não identifica, sozinha, a causa do desempenho." },
  { id: "EML 04", img: e4, subject: "Vamos avançar com Globo Ads?", pre: "Falta só um próximo passo!", desc: "Avanço: retoma o convite para dar o próximo passo com a Globo Ads.", learning: "Investigar a resposta ao convite mais direto. Uma abertura alta não comprova que esta peça gerou mais MQL." },
  { id: "EML 05", img: e5, subject: "O mercado está se movendo. E sua marca?", pre: "Veja onde estão as novas oportunidades", desc: "Oportunidade: encerra a sequência de peças com novos argumentos e cases.", learning: "Testar a força do convite final entre os contatos que ainda não converteram. Esse público não é necessariamente igual ao do primeiro envio." },
];

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Jornada inbound AON" },
      { name: "description", content: "Jornada inbound AON: qualificação de leads, análise dos cinco e-mails e aprendizados estratégicos, com fatos e hipóteses separados." },
      { property: "og:title", content: "Jornada inbound AON" },
      { property: "og:description", content: "Entenda a qualificação de leads, as cinco comunicações e os limites da análise da Jornada inbound AON." },
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
  { key: "base", icon: Database, label: "Base de origem", desc: "Base de origem dos contatos. Estar na base não significa ter iniciado a jornada.", tone: "blue" },
  { key: "entradas", icon: LogIn, label: "Entradas na Jornada", desc: "Contatos que iniciaram a jornada no período.", tone: "purple" },
  { key: "envios", icon: Send, label: "Total de Envios", desc: "Total informado no resumo da fonte. Não equivale ao número de pessoas nem à soma do tracking abaixo.", tone: "pink" },
];

const kpiChip: Record<string, string> = {
  blue: "bg-globo-blue/10 text-globo-blue",
  purple: "bg-globo-purple/10 text-globo-purple",
  pink: "bg-globo-pink/10 text-globo-pink",
  orange: "bg-globo-orange/10 text-globo-orange",
};

const emailColors = ["var(--globo-blue)", "var(--globo-purple)", "var(--globo-pink)", "var(--globo-orange)", "var(--color-success)"];

const toneBg: Record<string, string> = { primary: "bg-primary-soft text-primary", success: "bg-success-soft text-success", warning: "bg-warning-soft text-warning" };

function SectionTitle({ n, title, sub, color = "bg-globo-blue" }: { n: string; title: string; sub?: string; color?: string }) {
  return (
    <div className="col-span-12 mt-4 flex flex-wrap items-end justify-between gap-2 border-b border-border pb-3">
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
  const [leads, setLeads] = useState<Lead[] | null>(null);
  useEffect(() => {
    import("@/data/leads.json").then((module) => setLeads((module.default as LeadRow[]).map(toLead)));
  }, []);
  const [selected, setSelected] = useState("all");
  const [sheetData, setSheetData] = useState<JourneyData | null>(null);
  const [sheetInfo, setSheetInfo] = useState<{ title: string; at: Date } | null>(null);
  const data = sheetData ?? defaultJourney;
  const { flow, emails } = data;
  const rows = selected === "all" ? emails : emails.filter((e) => e.email === selected);
  const maxFlow = Math.max(1, ...flow.map((f) => f.v));
  const lastEmail = [...flow].reverse().find((f) => f.kind === "email");
  const lastSplit = [...flow].reverse().find((f) => f.kind === "split");
  const firstTracking = emails.find((email) => email.email === "EML 01");
  const openingFact = ["EML 04", "EML 05"].map((id) => {
    const email = emails.find((item) => item.email === id);
    return email ? `${id}: ${pct(email.openRate)} de abertura e ${pct(email.ctr)} de CTR` : `${id}: sem tracking correspondente`;
  }).join(". ");
  const insights = [
    { icon: GitBranch, title: "Conversão muda o público", tone: "primary", label: "Regra da jornada", text: "Quem preenche o MQL sai rumo ao comercial. Assim, menos contatos nas próximas comunicações pode incluir conversões, não apenas ausência de interesse." },
    { icon: TrendingUp, title: "Abertura não é conversão", tone: "success", label: "Fato · tracking", text: `${openingFact}. Esses indicadores não mostram quantos MQL cada peça gerou.` },
    { icon: Lightbulb, title: "Revisar o meio da conversa", tone: "warning", label: "Hipótese a testar", text: "Testar assunto, proposta e convite ao formulário dos EML 02 e 03. Os indicadores não isolam o efeito do conteúdo, do público ou do horário." },
    { icon: ShieldAlert, title: "Cuidar da entrega", tone: "warning", label: "Fato e recomendação", text: firstTracking ? `O EML 01 registra ${pct(firstTracking.bounce)} de falhas de entrega. Investigar os motivos antes de atribuir o resultado à qualidade da base.` : "Sem tracking do EML 01 na fonte carregada. Investigar falhas de entrega com os registros disponíveis." },
    { icon: Activity, title: "Medir até a qualificação", tone: "primary", label: "Limite da análise", text: "Sem vincular cada envio à data de preenchimento do formulário, não é possível atribuir MQL a uma peça nem comprovar qual mensagem causou a conversão." },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto grid max-w-[1600px] grid-cols-12 gap-5 px-4 py-6 sm:px-8 sm:py-10">
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
            <p>Os contatos selecionados vêm da base sincronizada com o Salesforce. A origem de cada contato não é detalhada nos indicadores deste painel.</p>
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
              Não abrir ou não clicar não exclui automaticamente o contato. Sem preenchimento do formulário, ele continua na sequência prevista, até a classificação e a saída do seu caminho.
            </p>
          </Panel>
          <Panel title="Cadência e horário de envio">
            <p className="text-sm font-semibold text-foreground">Comunicar, aguardar e verificar</p>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">As esperas separam as comunicações antes de uma nova checagem do formulário.</p>
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              <span className="font-semibold text-foreground">Einstein Send Time Optimization (STO):</span> define o horário de disparo por inteligência preditiva, com o objetivo de aumentar a chance de abertura e interação.
            </p>
          </Panel>
        </div>
        <Panel className="col-span-12" title="Quem pode entrar na jornada">
          <p className="mb-4 text-sm leading-relaxed text-muted-foreground">As regras de seleção escolhem os contatos aptos a receber as comunicações a partir da base sincronizada com o Salesforce. Essa seleção não significa que o contato já está qualificado para o comercial.</p>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {[
              ["Proprietário", "Leads do proprietário Relacionamento com Mercado"],
              ["E-mail válido", "Apenas contatos com e-mail válido"],
              ["Sem opt-out", "Respeito às preferências de comunicação"],
              ["Status elegíveis", "Ativo, Conhecendo, Novo e Qualificando"],
              ["Sem CNPJ", "Leads sem CNPJ cadastrado, foco da qualificação B2B"],
              ["Sem reentrada", "Exclui quem já participou da jornada"],
              ["Deduplicação", "Um registro por e-mail"],
              ["Resultado", "Audiência elegível antes do primeiro envio, ainda a qualificar"],
            ].map(([t, d], i) => (
              <div key={t} className="rounded-md border border-border p-3">
                <p className={`text-[11px] font-semibold uppercase tracking-wide ${["text-globo-blue", "text-globo-purple", "text-globo-pink", "text-globo-orange"][i % 4]}`}>{String(i + 1).padStart(2, "0")} · {t}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{d}</p>
              </div>
            ))}
          </div>
        </Panel>

        <SectionTitle n="01" title="MQL e qualificação" sub="O que significa estar qualificado" color="bg-globo-purple" />
        <p className="col-span-12 text-sm leading-6 text-muted-foreground"><strong className="text-foreground">MQL significa Marketing Qualified Lead, ou lead qualificado pelo marketing.</strong> É um contato classificado para o próximo passo comercial conforme os critérios da operação. Nesta jornada, o preenchimento do formulário é a checagem que direciona o caminho de qualificação. Abrir um e-mail, clicar ou ter CPF/CNPJ cadastrado não comprova, por si só, essa classificação.</p>
        {[
          ["Lead captado", "Contato registrado na base. Ainda precisa atender às regras de entrada para iniciar a jornada."],
          ["Em qualificação", "Contato que recebe conteúdos e convites ao formulário. Participar da sequência não significa já estar qualificado."],
          ["Validação do preenchimento", "Atividade que verifica se o formulário foi preenchido. Seu volume mede passagens pela checagem, não MQLs identificados."],
          ["Qualificação identificada", "Resultado registrado a partir do formulário e da classificação da operação. Não equivale a uma venda; este painel não apresenta contagem de MQL."],
        ].map(([title, text], index) => <Panel key={title} className="col-span-12 md:col-span-6 xl:col-span-3" title={`${index + 1}. ${title}`}><p className="text-xs leading-5 text-muted-foreground">{text}</p></Panel>)}

        <SectionTitle n="02" title="Por dentro da jornada: como funciona a estratégia de Inbound Leads" sub="Mapa original e explicação passo a passo" color="bg-globo-purple" />
        <JourneyStory />

        {/* Block 1 */}
        <SectionTitle n="02.1" title="Visão Geral da Jornada" sub="JNY_INBOUND_LEADS_AON" color="bg-globo-purple" />
        {overviewMeta.map((k) => (
          <Panel key={k.label} className="col-span-12 md:col-span-4">
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

        <div className="col-span-12 border-l-2 border-globo-purple py-2 pl-4 text-sm leading-6 text-muted-foreground">
          <p><strong className="text-foreground">Da base à oportunidade comercial:</strong> a base é o ponto de partida; as entradas mostram quem iniciou o relacionamento; os envios são comunicações; o MQL preenchido representa o objetivo atingido. Uma pessoa pode receber mais de um e-mail.</p>
          <p className="mt-2 text-xs"><strong className="text-foreground">Limite da fonte:</strong> o resumo geral e o tracking dos cinco e-mails apresentam totais distintos de envios. Os valores foram preservados; sem confirmação do período e do escopo de cada extração, não é seguro reconciliá-los ou calcular uma conversão entre essas bases.</p>
        </div>

        {/* Block 2 */}
        <SectionTitle n="02.2" title="Estágios da Jornada" sub="Registros por atividade na planilha" color="bg-globo-pink" />
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
                [`Chegaram ao ${lastEmail?.step ?? "último e-mail"}`, fmt(lastEmail?.v ?? 0)],
                ["Registros na última checagem", fmt(lastSplit?.v ?? 0)],
                ["Atividades listadas na planilha", String(flow.length)],
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
                <p className="text-sm font-semibold text-foreground">Como ler os volumes</p>
                 <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                   Os volumes são registros por atividade, não parcelas que se somam. A validação checa o preenchimento do MQL; não é o total de MQL convertidos. Quem converte sai antes das próximas comunicações. A mesma pessoa pode aparecer em várias atividades. Não some essas linhas como se fossem pessoas distintas.
                 </p>
              </div>
            </div>
          </Panel>
        </div>

        <SectionTitle n="03" title="Identificação dos Leads" color="bg-globo-blue" />
        <LeadsSection leads={leads} section="identity" />
        <LeadsSection leads={leads} section="stages" />
        <SectionTitle n="03.1" title="Perguntas e Respostas" color="bg-globo-purple" />
        <LeadsSection leads={leads} section="questions" />

        {/* Peças */}
        <SectionTitle n="04" title="Os cinco e-mails da jornada" sub="Papel de cada peça e indicadores registrados" color="bg-globo-orange" />
        <p className="col-span-12 text-sm leading-6 text-muted-foreground">As peças acompanham uma conversa progressiva: apresentar, inspirar, explicar e convidar à qualificação. Os números abaixo são do tracking de cada e-mail, não uma atribuição de MQL à peça.</p>
        <EmailGallery pieces={pieces} metrics={emails} />

        {/* Por dentro da jornada */}

        {/* Block 3 */}
        <SectionTitle n="05" title="Comparativo de desempenho dos e-mails" sub="Resultados operacionais dos disparos" color="bg-globo-blue" />
        <Panel className="col-span-12 overflow-x-auto" title="Comparativo por e-mail">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                {["E-mail", "Envios", "Taxa de abertura", "Aberturas únicas", "Cliques", "CTR", "CTOR", "Falhas de entrega (%)", "Descadastros (%)"].map((h, i) => (
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
              <p className="text-sm font-semibold text-foreground">Volume, interação e conversão são leituras diferentes</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                O fluxo registra contatos por atividade; o tracking registra envios e respostas por e-mail. Mais envios não significam uma taxa de interação maior. Quem preenche o MQL pode sair antes das próximas peças, mudando o público que segue na jornada. Não é correto atribuir a queda de volume automaticamente à perda de interesse.
              </p>
            </div>
          </div>
          <dl className="mt-4 grid gap-4 border-t border-border pt-4 text-xs sm:grid-cols-2 xl:grid-cols-4">
            {[["Abertura", "Sinal de visualização registrado no tracking; não comprova leitura completa ou intenção de compra."], ["CTR", "Taxa de cliques em relação aos envios. Ajuda a comparar a resposta proporcional, além do volume absoluto."], ["CTOR", "Taxa de cliques em relação às aberturas. Ajuda a observar a resposta após a abertura registrada."], ["Falhas e descadastros", "Falhas indicam problemas de entrega; descadastros indicam saída da comunicação. Nenhum dos dois é conversão em MQL."]].map(([label, text]) => <div key={label}><dt className="font-semibold text-foreground">{label}</dt><dd className="mt-1 leading-5 text-muted-foreground">{text}</dd></div>)}
          </dl>
        </Panel>

        <Panel className="col-span-12 lg:col-span-4" title="Volume de envios">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={rows} margin={{ top: 20, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--color-border)" />
              <XAxis dataKey="email" tick={axis} axisLine={false} tickLine={false} />
              <YAxis tick={axis} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: "var(--color-muted)" }} />
              <Bar dataKey="sends" name="Envios" fill={BLUE} radius={[2, 2, 0, 0]} barSize={32}>
                <LabelList dataKey="sends" position="top" style={axis} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="mt-3 border-t border-border pt-3 text-xs leading-5 text-muted-foreground">Volume absoluto de disparos por e-mail, não de pessoas únicas. A mesma pessoa pode receber mais de uma comunicação.</p>
        </Panel>
        <Panel className="col-span-12 lg:col-span-4" title="Taxa de abertura (%)">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={rows} margin={{ top: 20, right: 16, left: -16, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--color-border)" />
              <XAxis dataKey="email" tick={axis} axisLine={false} tickLine={false} />
              <YAxis tick={axis} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v: number) => pct(v)} />
              <Line type="linear" dataKey="openRate" name="Taxa de abertura" stroke={BLUE} strokeWidth={2} dot={{ r: 4, fill: BLUE }}>
                <LabelList dataKey="openRate" position="top" style={axis} formatter={(v: number) => pct(v)} />
              </Line>
            </LineChart>
          </ResponsiveContainer>
          <p className="mt-3 border-t border-border pt-3 text-xs leading-5 text-muted-foreground">Percentual de abertura registrado no tracking de cada e-mail. A quantidade de aberturas únicas aparece na tabela; a taxa não mede qualificação ou venda.</p>
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
          <p className="mt-3 border-t border-border pt-3 text-xs leading-5 text-muted-foreground">Taxa de cliques em relação aos envios. O clique sinaliza uma ação, mas a qualificação depende do formulário; o gráfico não mede conversão em MQL.</p>
        </Panel>

        {/* Limites de leitura */}
        <footer className="col-span-12 mt-6 border-t border-border pt-5">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Limites de leitura</p>
          <p className="mt-2 max-w-5xl text-xs leading-relaxed text-muted-foreground">
            As métricas de Estágios da Jornada representam os contatos que passaram pelas atividades configuradas no Journey Builder. As métricas de Performance dos E-mails representam os resultados operacionais dos disparos. Esses conjuntos possuem níveis de detalhe distintos e não devem ser comparados diretamente. CPF identifica uma pessoa; CNPJ identifica uma empresa. O preenchimento desses dados contribui para conhecer o contato, mas, isoladamente, não comprova conversão em MQL ou venda. As tabelas da base de contatos descrevem seus próprios registros e não substituem o resumo geral da jornada.
          </p>
        </footer>

        {/* Block 4 */}
        <SectionTitle n="06" title="Insights estratégicos e oportunidades de melhoria" color="bg-globo-pink" />
        <div className="col-span-12 grid gap-5 md:grid-cols-2 xl:grid-cols-5">
          {insights.map((i) => (
            <Panel key={i.title}>
              <div className={`mb-3 inline-flex h-8 w-8 items-center justify-center rounded-md ${toneBg[i.tone]}`}>
                <i.icon className="h-4 w-4" />
              </div>
              <p className="mb-2 text-[10px] font-semibold uppercase text-muted-foreground">{i.label}</p>
              <p className="text-sm font-semibold text-foreground">{i.title}</p>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{i.text}</p>
            </Panel>
          ))}
        </div>
        <LeadsSection leads={leads} section="insights" />
        <JourneyStructureInsights />
        <div className="col-span-12 border-t border-border pt-4">
          <h3 className="text-sm font-semibold text-foreground">Oportunidades por e-mail</h3>
          <ul className="mt-3 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">{pieces.map(piece => <li key={piece.id}><p className="text-xs font-semibold text-globo-purple">{piece.id} · Hipótese a testar</p><p className="mt-2 text-xs leading-5 text-muted-foreground">{piece.learning}</p></li>)}</ul>
        </div>


      </div>
    </div>
  );
}
