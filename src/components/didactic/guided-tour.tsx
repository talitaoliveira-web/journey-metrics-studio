import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export const TOUR_KEY = "renderize-tour-v1";

const STEPS = [
  { target: "filtros", title: "Comece pelos filtros", text: "Escolha o período e o segmento. Os números de contatos, o caminho e a evolução mudam na hora. “Limpar filtros” volta ao total." },
  { target: "visao-geral", title: "O resumo em uma frase", text: "A frase em destaque resume o resultado. Os cartões mostram os cinco números principais; toque no (?) para entender cada um." },
  { target: "caminho", title: "O caminho, passo a passo", text: "Veja por onde os contatos passam, quantos avançam em cada etapa e onde está a maior perda, destacada em vermelho." },
  { target: "desempenho", title: "Como foi cada e-mail", text: "Cada taxa é comparada com a média da jornada: ▲ acima, ▼ abaixo, ● na média. Os selos mostram o melhor e o pior e-mail." },
  { target: "o-que-fazer", title: "O que fazer agora", text: "Três sugestões práticas, calculadas a partir dos dados exibidos." },
  { target: "glossario", title: "Ficou com dúvida?", text: "Aqui estão o passo a passo de leitura, o glossário e os limites da análise." },
];

export function shouldAutoStartTour() {
  try { return window.localStorage.getItem(TOUR_KEY) !== "done"; } catch { return false; }
}

export function GuidedTour({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [index, setIndex] = useState(0);
  const step = STEPS[index] ?? STEPS[0]!;
  const last = index === STEPS.length - 1;

  const finish = useCallback(() => {
    try { window.localStorage.setItem(TOUR_KEY, "done"); } catch { /* storage unavailable: tour simply shows again */ }
    onClose();
  }, [onClose]);

  useEffect(() => { if (open) setIndex(0); }, [open]);

  useEffect(() => {
    if (!open) return;
    const el = document.getElementById(step.target);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
    el?.classList.add("tour-highlight");
    return () => el?.classList.remove("tour-highlight");
  }, [open, step.target]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") finish(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, finish]);

  if (!open) return null;
  return (
    <div role="dialog" aria-modal="false" aria-labelledby="tour-title" aria-describedby="tour-text" data-testid="guided-tour"
      className="tour-card fixed inset-x-3 bottom-3 z-50 rounded-2xl border border-border bg-card/95 p-5 shadow-2xl backdrop-blur-md sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-[400px]">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold text-globo-purple" data-testid="tour-progress">Passo {index + 1} de {STEPS.length}</p>
        <button type="button" onClick={finish} aria-label="Fechar tour" className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" data-testid="tour-close-button">
          <X aria-hidden="true" className="h-5 w-5" />
        </button>
      </div>
      <h2 id="tour-title" className="mt-1 text-lg font-semibold text-foreground">{step.title}</h2>
      <p id="tour-text" className="mt-1 text-sm leading-6 text-muted-foreground" aria-live="polite">{step.text}</p>
      <div className="mt-3 flex gap-1.5" aria-hidden="true">
        {STEPS.map((s, i) => <span key={s.target} className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${i <= index ? "bg-globo-purple" : "bg-muted"}`} />)}
      </div>
      <div className="mt-4 flex items-center justify-between gap-2">
        <Button type="button" variant="ghost" onClick={finish} data-testid="tour-skip-button">Pular</Button>
        <div className="flex gap-2">
          {index > 0 && <Button type="button" variant="outline" onClick={() => setIndex(index - 1)} data-testid="tour-prev-button"><ArrowLeft aria-hidden="true" className="h-4 w-4" /> Anterior</Button>}
          <Button type="button" onClick={() => (last ? finish() : setIndex(index + 1))} data-testid="tour-next-button">
            {last ? "Concluir" : <>Próximo <ArrowRight aria-hidden="true" className="h-4 w-4" /></>}
          </Button>
        </div>
      </div>
    </div>
  );
}
