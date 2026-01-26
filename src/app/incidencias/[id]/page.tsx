import Link from "next/link";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale/es";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IncidentCommentForm, IncidentResolveButton } from "@/components/incident-detail-actions";
import { getIncidenciaDetalle } from "../actions";

interface IncidenciaDetailPageProps {
  params: { id: string | string[] } | Promise<{ id: string | string[] }>;
}

export default async function IncidenciaDetailPage({ params }: IncidenciaDetailPageProps) {
  const resolvedParams = await Promise.resolve(params);
  const incidentId = Array.isArray(resolvedParams.id) ? resolvedParams.id[0] : resolvedParams.id;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data, error } = await getIncidenciaDetalle(incidentId ?? "");

  if (error || !data) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Incidencia no disponible</CardTitle>
            <p className="text-sm text-muted-foreground">{error || "No se encontró la incidencia."}</p>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const { incidencia, comentarios } = data;
  const isAuthor = incidencia.autor_usuario_id === user.id;

  const statusBadge = incidencia.estado === "resuelta" ? (
    <span className="inline-flex items-center rounded-full bg-green-500/10 px-2.5 py-1 text-xs font-medium text-green-600 dark:text-green-500">
      Resuelta
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full bg-yellow-500/10 px-2.5 py-1 text-xs font-medium text-yellow-600 dark:text-yellow-500">
      Activa
    </span>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="space-y-2">
        <Link href="/incidencias" className="text-sm text-muted-foreground hover:text-foreground">
          ← Volver a incidencias
        </Link>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{incidencia.titulo}</h1>
            <p className="text-sm text-muted-foreground">
              Creada por {incidencia.autor_display ?? incidencia.autor_unidad_familiar_codigo} el{" "}
              {format(new Date(incidencia.created_at), "PPpp", { locale: es })}
            </p>
          </div>
          <div>{statusBadge}</div>
        </div>
      </div>

      <div className="flex justify-start">
        <IncidentResolveButton
          incidentId={incidencia.id}
          isResolved={incidencia.estado === "resuelta"}
          canResolve={isAuthor}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detalle de la incidencia</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">{incidencia.descripcion}</p>
          {incidencia.resolved_at ? (
            <div className="text-xs text-muted-foreground">
              Resuelta el {format(new Date(incidencia.resolved_at), "PPpp", { locale: es })}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Comentarios</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {comentarios.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aún no hay comentarios. Sé el primero en aportar información.
            </p>
          ) : (
            <div className="space-y-4">
              {comentarios.map((comentario) => (
                <div key={comentario.id} className="rounded-lg border border-border/60 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-medium">
                      {comentario.autor_display ?? comentario.autor_unidad_familiar_codigo}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(comentario.created_at), "PPpp", { locale: es })}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{comentario.mensaje}</p>
                </div>
              ))}
            </div>
          )}
          <IncidentCommentForm incidentId={incidencia.id} />
        </CardContent>
      </Card>
    </div>
  );
}
