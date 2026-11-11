import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Expand, ZoomIn, ZoomOut, Scan } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { AssetImage } from "@/components/asset-image";

import { CONFIRMED_SENDS, type EmailRow } from "@/lib/journey-data";
import { validateEmail01 } from "@/lib/email-validation";

type EmailPiece = {
  id: string;
  img: { url: string };
  subject: string;
  pre: string;
  desc: string;
  learning: string;
};

const fmt = (value: number) => value.toLocaleString("pt-BR");
const pct = (value: number) => `${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;

export function EmailGallery({ pieces, metrics }: { pieces: EmailPiece[]; metrics: EmailRow[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [zoom, setZoom] = useState(100);
  const scrollRef = useRef<HTMLDivElement>(null);
  const active = activeIndex === null ? undefined : pieces[activeIndex];

  function open(index: number) {
    setActiveIndex(index);
    setZoom(100);
    scrollRef.current?.scrollTo({ top: 0, left: 0 });
  }

  return (
    <>
      <dl className="col-span-12 grid gap-4 border-y border-border py-4 text-xs sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Envios e entregas", "Envios são disparos registrados, não pessoas únicas. Entregas são mensagens que chegaram ao destino; essa quantidade não está disponível por peça."],
          ["Aberturas e cliques", "Abertura é uma visualização registrada; aberturas únicas deduplicam esse registro no tracking. Cliques registram ações nos links, não preenchimento do formulário."],
          ["CTR e CTOR", "CTR relaciona cliques aos envios; CTOR relaciona cliques às aberturas. São taxas de interação, não taxas de qualificação."],
          ["Falhas e descadastros", "Bounce é falha de entrega. Descadastro é saída da comunicação. Ambos aparecem como taxas da fonte, não como quantidades de contatos."],
        ].map(([label, text]) => <div key={label}><dt className="font-semibold text-foreground">{label}</dt><dd className="mt-1 leading-5 text-muted-foreground">{text}</dd></div>)}
      </dl>
      <div className="col-span-12 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {pieces.map((piece, index) => {
          const row = metrics.find((item) => item.email === piece.id);
          const issues = row ? validateEmail01(row) : [];
          return (
          <article key={piece.id} className="min-w-0 overflow-hidden rounded-md border border-border bg-card">
          <Button
            variant="outline"
            aria-label={`Ampliar ${piece.id}`}
            onClick={() => open(index)}
            className="group h-auto w-full min-w-0 flex-col items-stretch gap-0 overflow-hidden rounded-none border-0 bg-card p-0 text-left shadow-none"
          >
            <div className="relative h-28 overflow-hidden border-b border-border bg-muted">
              <AssetImage src={piece.img.url} alt={`Prévia do ${piece.id}`} label={`Arte do ${piece.id}`} className="h-full w-full object-cover object-top" testId={`email-art-preview-${piece.id.toLowerCase().replace(/\s+/g, "-")}`} />
              <span className="absolute bottom-2 right-2 flex h-7 w-7 items-center justify-center rounded-sm border border-border bg-card text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <Expand aria-hidden="true" />
              </span>
            </div>
            <div className="min-w-0 px-3 py-3">
              <p className="text-xs font-semibold text-primary">{piece.id} · {index + 1} de {pieces.length}</p>
              <p className="mt-1 line-clamp-2 min-h-10 whitespace-normal text-xs font-medium leading-5 text-foreground">{piece.subject}</p>
            </div>
          </Button>
          <div className="border-t border-border px-3 pb-4 pt-3">
            <p className="text-xs leading-5 text-muted-foreground">{piece.desc}</p>
            {row ? <>
              <p className="mb-2 mt-4 text-xs font-semibold uppercase text-primary">Indicadores registrados</p>
              <dl className="grid grid-cols-2 gap-x-2 gap-y-3 text-xs">
                {[["Envios", fmt(row.sends)], ["Abertura", pct(row.openRate)], ["Aberturas únicas", fmt(row.uniqueOpens)], ["Cliques", fmt(row.clicks)], ["CTR", pct(row.ctr)], ["CTOR", pct(row.ctor)], ["Falhas de entrega", pct(row.bounce)], ["Descadastros", pct(row.unsub)]].map(([label, value]) => <div key={label}><dt className="text-muted-foreground">{label}</dt><dd className="mt-1 font-semibold tabular-nums text-foreground">{value}</dd></div>)}
              </dl>
              {issues.length > 0 && <div role="status" aria-label="Inconsistências do E-mail 01" className="mt-4 border-l-2 border-warning pl-3 text-xs leading-5 text-muted-foreground">
                <p className="font-semibold text-warning">Indicadores inconsistentes com {fmt(CONFIRMED_SENDS["EML 01"] ?? row.sends)} envios</p>
                <ul className="mt-2 list-disc space-y-2 pl-4">{issues.map(issue => <li key={issue.code}>{issue.message}</li>)}</ul>
                <p className="mt-2">Valores preservados. Os cálculos de conferência não substituem as taxas registradas. Falhas e descadastros são verificados apenas quanto ao intervalo percentual, pois suas quantidades não foram informadas.</p>
              </div>}
            </> : <p className="mt-3 text-xs text-muted-foreground">Sem indicadores correspondentes na fonte carregada.</p>}
            <p className="mt-3 text-xs leading-5 text-muted-foreground"><strong className="text-foreground">Entregas:</strong> quantidade não informada por peça na fonte disponível. Não estimada a partir da taxa de falhas.</p>
          </div>
          </article>
        );})}
      </div>

      <Dialog open={Boolean(active)} onOpenChange={(isOpen) => { if (!isOpen) setActiveIndex(null); }}>
        {active && (
          <DialogContent className="flex max-h-[92dvh] w-[96vw] max-w-5xl flex-col gap-0 overflow-hidden rounded-md p-0">
            <div className="shrink-0 border-b border-border px-5 pb-4 pt-5 pr-12">
              <p className="mb-2 text-xs font-semibold text-primary">{active.id}</p>
              <DialogTitle className="text-base leading-6 tracking-normal">{active.subject}</DialogTitle>
              <DialogDescription className="mt-1 text-xs">{active.pre}</DialogDescription>
            </div>
            <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-border bg-card px-4 py-2">
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" aria-label="E-mail anterior" title="E-mail anterior" disabled={activeIndex === 0} onClick={() => { if (activeIndex !== null) open(activeIndex - 1); }}><ChevronLeft /></Button>
                <span className="w-14 text-center text-xs tabular-nums text-muted-foreground">{(activeIndex ?? 0) + 1} / {pieces.length}</span>
                <Button variant="ghost" size="icon" aria-label="Próximo e-mail" title="Próximo e-mail" disabled={activeIndex === pieces.length - 1} onClick={() => { if (activeIndex !== null) open(activeIndex + 1); }}><ChevronRight /></Button>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" aria-label="Diminuir imagem" title="Diminuir imagem" disabled={zoom <= 100} onClick={() => setZoom((value) => value - 25)}><ZoomOut /></Button>
                <span className="w-12 text-center text-xs tabular-nums text-muted-foreground">{zoom}%</span>
                <Button variant="ghost" size="icon" aria-label="Aumentar imagem" title="Aumentar imagem" disabled={zoom >= 200} onClick={() => setZoom((value) => value + 25)}><ZoomIn /></Button>
                <Button variant="ghost" size="icon" aria-label="Ajustar imagem" title="Ajustar imagem" onClick={() => setZoom(100)}><Scan /></Button>
              </div>
            </div>
            <div ref={scrollRef} className="min-h-0 flex-1 overflow-auto bg-muted p-3 sm:p-5">
              <AssetImage key={active.id} src={active.img.url} alt={`Layout completo do ${active.id}`} label={`Arte do ${active.id}`} className={zoom === 100 ? "mx-auto block h-auto w-full max-w-[640px]" : "mx-auto block h-auto max-w-none"} style={zoom > 100 ? { width: `${640 * zoom / 100}px` } : undefined} testId={`email-art-zoom-${active.id.toLowerCase().replace(/\s+/g, "-")}`} />
            </div>
            <p className="shrink-0 border-t border-border bg-card px-5 py-3 text-xs leading-5 text-muted-foreground">{active.desc}</p>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}