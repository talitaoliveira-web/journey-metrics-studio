import { AlertTriangle, DoorOpen, GitBranch, Hourglass, LogIn, Mail, Shuffle, Trophy, ArrowDownRight } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AssetImage } from "@/components/asset-image";
import { fmtInt, fmtPct, type JourneyPath, type PathStep, type StepKind } from "@/lib/journey-insights";
import { DataState, DidacticSection, type DataStatus } from "@/components/didactic/shared";

export type EmailPiece = { id: string; img: { url: string }; subject: string };

type TypeInfo = { name: string; icon: typeof Mail; chip: string; text: string };

export const STEP_TYPES: Record<StepKind | "random", TypeInfo> = {
  entry: { name: "Entrada", icon: LogIn, chip: "bg-foreground text-background", text: "Ponto de partida: o contato entra na jornada a partir da base de dados. Nesta jornada, uma automação adiciona os novos contatos toda quarta-feira." },
  email: { name: "Atividade de e-mail", icon: Mail, chip: "bg-globo-blue text-primary-foreground", text: "Envia uma mensagem ao contato. Cada envio gera indicadores como abertura, clique e bounce." },
  wait: { name: "Espera (Wait)", icon: Hourglass, chip: "bg-muted text-foreground border border-border", text: "Pausa programada antes do próximo passo, para dar tempo de o contato abrir o e-mail e agir." },
  decision: { name: "Divisão de decisão", icon: GitBranch, chip: "bg-globo-purple text-primary-foreground", text: "Pergunta que separa os contatos em caminhos, por exemplo: preencheu o formulário? Quem cumpre a regra segue um caminho; quem não cumpre, outro." },
  random: { name: "Divisão aleatória", icon: Shuffle, chip: "bg-card text-muted-foreground border border-dashed border-border", text: "Sorteia os contatos entre caminhos em proporções definidas, para testes A/B. Esta jornada não usa divisão aleatória." },
  goal: { name: "Meta (Goal)", icon: Trophy, chip: "bg-success text-primary-foreground", text: "O objetivo da jornada. Aqui, a meta é preencher o CNPJ: quem atinge a meta sai da jornada como lead qualificado." },
  exit: { name: "Critério de saída (Exit)", icon: DoorOpen, chip: "bg-warning text-primary-foreground", text: "Regra que tira o contato da jornada antes ou no fim do caminho, por exemplo por falta de engajamento ou ao terminar os e-mails sem converter." },
};

function TypeChip({ kind, testId }: { kind: StepKind | "random"; testId: string }) {
  const t = STEP_TYPES[kind];
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button type="button" data-testid={testId} aria-label={`${t.name}: ${t.text}`}
          className={`inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold transition-[filter,transform] duration-150 hover:brightness-110 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${t.chip}`}>
          <t.icon aria-hidden="true" className="h-3.5 w-3.5" /> {t.name}
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs text-sm leading-6">{t.text}</TooltipContent>
    </Tooltip>
  );
}

