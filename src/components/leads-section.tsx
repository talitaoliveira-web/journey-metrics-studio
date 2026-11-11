import { useMemo, useState } from "react";
import { Loader2, Search, ChevronLeft, ChevronRight, Contact, Building2, CircleHelp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { consolidateLeads, type Lead } from "@/lib/leads";
import { defaultJourney } from "@/lib/journey-data";
import { documentSummary, percentage, questionSummary, selectIdentification, type Identification, type Question } from "@/lib/lead-analysis";

const fmt = (n: number) => n.toLocaleString("pt-BR");
const pct = (n: number) => `${n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
const PAGE = 25;
const questions: { key: Question; title: string; desc: string }[] = [
  { key: "q004", title: "Q004 · Valor de mercado da empresa", desc: "Faixas declaradas pelos contatos, mantidas conforme o registro original." },
  { key: "q005", title: "Q005 · Investimento em mídia", desc: "Faixas de investimento informadas, sem estimar valores dentro de cada faixa." },
  { key: "q006", title: "Q006 · Aceita receber informações da Globo?", desc: "Preferência registrada. Uma resposta ausente não equivale a uma recusa." },
];
function Table({ head, rows }: { head: string[]; rows: (string | number)[][] }) {
  return <div className="overflow-x-auto rounded-md border border-border bg-card"><table className="w-full text-left text-xs"><thead className="bg-muted text-muted-foreground"><tr>{head.map(h => <th key={h} className="px-3 py-3 font-semibold">{h}</th>)}</tr></thead><tbody>{rows.map((r, i) => <tr key={i} className="border-t border-border">{r.map((c, j) => <td key={j} className="px-3 py-3 text-foreground">{typeof c === "number" ? fmt(c) : c}</td>)}</tr>)}</tbody></table></div>;
}

export function LeadsSection({ leads, section }: { leads: Lead[] | null; section: "stages" | "identity" | "questions" | "insights" }) {
  const [group, setGroup] = useState<Identification>("all");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const segment = useMemo(() => selectIdentification(leads ?? [], group), [leads, group]);
  if (!leads) return <p className="col-span-12 flex items-center gap-2 py-5 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Carregando registros para análise...</p>;
  const docs = documentSummary(leads);
  if (section === "stages") {
    const statuses = consolidateLeads(leads).funnel;
    return <details className="col-span-12 border-y border-border py-4"><summary className="cursor-pointer text-sm font-semibold text-foreground">Status registrados na base de contatos</summary><p className="my-3 text-xs leading-5 text-muted-foreground">Distribuição de {fmt(leads.length)} registros da exportação de contatos. É uma base distinta dos volumes por atividade acima; os status são transcritos da fonte, não regras inferidas de exclusão.</p><Table head={["Status registrado", "Etapa de saída", "Motivo registrado", "Registros"]} rows={statuses.map(f => [f.status, f.etapa, f.motivo, f.qtde])} /></details>;
  }
  if (section === "identity") {
    const cards = [
      { label: "CPF preenchido", count: docs.cpf, icon: Contact, color: "text-globo-blue", bg: "bg-globo-blue" },
      { label: "CNPJ preenchido", count: docs.cnpj, icon: Building2, color: "text-globo-purple", bg: "bg-globo-purple" },
      { label: "Não informado", count: docs.none, icon: CircleHelp, color: "text-muted-foreground", bg: "bg-muted-foreground" },
    ];
    const search = q.trim().toLowerCase();
    const filtered = leads.filter(l => !search || l.email.toLowerCase().includes(search) || l.empresa.toLowerCase().includes(search));
    const pages = Math.max(1, Math.ceil(filtered.length / PAGE));
    return <>
      <div className="col-span-12 flex flex-wrap items-baseline justify-between gap-2 border-l-2 border-globo-blue pl-4"><p className="text-sm text-muted-foreground">Documentos preenchidos na exportação de contatos, não validação de identidade ou conversão.</p><p className="text-sm font-semibold text-foreground">{fmt(docs.total)} registros analisados</p></div>
      {cards.map(c => <article key={c.label} className="col-span-12 rounded-md border border-border bg-card p-5 md:col-span-4"><div className={`flex items-center justify-between ${c.color}`}><h3 className="text-sm font-semibold">{c.label}</h3><c.icon className="h-5 w-5" /></div><p className="mt-4 text-4xl font-semibold tabular-nums text-foreground">{fmt(c.count)}</p><p className={`mt-2 text-lg font-semibold ${c.color}`}>{pct(percentage(c.count, docs.total))}</p><div className="mt-4 h-2 overflow-hidden rounded-sm bg-muted" role="meter" aria-label={c.label} aria-valuenow={c.count} aria-valuemin={0} aria-valuemax={docs.total}><div className={`h-full ${c.bg}`} style={{ width: `${percentage(c.count, docs.total)}%` }} /></div><p className="mt-3 text-xs text-muted-foreground">Percentual sobre {fmt(docs.total)} registros</p></article>)}
      <p className="col-span-12 text-xs leading-5 text-muted-foreground">{fmt(docs.identified)} registros têm ao menos um documento; {fmt(docs.both)} têm CPF e CNPJ e aparecem nos dois indicadores. Por isso, as três categorias não devem ser somadas. “Não informado” significa ausência de ambos os documentos. Estes {fmt(docs.total)} registros não substituem a base de {fmt(defaultJourney.overview.base)} registros da DE_JORNADALEADS_QUALIFICACAOMQL_AGO25.</p>
      <details className="col-span-12 border-y border-border py-4"><summary className="cursor-pointer text-sm font-semibold text-foreground">Registros de identificação</summary><label className="relative my-4 block"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><input aria-label="Buscar registros" placeholder="Buscar e-mail ou empresa" value={q} onChange={e => { setQ(e.target.value); setPage(0); }} className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm" /></label><Table head={["E-mail", "Empresa", "Categoria", "CPF", "CNPJ", "Status"]} rows={filtered.slice(page * PAGE, (page + 1) * PAGE).map(l => [l.email, l.empresa, l.categoria, l.cpf || "Não informado", l.cnpj || "Não informado", l.status])} /><div className="mt-3 flex items-center justify-end gap-3 text-xs text-muted-foreground"><Button variant="outline" size="icon" aria-label="Página anterior" disabled={page === 0} onClick={() => setPage(page - 1)}><ChevronLeft /></Button>Página {page + 1} de {pages}<Button variant="outline" size="icon" aria-label="Próxima página" disabled={page + 1 >= pages} onClick={() => setPage(page + 1)}><ChevronRight /></Button></div></details>
    </>;
  }
  if (section === "questions") return <>
    <p className="col-span-12 text-sm leading-6 text-muted-foreground">As respostas ajudam a descrever o perfil e as preferências declaradas. Cada quantidade e percentual usa todos os registros do grupo selecionado, incluindo respostas não informadas.</p>
    <div className="col-span-12 flex flex-wrap gap-2" role="group" aria-label="Identificação das respostas">{([{ value: "all", label: "Todos" }, { value: "cpf", label: "CPF preenchido" }, { value: "cnpj", label: "CNPJ preenchido" }, { value: "none", label: "Não informado" }] as { value: Identification; label: string }[]).map(g => <Button key={g.value} variant={group === g.value ? "default" : "outline"} aria-pressed={group === g.value} onClick={() => setGroup(g.value)}>{g.label}</Button>)}</div>
    <p className="col-span-12 text-xs text-muted-foreground">Grupo selecionado: <strong className="text-foreground">{fmt(segment.length)} registros</strong>. Registros com ambos os documentos participam das análises de CPF e CNPJ, sem duplicação dentro de cada grupo.</p>
    {questions.map(question => {
      const answers = questionSummary(segment, question.key);
      const answered = segment.filter(l => l[question.key].trim()).length;
      return <section key={question.key} className="col-span-12 min-w-0 border-t border-border pt-5 lg:col-span-4"><h3 className="text-base font-semibold text-foreground">{question.title}</h3><p className="mt-2 min-h-10 text-xs leading-5 text-muted-foreground">{question.desc}</p><p className="my-4 text-sm text-foreground"><strong>{fmt(answered)}</strong> com resposta · {pct(percentage(answered, segment.length))} do grupo</p><Table head={["Resposta registrada", "Qtd.", "% do grupo"]} rows={answers.map(a => [a.answer, a.count, pct(a.percent)])} />{!answers.length && <p className="py-4 text-xs text-muted-foreground">Nenhum registro neste grupo.</p>}<p className="mt-3 text-xs leading-5 text-muted-foreground">Base: {fmt(segment.length)} registros. Campos vazios aparecem como “Não informado”.</p></section>;
    })}
  </>;
  const answered = leads.filter(l => l.q004.trim() || l.q005.trim() || l.q006.trim()).length;
  return <>
    <article className="col-span-12 border-l-2 border-globo-blue pl-4 md:col-span-6"><p className="text-[11px] font-semibold uppercase text-globo-blue">Fato · identificação</p><h3 className="mt-2 text-sm font-semibold">Preenchimento ainda restrito nesta base</h3><p className="mt-2 text-xs leading-5 text-muted-foreground">{fmt(docs.identified)} de {fmt(docs.total)} registros têm ao menos um documento ({pct(percentage(docs.identified, docs.total))}). Isso descreve cobertura cadastral, não uma taxa de conversão da jornada. Confirmar o período e a abrangência da exportação antes de avaliar o resultado.</p></article>
    <article className="col-span-12 border-l-2 border-globo-purple pl-4 md:col-span-6"><p className="text-[11px] font-semibold uppercase text-globo-purple">Fato e oportunidade · respostas</p><h3 className="mt-2 text-sm font-semibold">Um recorte pequeno para conhecer o perfil</h3><p className="mt-2 text-xs leading-5 text-muted-foreground">{fmt(answered)} registros têm alguma resposta às três perguntas. A distribuição não representa automaticamente toda a base. Comparar respostas por documento e investigar os campos ausentes; ausência em Q006 não autoriza concluir recusa ou consentimento.</p></article>
  </>;
}
