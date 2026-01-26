"use client";

import { useState, useTransition } from "react";
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
import { Car, Plus } from "lucide-react";
import { toast } from "sonner";
import { createParkingRequest } from "@/app/parking/actions";

interface CreateParkingRequestDialogProps {
  defaultPlanta?: number | null;
}

export function CreateParkingRequestDialog({ defaultPlanta }: CreateParkingRequestDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [planta, setPlanta] = useState(defaultPlanta ?? 0);
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!fechaInicio || !fechaFin) {
      toast.error("Selecciona el rango de fechas");
      return;
    }

    startTransition(async () => {
      const result = await createParkingRequest(planta, fechaInicio, fechaFin);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Solicitud creada");
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
          <Button variant="default" className="gap-2">
            <Plus className="size-4" />
            Solicitar una plaza
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary">
              <Car className="w-5 h-5" />
            </div>
            <div className="space-y-2">
              <DialogTitle>Solicitar una plaza</DialogTitle>
            </div>
          </div>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-6">
            <div className="space-y-2">
              <Label htmlFor="solicitud-planta">Planta solicitada</Label>
              <select
                id="solicitud-planta"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={planta}
                onChange={(event) => setPlanta(Number(event.target.value))}
                disabled={isPending}
                required
              >
                <option value={0}>Planta 0</option>
                <option value={-1}>Planta -1</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="solicitud-inicio">Desde cuándo</Label>
              <Input
                id="solicitud-inicio"
                type="datetime-local"
                value={fechaInicio}
                onChange={(event) => setFechaInicio(event.target.value)}
                disabled={isPending}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="solicitud-fin">Hasta cuándo</Label>
              <Input
                id="solicitud-fin"
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
            <Button type="submit" disabled={isPending}>
              {isPending ? "Solicitando..." : "Solicitar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
