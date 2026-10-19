import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { FileSpreadsheet, Loader2, RefreshCw, Plus, ExternalLink, X } from "lucide-react";
import { createTemplateSheet, loadJourneyFromSheet } from "@/lib/sheets.functions";
import { extractSpreadsheetId, SHEET_TABS, type JourneyData } from "@/lib/journey-data";

const STORAGE_KEY = "jornada-aon-sheet-id";

type Props = { onData: (data: JourneyData | null, info: { title: string; at: Date } | null) => void };

export function SheetSource({ onData }: Props) {
  const load = useServerFn(loadJourneyFromSheet);
  const create = useServerFn(createTemplateSheet);
  const [input, setInput] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [status, setStatus] = useState<{ kind: "idle" | "loading" | "ok" | "error"; msg?: string }>({ kind: "idle" });

  async function run(id: string) {
    setStatus({ kind: "loading" });
    try {
      const r = await load({ data: { spreadsheetId: id } });
      if (!r.ok) { setStatus({ kind: "error", msg: r.error }); return; }
      localStorage.setItem(STORAGE_KEY, id);
      setActiveId(id);
      onData(r.data, { title: r.title, at: new Date() });
      const extra = r.warnings.length ? ` ${r.warnings.join(" ")}` : "";
      setStatus({ kind: "ok", msg: `"${r.title}" carregada (${r.loaded.join(", ")}).${extra}` });
    } catch (e) {
      setStatus({ kind: "error", msg: e instanceof Error ? e.message : "Não foi possível carregar a planilha." });
    }
  }

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) { setInput(`https://docs.google.com/spreadsheets/d/${saved}`); void run(saved); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const id = extractSpreadsheetId(input);
    if (!id) { setStatus({ kind: "error", msg: "Cole o link completo da planilha do Google Sheets." }); return; }
    void run(id);
  }

  async function makeTemplate() {
    setStatus({ kind: "loading" });
    try {
      const r = await create();
      setInput(r.url);
      await run(r.spreadsheetId);
      window.open(r.url, "_blank", "noopener");
    } catch (e) {
      setStatus({ kind: "error", msg: e instanceof Error ? e.message : "Não foi possível criar a planilha." });
    }
  }

  function disconnect() {
    localStorage.removeItem(STORAGE_KEY);
    setActiveId(null);
    setInput("");
    onData(null, null);
    setStatus({ kind: "idle" });
  }

  const busy = status.kind === "loading";

  return (
    <div className="col-span-12 rounded-md border border-border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-success-soft text-success">
            <FileSpreadsheet className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-foreground">Fonte dos dados: Google Sheets</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Cole o link de uma planilha com as abas {Object.values(SHEET_TABS).join(", ")}. Sem planilha, o painel mostra os dados do relatório original.
            </p>
          </div>
        </div>
        <button type="button" onClick={makeTemplate} disabled={busy}
          className="inline-flex h-9 items-center gap-2 rounded-md border border-border px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50">
          <Plus className="h-4 w-4" /> Criar planilha modelo
        </button>
      </div>

      <form onSubmit={submit} className="mt-4 flex flex-wrap gap-2">
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="https://docs.google.com/spreadsheets/d/..."
          aria-label="Link da planilha"
          className="h-9 min-w-[260px] flex-1 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring" />
        <button type="submit" disabled={busy}
          className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          {activeId ? "Atualizar dados" : "Carregar dados"}
        </button>
        {activeId && (
          <>
            <a href={`https://docs.google.com/spreadsheets/d/${activeId}`} target="_blank" rel="noopener noreferrer"
              className="inline-flex h-9 items-center gap-2 rounded-md border border-border px-3 text-sm text-foreground hover:bg-muted">
              <ExternalLink className="h-4 w-4" /> Abrir
            </a>
            <button type="button" onClick={disconnect}
              className="inline-flex h-9 items-center gap-2 rounded-md border border-border px-3 text-sm text-muted-foreground hover:bg-muted">
              <X className="h-4 w-4" /> Usar dados originais
            </button>
          </>
        )}
      </form>

      {status.msg && (
        <p role="status" className={`mt-3 text-xs ${status.kind === "error" ? "text-destructive" : "text-success"}`}>{status.msg}</p>
      )}
    </div>
  );
}
