"use client";

import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale/es";
import { AlertTriangle, Image } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Incidencia } from "@/app/incidencias/actions";

interface IncidentCardProps {
  incident: Incidencia;
}

export function IncidentCard({ incident }: IncidentCardProps) {
  const statusBadge =
    incident.estado === "resuelta" ? (
      <span className="inline-flex shrink-0 items-center rounded-full bg-green-500/10 px-2.5 py-1 text-xs font-medium text-green-600 dark:text-green-500">
        Resuelta
      </span>
    ) : (
      <span className="inline-flex shrink-0 items-center rounded-full bg-yellow-500/10 px-2.5 py-1 text-xs font-medium text-yellow-600 dark:text-yellow-500">
        Activa
      </span>
    );

  return (
    <Link href={`/incidencias/${incident.id}`} className="group block min-w-0">
      <Card className="hover:shadow-lg transition-all duration-200 border-border/50 h-full">
        <CardHeader className="grid-cols-1">
          <div className="flex min-w-0 items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle
                  className="mb-1 line-clamp-2 text-base leading-snug break-words"
                  title={incident.titulo}
                >
                  {incident.titulo}
                </CardTitle>
                <p className="text-sm text-muted-foreground break-words">
                  Reportada por:{" "}
                  {incident.autor_display &&
                  incident.autor_display !==
                    incident.autor_unidad_familiar_codigo
                    ? `${incident.autor_display} · ${incident.autor_unidad_familiar_codigo}`
                    : incident.autor_unidad_familiar_codigo}
                </p>
              </div>
            </div>
            {statusBadge}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground line-clamp-2">
              {incident.descripcion}
            </p>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                Creada:{" "}
                {format(new Date(incident.created_at), "PPpp", { locale: es })}
              </span>
              {incident.adjuntos_count ? (
                <span className="inline-flex items-center gap-1">
                  <Image className="size-3.5" />
                  {incident.adjuntos_count}
                </span>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
