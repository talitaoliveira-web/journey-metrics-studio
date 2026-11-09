<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep email artwork previews and their accessible zoom dialog in a dedicated gallery component, so compact previews and full-image inspection stay consistent.
- Journey metrics come from src/lib/journey-data.ts defaults, optionally overridden by the builder's own Google Sheet (server fns in src/lib/sheets.functions.ts); missing tabs fall back to defaults so the original report numbers never silently change.
- Keep document and question aggregations browser-safe in a separate analysis module; document groups are independent and all percentages use the displayed source or selected segment denominator, so overlaps and distinct report bases stay explicit.
- Render journey-structure interpretations separately from the guided map narrative, so all insights can remain together in the final dashboard section.
