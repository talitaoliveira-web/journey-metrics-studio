# Renderize — Jornada inbound AON

## What the app is
PT-BR analytics dashboard (Lovable/TanStack Start: React 19, Tailwind v4, shadcn/ui, Recharts) reporting the "Jornada inbound AON" 5-email inbound journey (Globo Ads / Salesforce Marketing Cloud). Brand is "Renderize"; the report context ("Jornada inbound AON") is the header subtitle and page title.

## Stack & serving
- No separate backend: TanStack Start server functions in `src/lib/*.functions.ts` (Google Sheets fetch, CSRF-protected); data defaults in `src/lib/journey-data.ts` and `src/data/leads.json`.
- Dev server: `vite dev` — the Lovable config hardcodes **port 8080**, but the Emergent preview ingress routes to **port 3000**. Run: `./node_modules/.bin/vite dev --port 3000 --host 0.0.0.0 --strictPort` from /app. `vite.config.ts` allows preview hosts via `vite.server.allowedHosts` (".preview.emergentcf.cloud", ".preview.emergentagent.com").
- Deps are bun-managed (`bun.lock`); install with `bun install`. Supervisor `backend`/`frontend` programs point to nonexistent template dirs — ignore them (FATAL is expected).
- Typecheck: `bunx tsc --noEmit` (tsconfig has `exactOptionalPropertyTypes`). Tests: `bunx vitest run` (27 tests). Lint: `eslint .`.

## Data model (browser-safe modules)
- `journey-data.ts`: JourneyData = { overview (base/entradas/envios), flow FlowStep[], emails EmailRow[5], consolidated ConsolidatedItem[] }; SHEET_TABS = Visao_Geral, Fluxo, Emails, Consolidado. Missing tabs fall back to defaults.
- `leads.ts`: LeadRow tuple (17 cols) → Lead; consolidateLeads builds the funnel; splitStatus parses "…saiu da jornada após E-mail N".
- `email-validation.ts`: pure E-mail 01 consistency diagnostics (1.923 envios baseline), no metric mutation.

## Key flows
- Reader journey: header (Renderize + date/email filter + last update) → Fonte dos dados (Google Sheets override) → Contexto da Jornada → Por dentro da jornada (map canvas + 12-step narrative + insights) → Visão Geral → tracking charts → Email gallery (compact previews + zoom dialog) → lead funnel → final interpretations.
- Email filter select filters per-email views; zoom dialogs support 100–200/250% zoom.

## Known trade-offs (spec deviations)
- Email artworks (eml01–05.jpg, jornada-canvas.jpg) are Lovable R2 assets unreachable outside the Lovable editor; `src/components/asset-image.tsx` attempts the Lovable URL and degrades to a labeled placeholder (`data-asset-fallback="true"`) — self-heals where the /__l5e proxy exists. The browser logs one 404 per asset attempt; no broken-image UI remains.

## Auth
None. No accounts or gated areas.
