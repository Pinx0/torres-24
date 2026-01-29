import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getPendingRequests,
  getMyRequests,
} from "./actions";
import { CreatePackageRequestDialog } from "@/components/create-package-request-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Inbox } from "lucide-react";
import { PackageRequestsList } from "@/components/package-requests-list";

export default async function PaquetesPage() {
  // Verify authentication
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch all data in parallel
  const [pendingResult, myRequestsResult] = await Promise.all([
    getPendingRequests(),
    getMyRequests(),
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
              <h1 className="text-3xl font-bold text-foreground mb-2">Recogida de paquetes</h1>
              <p className="text-muted-foreground">
                Solicita que un vecino recoja tu paquete o ayuda a otros vecinos a recoger sus paquetes.
              </p>
            </div>
          </div>
          <CreatePackageRequestDialog />
        </div>
      </div>

      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 bg-muted/50 h-12">
          <TabsTrigger value="pending" className="gap-2 data-[active=true]:bg-background cursor-pointer h-full">
            <Inbox className="size-4" />
            Pendientes
            {pendingResult.data.length > 0 && (
              <span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                {pendingResult.data.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="my-requests" className="gap-2 data-[active=true]:bg-background cursor-pointer h-full">
            <Package className="size-4" />
            Mis solicitudes
            {myRequestsResult.data.length > 0 && (
              <span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                {myRequestsResult.data.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingResult.error ? (
            <Card>
              <CardHeader>
                <CardTitle>Error</CardTitle>
                <CardDescription>{pendingResult.error}</CardDescription>
              </CardHeader>
            </Card>
          ) : pendingResult.data.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                  <Inbox className="size-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No hay solicitudes pendientes</h3>
                <p className="text-sm text-muted-foreground text-center max-w-md">
                  No hay solicitudes de recogida de paquetes disponibles en este momento.
                </p>
              </CardContent>
            </Card>
          ) : (
            <PackageRequestsList
              requests={pendingResult.data}
              showActions={true}
              emptyMessage="No hay solicitudes pendientes"
            />
          )}
        </TabsContent>

        <TabsContent value="my-requests" className="space-y-4">
          {myRequestsResult.error ? (
            <Card>
              <CardHeader>
                <CardTitle>Error</CardTitle>
                <CardDescription>{myRequestsResult.error}</CardDescription>
              </CardHeader>
            </Card>
          ) : myRequestsResult.data.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                  <Package className="size-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No tienes solicitudes relacionadas</h3>
                <p className="text-sm text-muted-foreground text-center max-w-md">
                  Aquí verás las solicitudes que has creado y las que has aceptado recoger.
                </p>
              </CardContent>
            </Card>
          ) : (
            <PackageRequestsList
              requests={myRequestsResult.data}
              emptyMessage="No tienes solicitudes relacionadas"
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
