import { CalendarRange, Compass, FilterX, Layers, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fmtDate, fmtInt, isDefaultFilters, type FilterOptions, type LeadFilters } from "@/lib/journey-insights";

const selectClass =
  "h-10 w-full min-w-0 rounded-md border border-border bg-card px-3 text-sm text-foreground transition-[border-color,box-shadow] duration-150 hover:border-foreground/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-70";

export function FiltersBar({ filters, options, onChange, onClear, onTour, matched }: {
  filters: LeadFilters; options: FilterOptions | null; onChange: (f: LeadFilters) => void; onClear: () => void; onTour: () => void; matched: number | null;
}) {
  const disabled = !options;
  return (
    <div id="filtros" data-testid="filters-bar" className="relative z-30 col-span-12 lg:sticky lg:top-0 scroll-mt-4 rounded-2xl border border-border bg-card/85 p-4 shadow-sm backdrop-blur-md transition-[outline-color] duration-300">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1.3fr_auto] lg:items-end">
        <label className="block text-sm">
          <span className="mb-1 flex items-center gap-1.5 font-medium text-foreground"><CalendarRange aria-hidden="true" className="h-4 w-4 text-muted-foreground" /> Período de entrada</span>
          <select data-testid="filter-period" className={selectClass} disabled={disabled} value={filters.period} onChange={(e) => onChange({ ...filters, period: e.target.value })}>
            <option value="all">Todo o período</option>
            {options?.periods.map((p) => <option key={p.value} value={p.value}>{p.label} ({fmtInt(p.count)})</option>)}
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1 flex items-center gap-1.5 font-medium text-foreground"><Layers aria-hidden="true" className="h-4 w-4 text-muted-foreground" /> Versão da jornada</span>
          <select data-testid="filter-version" className={selectClass} disabled={disabled} value={filters.version} onChange={(e) => onChange({ ...filters, version: e.target.value })} aria-describedby="version-note">
            <option value="all">Todas (a fonte tem 1 versão)</option>
          </select>
          <span id="version-note" className="sr-only">A base exportada não registra versões diferentes da jornada.</span>
        </label>
        <label className="block text-sm">
          <span className="mb-1 flex items-center gap-1.5 font-medium text-foreground"><Users aria-hidden="true" className="h-4 w-4 text-muted-foreground" /> Segmento</span>
          <select data-testid="filter-segment" className={selectClass} disabled={disabled} value={filters.segment} onChange={(e) => onChange({ ...filters, segment: e.target.value })}>
            <option value="all">Todos os segmentos</option>
            <optgroup label="Categoria do contato">
              {options?.categories.map((o) => <option key={o.value} value={o.value}>{o.label} ({fmtInt(o.count)})</option>)}
            </optgroup>
            <optgroup label="Origem do lead">
              {options?.sources.map((o) => <option key={o.value} value={o.value}>{o.label} ({fmtInt(o.count)})</option>)}
            </optgroup>
          </select>
        </label>
        <div className="flex gap-2 sm:col-span-2 lg:col-span-1">
          <Button type="button" variant="outline" className="h-10 flex-1 lg:flex-none" onClick={onClear} disabled={isDefaultFilters(filters)} data-testid="filters-clear-button">
            <FilterX aria-hidden="true" className="h-4 w-4" /> Limpar filtros
          </Button>
          <Button type="button" variant="ghost" className="h-10 flex-1 lg:flex-none" onClick={onTour} data-testid="tour-restart-button">
            <Compass aria-hidden="true" className="h-4 w-4" /> Ver tour
          </Button>
        </div>
      </div>
      <p className="mt-3 text-sm text-muted-foreground" aria-live="polite" data-testid="filters-summary">
        {matched === null ? "Carregando a base de contatos…" : (
          <>
            <strong className="font-semibold text-foreground">{fmtInt(matched)}</strong> contatos no recorte
            {options?.coverage && <> · base com entradas de {fmtDate(options.coverage.first)} a {fmtDate(options.coverage.last)}</>}
            {" "}· os filtros valem para as seções 1, 2, 4 e 5.
          </>
        )}
      </p>
    </div>
  );
}
