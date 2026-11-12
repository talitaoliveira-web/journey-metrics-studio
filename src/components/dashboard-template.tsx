import type { ComponentType, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function DashboardShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("min-h-screen bg-background", className)}>
      <div className="mx-auto grid max-w-[1600px] grid-cols-12 gap-5 px-4 py-6 sm:px-8 sm:py-10">
        {children}
      </div>
    </div>
  );
}

export function SectionTitle({
  n,
  title,
  sub,
  color = "bg-globo-blue",
  id,
  className,
}: {
  n: string;
  title: string;
  sub?: string;
  color?: string;
  id?: string;
  className?: string;
}) {
  return (
    <div
      id={id}
      className={cn(
        "col-span-12 mt-4 scroll-mt-32 flex flex-wrap items-end justify-between gap-2 border-b border-border pb-3",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <span className={cn("flex h-7 min-w-9 items-center justify-center rounded-md px-1.5 text-xs font-bold text-primary-foreground", color)}>
          {n}
        </span>
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      </div>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

export function Panel({
  className = "",
  title,
  children,
}: {
  className?: string;
  title?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("rounded-md border border-border bg-card p-5", className)}>
      {title && <h3 className="mb-4 text-sm font-semibold text-foreground">{title}</h3>}
      {children}
    </div>
  );
}

export function KpiCard({
  label,
  value,
  desc,
  tone = "blue",
  icon: Icon,
}: {
  label: string;
  value: string | number;
  desc: string;
  tone?: "blue" | "purple" | "pink" | "orange";
  icon: ComponentType<{ className?: string }>;
}) {
  const toneClasses: Record<string, string> = {
    blue: "bg-globo-blue/10 text-globo-blue",
    purple: "bg-globo-purple/10 text-globo-purple",
    pink: "bg-globo-pink/10 text-globo-pink",
    orange: "bg-globo-orange/10 text-globo-orange",
  };

  return (
    <Panel className="col-span-12 md:col-span-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <span className={cn("flex h-8 w-8 items-center justify-center rounded-md", toneClasses[tone])}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-3 text-4xl font-semibold tracking-tight text-foreground">{value}</p>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{desc}</p>
    </Panel>
  );
}
