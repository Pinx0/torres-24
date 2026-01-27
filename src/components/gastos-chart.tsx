"use client";

import {
  PieChart,
  Pie,
  Cell,
} from "recharts";

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

export interface GastosChartItem {
  id: string;
  label: string;
  value: number;
  color: string;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(value);
}

export function GastosChart({ data }: { data: GastosChartItem[] }) {
  const chartConfig = data.reduce<ChartConfig>((acc, item) => {
    acc[item.id] = {
      label: item.label,
      color: item.color,
    };
    return acc;
  }, {});

  return (
    <ChartContainer config={chartConfig} className="h-80">
      <PieChart>
        <ChartTooltip
          content={
            <ChartTooltipContent
              nameKey="label"
              formatter={(value, name) => (
                <div className="flex w-full items-center justify-between gap-3">
                  <span className="text-muted-foreground">{name}</span>
                  <span className="font-mono font-medium">
                    {formatCurrency(Number(value))}
                  </span>
                </div>
              )}
            />
          }
        />
        <Pie data={data} dataKey="value" nameKey="label" innerRadius={60} strokeWidth={2}>
          {data.map((entry) => (
            <Cell key={entry.id} fill={entry.color} />
          ))}
        </Pie>
        <ChartLegend content={<ChartLegendContent nameKey="label" />} />
      </PieChart>
    </ChartContainer>
  );
}
