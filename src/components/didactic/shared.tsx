import type { ReactNode } from "react";
import { CircleHelp, Inbox, RefreshCw, TriangleAlert } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export type HelpContent = { title: string; what: string; how: string; why: string };

/** (?) button that explains what a number or chart is, how to read it and why it matters. Tap-friendly. */
export function HelpTip({ id, help }: { id: string; help: HelpContent }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`Ajuda: ${help.title}`}
          data-testid={`help-${id}`}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-[background-color,color,transform] duration-150 hover:bg-muted hover:text-foreground active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <CircleHelp aria-hidden="true" className="h-4 w-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent data-testid={`help-${id}-content`} className="w-[min(22rem,calc(100vw-2rem))] text-sm leading-6">
        <p className="font-semibold text-foreground">{help.title}</p>
        <dl className="mt-2 space-y-2 text-muted-foreground">
          <div><dt className="font-semibold text-foreground">O que é</dt><dd>{help.what}</dd></div>
          <div><dt className="font-semibold text-foreground">Como ler</dt><dd>{help.how}</dd></div>
          <div><dt className="font-semibold text-foreground">Por que importa</dt><dd>{help.why}</dd></div>
        </dl>
      </PopoverContent>
    </Popover>
  );
}

export function DidacticSection({ id, n, title, lead, help, children }: {
  id: string; n: number; title: string; lead: string; help?: HelpContent | undefined; children: ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} data-testid={`section-${id}`} className="col-span-12 scroll-mt-32 rounded-2xl transition-[outline-color] duration-300">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3 border-b border-border pb-3">
        <div className="flex items-start gap-3">
          <span aria-hidden="true" className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-foreground text-sm font-bold text-background">{n}</span>
          <div>
            <h2 id={`${id}-title`} className="text-xl font-semibold tracking-tight text-foreground">{title}</h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">{lead}</p>
          </div>
        </div>
        {help && <HelpTip id={id} help={help} />}
      </div>
      {children}
    </section>
  );
}

export type DataStatus = "loading" | "error" | "empty" | "ready";

/** Friendly loading / error / empty states for sections fed by the contact base. */
export function DataState({ status, id, onRetry, onClear, minHeight = "min-h-40" }: {
  status: Exclude<DataStatus, "ready">; id: string; onRetry: () => void; onClear: () => void; minHeight?: string;
}) {
  if (status === "loading") {
    return (
      <div data-testid={`${id}-loading`} aria-busy="true" aria-live="polite" className={`space-y-3 ${minHeight}`}>
        <span className="sr-only">Carregando a base de contatos…</span>
        <Skeleton className="h-6 w-2/3" /><Skeleton className="h-24 w-full" /><Skeleton className="h-6 w-1/2" />
      </div>
    );
  }
  const isError = status === "error";
  const Icon = isError ? TriangleAlert : Inbox;
  return (
    <div role="status" data-testid={`${id}-${status}`} className={`flex flex-col items-start justify-center gap-3 rounded-xl border border-dashed border-border bg-muted/50 p-6 ${minHeight}`}>
      <Icon aria-hidden="true" className={`h-6 w-6 ${isError ? "text-destructive" : "text-muted-foreground"}`} />
      <div>
        <p className="font-semibold text-foreground">{isError ? "Não foi possível carregar a base de contatos" : "Nenhum contato com esses filtros"}</p>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          {isError ? "Verifique sua conexão e tente de novo. Os indicadores de e-mail continuam disponíveis abaixo." : "Não há contatos que entraram na jornada nesse período e segmento. Tente outra combinação ou limpe os filtros."}
        </p>
      </div>
      <Button type="button" variant="outline" size="sm" onClick={isError ? onRetry : onClear} data-testid={`${id}-${isError ? "retry" : "clear"}-button`}>
        <RefreshCw aria-hidden="true" className="h-4 w-4" /> {isError ? "Tentar de novo" : "Limpar filtros"}
      </Button>
    </div>
  );
}
