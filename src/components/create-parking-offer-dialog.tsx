"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CarFront, Plus } from "lucide-react";
import { toast } from "sonner";
import { createParkingOffer } from "@/app/parking/actions";

interface GarajeOption {
  codigo: string;
  numero_planta: number;
}

interface CreateParkingOfferDialogProps {
  garajes: GarajeOption[];
}

export function CreateParkingOfferDialog({ garajes }: CreateParkingOfferDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [garajeCodigo, setGarajeCodigo] = useState(garajes[0]?.codigo ?? "");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [isPending, startTransition] = useTransition();

  const selectedGaraje = useMemo(
    () => garajes.find((garaje) => garaje.codigo === garajeCodigo),
    [garajes, garajeCodigo]
  );

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!garajeCodigo) {
      toast.error("Selecciona una plaza de garaje");
      return;
    }

    if (!fechaInicio || !fechaFin) {
      toast.error("Selecciona el rango de fechas");
      return;
    }

    startTransition(async () => {
      const result = await createParkingOffer(garajeCodigo, fechaInicio, fechaFin);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Oferta creada");
      setFechaInicio("");
      setFechaFin("");
      setOpen(false);
      router.refresh();
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button className="gap-2 shadow-sm" variant="outline">
            <Plus className="size-4" />
            Ofertar mi plaza
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary">
              <CarFront className="w-5 h-5" />
            </div>
            <div className="space-y-2">
              <DialogTitle>Ofertar mi plaza</DialogTitle>
            </div>
          </div>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-6">
            <div className="space-y-2">
              <Label>Plaza de garaje</Label>
              {garajes.length > 1 ? (
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={garajeCodigo}
                  onChange={(event) => setGarajeCodigo(event.target.value)}
                  disabled={isPending}
                  required
                >
                  {garajes.map((garaje) => (
                    <option key={garaje.codigo} value={garaje.codigo}>
                      {garaje.codigo} · Planta {garaje.numero_planta}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="rounded-md border border-input bg-muted/30 px-3 py-2 text-sm">
                  {selectedGaraje
                    ? `${selectedGaraje.codigo} · Planta ${selectedGaraje.numero_planta}`
                    : "No tienes plazas registradas"}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="oferta-inicio">Desde cuándo</Label>
              <Input
                id="oferta-inicio"
                type="datetime-local"
                value={fechaInicio}
                onChange={(event) => setFechaInicio(event.target.value)}
                disabled={isPending}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="oferta-fin">Hasta cuándo</Label>
              <Input
                id="oferta-fin"
                type="datetime-local"
                value={fechaFin}
                onChange={(event) => setFechaFin(event.target.value)}
                disabled={isPending}
                required
              />
            </div>
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
            <Button type="submit" disabled={isPending || garajes.length === 0}>
              {isPending ? "Ofertando..." : "Ofertar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
