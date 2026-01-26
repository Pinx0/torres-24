"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { createIncidenciaComentario, updateIncidenciaEstado } from "@/app/incidencias/actions";

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

  const handleCommentSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!comment.trim()) {
      toast.error("Escribe un comentario antes de enviar");
      return;
    }

    setIsSubmitting(true);
    startTransition(async () => {
      const result = await createIncidenciaComentario(incidentId, comment.trim());

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Comentario enviado");
        setComment("");
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
      <Button type="submit" disabled={isPending || isSubmitting || !comment.trim()}>
        {isSubmitting ? "Enviando..." : "Comentar"}
      </Button>
    </form>
  );
}
