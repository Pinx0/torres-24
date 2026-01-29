import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { listGastos } from "./actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GastosViewer } from "@/components/gastos-viewer";

export default async function GastosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const gastosResult = await listGastos();

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="space-y-2">
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
          ← Volver al menú principal
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Visor de gastos</h1>
          <p className="text-muted-foreground">
            Analiza los gastos de la comunidad por categoría y periodicidad.
          </p>
        </div>
      </div>

      {gastosResult.error ? (
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <p className="text-sm text-muted-foreground">{gastosResult.error}</p>
          </CardHeader>
        </Card>
      ) : !gastosResult.data || gastosResult.data.gastos.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <h3 className="text-lg font-semibold mb-2">No hay gastos registrados</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Cuando se registren gastos, aquí podrás verlos agrupados por categoría y periodo.
            </p>
          </CardContent>
        </Card>
      ) : (
        <GastosViewer gastos={gastosResult.data.gastos} participacion={gastosResult.data.participacion} />
      )}
    </div>
  );
}
