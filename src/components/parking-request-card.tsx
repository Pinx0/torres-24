"use client";

import { motion } from "framer-motion";
import { CalendarClock, CarFront, User, X } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale/es";
import {
  ParkingRequest,
  cancelParkingOffer,
  cancelParkingRequest,
  offerParkingForRequest,
} from "@/app/parking/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Garaje } from "@/app/mis-datos/actions";

interface ParkingRequestCardProps {
  request: ParkingRequest;
  isMyRequest: boolean;
  currentFamilyCode: string;
  garajes: Garaje[];
}

export function ParkingRequestCard({
  request,
  isMyRequest,
  currentFamilyCode,
  garajes,
}: ParkingRequestCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isCancelling, setIsCancelling] = useState(false);
  const [isOfferCancelling, setIsOfferCancelling] = useState(false);
  const [offerOpen, setOfferOpen] = useState(false);
  const [garajeCodigo, setGarajeCodigo] = useState("");
  const solicitanteLabel = request.solicitante_unidad_familiar_codigo;
  const matchingGarajes = garajes.filter(
    (garaje) => garaje.numero_planta === request.planta_solicitada,
  );
  const canOffer =
    !isMyRequest &&
    request.estado === "pendiente" &&
    matchingGarajes.length > 0;
  const formattedInicio = format(new Date(request.fecha_inicio), "yyyy-MM-dd'T'HH:mm");
  const formattedFin = format(new Date(request.fecha_fin), "yyyy-MM-dd'T'HH:mm");
  const hasOfferDetails =
    request.estado === "aceptada" &&
    (request.oferta_garaje_codigo || request.oferta_unidad_familiar_codigo);
  const isOfferOwner =
    request.estado === "aceptada" &&
    Boolean(request.oferta_id) &&
    request.oferta_unidad_familiar_codigo === currentFamilyCode;

  const statusBadge = (() => {
    switch (request.estado) {
      case "pendiente":
        return (
          <span className="inline-flex items-center rounded-full bg-yellow-500/10 px-2.5 py-1 text-xs font-medium text-yellow-600 dark:text-yellow-500">
            Pendiente
          </span>
        );
      case "aceptada":
        return (
          <span className="inline-flex items-center rounded-full bg-green-500/10 px-2.5 py-1 text-xs font-medium text-green-600 dark:text-green-500">
            Aceptada
          </span>
        );
      case "cancelada":
        return (
          <span className="inline-flex items-center rounded-full bg-rose-500/10 px-2.5 py-1 text-xs font-medium text-rose-600 dark:text-rose-500">
            Cancelada
          </span>
        );
      default:
        return null;
    }
  })();

  const handleCancel = () => {
    setIsCancelling(true);
    startTransition(async () => {
      const result = await cancelParkingRequest(request.id);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Solicitud cancelada");
        router.refresh();
      }
      setIsCancelling(false);
    });
  };

  const handleOfferCancel = () => {
    if (!request.oferta_id) {
      toast.error("No hay oferta asociada");
      return;
    }

    setIsOfferCancelling(true);
    startTransition(async () => {
      const result = await cancelParkingOffer(request.oferta_id!);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Oferta cancelada");
        router.refresh();
      }
      setIsOfferCancelling(false);
    });
  };

  const handleOffer = () => {
    if (!garajeCodigo) {
      toast.error("Selecciona una plaza de garaje");
      return;
    }

    startTransition(async () => {
      const result = await offerParkingForRequest(request.id, garajeCodigo);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Plaza ofertada");
      setOfferOpen(false);
      router.refresh();
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      whileHover={{ y: -2 }}
    >
      <Card className="hover:shadow-lg transition-all duration-200 border-border/50">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary shrink-0">
                <CalendarClock className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-base mb-1">Necesidad de plaza</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Planta solicitada: {request.planta_solicitada}
                </p>
              </div>
            </div>
            {statusBadge}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="size-4" />
              <span>
                {isMyRequest ? "Solicitado por ti" : `Solicitado por: ${solicitanteLabel}`}
              </span>
            </div>
            <div className="text-sm text-muted-foreground">
              {format(new Date(request.fecha_inicio), "PPpp", { locale: es })} -{" "}
              {format(new Date(request.fecha_fin), "PPpp", { locale: es })}
            </div>

            {hasOfferDetails ? (
              <div className="space-y-2 rounded-lg border border-border/60 bg-muted/20 p-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CarFront className="size-4" />
                  <span>
                    Plaza concedida: {request.oferta_garaje_codigo ?? "N/D"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="size-4" />
                  <span>
                    Ofertada por: {request.oferta_unidad_familiar_codigo ?? "N/D"}
                  </span>
                </div>
              </div>
            ) : null}

            {canOffer ? (
              <Dialog
                open={offerOpen}
                onOpenChange={(nextOpen) => {
                  setOfferOpen(nextOpen);
                  if (nextOpen) {
                    setGarajeCodigo(matchingGarajes[0]?.codigo ?? "");
                  }
                }}
              >
                <DialogTrigger
                  render={
                    <Button className="w-full gap-2">
                      <CarFront className="size-4" />
                      Ofrecer mi plaza
                    </Button>
                  }
                />
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Ofrecer mi plaza</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-2">
                    <div className="space-y-2">
                      <Label>Plaza a ofertar</Label>
                      {matchingGarajes.length > 1 ? (
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                          value={garajeCodigo}
                          onChange={(event) => setGarajeCodigo(event.target.value)}
                          disabled={isPending}
                          required
                        >
                          {matchingGarajes.map((garaje) => (
                            <option key={garaje.codigo} value={garaje.codigo}>
                              {garaje.codigo} · Planta {garaje.numero_planta}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="rounded-md border border-input bg-muted/30 px-3 py-2 text-sm">
                          {matchingGarajes[0]
                            ? `${matchingGarajes[0].codigo} · Planta ${matchingGarajes[0].numero_planta}`
                            : "No tienes plazas en esta planta"}
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`oferta-inicio-${request.id}`}>Desde cuándo</Label>
                      <Input
                        id={`oferta-inicio-${request.id}`}
                        type="datetime-local"
                        value={formattedInicio}
                        readOnly
                        disabled
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`oferta-fin-${request.id}`}>Hasta cuándo</Label>
                      <Input
                        id={`oferta-fin-${request.id}`}
                        type="datetime-local"
                        value={formattedFin}
                        readOnly
                        disabled
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setOfferOpen(false)}
                      disabled={isPending}
                    >
                      Cancelar
                    </Button>
                    <Button onClick={handleOffer} disabled={isPending || !garajeCodigo}>
                      {isPending ? "Ofertando..." : "Confirmar oferta"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            ) : null}

            {isMyRequest && request.estado !== "cancelada" ? (
              <Button
                variant="destructive"
                className="w-full gap-2"
                onClick={handleCancel}
                disabled={isPending || isCancelling}
              >
                <X className="size-4" />
                {isPending || isCancelling ? "Cancelando..." : "Cancelar solicitud"}
              </Button>
            ) : null}

            {isOfferOwner ? (
              <Button
                variant="destructive"
                className="w-full gap-2"
                onClick={handleOfferCancel}
                disabled={isPending || isOfferCancelling}
              >
                <X className="size-4" />
                {isPending || isOfferCancelling ? "Cancelando..." : "Retirar oferta"}
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
