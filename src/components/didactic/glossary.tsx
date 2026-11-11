import { BookOpen, Info } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { DidacticSection } from "@/components/didactic/shared";

const HOW_TO_READ = [
  ["Comece pela frase do topo", "Ela resume, em uma linha, quantos entraram e quantos atingiram a meta."],
  ["Use os filtros", "Escolha período e segmento. Os números de contatos, o caminho e a evolução se atualizam na hora."],
  ["Siga o caminho", "Na seção 2, veja etapa por etapa onde os contatos avançam e onde saem. A maior perda aparece em vermelho."],
  ["Compare os e-mails", "Na seção 3, ▲ e ▼ mostram se cada taxa está acima ou abaixo da média; verde é melhor e vermelho é pior."],
  ["Toque no (?)", "Cada número e gráfico tem uma explicação: o que é, como ler e por que importa."],
];

const GLOSSARY: [string, string][] = [
  ["Contato", "Uma pessoa cadastrada na base, identificada pelo e-mail. É quem recebe as comunicações da jornada."],
  ["Entrada", "O momento em que o contato começa a jornada. Nesta jornada, novos contatos entram toda quarta-feira, por uma automação."],
  ["Meta (Goal)", "O objetivo da jornada. Aqui é o preenchimento do CNPJ, que transforma o contato em um lead qualificado de empresa (MQL). Quem atinge a meta sai da jornada."],
  ["Critério de saída (Exit)", "Regra que tira o contato da jornada, por exemplo por não engajar após o E-mail 03 ou ao terminar os cinco e-mails sem converter."],
  ["Espera (Wait)", "Pausa programada entre um passo e outro, para dar tempo de o contato reagir ao e-mail."],
  ["Divisão de decisão", "Pergunta que separa os contatos em caminhos diferentes, como: preencheu o formulário? abriu o e-mail?"],
  ["Divisão aleatória", "Sorteio de contatos entre caminhos, usado em testes A/B. Não é usada nesta jornada."],
  ["Taxa de abertura", "Percentual de envios abertos. Pode ser inflada por proteções de privacidade, como a Apple Mail Privacy Protection, que abrem os e-mails automaticamente."],
  ["CTR (clique sobre envios)", "Cliques divididos pelos envios. Mostra quantos agiram a partir do e-mail."],
  ["CTOR (cliques sobre aberturas)", "Cliques divididos pelas aberturas. Mostra se o conteúdo convenceu quem abriu."],
  ["Bounce (hard e soft)", "E-mail que não chegou. Hard bounce é permanente (endereço inexistente) e o contato deve ser removido; soft bounce é temporário (caixa cheia, servidor fora do ar). A fonte atual não separa os dois tipos."],
  ["Descadastro", "Quando a pessoa pede para não receber mais e-mails (opt-out). Ela deixa de ser elegível para novas comunicações."],
  ["Tempo médio na jornada", "Média de dias entre a entrada e a saída, entre os contatos que já concluíram a jornada."],
];

const LIMITS = [
  "A taxa de abertura pode ser inflada por proteções de privacidade de e-mail, como a Apple Mail Privacy Protection. Use o clique como sinal mais confiável.",
  "Entregues é uma estimativa (enviados menos bounce): a fonte não tem essa coluna. A fonte também não separa hard e soft bounce.",
  "A base exportada registra uma única versão da jornada; por isso o filtro de versão tem só uma opção.",
  "As seções 1, 2 e 4 usam a base de contatos exportada; a seção 3 usa o tracking de e-mails. São fontes com níveis de detalhe diferentes, e os totais não precisam coincidir.",
  "As taxas dos e-mails foram mantidas como registradas na fonte, sem recálculo pelos envios atualizados.",
  "Os contatos ativos ainda podem atingir a meta; os resultados das últimas semanas ainda vão mudar.",
];

export function GlossarySection() {
  return (
    <DidacticSection id="glossario" n={6} title="Como ler este dashboard"
      lead="Um guia rápido, o glossário dos termos do Marketing Cloud e os limites desta análise.">
      <div className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-5">
          <div className="rounded-xl border border-border bg-card p-5" data-testid="how-to-read">
            <h3 className="flex items-center gap-2 font-semibold text-foreground"><BookOpen aria-hidden="true" className="h-5 w-5 text-globo-purple" /> Passo a passo</h3>
            <ol className="mt-3 space-y-3">
              {HOW_TO_READ.map(([t, d], i) => (
                <li key={t} className="flex gap-3 text-sm leading-6">
                  <span aria-hidden="true" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted font-semibold text-foreground">{i + 1}</span>
                  <span><strong className="text-foreground">{t}.</strong> <span className="text-muted-foreground">{d}</span></span>
                </li>
              ))}
            </ol>
          </div>
          <div role="note" className="rounded-xl border border-warning bg-warning-soft p-5" data-testid="limitations">
            <h3 className="flex items-center gap-2 font-semibold text-foreground"><Info aria-hidden="true" className="h-5 w-5 text-warning" /> Limitações dos dados</h3>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-foreground">
              {LIMITS.map((l) => <li key={l}>{l}</li>)}
            </ul>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5" data-testid="glossary">
          <h3 className="font-semibold text-foreground">Glossário</h3>
          <Accordion type="multiple" className="mt-2">
            {GLOSSARY.map(([term, def]) => {
              const slug = term.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
              return (
                <AccordionItem key={term} value={term}>
                  <AccordionTrigger data-testid={`glossary-${slug}`} className="text-base">{term}</AccordionTrigger>
                  <AccordionContent className="text-sm leading-6 text-muted-foreground">{def}</AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </div>
      </div>
    </DidacticSection>
  );
}
