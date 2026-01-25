import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getPendingRequests,
  getMyRequests,
  getAcceptedRequests,
} from "./actions";
import { CreatePackageRequestDialog } from "@/components/create-package-request-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Inbox, CheckCircle } from "lucide-react";
import { PackageRequestsList } from "@/components/package-requests-list";

export default async function PaquetesPage() {
  // Verify authentication
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch all data in parallel
  const [pendingResult, myRequestsResult, acceptedResult] = await Promise.all([
    getPendingRequests(),
    getMyRequests(),
    getAcceptedRequests(),
  ]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6">
        <div className="flex items-center justify-between gap-4 mb-2">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Recogida de Paquetes</h1>
            <p className="text-muted-foreground">
              Solicita que un vecino recoja tu paquete o acepta solicitudes de otros
            </p>
          </div>
          <CreatePackageRequestDialog />
        </div>
      </div>

      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-muted/50 h-12">
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
            Mis Solicitudes
            {myRequestsResult.data.length > 0 && (
              <span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                {myRequestsResult.data.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="accepted" className="gap-2 data-[active=true]:bg-background cursor-pointer h-full">
            <CheckCircle className="size-4" />
            Aceptadas
            {acceptedResult.data.length > 0 && (
              <span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                {acceptedResult.data.length}
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
                <h3 className="text-lg font-semibold mb-2">No has creado ninguna solicitud</h3>
                <p className="text-sm text-muted-foreground text-center max-w-md">
                  Crea una solicitud para que un vecino recoja tu paquete cuando no estés en casa.
                </p>
              </CardContent>
            </Card>
          ) : (
            <PackageRequestsList
              requests={myRequestsResult.data}
              isMyRequest={true}
              emptyMessage="No has creado ninguna solicitud"
            />
          )}
        </TabsContent>

        <TabsContent value="accepted" className="space-y-4">
          {acceptedResult.error ? (
            <Card>
              <CardHeader>
                <CardTitle>Error</CardTitle>
                <CardDescription>{acceptedResult.error}</CardDescription>
              </CardHeader>
            </Card>
          ) : acceptedResult.data.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                  <CheckCircle className="size-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No hay solicitudes aceptadas</h3>
                <p className="text-sm text-muted-foreground text-center max-w-md">
                  Las solicitudes aceptadas aparecerán aquí. Solo se muestran durante 1 mes después de ser aceptadas.
                </p>
              </CardContent>
            </Card>
          ) : (
            <PackageRequestsList
              requests={acceptedResult.data}
              emptyMessage="No hay solicitudes aceptadas"
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
