import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { getIncidenciasByEstado } from "./actions";
import { IncidentsList } from "@/components/incidents-list";
import { CreateIncidentDialog } from "@/components/create-incident-dialog";

export default async function IncidenciasPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [activesResult, resolvedResult] = await Promise.all([
    getIncidenciasByEstado("activa"),
    getIncidenciasByEstado("resuelta"),
  ]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
              ← Volver al menú principal
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Gestión de incidencias</h1>
              <p className="text-muted-foreground">
                Reporta problemas y mantén a todos informados sobre su resolución.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <CreateIncidentDialog />
          </div>
        </div>
      </div>

      <Tabs defaultValue="active" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 bg-muted/50 h-12">
          <TabsTrigger value="active" className="gap-2 data-[active=true]:bg-background cursor-pointer h-full">
            <AlertTriangle className="size-4" />
            Activas
            {activesResult.data.length > 0 && (
              <span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                {activesResult.data.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="resolved" className="gap-2 data-[active=true]:bg-background cursor-pointer h-full">
            <CheckCircle2 className="size-4" />
            Resueltas
            {resolvedResult.data.length > 0 && (
              <span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                {resolvedResult.data.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {activesResult.error ? (
            <Card>
              <CardHeader>
                <CardTitle>Error</CardTitle>
                <p className="text-sm text-muted-foreground">{activesResult.error}</p>
              </CardHeader>
            </Card>
          ) : activesResult.data.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                  <AlertTriangle className="size-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No hay incidencias activas</h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  Crea una incidencia cuando detectes un problema en la comunidad.
                </p>
              </CardContent>
            </Card>
          ) : (
            <IncidentsList incidents={activesResult.data} />
          )}
        </TabsContent>

        <TabsContent value="resolved" className="space-y-4">
          {resolvedResult.error ? (
            <Card>
              <CardHeader>
                <CardTitle>Error</CardTitle>
                <p className="text-sm text-muted-foreground">{resolvedResult.error}</p>
              </CardHeader>
            </Card>
          ) : resolvedResult.data.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                  <CheckCircle2 className="size-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No hay incidencias resueltas</h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  Aquí aparecerán las incidencias que ya están solucionadas.
                </p>
              </CardContent>
            </Card>
          ) : (
            <IncidentsList incidents={resolvedResult.data} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
