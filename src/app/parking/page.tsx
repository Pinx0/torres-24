import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CarFront, ClipboardList } from "lucide-react";
import { CreateParkingOfferDialog } from "@/components/create-parking-offer-dialog";
import { CreateParkingRequestDialog } from "@/components/create-parking-request-dialog";
import { getParkingOffers, getParkingRequests } from "./actions";
import { getUserPossessions } from "@/app/mis-datos/actions";
import { ParkingOffersList } from "@/components/parking-offers-list";
import { ParkingRequestsList } from "@/components/parking-requests-list";

async function getUserFamilyUnitCode() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const adminClient = createAdminClient();
  const { data: userUnidad } = await adminClient
    .from("usuarios_unidades_familiares")
    .select("unidad_familiar_codigo")
    .eq("usuario_id", user.id)
    .single();

  return userUnidad?.unidad_familiar_codigo ?? null;
}

export default async function ParkingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [offersResult, requestsResult, possessionsResult, familyCode] = await Promise.all([
    getParkingOffers(),
    getParkingRequests(),
    getUserPossessions(),
    getUserFamilyUnitCode(),
  ]);

  const garajes = possessionsResult.data?.garajes ?? [];
  const defaultPlanta = garajes[0]?.numero_planta ?? 0;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
              ← Volver al menú principal
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">ParkShare™</h1>
              <p className="text-muted-foreground">
                Comparte tu plaza o solicita una cuando la necesites.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <CreateParkingOfferDialog garajes={garajes} />
            <CreateParkingRequestDialog defaultPlanta={defaultPlanta} />
          </div>
        </div>
      </div>

      <Tabs defaultValue="requests" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 bg-muted/50 h-12">
          <TabsTrigger value="requests" className="gap-2 data-[active=true]:bg-background cursor-pointer h-full">
            <ClipboardList className="size-4" />
            Necesidades
            {requestsResult.data.length > 0 && (
              <span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                {requestsResult.data.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="offers" className="gap-2 data-[active=true]:bg-background cursor-pointer h-full">
            <CarFront className="size-4" />
            Plazas libres
            {offersResult.data.length > 0 && (
              <span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                {offersResult.data.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="space-y-4">
          {requestsResult.error ? (
            <Card>
              <CardHeader>
                <CardTitle>Error</CardTitle>
                <p className="text-sm text-muted-foreground">{requestsResult.error}</p>
              </CardHeader>
            </Card>
          ) : requestsResult.data.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                  <ClipboardList className="size-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No tienes necesidades activas</h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  Crea una solicitud cuando necesites una plaza de parking.
                </p>
              </CardContent>
            </Card>
          ) : (
            <ParkingRequestsList
              requests={requestsResult.data}
              currentFamilyCode={familyCode ?? ""}
            />
          )}
        </TabsContent>

        <TabsContent value="offers" className="space-y-4">
          {offersResult.error ? (
            <Card>
              <CardHeader>
                <CardTitle>Error</CardTitle>
                <p className="text-sm text-muted-foreground">{offersResult.error}</p>
              </CardHeader>
            </Card>
          ) : offersResult.data.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                  <CarFront className="size-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No hay plazas disponibles</h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  Ofrece tu plaza para ayudar a otros vecinos cuando no la uses.
                </p>
              </CardContent>
            </Card>
          ) : (
            <ParkingOffersList offers={offersResult.data} currentFamilyCode={familyCode ?? ""} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
