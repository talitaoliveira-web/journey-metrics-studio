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
- Section 02.2 view shows only entry + email stages (filtered in the view; flow data, sheet template and parser keep all 17 stages). Resumo do fluxo: Entradas, Chegaram ao Email 05, Etapas exibidas.
- Fluxo (02.2): email stages Email 01–05 use the confirmed sends (4.149, 2.503, 2.043, 1.048, 931); entry, wait, validation and exit stages unchanged; parser maps old email-stage values (1.923, 1.188, 867, 573, 483) to the new ones.
- Confirmed figures: base 9.719 (DE_JORNADALEADS_QUALIFICACAOMQL_AGO25); sends per email in `CONFIRMED_SENDS` (EML 01–05: 4.149, 2.503, 2.043, 1.048, 931; total 10.674). Rates/opens/clicks preserved from source, not recalculated. Parser maps superseded sends (EML 01: 12.613/1.923; EML 02–05 old values) to the confirmed ones.
- `email-validation.ts`: pure E-mail 01 consistency diagnostics against `CONFIRMED_SENDS["EML 01"]`, no metric mutation (currently flags CTR 1,24% vs 157/4.149 = 3,78%).

## Key flows
- Reader journey: header (Renderize + date/email filter + last update) → Fonte dos dados (Google Sheets override) → Contexto da Jornada → Por dentro da jornada (map canvas + 12-step narrative + insights) → Visão Geral → tracking charts → Email gallery (compact previews + zoom dialog) → lead funnel → final interpretations.
- Email filter select filters per-email views; zoom dialogs support 100–200/250% zoom.

## Known trade-offs (spec deviations)
- None open. Email artworks (eml01–05.jpg, jornada-canvas.jpg) were recovered byte-perfect from the project's Lovable preview origin and are now committed at `src/assets/*.jpg`, imported directly (see `src/vite-env.d.ts`). `src/components/asset-image.tsx` remains as a safety net: it renders the local asset and degrades to a labeled placeholder (`data-asset-fallback="true"`) only if an image ever fails to load.

## Auth
None. No accounts or gated areas.
