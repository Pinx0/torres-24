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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Plus } from "lucide-react";
import { toast } from "sonner";
import { createIncidencia, createIncidenciaUploadUrl } from "@/app/incidencias/actions";

const MAX_IMAGES = 5;
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

interface CreateIncidentDialogProps {
  onSuccess?: () => void;
}

export function CreateIncidentDialog({ onSuccess }: CreateIncidentDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPending, startTransition] = useTransition();
  const [images, setImages] = useState<File[]>([]);

  const imageNames = useMemo(() => images.map((image) => image.name), [images]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!title.trim() || !description.trim()) {
      toast.error("Completa el título y la explicación");
      return;
    }

    if (images.length > MAX_IMAGES) {
      toast.error(`Solo puedes adjuntar hasta ${MAX_IMAGES} imágenes`);
      return;
    }

    for (const image of images) {
      if (!ALLOWED_IMAGE_TYPES.has(image.type)) {
        toast.error("Solo se permiten imágenes JPG, PNG o WebP");
        return;
      }
      if (image.size > MAX_IMAGE_SIZE) {
        toast.error("Alguna imagen supera los 10MB");
        return;
      }
    }

    startTransition(async () => {
      const uploadedImages: { path: string; mimeType: string; sizeBytes: number }[] = [];

      for (const image of images) {
        const uploadResult = await createIncidenciaUploadUrl({
          fileName: image.name,
          contentType: image.type,
          sizeBytes: image.size,
        });

        if (uploadResult.error || !uploadResult.data) {
          toast.error(uploadResult.error || "No se pudo preparar la subida");
          return;
        }

        let uploadResponse: Response;
        try {
          uploadResponse = await fetch(uploadResult.data.uploadUrl, {
            method: "PUT",
            headers: {
              "Content-Type": image.type || "application/octet-stream",
            },
            body: image,
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Error desconocido";
          toast.error(`No se pudo subir una imagen: ${message}`);
          return;
        }

        if (!uploadResponse.ok) {
          toast.error(`No se pudo subir una imagen (HTTP ${uploadResponse.status})`);
          return;
        }

        uploadedImages.push({
          path: uploadResult.data.r2Key,
          mimeType: image.type || "application/octet-stream",
          sizeBytes: image.size,
        });
      }

      const result = await createIncidencia(title.trim(), description.trim(), uploadedImages);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Incidencia creada");
        setTitle("");
        setDescription("");
        setImages([]);
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
            <div className="space-y-2">
              <Label htmlFor="incident-images">Adjuntar imágenes (opcional)</Label>
              <Input
                id="incident-images"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                multiple
                onChange={(event) => setImages(Array.from(event.target.files ?? []))}
                disabled={isPending}
              />
              {imageNames.length > 0 ? (
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>
                    {imageNames.length} imagen{imageNames.length === 1 ? "" : "es"} seleccionada
                  </p>
                  <ul className="list-disc pl-4 space-y-0.5">
                    {imageNames.map((name) => (
                      <li key={name}>{name}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <p className="text-xs text-muted-foreground">
                Hasta {MAX_IMAGES} imágenes. Máximo 10MB por imagen. JPG, PNG o WebP.
              </p>
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
