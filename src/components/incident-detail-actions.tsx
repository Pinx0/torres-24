"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  createIncidenciaComentario,
  createIncidenciaUploadUrl,
  updateIncidenciaEstado,
} from "@/app/incidencias/actions";

const MAX_IMAGES = 5;
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

interface IncidentResolveButtonProps {
  incidentId: string;
  isResolved: boolean;
  canResolve: boolean;
}

interface IncidentCommentFormProps {
  incidentId: string;
}

export function IncidentResolveButton({
  incidentId,
  isResolved,
  canResolve,
}: IncidentResolveButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [actionType, setActionType] = useState<"resolve" | null>(null);

  const handleToggleResolve = () => {
    if (!canResolve) {
      return;
    }

    setActionType("resolve");
    startTransition(async () => {
      const result = await updateIncidenciaEstado(incidentId, isResolved ? "activa" : "resuelta");

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(isResolved ? "Incidencia marcada como no resuelta" : "Incidencia marcada como resuelta");
        router.refresh();
      }
      setActionType(null);
    });
  };

  if (!canResolve) {
    return null;
  }

  return (
    <Button
      variant={isResolved ? "outline" : "default"}
      onClick={handleToggleResolve}
      disabled={isPending}
    >
      {actionType === "resolve" && isPending
        ? "Actualizando..."
        : isResolved
          ? "Marcar como no resuelta"
          : "Marcar como resuelta"}
    </Button>
  );
}

export function IncidentCommentForm({ incidentId }: IncidentCommentFormProps) {
  const router = useRouter();
  const [comment, setComment] = useState("");
  const [isPending, startTransition] = useTransition();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [images, setImages] = useState<File[]>([]);

  const imageNames = useMemo(() => images.map((image) => image.name), [images]);

  const handleCommentSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!comment.trim()) {
      toast.error("Escribe un comentario antes de enviar");
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

    setIsSubmitting(true);
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
          setIsSubmitting(false);
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
          setIsSubmitting(false);
          return;
        }

        if (!uploadResponse.ok) {
          toast.error(`No se pudo subir una imagen (HTTP ${uploadResponse.status})`);
          setIsSubmitting(false);
          return;
        }

        uploadedImages.push({
          path: uploadResult.data.r2Key,
          mimeType: image.type || "application/octet-stream",
          sizeBytes: image.size,
        });
      }

      const result = await createIncidenciaComentario(incidentId, comment.trim(), uploadedImages);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Comentario enviado");
        setComment("");
        setImages([]);
        router.refresh();
      }
      setIsSubmitting(false);
    });
  };

  return (
    <form onSubmit={handleCommentSubmit} className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="incident-comment">Añadir comentario</Label>
        <Textarea
          id="incident-comment"
          placeholder="Comparte avances, detalles o soluciones..."
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          rows={4}
          disabled={isPending}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="incident-comment-images">Adjuntar imágenes (opcional)</Label>
        <input
          id="incident-comment-images"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          multiple
          onChange={(event) => setImages(Array.from(event.target.files ?? []))}
          disabled={isPending}
          className="block w-full text-sm text-muted-foreground file:mr-4 file:rounded-md file:border-0 file:bg-muted file:px-4 file:py-2 file:text-sm file:font-medium file:text-foreground hover:file:bg-muted/80"
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
      <Button type="submit" disabled={isPending || isSubmitting || !comment.trim()}>
        {isSubmitting ? "Enviando..." : "Comentar"}
      </Button>
    </form>
  );
}
