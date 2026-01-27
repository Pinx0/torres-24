"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { GastoCalculado, GastoPeriodicidad, GastoTipo } from "@/app/gastos/actions";

type Scope = "comunidad" | "mi_parte";
type Period = "mensual" | "anual";

const PERIODICIDAD_LABEL: Record<GastoPeriodicidad, string> = {
  puntual: "Puntual",
  mensual: "Mensual",
  bimensual: "Bimensual",
  trimestral: "Trimestral",
  semestral: "Semestral",
  anual: "Anual",
};

const TIPO_LABEL: Record<GastoTipo, string> = {
  real: "Real",
  presupuestado: "Presupuestado",
};

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

export function GastosList({
  gastos,
  scope,
  period,
}: {
  gastos: GastoCalculado[];
  scope: Scope;
  period: Period;
}) {
  if (gastos.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          No hay gastos que coincidan con los filtros seleccionados.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {gastos.map((gasto) => {
        const categoria = gasto.categoria?.nombre ?? "Sin categoría";
        const amount = getMonto(gasto, scope, period);
        const fechaInicio = new Date(gasto.fecha_inicio).toLocaleDateString("es-ES");
        const fechaFin = gasto.fecha_fin
          ? new Date(gasto.fecha_fin).toLocaleDateString("es-ES")
          : null;

        return (
          <Card key={gasto.id} className="border-border/60">
            <CardHeader className="pb-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-base">{gasto.descripcion}</CardTitle>
                  <p className="text-sm text-muted-foreground">{categoria}</p>
                </div>
                <div className="text-right text-base font-semibold tabular-nums text-foreground">
                  {formatCurrency(amount)}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="rounded-full bg-muted px-2.5 py-1 font-medium text-foreground">
                  {TIPO_LABEL[gasto.tipo]}
                </span>
                <span className="rounded-full bg-muted px-2.5 py-1 font-medium text-foreground">
                  {PERIODICIDAD_LABEL[gasto.periodicidad]}
                </span>
                <span className="rounded-full bg-muted px-2.5 py-1 font-medium text-foreground">
                  {period === "mensual" ? "Mensualizado" : "Anualizado"}
                </span>
                <span className="rounded-full bg-muted px-2.5 py-1 font-medium text-foreground">
                  Desde {fechaInicio}
                  {fechaFin ? ` · Hasta ${fechaFin}` : ""}
                </span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
