import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { toLead, type Lead, type LeadRow } from "@/lib/leads";
import { EmailGallery } from "@/components/email-gallery";
import { JourneyStory, JourneyStructureInsights } from "@/components/journey-story";
import { SheetSource } from "@/components/sheet-source";
import { LeadsSection } from "@/components/leads-section";
import { DidacticDashboard } from "@/components/didactic/didactic-dashboard";
import journeyMapUrl from "@/assets/jornada-canvas.jpg";
import { defaultJourney, type JourneyData, type Overview } from "@/lib/journey-data";
import { DashboardShell, KpiCard, Panel, SectionTitle } from "@/components/dashboard-template";
import {
  Bar, BarChart, CartesianGrid, LabelList, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import {
  Database, LogIn, Send, GitBranch, TrendingUp, Lightbulb, ShieldAlert, Activity, Info, Calendar, Mail,
} from "lucide-react";
import e1 from "@/assets/eml01.jpg";
import e2 from "@/assets/eml02.jpg";
import e3 from "@/assets/eml03.jpg";
import e4 from "@/assets/eml04.jpg";
import e5 from "@/assets/eml05.jpg";

const pieces = [
  { id: "EML 01", img: { url: e1 }, subject: "O que é Globo Ads? A gente te mostra", pre: "Conheça soluções para diferentes objetivos de marca", desc: "Apresentação: introduz a Globo Ads e c[...]
  { id: "EML 02", img: { url: e2 }, subject: "O que acontece quando marcas se conectam à Globo?", pre: "Resultados e insights para inspirar sua estratégia", desc: "Inspiração: apresenta cases [...]" },
  { id: "EML 03", img: { url: e3 }, subject: "Anunciar com a Globo é mais simples do que parece", pre: "Entenda como funciona na prática", desc: "Educação: aprofunda argumentos e benefícios s[...]
  { id: "EML 04", img: { url: e4 }, subject: "Vamos avançar com Globo Ads?", pre: "Falta só um próximo passo!", desc: "Avanço: retoma o convite para dar o próximo passo com a Globo Ads.", lea[...]
  { id: "EML 05", img: { url: e5 }, subject: "O mercado está se movendo. E sua marca?", pre: "Veja onde estão as novas oportunidades", desc: "Oportunidade: encerra a sequência de peças com nov[...]
];

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Renderize — Jornada inbound AON" },
      { name: "description", content: "Renderize: Jornada inbound AON — qualificação de leads, análise dos cinco e-mails e aprendizados estratégicos, com fatos e hipóteses separados." },
      { property: "og:title", content: "Renderize — Jornada inbound AON" },
      { property: "og:description", content: "Renderize: entenda a qualificação de leads, as cinco comunicações e os limites da análise da Jornada inbound AON." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

const BLUE = "var(--globo-blue)";
const fmt = (n: number) => n.toLocaleString("pt-BR");
const pct = (n: number) => n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + "%";

const overviewMeta: { key: keyof Overview; icon: typeof Database; label: string; desc: string; tone: "blue" | "purple" | "pink" }[] = [
  { key: "base", icon: Database, label: "Base de origem", desc: "Total de registros da DE_JORNADALEADS_QUALIFICACAOMQL_AGO25. Estar na base não significa ter iniciado a jornada.", tone: "blue" },
  { key: "entradas", icon: LogIn, label: "Entradas na Jornada", desc: "Contatos que iniciaram a jornada no período.", tone: "purple" },
  { key: "envios", icon: Send, label: "Total de Envios", desc: "Total informado no resumo da fonte. Não equivale ao número de pessoas nem à soma do tracking abaixo.", tone: "pink" },
];

const kpiChip: Record<string, string> = {
  blue: "bg-globo-blue/10 text-globo-blue",
  purple: "bg-globo-purple/10 text-globo-purple",
  pink: "bg-globo-pink/10 text-globo-pink",
  orange: "bg-globo-orange/10 text-globo-orange",
};

const emailColors = ["var(--globo-blue)", "var(--globo-purple)", "var(--globo-pink)", "var(--globo-orange)", "var(--color-success)"];

const toneBg: Record<string, string> = { primary: "bg-primary-soft text-primary", success: "bg-success-soft text-success", warning: "bg-warning-soft text-warning" };

const axis = { fontSize: 14, fill: "var(--color-muted-foreground)" };
