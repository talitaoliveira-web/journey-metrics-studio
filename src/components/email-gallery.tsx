import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Expand, ZoomIn, ZoomOut, Scan } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

type EmailPiece = {
  id: string;
  img: { url: string };
  subject: string;
  pre: string;
  desc: string;
};

export function EmailGallery({ pieces }: { pieces: EmailPiece[] }) {
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
      <div className="col-span-12 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {pieces.map((piece, index) => (
          <Button
            key={piece.id}
            variant="outline"
            aria-label={`Ampliar ${piece.id}`}
            onClick={() => open(index)}
            className="group h-auto min-w-0 flex-col items-stretch gap-0 overflow-hidden bg-card p-0 text-left shadow-none"
          >
            <div className="relative h-28 overflow-hidden border-b border-border bg-muted">
              <img src={piece.img.url} alt={`Prévia do ${piece.id}`} className="h-full w-full object-cover object-top" loading="lazy" />
              <span className="absolute bottom-2 right-2 flex h-7 w-7 items-center justify-center rounded-sm border border-border bg-card text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <Expand aria-hidden="true" />
              </span>
            </div>
            <div className="min-w-0 px-3 py-3">
              <p className="text-[11px] font-semibold text-primary">{piece.id}</p>
              <p className="mt-1 line-clamp-2 min-h-10 whitespace-normal text-xs font-medium leading-5 text-foreground">{piece.subject}</p>
            </div>
          </Button>
        ))}
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
              <img key={active.id} src={active.img.url} alt={`Layout completo do ${active.id}`} className={zoom === 100 ? "mx-auto block h-auto w-full max-w-[640px]" : "mx-auto block h-auto max-w-none"} style={zoom > 100 ? { width: `${640 * zoom / 100}px` } : undefined} />
            </div>
            <p className="shrink-0 border-t border-border bg-card px-5 py-3 text-xs leading-5 text-muted-foreground">{active.desc}</p>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}