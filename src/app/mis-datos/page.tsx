import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserPossessions } from "./actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!possessions) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Mis Datos</CardTitle>
            <CardDescription>No se encontraron datos disponibles.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">Mis Datos</h1>
        <p className="text-muted-foreground">
          Consulta tus posesiones y sus porcentajes de participación
        </p>
      </div>

      <div className="space-y-6">
        {/* Vivienda Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary">
                <Home className="w-5 h-5" />
              </div>
              <div>
                <CardTitle>Vivienda</CardTitle>
                <CardDescription>Tu vivienda principal</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {possessions.vivienda ? (
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-semibold text-foreground">{possessions.vivienda.codigo}</p>
                  <p className="text-sm text-muted-foreground">Código</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-foreground">
                    {possessions.vivienda.porcentaje_participacion.toFixed(2)}%
                  </p>
                  <p className="text-sm text-muted-foreground">Cuota</p>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">No hay vivienda asociada</p>
            )}
          </CardContent>
        </Card>

        {/* Garajes Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary">
                <Car className="w-5 h-5" />
              </div>
              <div>
                <CardTitle>Garajes</CardTitle>
                <CardDescription>
                  {possessions.garajes.length === 0
                    ? "No tienes garajes asociados"
                    : `${possessions.garajes.length} garaje${possessions.garajes.length > 1 ? "s" : ""}`}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {possessions.garajes.length > 0 ? (
              <div className="space-y-3">
                {possessions.garajes.map((garaje) => (
                  <div
                    key={garaje.codigo}
                    className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                  >
                    <div>
                      <p className="font-semibold text-foreground">{garaje.codigo}</p>
                      <p className="text-sm text-muted-foreground">Código</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground">
                        {garaje.porcentaje_participacion.toFixed(2)}%
                      </p>
                      <p className="text-sm text-muted-foreground">Cuota</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No hay garajes asociados</p>
            )}
          </CardContent>
        </Card>

        {/* Trasteros Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <CardTitle>Trasteros</CardTitle>
                <CardDescription>
                  {possessions.trasteros.length === 0
                    ? "No tienes trasteros asociados"
                    : `${possessions.trasteros.length} trastero${possessions.trasteros.length > 1 ? "s" : ""}`}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {possessions.trasteros.length > 0 ? (
              <div className="space-y-3">
                {possessions.trasteros.map((trastero) => (
                  <div
                    key={trastero.codigo}
                    className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                  >
                    <div>
                      <p className="font-semibold text-foreground">{trastero.codigo}</p>
                      <p className="text-sm text-muted-foreground">Código</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground">
                        {trastero.porcentaje_participacion.toFixed(2)}%
                      </p>
                      <p className="text-sm text-muted-foreground">Cuota</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No hay trasteros asociados</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
