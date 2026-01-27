"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { GastoCalculado, GastoTipo } from "@/app/gastos/actions";
import { GastosChart } from "@/components/gastos-chart";
import { GastosList } from "@/components/gastos-list";

type Scope = "comunidad" | "mi_parte";
type Period = "mensual" | "anual";
type TipoFilter = GastoTipo | "ambos";

const FALLBACK_COLORS = [
  "#0ea5e9",
  "#6366f1",
  "#22c55e",
  "#f97316",
  "#ec4899",
  "#14b8a6",
  "#eab308",
  "#8b5cf6",
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(value);
}

function getMonto(gasto: GastoCalculado, scope: Scope, period: Period) {
  if (scope === "mi_parte") {
    return period === "mensual" ? gasto.mensual_mi_parte : gasto.anual_mi_parte;
  }
  return period === "mensual" ? gasto.mensual_comunidad : gasto.anual_comunidad;
}

export function GastosViewer({
  gastos,
  participacion,
}: {
  gastos: GastoCalculado[];
  participacion: number;
}) {
  const [scope, setScope] = useState<Scope>("comunidad");
  const [period, setPeriod] = useState<Period>("mensual");
  const [tipo, setTipo] = useState<TipoFilter>("ambos");

  const filteredGastos = useMemo(() => {
    return gastos.filter((gasto) => (tipo === "ambos" ? true : gasto.tipo === tipo));
  }, [gastos, tipo]);

  const chartData = useMemo(() => {
    const entries = new Map<
      string,
      { id: string; label: string; value: number; color: string }
    >();

    let colorIndex = 0;
    for (const gasto of filteredGastos) {
      const value = getMonto(gasto, scope, period);
      if (!value) continue;
      const id = gasto.categoria?.id ?? "sin-categoria";
      const label = gasto.categoria?.nombre ?? "Sin categoría";
      const color =
        gasto.categoria?.color ?? FALLBACK_COLORS[colorIndex % FALLBACK_COLORS.length];

      const existing = entries.get(id);
      if (existing) {
        existing.value += value;
      } else {
        entries.set(id, { id, label, value, color });
        colorIndex += 1;
      }
    }

    return Array.from(entries.values()).sort((a, b) => b.value - a.value);
  }, [filteredGastos, period, scope]);

  const total = useMemo(() => {
    return filteredGastos.reduce((acc, gasto) => acc + getMonto(gasto, scope, period), 0);
  }, [filteredGastos, scope, period]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-[1.2fr_2fr]">
        <Card className="border-border/60">
          <CardHeader className="space-y-3">
            <CardTitle className="text-base">Filtros del visor</CardTitle>
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Importe</p>
              <ButtonGroup>
                <Button
                  size="sm"
                  variant={scope === "comunidad" ? "default" : "outline"}
                  onClick={() => setScope("comunidad")}
                >
                  Total comunidad
                </Button>
                <Button
                  size="sm"
                  variant={scope === "mi_parte" ? "default" : "outline"}
                  onClick={() => setScope("mi_parte")}
                >
                  Mi parte ({(participacion * 100).toFixed(2)}%)
                </Button>
              </ButtonGroup>
            </div>
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Periodo</p>
              <ButtonGroup>
                <Button
                  size="sm"
                  variant={period === "mensual" ? "default" : "outline"}
                  onClick={() => setPeriod("mensual")}
                >
                  Mensual
                </Button>
                <Button
                  size="sm"
                  variant={period === "anual" ? "default" : "outline"}
                  onClick={() => setPeriod("anual")}
                >
                  Anual
                </Button>
              </ButtonGroup>
            </div>
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Tipo de gasto</p>
              <ButtonGroup>
                <Button
                  size="sm"
                  variant={tipo === "ambos" ? "default" : "outline"}
                  onClick={() => setTipo("ambos")}
                >
                  Ambos
                </Button>
                <Button
                  size="sm"
                  variant={tipo === "real" ? "default" : "outline"}
                  onClick={() => setTipo("real")}
                >
                  Reales
                </Button>
                <Button
                  size="sm"
                  variant={tipo === "presupuestado" ? "default" : "outline"}
                  onClick={() => setTipo("presupuestado")}
                >
                  Presupuestados
                </Button>
              </ButtonGroup>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-dashed border-border/70 p-4 text-sm">
              <p className="text-muted-foreground">Total seleccionado</p>
              <p className="mt-1 text-2xl font-semibold text-foreground tabular-nums">
                {formatCurrency(total)}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Los gastos puntuales se prorratean a 12 meses en la vista mensual.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Distribución por categoría</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length === 0 ? (
              <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
                No hay datos para mostrar en la gráfica.
              </div>
            ) : (
              <GastosChart data={chartData} />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Detalle de gastos</h2>
          <p className="text-sm text-muted-foreground">
            Lista completa con periodicidad y tipo de gasto.
          </p>
        </div>
        <GastosList gastos={filteredGastos} scope={scope} period={period} />
      </div>
    </div>
  );
}
