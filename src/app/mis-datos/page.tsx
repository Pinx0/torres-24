import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserPossessions } from "./actions";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Home, Car, Package } from "lucide-react";

export default async function MisDatosPage() {
  // Verify authentication
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user possessions
  const { data: possessions, error } = await getUserPossessions();

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card className="border border-border/50 bg-card shadow-sm">
          <CardContent className="p-4">
            <h2 className="font-semibold text-foreground mb-2">Error</h2>
            <p className="text-sm text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!possessions) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card className="border border-border/50 bg-card shadow-sm">
          <CardContent className="p-4">
            <h2 className="font-semibold text-foreground mb-2">Mis datos</h2>
            <p className="text-sm text-muted-foreground">No se encontraron datos disponibles.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6 space-y-2">
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
          ← Volver al menú principal
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Mis datos</h1>
          <p className="text-muted-foreground">
            Consulta tus posesiones y sus porcentajes de participación
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {/* Vivienda Section */}
        <Card className="border border-border/50 bg-card shadow-sm">
          <CardContent>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary shrink-0">
                <Home className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Vivienda</h3>
                {possessions.vivienda && (
                  <p className="text-xs text-muted-foreground">
                    1 vivienda
                  </p>
                )}
              </div>
            </div>
            {possessions.vivienda ? (
              <div className="space-y-1.5 pl-10">
                <div className="p-2.5 bg-muted/50 rounded-lg border border-border/50">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-sm font-medium text-foreground">{possessions.vivienda.codigo}</p>
                    <p className="text-sm font-medium text-foreground">
                      {possessions.vivienda.porcentaje_participacion.toFixed(2)}%
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                    <span>Escalera: {possessions.vivienda.escalera}</span>
                    <span>Planta: {possessions.vivienda.numero_planta}</span>
                    <span>Sup. util: {possessions.vivienda.superficie_util.toFixed(2)} m2</span>
                    <span>Sup. construida: {possessions.vivienda.superficie_construida.toFixed(2)} m2</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground pl-10">No hay vivienda asociada</p>
            )}
          </CardContent>
        </Card>

        {/* Garajes Section */}
        <Card className="border border-border/50 bg-card shadow-sm">
          <CardContent>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary shrink-0">
                <Car className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Garajes</h3>
                {possessions.garajes.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {possessions.garajes.length} garaje{possessions.garajes.length > 1 ? "s" : ""}
                  </p>
                )}
              </div>
            </div>
            {possessions.garajes.length > 0 ? (
              <div className="space-y-1.5 pl-10">
                {possessions.garajes.map((garaje) => (
                  <div
                    key={garaje.codigo}
                    className="p-2.5 bg-muted/50 rounded-lg border border-border/50"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-sm font-medium text-foreground">{garaje.codigo}</p>
                      <p className="text-sm font-medium text-foreground">
                        {garaje.porcentaje_participacion.toFixed(2)}%
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                      <span>Planta: {garaje.numero_planta}</span>
                      <span>Sup. util: {garaje.superficie_util.toFixed(2)} m2</span>
                      <span>Sup. construida: {garaje.superficie_construida.toFixed(2)} m2</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground pl-10">No hay garajes asociados</p>
            )}
          </CardContent>
        </Card>

        {/* Trasteros Section */}
        <Card className="border border-border/50 bg-card shadow-sm">
          <CardContent>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary shrink-0">
                <Package className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Trasteros</h3>
                {possessions.trasteros.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {possessions.trasteros.length} trastero{possessions.trasteros.length > 1 ? "s" : ""}
                  </p>
                )}
              </div>
            </div>
            {possessions.trasteros.length > 0 ? (
              <div className="space-y-1.5 pl-10">
                {possessions.trasteros.map((trastero) => (
                  <div
                    key={trastero.codigo}
                    className="p-2.5 bg-muted/50 rounded-lg border border-border/50"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-sm font-medium text-foreground">{trastero.codigo}</p>
                      <p className="text-sm font-medium text-foreground">
                        {trastero.porcentaje_participacion.toFixed(2)}%
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                      <span>Planta: {trastero.numero_planta}</span>
                      <span>Sup. util: {trastero.superficie_util.toFixed(2)} m2</span>
                      <span>Sup. construida: {trastero.superficie_construida.toFixed(2)} m2</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground pl-10">No hay trasteros asociados</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
