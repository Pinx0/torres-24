import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BadgeCheck, Vote } from "lucide-react";
import { getPollDetail } from "../actions";
import { PollDetailActions } from "@/components/poll-detail-actions";

interface PollDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function PollDetailPage({ params }: PollDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const pollResult = await getPollDetail(id);

  if (pollResult.error || !pollResult.data) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link href="/votaciones" className="text-sm text-muted-foreground hover:text-foreground">
          ← Volver a votaciones
        </Link>
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <p className="text-sm text-muted-foreground">
              {pollResult.error || "No se pudo cargar la encuesta"}
            </p>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const { encuesta, opciones, hasVoted, selectedOptionId, isCreator, totalVotos } =
    pollResult.data;
  const isFinalized = encuesta.estado === "finalizada";
  const canVote = encuesta.estado === "activa" && !hasVoted;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="space-y-3">
        <Link href="/votaciones" className="text-sm text-muted-foreground hover:text-foreground">
          ← Volver a votaciones
        </Link>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground">{encuesta.titulo}</h1>
            {encuesta.descripcion ? (
              <p className="text-muted-foreground">{encuesta.descripcion}</p>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${isFinalized
                ? "bg-blue-500/10 text-blue-600 dark:text-blue-500"
                : "bg-green-500/10 text-green-600 dark:text-green-500"
                }`}
            >
              {isFinalized ? "Finalizada" : "Activa"}
            </span>
            {isCreator ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                <BadgeCheck className="size-3" />
                Tu encuesta
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <Card className="border-border/60">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Vote className="size-4 text-primary" />
            <CardTitle className="text-base">
              {canVote ? "Selecciona una opción" : "Resultados"}
            </CardTitle>
          </div>
          {canVote ? (
            <p className="text-sm text-muted-foreground">
              Tu unidad familiar solo puede votar una vez.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Resultados provisionales según los votos emitidos.
            </p>
          )}
        </CardHeader>
        <CardContent>
          <PollDetailActions
            pollId={encuesta.id}
            options={opciones}
            canVote={canVote}
            hasVoted={hasVoted}
            selectedOptionId={selectedOptionId}
            isFinalized={isFinalized}
            isOwner={isCreator}
            totalVotes={totalVotos}
          />
        </CardContent>
      </Card>
    </div>
  );
}
