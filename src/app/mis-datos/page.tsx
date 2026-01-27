import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserPossessions } from "./actions";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { PossessionSubcard } from "@/components/possession-subcard";
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

  const totalParticipacion = [
    possessions.vivienda?.porcentaje_participacion ?? 0,
    ...possessions.garajes.map((garaje) => garaje.porcentaje_participacion),
    ...possessions.trasteros.map((trastero) => trastero.porcentaje_participacion),
  ].reduce((acc, value) => acc + value, 0);

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

      <div className="mb-4 border-b border-border/60 bg-transparent px-4 pb-4 text-right">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Total cuota de participacion
        </p>
        <p className="mt-2 text-2xl font-semibold text-foreground">
          {totalParticipacion.toFixed(2)}%
        </p>
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
                <PossessionSubcard
                  columns={6}
                  items={[
                    {
                      label: "Codigo",
                      value: possessions.vivienda.codigo,
                      prominent: true,
                      fullSpan: true,
                    },
                    {
                      label: "Escalera",
                      value: possessions.vivienda.escalera,
                    },
                    {
                      label: "Planta",
                      value: possessions.vivienda.numero_planta,
                    },
                    {
                      label: "Sup. util",
                      value: `${possessions.vivienda.superficie_util.toFixed(2)} m2`,
                    },
                    {
                      label: "Sup. construida",
                      value: `${possessions.vivienda.superficie_construida.toFixed(2)} m2`,
                    },
                    {
                      label: "Cuota",
                      value: `${possessions.vivienda.porcentaje_participacion.toFixed(2)}%`,
                      prominent: true,
                      align: "right",
                    },
                  ]}
                />
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
                  <PossessionSubcard
                    key={garaje.codigo}
                    columns={5}
                    items={[
                      {
                        label: "Codigo",
                        value: garaje.codigo,
                        prominent: true,
                        fullSpan: true,
                      },
                      {
                        label: "Planta",
                        value: garaje.numero_planta,
                      },
                      {
                        label: "Sup. util",
                        value: `${garaje.superficie_util.toFixed(2)} m2`,
                      },
                      {
                        label: "Sup. construida",
                        value: `${garaje.superficie_construida.toFixed(2)} m2`,
                      },
                      {
                        label: "Cuota",
                        value: `${garaje.porcentaje_participacion.toFixed(2)}%`,
                        prominent: true,
                        align: "right",
                      },
                    ]}
                  />
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
                  <PossessionSubcard
                    key={trastero.codigo}
                    columns={5}
                    items={[
                      {
                        label: "Codigo",
                        value: trastero.codigo,
                        prominent: true,
                        fullSpan: true,
                      },
                      {
                        label: "Planta",
                        value: trastero.numero_planta,
                      },
                      {
                        label: "Sup. util",
                        value: `${trastero.superficie_util.toFixed(2)} m2`,
                      },
                      {
                        label: "Sup. construida",
                        value: `${trastero.superficie_construida.toFixed(2)} m2`,
                      },
                      {
                        label: "Cuota",
                        value: `${trastero.porcentaje_participacion.toFixed(2)}%`,
                        prominent: true,
                        align: "right",
                      },
                    ]}
                  />
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
