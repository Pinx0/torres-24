"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, ImageIcon, Trash2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { deletePoll, finalizePoll, votePoll } from "@/app/votaciones/actions";

interface PollOptionView {
  id: string;
  texto: string | null;
  archivo_mime_type: string | null;
  download_url?: string | null;
  votos?: number;
  porcentaje?: number;
}

interface PollDetailActionsProps {
  pollId: string;
  options: PollOptionView[];
  canVote: boolean;
  hasVoted: boolean;
  selectedOptionId: string | null;
  isFinalized: boolean;
  isOwner: boolean;
  totalVotes: number;
}

export function PollDetailActions({
  pollId,
  options,
  canVote,
  hasVoted,
  selectedOptionId,
  isFinalized,
  isOwner,
  totalVotes,
}: PollDetailActionsProps) {
  const router = useRouter();
  const [choice, setChoice] = useState<string | null>(selectedOptionId);
  const [isPending, startTransition] = useTransition();
  const showResults = hasVoted || isFinalized;

  const handleVote = () => {
    if (!choice) {
      toast.error("Selecciona una opción");
      return;
    }

    startTransition(async () => {
      const result = await votePoll(pollId, choice);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Voto registrado");
      router.refresh();
    });
  };

  const handleFinalize = () => {
    if (!confirm("¿Quieres finalizar la encuesta?")) {
      return;
    }

    startTransition(async () => {
      const result = await finalizePoll(pollId);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Encuesta finalizada");
      router.refresh();
    });
  };

  const handleDelete = () => {
    if (!confirm("¿Quieres eliminar la encuesta? Esta acción no se puede deshacer.")) {
      return;
    }

    startTransition(async () => {
      const result = await deletePoll(pollId);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Encuesta eliminada");
      router.push("/votaciones");
      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {options.map((option) => {
          const isSelected = choice === option.id;
          const votes = option.votos ?? 0;
          const percentage = option.porcentaje ?? 0;
          const showImage = option.archivo_mime_type?.startsWith("image/");
          const showPdf = option.archivo_mime_type === "application/pdf";

          return (
            <Card
              key={option.id}
              className={`border-border/60 ${canVote ? "cursor-pointer hover:border-primary/50" : ""
                } ${isSelected ? "border-primary/70 ring-1 ring-primary/20" : ""}`}
              onClick={() => {
                if (canVote) {
                  setChoice(option.id);
                }
              }}
            >
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-2 flex-1">
                    {option.texto ? (
                      <p className="text-sm font-medium text-foreground">{option.texto}</p>
                    ) : null}
                    {option.download_url && showImage ? (
                      <img
                        src={option.download_url}
                        alt={option.texto || "Opción con imagen"}
                        className="rounded-lg border border-border/60 max-h-64 object-contain"
                      />
                    ) : null}
                    {option.download_url && showPdf ? (
                      <a
                        href={option.download_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-primary underline-offset-2 hover:underline"
                      >
                        <FileText className="size-4" />
                        Ver PDF adjunto
                      </a>
                    ) : null}
                    {!option.download_url && option.archivo_mime_type ? (
                      <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                        <ImageIcon className="size-4" />
                        Archivo adjunto
                      </div>
                    ) : null}
                  </div>
                  {canVote ? (
                    <div className="flex items-center">
                      <input
                        type="radio"
                        name="poll-option"
                        checked={isSelected}
                        onChange={() => setChoice(option.id)}
                        className="size-4 accent-primary"
                      />
                    </div>
                  ) : null}
                </div>

                {showResults ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{votes} voto{votes === 1 ? "" : "s"}</span>
                      <span>{percentage}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted/50 overflow-hidden">
                      <div
                        className="h-full bg-primary/70"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {showResults ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CheckCircle2 className="size-4 text-primary" />
          <span>{totalVotes} voto{totalVotes === 1 ? "" : "s"} emitidos</span>
        </div>
      ) : null}

      {canVote ? (
        <Button onClick={handleVote} disabled={!choice || isPending} className="w-full">
          {isPending ? "Registrando voto..." : "Votar"}
        </Button>
      ) : null}

      {isOwner ? (
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            onClick={handleFinalize}
            disabled={isPending || isFinalized}
            className="flex-1"
          >
            {isFinalized ? "Encuesta finalizada" : "Finalizar encuesta"}
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isPending}
            className="flex-1"
          >
            <Trash2 className="size-4" />
            Eliminar encuesta
          </Button>
        </div>
      ) : null}
    </div>
  );
}
