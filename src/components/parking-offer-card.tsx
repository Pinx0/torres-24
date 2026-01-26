"use client";

import { useEffect, useState, useTransition } from "react";
import { motion } from "framer-motion";
import { CarFront, Check, X } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale/es";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ParkingOffer, acceptParkingOffer, cancelParkingOffer } from "@/app/parking/actions";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ParkingOfferCardProps {
  offer: ParkingOffer;
  isMyOffer: boolean;
}

export function ParkingOfferCard({ offer, isMyOffer }: ParkingOfferCardProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [isPending, startTransition] = useTransition();
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    if (open) {
      const start = new Date(offer.fecha_inicio);
      const end = new Date(offer.fecha_fin);
      setFechaInicio(format(start, "yyyy-MM-dd'T'HH:mm"));
      setFechaFin(format(end, "yyyy-MM-dd'T'HH:mm"));
    }
  }, [open, offer.fecha_inicio, offer.fecha_fin]);

  const handleAccept = () => {
    if (!fechaInicio || !fechaFin) {
      toast.error("Selecciona el rango de fechas");
      return;
    }

    startTransition(async () => {
      const result = await acceptParkingOffer(offer.id, fechaInicio, fechaFin);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Oferta aceptada");
      setOpen(false);
      router.refresh();
    });
  };

  const handleCancel = () => {
    setIsCancelling(true);
    startTransition(async () => {
      const result = await cancelParkingOffer(offer.id);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Oferta retirada");
        router.refresh();
      }
      setIsCancelling(false);
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
                <CarFront className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-base mb-1">
                  Plaza {offer.garaje_codigo}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Planta {offer.numero_planta ?? "N/D"}
                </p>
              </div>
            </div>
            {isMyOffer ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                Tu oferta
              </span>
            ) : null}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">
              {format(new Date(offer.fecha_inicio), "PPpp", { locale: es })} -{" "}
              {format(new Date(offer.fecha_fin), "PPpp", { locale: es })}
            </div>

            {!isMyOffer && (
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger
                  render={
                    <Button className="w-full gap-2">
                      <Check className="size-4" />
                      Aceptar oferta
                    </Button>
                  }
                />
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Selecciona el tramo</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-2">
                    <div className="space-y-2">
                      <Label htmlFor={`aceptar-inicio-${offer.id}`}>Desde cuándo</Label>
                      <Input
                        id={`aceptar-inicio-${offer.id}`}
                        type="datetime-local"
                        min={format(new Date(offer.fecha_inicio), "yyyy-MM-dd'T'HH:mm")}
                        max={format(new Date(offer.fecha_fin), "yyyy-MM-dd'T'HH:mm")}
                        value={fechaInicio}
                        onChange={(event) => setFechaInicio(event.target.value)}
                        disabled={isPending}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`aceptar-fin-${offer.id}`}>Hasta cuándo</Label>
                      <Input
                        id={`aceptar-fin-${offer.id}`}
                        type="datetime-local"
                        min={format(new Date(offer.fecha_inicio), "yyyy-MM-dd'T'HH:mm")}
                        max={format(new Date(offer.fecha_fin), "yyyy-MM-dd'T'HH:mm")}
                        value={fechaFin}
                        onChange={(event) => setFechaFin(event.target.value)}
                        disabled={isPending}
                        required
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Si eliges un tramo parcial, la oferta se partirá y solo se mantendrán
                      tramos libres de 4h o más.
                    </p>
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setOpen(false)}
                      disabled={isPending}
                    >
                      Cancelar
                    </Button>
                    <Button onClick={handleAccept} disabled={isPending}>
                      {isPending ? "Aceptando..." : "Aceptar"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}

            {isMyOffer && offer.estado === "activa" ? (
              <Button
                variant="destructive"
                className="w-full gap-2"
                onClick={handleCancel}
                disabled={isPending || isCancelling}
              >
                <X className="size-4" />
                {isPending || isCancelling ? "Retirando..." : "Retirar oferta"}
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
