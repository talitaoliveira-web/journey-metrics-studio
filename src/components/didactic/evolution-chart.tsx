import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { TrendingUp } from "lucide-react";
import { fmtInt, weeklyInsights, type WeekPoint } from "@/lib/journey-insights";
import { DataState, DidacticSection, type DataStatus } from "@/components/didactic/shared";

const tick = { fontSize: 14, fill: "var(--color-muted-foreground)" };

export function EvolutionChart({ series, status, onRetry, onClear }: { series: WeekPoint[]; status: DataStatus; onRetry: () => void; onClear: () => void }) {
  const insights = weeklyInsights(series);
  return (
    <DidacticSection id="evolucao" n={4} title="Evolução no tempo"
      lead="Quantos contatos entraram, concluíram e atingiram a meta em cada semana."
      help={{ title: "Evolução semanal", what: "Contagem semanal de entradas (pela data de entrada), conclusões e metas atingidas (pela data de saída).", how: "Cada ponto é uma semana, identificada pela segunda-feira em que começa. Linha contínua: entradas; tracejada: conclusões; pontilhada: metas.", why: "Mostra se a jornada está recebendo contatos novos e se os resultados acompanham esse volume." }}>
      {status !== "ready" ? <DataState status={status} id="evolution" onRetry={onRetry} onClear={onClear} minHeight="min-h-72" /> : (
        <div className="rounded-xl border border-border bg-card p-5" data-testid="evolution-chart">
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={series} margin={{ top: 16, right: 24, left: 16, bottom: 28 }}>
              <CartesianGrid stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="label" tick={tick} axisLine={false} tickLine={false}
                label={{ value: "Semana (início na segunda-feira)", position: "insideBottom", offset: -18, fontSize: 14, fill: "var(--color-muted-foreground)" }} />
              <YAxis tick={tick} axisLine={false} tickLine={false} tickFormatter={(v) => fmtInt(Number(v))} width={64}
                label={{ value: "Contatos", angle: -90, position: "insideLeft", offset: -4, fontSize: 14, fill: "var(--color-muted-foreground)" }} />
              <Tooltip formatter={(v, name) => [`${fmtInt(Number(v))} contatos`, name]} labelFormatter={(l) => `Semana de ${l}`} contentStyle={{ fontSize: 14 }} />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: 14 }} />
              <Line type="monotone" dataKey="entradas" name="Entradas" stroke="var(--globo-blue)" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="conclusoes" name="Conclusões" stroke="var(--globo-orange)" strokeWidth={3} strokeDasharray="8 4" dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="metas" name="Metas atingidas" stroke="var(--color-success)" strokeWidth={3} strokeDasharray="2 4" dot={{ r: 5 }} activeDot={{ r: 7 }} />
            </LineChart>
          </ResponsiveContainer>
          <ul className="mt-4 space-y-2 border-t border-border pt-4" data-testid="evolution-insights">
            {insights.map((t) => (
              <li key={t} className="flex gap-2 text-base leading-7 text-foreground"><TrendingUp aria-hidden="true" className="mt-1 h-5 w-5 shrink-0 text-globo-purple" />{t}</li>
            ))}
            <li className="text-sm leading-6 text-muted-foreground">As entradas chegam em lotes semanais, porque a automação adiciona novos contatos toda quarta-feira.</li>
          </ul>
        </div>
      )}
    </DidacticSection>
  );
}
