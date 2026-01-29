import Link from "next/link";

export default function VotacionesPage() {
  return (
    <div className="min-h-[60vh] bg-background">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="space-y-4">
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
            ← Volver al menú principal
          </Link>
        </div>
        <div className="mt-4 rounded-2xl border bg-card p-8 text-center shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-muted-foreground">
            Próximamente
          </p>
          <h1 className="mt-4 text-3xl md:text-4xl font-semibold text-foreground">
            Votaciones y sondeos para toda la comunidad
          </h1>
          <p className="mt-4 text-sm md:text-base text-muted-foreground/80">
            Muy pronto podrás votar propuestas y medir el interés de nuevas ideas
            entre todos los vecinos.
          </p>
        </div>
      </div>
    </div>
  );
}
