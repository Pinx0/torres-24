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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Package, Plus } from "lucide-react";
import { createPackageRequest } from "@/app/paquetes/actions";
import { toast } from "sonner";

interface CreatePackageRequestDialogProps {
  onSuccess?: () => void;
}

export function CreatePackageRequestDialog({
  onSuccess,
}: CreatePackageRequestDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!description.trim()) {
      toast.error("Por favor, indica cuándo llegará el paquete");
      return;
    }

    startTransition(async () => {
      const result = await createPackageRequest(description.trim());

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Solicitud creada exitosamente");
        setDescription("");
        setOpen(false);
        router.refresh();
        onSuccess?.();
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button className="gap-2 shadow-sm">
            <Plus className="size-4" />
            Solicitar recogida
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary">
              <Package className="w-5 h-5" />
            </div>
            <div className="space-y-2">
              <DialogTitle>Solicitar recogida de paquete</DialogTitle>
            </div>
          </div>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-6">
            <div className="space-y-2">
              <Label htmlFor="description">Cuándo llegará</Label>
              <Textarea
                id="description"
                placeholder="Ej: Llegará el lunes por la tarde, el martes en la mañana, el 15 de febrero..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
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
            <Button type="submit" disabled={isPending || !description.trim()}>
              {isPending ? "Solicitando..." : "Solicitar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
