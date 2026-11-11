import { Lightbulb } from "lucide-react";
import type { Recommendation } from "@/lib/journey-insights";
import { DataState, DidacticSection, type DataStatus } from "@/components/didactic/shared";

export function Recommendations({ items, status, onRetry, onClear }: { items: Recommendation[]; status: DataStatus; onRetry: () => void; onClear: () => void }) {
  return (
    <DidacticSection id="o-que-fazer" n={5} title="O que fazer agora"
      lead="Três sugestões práticas, calculadas a partir dos números desta página. Elas mudam quando você altera os filtros."
      help={{ title: "Ações recomendadas", what: "Sugestões geradas por regras simples sobre os dados: a etapa com maior perda, o e-mail com maior bounce e o de menor clique.", how: "Cada cartão diz o que os dados mostram e o que testar. A etiqueta indica de qual seção vem o dado.", why: "Transforma a leitura do dashboard em próximos passos. São hipóteses para testar, não garantias de resultado." }}>
      {status !== "ready" && status !== "empty" ? <DataState status={status} id="recommendations" onRetry={onRetry} onClear={onClear} /> : items.length === 0 ? (
        <div role="status" data-testid="recommendations-empty" className="rounded-xl border border-dashed border-border bg-muted/50 p-6 text-sm text-muted-foreground">
          Não há dados suficientes neste recorte para sugerir ações. Limpe os filtros para ver as recomendações da jornada inteira.
        </div>
      ) : (
        <ol className="grid gap-4 md:grid-cols-3" data-testid="recommendations-list">
          {items.map((r, i) => (
            <li key={r.id} data-testid={`recommendation-${r.id}`} className="flex flex-col rounded-xl border border-border bg-card p-5 shadow-sm transition-[box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-center gap-3">
                <span aria-hidden="true" className="flex h-9 w-9 items-center justify-center rounded-full bg-globo-purple/10 font-bold text-globo-purple">{i + 1}</span>
                <span className="rounded-full border border-border px-2.5 py-0.5 text-xs font-medium text-muted-foreground">{r.basis}</span>
              </div>
              <h3 className="mt-3 flex items-start gap-2 text-base font-semibold text-foreground"><Lightbulb aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-warning" />{r.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{r.text}</p>
            </li>
          ))}
        </ol>
      )}
    </DidacticSection>
  );
}
