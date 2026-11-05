import { useEffect, useMemo, useState } from "react";
import { Loader2, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { consolidateLeads, toLead, type Lead, type LeadRow } from "@/lib/leads";

const fmt = (n: number) => n.toLocaleString("pt-BR");
const dash = (v: string) => v || "Não informado";
const PAGE = 25;

function Title({ n, title, sub, color }: { n: string; title: string; sub?: string; color: string }) {
  return (
    <div className="col-span-12 mt-4 flex items-end justify-between border-b border-border pb-3">
      <div className="flex items-center gap-3">
        <span className={`flex h-7 min-w-9 items-center justify-center rounded-md px-1.5 text-xs font-bold text-primary-foreground ${color}`}>{n}</span>
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      </div>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function Table({ head, rows }: { head: string[]; rows: (string | number)[][] }) {
  return (
    <div className="overflow-x-auto rounded-md border border-border bg-card">
      <table className="w-full text-left text-xs">
        <thead className="bg-muted text-muted-foreground">
          <tr>{head.map((h) => <th key={h} className="whitespace-nowrap px-3 py-2 font-semibold">{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-border">
              {r.map((c, j) => <td key={j} className="whitespace-nowrap px-3 py-2 text-foreground">{typeof c === "number" ? fmt(c) : c}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function LeadsSection() {
  const [leads, setLeads] = useState<Lead[] | null>(null);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("Todas");
  const [page, setPage] = useState(0);

  useEffect(() => {
    import("@/data/leads.json").then((m) => setLeads((m.default as LeadRow[]).map(toLead)));
  }, []);

  const c = useMemo(() => (leads ? consolidateLeads(leads) : null), [leads]);
  const filtered = useMemo(() => {
    if (!leads) return [];
    const s = q.trim().toLowerCase();
    return leads.filter((l) => (cat === "Todas" || l.categoria === cat) &&
      (!s || l.email.toLowerCase().includes(s) || l.empresa.toLowerCase().includes(s) || l.status.toLowerCase().includes(s)));
  }, [leads, q, cat]);

  if (!leads || !c) {
    return <div className="col-span-12 flex items-center gap-2 py-8 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Carregando base de leads...</div>;
  }

  const withCnpj = leads.filter((l) => l.cnpj);
  const answered = leads.filter((l) => l.q004 || l.q005);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE));
  const view = filtered.slice(page * PAGE, page * PAGE + PAGE);

  return (
    <>
      <Title n="08" title="Funil e Status da Jornada" sub="Quantidade por status de saída" color="bg-globo-purple" />
      <div className="col-span-12">
        <Table head={["StatusNaJornada", "EtapaSaida", "MotivoSaida", "Qtde"]} rows={c.funnel.map((f) => [f.status, f.etapa, f.motivo, f.qtde])} />
      </div>

      <Title n="09" title="CNPJ Preenchido" sub={`${fmt(withCnpj.length)} leads`} color="bg-globo-pink" />
      <div className="col-span-12">
        <Table head={["Email", "Empresa", "CNPJ", "StatusNaJornada", "Q004", "Q005", "Q006", "LeadSource", "Campanha"]}
          rows={withCnpj.map((l) => [l.email, l.empresa, l.cnpj, l.status, dash(l.q004), dash(l.q005), dash(l.q006), dash(l.leadSource), dash(l.campanha)])} />
      </div>

      <Title n="10" title="Respostas Q004 e Q005" sub={`${fmt(answered.length)} leads responderam`} color="bg-globo-orange" />
      <div className="col-span-12">
        <Table head={["Email", "Empresa", "CNPJ", "StatusNaJornada", "Q004", "Q005", "Q006"]}
          rows={answered.map((l) => [l.email, l.empresa, dash(l.cnpj), l.status, dash(l.q004), dash(l.q005), dash(l.q006)])} />
      </div>

      <Title n="11" title="Tabela Principal de Leads" sub={`${fmt(filtered.length)} de ${fmt(leads.length)} leads`} color="bg-globo-blue" />
      <div className="col-span-12 flex flex-wrap gap-2">
        <label className="relative min-w-[240px] flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} placeholder="Buscar por e-mail, empresa ou status"
            aria-label="Buscar leads" className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring" />
        </label>
        <select value={cat} onChange={(e) => { setCat(e.target.value); setPage(0); }} aria-label="Categoria"
          className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground">
          {["Todas", "Empresa", "Visitante", "Estudante", "Não informado"].map((o) => <option key={o}>{o}</option>)}
        </select>
      </div>
      <div className="col-span-12">
        <Table head={["Email", "Empresa", "Categoria", "CNPJ", "CPF", "LeadSource", "Campanha", "CreatedDate", "DataEntradaJornada", "DataSaidaJornada", "StatusNaJornada", "SentToCRM", "SentToCRMDateTime", "AbriuEmail"]}
          rows={view.map((l) => [l.email, l.empresa, l.categoria, dash(l.cnpj), dash(l.cpf), dash(l.leadSource), dash(l.campanha), dash(l.createdDate), dash(l.entrada), dash(l.saida), l.status, dash(l.sentToCrm), dash(l.sentToCrmAt), l.abriu])} />
        <div className="mt-3 flex items-center justify-end gap-2 text-xs text-muted-foreground">
          <button type="button" aria-label="Página anterior" disabled={page === 0} onClick={() => setPage(page - 1)} className="rounded-md border border-border p-1.5 disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
          Página {page + 1} de {pages}
          <button type="button" aria-label="Próxima página" disabled={page + 1 >= pages} onClick={() => setPage(page + 1)} className="rounded-md border border-border p-1.5 disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
        </div>
      </div>
    </>
  );
}
