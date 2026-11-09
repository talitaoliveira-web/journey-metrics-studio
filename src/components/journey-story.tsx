import { useRef, useState } from "react";
import {
  CalendarClock, Database, GitBranch, Hourglass, LogIn, Mail, MailOpen, Map, Merge,
  PencilLine, LogOut, Expand, ZoomIn, ZoomOut, Scan, ArrowDown, Compass,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import journeyMap from "@/assets/jornada-canvas.jpg.asset.json";

type Condition = { se: string; sePath: string; nao: string; naoPath: string };

type StoryStep = {
  icon: typeof Database;
  title: string;
  text: string;
  condition?: Condition;
};

const steps: StoryStep[] = [
  {
    icon: Database,
    title: "A base alimenta a jornada",
    text: "Tudo começa na Data Extension, a tabela de contatos sincronizada com o Salesforce. Uma automação roda toda quarta-feira e avalia apenas os registros novos: quem já participou não entra de novo.",
  },
  {
    icon: LogIn,
    title: "O contato entra na jornada",
    text: "Cada contato elegível entra pelo ponto de partida e passa a percorrer as etapas no seu próprio ritmo. Entrar na jornada não significa estar qualificado: significa apenas começar a conversa.",
  },
  {
    icon: Mail,
    title: "Primeiro e-mail, no melhor horário",
    text: "Antes do disparo, o Einstein STO segura o envio por algumas horas e escolhe, por inteligência preditiva, o horário com mais chance de abertura para cada pessoa. Só então o EML 01 é enviado.",
  },
  {
    icon: Hourglass,
    title: "Pausa para respirar",
    text: "Depois de cada e-mail, há uma etapa de espera antes da próxima checagem. Envio, espera e verificação são atividades diferentes, pelas quais o mesmo contato pode passar.",
  },
  {
    icon: GitBranch,
    title: "A grande pergunta: preencheu o MQL?",
    text: "Ao fim de cada espera, a jornada verifica o preenchimento do formulário de qualificação. No mapa, essa atividade se chama Preencheu MQL?. Ela checa uma informação, não conta vendas nem comprova o efeito de um e-mail.",
    condition: {
      se: "O contato preencheu o MQL",
      sePath: "O objetivo foi atingido. Ele segue pelo caminho de conversão e não precisa mais receber a sequência de nutrição.",
      nao: "O contato ainda não preencheu",
      naoPath: "Ele continua na jornada e recebe a próxima comunicação, com conteúdo mais aprofundado.",
    },
  },
  {
    icon: MailOpen,
    title: "A abertura também é observada",
    text: "Em alguns pontos, a jornada avalia se o e-mail anterior foi aberto. Esse sinal de comportamento ajuda a organizar o caminho do contato, mas não tira ninguém do fluxo: quem não abriu segue recebendo as próximas peças.",
  },
  {
    icon: Mail,
    title: "A sequência de nutrição continua",
    text: "Quem ainda não converteu recebe EML 02 e EML 03, sempre com espera e nova checagem de MQL entre uma peça e outra. Os conteúdos aprofundam a apresentação da Globo Ads: cases, funcionamento da plataforma e convites ao formulário.",
  },
  {
    icon: Merge,
    title: "Os Joins reúnem os caminhos",
    text: "Depois das checagens, os caminhos separados se encontram de novo em pontos de junção (os Joins). Assim, contatos que trilharam rotas diferentes voltam ao trilho principal para receber a próxima etapa juntos.",
  },
  {
    icon: Mail,
    title: "Reta final: EML 04 e EML 05",
    text: "As duas últimas peças retomam o convite de forma mais direta, sempre intercaladas por esperas e pela pergunta de sempre: preencheu o MQL? Quem preenche sai rumo à qualificação; quem não preenche segue até a classificação final.",
  },
  {
    icon: GitBranch,
    title: "Classificação final",
    text: "Na última etapa de decisão, a jornada olha para as informações que o contato deixou e separa cada pessoa no caminho correspondente.",
    condition: {
      se: "Preencheu CNPJ, respondeu Estudante ou deixou outras respostas",
      sePath: "Cada resposta tem um caminho próprio de atualização, incluindo o caminho de Qualificando e o de Reminder.",
      nao: "Não preencheu nenhuma informação",
      naoPath: "O contato segue pelo caminho Não convertido, também registrado na base.",
    },
  },
  {
    icon: PencilLine,
    title: "A base é atualizada",
    text: "Em todos os caminhos, uma atividade de atualização grava o resultado na Data Extension. É assim que a jornada devolve para o CRM o que aprendeu sobre cada contato.",
  },
  {
    icon: LogOut,
    title: "Saídas em momentos diferentes",
    text: "O mapa apresenta pontos de saída próprios para os diferentes caminhos. Sair da jornada encerra o recebimento de comunicações, mas o registro do contato permanece na base com o resultado obtido.",
  },
];

const revelations = [
  "A comunicação não acontece de forma isolada: ela segue uma sequência planejada, com começo, meio e classificação final.",
  "O comportamento do contato influencia o caminho: abertura de e-mail e preenchimento do formulário orientam as decisões da jornada.",
  "O preenchimento de informações (MQL, CNPJ, resposta Estudante) é usado como critério de segmentação, não apenas como meta.",
  "Existem caminhos distintos para acompanhar situações diferentes de qualificação, incluindo Qualificando, Reminder e Não convertido.",
  "A jornada combina quatro movimentos: comunicar, esperar, avaliar e atualizar a base.",
];

function ConditionBlock({ condition }: { condition: Condition }) {
  return (
    <div className="mt-3 grid gap-2 sm:grid-cols-2">
      <div className="rounded-md border border-border bg-success-soft p-3">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-success">Se</p>
        <p className="mt-1 text-xs font-medium leading-5 text-foreground">{condition.se}</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">{condition.sePath}</p>
      </div>
      <div className="rounded-md border border-border bg-muted p-3">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Não</p>
        <p className="mt-1 text-xs font-medium leading-5 text-foreground">{condition.nao}</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">{condition.naoPath}</p>
      </div>
    </div>
  );
}

export function JourneyStory() {
  const [open, setOpen] = useState(false);
  const [zoom, setZoom] = useState(100);
  const scrollRef = useRef<HTMLDivElement>(null);

  function openMap() {
    setZoom(100);
    setOpen(true);
    scrollRef.current?.scrollTo({ top: 0, left: 0 });
  }

  return (
    <>
      {/* Mapa geral */}
      <div className="col-span-12 overflow-hidden rounded-md border border-border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary-soft text-primary">
              <Map className="h-4 w-4" />
            </span>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Mapa geral da jornada</h3>
              <p className="text-xs text-muted-foreground">Imagem original do Salesforce Marketing Cloud, com nomes, atividades e conexões reais.</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={openMap}>
            <Expand className="h-4 w-4" /> Ampliar mapa
          </Button>
        </div>
        <button
          type="button"
          onClick={openMap}
          aria-label="Ampliar o mapa da jornada"
          className="group relative block max-h-[420px] w-full cursor-zoom-in overflow-hidden bg-muted"
        >
          <img
            src={journeyMap.url}
            alt="Mapa original da jornada JNY_INBOUND_LEADS_AON no Journey Builder"
            className="w-full object-cover object-top"
            loading="lazy"
          />
          <span className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-sm border border-border bg-card text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
            <Expand className="h-4 w-4" aria-hidden="true" />
          </span>
        </button>
      </div>

      <p className="col-span-12 text-xs leading-5 text-muted-foreground"><strong className="text-foreground">Três leituras diferentes:</strong> o mapa mostra as atividades e suas ramificações; os 12 passos abaixo agrupam essa lógica para explicá-la; a tabela de estágios reproduz as linhas da planilha. As 17 linhas do relatório original não são uma contagem de todos os blocos da imagem.</p>
      {/* Narrativa guiada */}
      <div className="col-span-12 grid gap-5">
        <div className="min-w-0">
          <ol className="relative space-y-4 before:absolute before:bottom-4 before:left-[15px] before:top-4 before:w-px before:bg-border">
            {steps.map((step, i) => (
              <li key={step.title} className="relative flex gap-4">
                <span className="z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-card text-primary">
                  <step.icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1 rounded-md border border-border bg-card p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Passo explicativo {String(i + 1).padStart(2, "0")} de {steps.length}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-foreground">{step.title}</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">{step.text}</p>
                  {step.condition && <ConditionBlock condition={step.condition} />}
                  {i < steps.length - 1 && (
                    <p className="mt-3 flex items-center gap-1.5 text-[11px] font-medium text-primary">
                      <ArrowDown className="h-3 w-3" aria-hidden="true" /> Em seguida: {steps[i + 1]?.title}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </div>

        <p className="flex items-center gap-2 text-xs leading-5 text-muted-foreground"><CalendarClock className="h-4 w-4 shrink-0" aria-hidden="true" />Início em 26/08/2026. A entrada avalia novos registros às quartas-feiras.</p>
      </div>

      {/* Zoom do mapa */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="flex max-h-[92dvh] w-[96vw] max-w-6xl flex-col gap-0 overflow-hidden rounded-md p-0">
          <div className="shrink-0 border-b border-border px-5 pb-4 pt-5 pr-12">
            <DialogTitle className="text-base leading-6 tracking-normal">Mapa original da jornada</DialogTitle>
            <DialogDescription className="mt-1 text-xs">
              JNY_INBOUND_LEADS_AON no Journey Builder, com os nomes e as conexões originais das atividades.
            </DialogDescription>
          </div>
          <div className="flex shrink-0 items-center justify-end gap-1 border-b border-border bg-card px-4 py-2">
            <Button variant="ghost" size="icon" aria-label="Diminuir imagem" title="Diminuir imagem" disabled={zoom <= 100} onClick={() => setZoom((v) => v - 25)}>
              <ZoomOut />
            </Button>
            <span className="w-12 text-center text-xs tabular-nums text-muted-foreground">{zoom}%</span>
            <Button variant="ghost" size="icon" aria-label="Aumentar imagem" title="Aumentar imagem" disabled={zoom >= 250} onClick={() => setZoom((v) => v + 25)}>
              <ZoomIn />
            </Button>
            <Button variant="ghost" size="icon" aria-label="Ajustar imagem" title="Ajustar imagem" onClick={() => setZoom(100)}>
              <Scan />
            </Button>
          </div>
          <div ref={scrollRef} className="min-h-0 flex-1 overflow-auto bg-muted p-3 sm:p-5">
            <img
              src={journeyMap.url}
              alt="Mapa completo da jornada JNY_INBOUND_LEADS_AON"
              className={zoom === 100 ? "mx-auto block h-auto w-full max-w-[1100px]" : "mx-auto block h-auto max-w-none"}
              style={zoom > 100 ? { width: `${1100 * zoom / 100}px` } : undefined}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function JourneyStructureInsights() {
  return (
        <div className="col-span-12">
          <div className="border-t border-border py-5">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-globo-purple/10 text-globo-purple">
                <Compass className="h-4 w-4" />
              </span>
              <div>
                <h3 className="text-sm font-semibold text-foreground">O que a estrutura da jornada revela</h3>
                <p className="text-xs text-muted-foreground">Leituras sobre a estratégia, não resultados comprovados.</p>
              </div>
            </div>
            <ul className="mt-4 space-y-3">
              {revelations.map((text, i) => (
                <li key={i} className="flex gap-3 rounded-md border border-border p-3">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-sm bg-primary-soft text-[11px] font-semibold text-primary">{i + 1}</span>
                  <p className="text-xs leading-5 text-muted-foreground">{text}</p>
                </li>
              ))}
            </ul>
            <p className="mt-4 rounded-md border border-border bg-muted p-3 text-xs leading-5 text-muted-foreground">
              Estas interpretações descrevem o que a estrutura permite compreender sobre a estratégia. Elas não comprovam, sozinhas, resultados de conversão ou de engajamento.
            </p>

          </div>
        </div>
  );
}
