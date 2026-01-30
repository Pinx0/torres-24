"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale/es";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BadgeCheck, Clock, Vote } from "lucide-react";

interface PollCardProps {
  id: string;
  titulo: string;
  descripcion?: string | null;
  estado: "activa" | "finalizada";
  created_at: string;
  finalized_at?: string | null;
  opciones_count: number;
  votos_count: number;
  isOwner?: boolean;
}

export function PollCard({
  id,
  titulo,
  descripcion,
  estado,
  created_at,
  finalized_at,
  opciones_count,
  votos_count,
  isOwner = false,
}: PollCardProps) {
  const statusBadge =
    estado === "activa" ? (
      <span className="inline-flex items-center rounded-full bg-green-500/10 px-2.5 py-1 text-xs font-medium text-green-600 dark:text-green-500">
        Activa
      </span>
    ) : (
      <span className="inline-flex items-center rounded-full bg-blue-500/10 px-2.5 py-1 text-xs font-medium text-blue-600 dark:text-blue-500">
        Finalizada
      </span>
    );

  const timestamp = finalized_at || created_at;
  const timestampLabel = estado === "finalizada" ? "Finalizada" : "Creada";

  return (
    <Link href={`/votaciones/${id}`} className="block">
      <Card className="hover:shadow-lg transition-all duration-200 border-border/50 h-full">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary shrink-0">
                <Vote className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <CardTitle className="text-base line-clamp-2">{titulo}</CardTitle>
                {descripcion ? (
                  <p className="text-sm text-muted-foreground line-clamp-2">{descripcion}</p>
                ) : null}
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              {statusBadge}
              {isOwner ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  <BadgeCheck className="size-3" />
                  Tu encuesta
                </span>
              ) : null}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Vote className="size-4" />
              <span>
                {opciones_count} {opciones_count === 1 ? "opción" : "opciones"} · {votos_count}{" "}
                voto{votos_count === 1 ? "" : "s"}
              </span>
            </div>
            {timestamp ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="size-3" />
                <span>
                  {timestampLabel}{" "}
                  {formatDistanceToNow(new Date(timestamp), {
                    addSuffix: true,
                    locale: es,
                  })}
                </span>
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