function StepRow({ step, max, isLoss, piece }: { step: PathStep; max: number; isLoss: boolean; piece: EmailPiece | undefined }) {
  const compact = step.kind === "wait";
  const width = max ? Math.max(2, (step.count / max) * 100) : 0;
  const barColor = step.kind === "goal" ? "bg-success" : step.kind === "exit" ? "bg-warning" : isLoss ? "bg-destructive" : step.kind === "decision" ? "bg-globo-purple" : step.kind === "email" ? "bg-globo-blue" : step.kind === "entry" ? "bg-foreground" : "bg-muted-foreground/40";
  return (
    <li data-testid={`path-step-${step.id}`} data-loss={isLoss || undefined}
      className={`relative rounded-xl border p-4 transition-[box-shadow,border-color] duration-200 ${isLoss ? "border-destructive bg-destructive/5 shadow-md" : "border-border bg-card hover:shadow-sm"} ${compact ? "py-3" : ""}`}>
      <div className="flex flex-wrap items-center gap-3">
        {step.kind === "email" && piece && (
          <AssetImage src={piece.img.url} alt={`Miniatura do ${piece.id}`} label={piece.id} testId={`path-thumb-${step.id}`}
            className="h-14 w-10 shrink-0 rounded-md border border-border object-cover object-top" fallbackClassName="!min-h-14 !w-10 !p-1" />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <TypeChip kind={step.kind} testId={`path-type-${step.id}`} />
            {isLoss && (
              <span data-testid="path-biggest-loss-badge" className="inline-flex items-center gap-1 rounded-full bg-destructive px-2.5 py-0.5 text-xs font-semibold text-destructive-foreground">
                <AlertTriangle aria-hidden="true" className="h-3.5 w-3.5" /> Maior perda
              </span>
            )}
          </div>
          <p className={`mt-1.5 font-semibold text-foreground ${compact ? "text-sm" : "text-base"}`}>{step.label}{step.kind === "email" && piece ? <span className="font-normal text-muted-foreground"> · “{piece.subject}”</span> : null}</p>
        </div>
        <div className="text-right">
          <p className="text-xl font-semibold tabular-nums text-foreground" data-testid={`path-count-${step.id}`}>{fmtInt(step.count)}</p>
          <p className="text-sm text-muted-foreground">{step.kind === "goal" || step.kind === "exit" ? "contatos" : "passaram"}</p>
        </div>
      </div>
      <div className="mt-3 h-2.5 rounded-full bg-muted" aria-hidden="true">
        <div className={`h-2.5 rounded-full transition-[width] duration-500 ${barColor}`} style={{ width: `${width}%` }} />
      </div>
      {step.advanceRate !== null && (
        <p className="mt-2 text-sm text-muted-foreground" data-testid={`path-advance-${step.id}`}>
          {step.isFinal
            ? <><strong className="text-foreground">{fmtPct(step.advanceRate)}</strong> atingiram a meta nesta classificação; os demais terminaram os e-mails sem converter.</>
            : <><strong className="text-foreground">{fmtPct(step.advanceRate)}</strong> avançaram para a próxima etapa</>}
          {step.kind === "decision" && (step.lost > 0 || step.goals > 0) && (
            <> · {step.goals > 0 && <span className="font-medium text-success">{fmtInt(step.goals)} atingiram a meta</span>}{step.goals > 0 && step.lost > 0 && " · "}
              {step.lost > 0 && <span className={`inline-flex items-center gap-1 font-medium ${isLoss ? "text-destructive" : "text-foreground"}`}><ArrowDownRight aria-hidden="true" className="h-3.5 w-3.5" />{fmtInt(step.lost)} saíram sem meta</span>}
            </>
          )}
        </p>
      )}
      {step.kind === "decision" && step.reasons.length > 0 && (
        <p className="mt-1 text-sm text-muted-foreground">Motivos: {step.reasons.map((r) => `${r.label} (${fmtInt(r.count)})`).join(" · ")}</p>
      )}
    </li>
  );
}

export function JourneyPathSection({ path, status, onRetry, onClear, pieces, mapUrl }: {
  path: JourneyPath; status: DataStatus; onRetry: () => void; onClear: () => void; pieces: EmailPiece[]; mapUrl: string;
}) {
  const loss = path.steps.find((s) => s.id === path.biggestLossId);
  const max = path.steps[0]?.count ?? 0;
  const pieceFor = (s: PathStep) => (s.emailIndex !== null ? pieces[s.emailIndex - 1] : undefined);
  return (
    <DidacticSection id="caminho" n={2} title="O caminho da jornada, passo a passo"
      lead="Cada cartão é uma etapa do Journey Builder, na ordem real. Veja quantos contatos passaram por ela e quantos seguiram adiante."
      help={{ title: "Caminho da jornada", what: "A sequência de etapas da jornada: entrada, e-mails, esperas, decisões, meta e saídas.", how: "Leia de cima para baixo. A barra mostra o volume em relação à entrada; a porcentagem mostra quantos avançaram. A etapa em vermelho é a que mais perde contatos.", why: "Mostra onde a jornada converte e onde perde pessoas. É ali que uma mudança tem mais efeito." }}>
      <div className="mb-4 flex flex-wrap items-center gap-2" data-testid="path-legend">
        <span className="text-sm font-medium text-foreground">Tipos de etapa (passe o mouse ou foque para ver):</span>
        {(["entry", "email", "wait", "decision", "random", "goal", "exit"] as const).map((k) => <TypeChip key={k} kind={k} testId={`legend-type-${k}`} />)}
      </div>
      {status !== "ready" ? <DataState status={status} id="path" onRetry={onRetry} onClear={onClear} minHeight="min-h-64" /> : (
        <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
          <div>
            {loss && loss.emailIndex !== null && (
              <div role="alert" data-testid="path-loss-callout" className="mb-4 flex gap-3 rounded-xl border border-destructive bg-destructive/5 p-4 text-sm leading-6 text-foreground">
                <AlertTriangle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
                <p><strong>Atenção — {loss.label}:</strong> {fmtInt(loss.lost)} contatos ({fmtPct(loss.count ? loss.lost / loss.count : 0)} dos que chegaram) saem aqui sem atingir a meta. É a maior perda do caminho: melhorar esta etapa tem mais impacto do que qualquer outra.</p>
              </div>
            )}
            <ol className="space-y-2" aria-label="Etapas da jornada em ordem" data-testid="path-steps">
              {path.steps.map((s) => <StepRow key={s.id} step={s} max={max} isLoss={s.id === path.biggestLossId} piece={pieceFor(s)} />)}
            </ol>
          </div>
          <aside className="space-y-4 xl:sticky xl:top-40 xl:self-start">
            <div className="rounded-xl border border-border bg-card p-4 text-sm leading-6 text-muted-foreground" data-testid="path-base-note">
              <p className="font-semibold text-foreground">Sobre estes números</p>
              <p className="mt-1">O caminho mostra os <strong className="text-foreground">{fmtInt(path.finished)}</strong> contatos que já saíram da jornada. Os <strong className="text-foreground">{fmtInt(path.active)}</strong> ativos ainda estão percorrendo as etapas e a base não registra onde estão agora.</p>
              <p className="mt-2">A base registra saídas apenas nas decisões; por isso as esperas mantêm o mesmo volume do e-mail anterior.</p>
            </div>
            <figure className="overflow-hidden rounded-xl border border-border bg-card">
              <AssetImage src={mapUrl} alt="Mapa original da jornada JNY_INBOUND_LEADS_AON no Journey Builder" label="Mapa geral da jornada" testId="path-journey-map"
                className="h-48 w-full object-cover object-left-top" fallbackClassName="min-h-48" />
              <figcaption className="p-3 text-sm text-muted-foreground">
                Mapa original no Journey Builder. <a href="#por-dentro" className="font-medium text-globo-purple underline-offset-4 hover:underline" data-testid="path-map-link">Ver o mapa completo e a explicação</a>
              </figcaption>
            </figure>
          </aside>
        </div>
      )}
    </DidacticSection>
  );
}
