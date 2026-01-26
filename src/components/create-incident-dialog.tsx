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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Plus } from "lucide-react";
import { toast } from "sonner";
import { createIncidencia } from "@/app/incidencias/actions";

interface CreateIncidentDialogProps {
  onSuccess?: () => void;
}

export function CreateIncidentDialog({ onSuccess }: CreateIncidentDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!title.trim() || !description.trim()) {
      toast.error("Completa el título y la explicación");
      return;
    }

    startTransition(async () => {
      const result = await createIncidencia(title.trim(), description.trim());

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Incidencia creada");
        setTitle("");
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
            Reportar incidencia
          </Button>
        }
      />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="space-y-2">
              <DialogTitle>Reportar incidencia</DialogTitle>
            </div>
          </div>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-6">
            <div className="space-y-2">
              <Label htmlFor="incident-title">Título</Label>
              <Input
                id="incident-title"
                placeholder="Ej: Luz del portal fundida"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                disabled={isPending}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="incident-description">Explicación</Label>
              <Textarea
                id="incident-description"
                placeholder="Describe el problema con el mayor detalle posible..."
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={5}
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
            <Button type="submit" disabled={isPending || !title.trim() || !description.trim()}>
              {isPending ? "Reportando..." : "Reportar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
