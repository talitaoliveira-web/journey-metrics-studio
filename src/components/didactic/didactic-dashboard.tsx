import { useEffect, useMemo, useState } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { Lead } from "@/lib/leads";
import type { EmailRow } from "@/lib/journey-data";
import {
  applyFilters, buildPath, computeKpis, DEFAULT_FILTERS, filterOptions, recommendations, weeklySeries, type LeadFilters,
} from "@/lib/journey-insights";
import { FiltersBar } from "@/components/didactic/filters-bar";
import { OverviewKpis } from "@/components/didactic/overview-kpis";
import { JourneyPathSection, type EmailPiece } from "@/components/didactic/journey-path";
import { EmailPerformance } from "@/components/didactic/email-performance";
import { EvolutionChart } from "@/components/didactic/evolution-chart";
import { Recommendations } from "@/components/didactic/recommendations";
import { GlossarySection } from "@/components/didactic/glossary";
import { GuidedTour, shouldAutoStartTour } from "@/components/didactic/guided-tour";
import type { DataStatus } from "@/components/didactic/shared";

/** Didactic layer (sections 1–6) on top of the detailed analysis. Lead-based sections follow the filters. */
export function DidacticDashboard({ leads, leadsError, onRetry, emails, pieces, mapUrl }: {
  leads: Lead[] | null; leadsError: boolean; onRetry: () => void; emails: EmailRow[]; pieces: EmailPiece[]; mapUrl: string;
}) {
  const [filters, setFilters] = useState<LeadFilters>(DEFAULT_FILTERS);
  const [tourOpen, setTourOpen] = useState(false);
  useEffect(() => { if (leads && shouldAutoStartTour()) setTourOpen(true); }, [leads]);

  const options = useMemo(() => (leads ? filterOptions(leads) : null), [leads]);
  const filtered = useMemo(() => (leads ? applyFilters(leads, filters) : []), [leads, filters]);
  const kpis = useMemo(() => computeKpis(filtered), [filtered]);
  const path = useMemo(() => buildPath(filtered), [filtered]);
  const series = useMemo(() => weeklySeries(filtered), [filtered]);
  const recs = useMemo(() => recommendations(path, kpis, emails), [path, kpis, emails]);

  const status: DataStatus = leadsError ? "error" : !leads ? "loading" : filtered.length === 0 ? "empty" : "ready";
  const clear = () => setFilters(DEFAULT_FILTERS);

  return (
    <TooltipProvider delayDuration={150}>
      <FiltersBar filters={filters} options={options} onChange={setFilters} onClear={clear} onTour={() => setTourOpen(true)} matched={leads ? filtered.length : null} />
      <OverviewKpis kpis={kpis} status={status} onRetry={onRetry} onClear={clear} />
      <JourneyPathSection path={path} status={status} onRetry={onRetry} onClear={clear} pieces={pieces} mapUrl={mapUrl} />
      <EmailPerformance emails={emails} pieces={pieces} />
      <EvolutionChart series={series} status={status} onRetry={onRetry} onClear={clear} />
      <Recommendations items={recs} status={status} onRetry={onRetry} onClear={clear} />
      <GlossarySection />
      <GuidedTour open={tourOpen} onClose={() => setTourOpen(false)} />
    </TooltipProvider>
  );
}
