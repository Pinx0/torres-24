import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Vote } from "lucide-react";
import { getActivePolls } from "./actions";
import { CreatePollDialog } from "@/components/create-poll-dialog";
import { PollCard } from "@/components/poll-card";

export default async function VotacionesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const pollsResult = await getActivePolls();

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
              ← Volver al menú principal
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Votaciones</h1>
              <p className="text-muted-foreground">
                Participa en encuestas y decide las próximas mejoras de la comunidad.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <CreatePollDialog />
          </div>
        </div>
      </div>

      {pollsResult.error ? (
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <p className="text-sm text-muted-foreground">{pollsResult.error}</p>
          </CardHeader>
        </Card>
      ) : pollsResult.data.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
              <Vote className="size-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No hay encuestas activas</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Crea la primera encuesta para conocer la opinión de la comunidad.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {pollsResult.data.map((poll) => (
            <PollCard
              key={poll.id}
              id={poll.id}
              titulo={poll.titulo}
              descripcion={poll.descripcion}
              estado={poll.estado}
              created_at={poll.created_at}
              finalized_at={poll.finalized_at}
              opciones_count={poll.opciones_count}
              votos_count={poll.votos_count}
              isOwner={poll.autor_usuario_id === user.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
