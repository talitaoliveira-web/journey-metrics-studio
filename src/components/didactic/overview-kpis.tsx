import { CheckCircle2, DoorOpen, LogIn, Target, Timer } from "lucide-react";
import { fmtInt, fmtPct, type Kpis } from "@/lib/journey-insights";
import { DataState, DidacticSection, HelpTip, type DataStatus, type HelpContent } from "@/components/didactic/shared";

type Card = { id: string; icon: typeof LogIn; label: string; value: string; sub: string; sentence: string; tone: string; help: HelpContent };

const tone: Record<string, string> = {
  blue: "bg-globo-blue/10 text-globo-blue",
  purple: "bg-globo-purple/10 text-globo-purple",
  green: "bg-success-soft text-success",
  pink: "bg-globo-pink/10 text-globo-pink",
  orange: "bg-warning-soft text-warning",
};

export function summarySentence(k: Kpis) {
  return `Dos ${fmtInt(k.entered)} contatos que entraram, ${fmtInt(k.goal)} (${fmtPct(k.goalRate)}) atingiram a meta da jornada, preenchendo o CNPJ. ${fmtInt(k.active)} ainda estão percorrendo a jornada e ${fmtInt(k.abandoned)} saíram antes do último e-mail.`;
}

export function OverviewKpis({ kpis, status, onRetry, onClear }: { kpis: Kpis; status: DataStatus; onRetry: () => void; onClear: () => void }) {
  const cards: Card[] = [
    { id: "entered", icon: LogIn, label: "Contatos que entraram", value: fmtInt(kpis.entered), sub: "100% do recorte", tone: "blue",
      sentence: "Pessoas que iniciaram a jornada e começaram a receber os e-mails.",
      help: { title: "Contatos que entraram", what: "Quantidade de contatos com data de entrada registrada na base exportada.", how: "É o ponto de partida: as demais porcentagens são calculadas sobre este número.", why: "Mostra o tamanho do público que a jornada tentou converter." } },
    { id: "active", icon: Timer, label: "Contatos ativos na jornada", value: fmtInt(kpis.active), sub: `${fmtPct(kpis.activeRate)} dos que entraram`, tone: "purple",
      sentence: "Ainda estão no meio do caminho: não têm data de saída registrada.",
      help: { title: "Contatos ativos", what: "Contatos que entraram e ainda não saíram da jornada.", how: "Quanto maior, mais resultados ainda podem acontecer. Esses contatos ainda podem atingir a meta.", why: "Evita concluir cedo demais: parte do resultado ainda está em andamento." } },
    { id: "concluded", icon: CheckCircle2, label: "Contatos que concluíram", value: fmtInt(kpis.concluded), sub: kpis.avgDays !== null ? `Tempo médio: ${Math.round(kpis.avgDays)} dias` : `${fmtPct(kpis.concludedRate)} dos que entraram`, tone: "green",
      sentence: "Já saíram da jornada com um resultado registrado: meta, fim dos e-mails ou saída antecipada.",
      help: { title: "Contatos que concluíram", what: "Contatos com data de saída: atingiram a meta, terminaram os 5 e-mails ou saíram antes.", how: "Concluir não é o mesmo que converter. Veja a taxa de meta para saber quantos converteram.", why: "Junto com o tempo médio, mostra quanto tempo a jornada leva para dar uma resposta." } },
    { id: "goal-rate", icon: Target, label: "Taxa de meta atingida", value: fmtPct(kpis.goalRate), sub: `${fmtInt(kpis.goal)} contatos preencheram o CNPJ`, tone: "pink",
      sentence: "A conversão da jornada: quem preencheu o CNPJ, tornando-se um lead qualificado de empresa.",
      help: { title: "Taxa de meta atingida (conversão)", what: "Contatos que preencheram o CNPJ divididos pelos contatos que entraram.", how: `Quem preencheu como estudante (${fmtInt(kpis.student)}) não conta como meta, porque não é um lead de empresa.`, why: "É o principal resultado da jornada: transformar contatos em oportunidades comerciais." } },
    { id: "abandon-rate", icon: DoorOpen, label: "Taxa de saída / abandono", value: fmtPct(kpis.abandonRate), sub: `${fmtInt(kpis.abandoned)} contatos`, tone: "orange",
      sentence: "Saíram antes do último e-mail sem atingir a meta, principalmente por não engajar.",
      help: { title: "Taxa de saída / abandono", what: "Contatos que deixaram a jornada antes do E-mail 05 sem preencher o CNPJ, divididos pelos que entraram.", how: "Quanto menor, melhor. A seção 2 mostra em qual etapa essas saídas acontecem.", why: "Indica onde a conversa perde as pessoas e onde vale a pena agir primeiro." } },
  ];

  return (
    <DidacticSection id="visao-geral" n={1} title="Visão geral" lead="Os cinco números que resumem a jornada, calculados a partir da base de contatos exportada."
      help={{ title: "Visão geral", what: "Resumo dos resultados dos contatos que entraram na jornada JNY_INBOUND_LEADS_AON.", how: "Leia a frase em destaque e depois os cartões, da esquerda para a direita, como o caminho de um contato.", why: "Dá a resposta rápida, antes dos detalhes: quantos entraram, quantos converteram e quantos se perderam." }}>
      {status !== "ready" ? <DataState status={status} id="overview" onRetry={onRetry} onClear={onClear} /> : (
        <>
          <p data-testid="overview-summary" className="mb-5 rounded-xl border-l-4 border-globo-purple bg-card p-5 text-lg leading-8 text-foreground shadow-sm">
            {summarySentence(kpis)}
          </p>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {cards.map((c) => (
              <article key={c.id} data-testid={`kpi-${c.id}`} className="flex flex-col rounded-xl border border-border bg-card p-5 shadow-sm transition-[box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-md">
                <div className="flex items-start justify-between gap-2">
                  <span aria-hidden="true" className={`flex h-10 w-10 items-center justify-center rounded-lg ${tone[c.tone]}`}><c.icon className="h-5 w-5" /></span>
                  <HelpTip id={`kpi-${c.id}`} help={c.help} />
                </div>
                <h3 className="mt-4 text-sm font-semibold text-muted-foreground">{c.label}</h3>
                <p data-testid={`kpi-${c.id}-value`} className="mt-1 text-4xl font-semibold tracking-tight text-foreground tabular-nums">{c.value}</p>
                <p className="mt-1 text-sm font-medium text-foreground">{c.sub}</p>
                <p className="mt-3 border-t border-border pt-3 text-sm leading-6 text-muted-foreground">{c.sentence}</p>
              </article>
            ))}
          </div>
        </>
      )}
    </DidacticSection>
  );
}
