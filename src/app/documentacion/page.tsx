import Link from "next/link";
import { redirect } from "next/navigation";
import { SearchX } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { listDocumentos } from "./actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateDocumentDialog } from "@/components/create-document-dialog";
import { DocumentFilters } from "@/components/document-filters";
import { DocumentsList } from "@/components/documents-list";

export const dynamic = "force-dynamic";

interface DocumentacionPageProps {
  searchParams?: {
    q?: string;
    tipo?: string;
    orderBy?: string;
    orderDir?: string;
  };
}

export default async function DocumentacionPage({ searchParams }: DocumentacionPageProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const orderBy = searchParams?.orderBy === "titulo" ? "titulo" : "fecha";
  const orderDir = searchParams?.orderDir === "asc" ? "asc" : "desc";
  const paramsKey = new URLSearchParams(
    Object.entries(searchParams ?? {}).filter(([, value]) => typeof value === "string")
  ).toString();

  const documentosResult = await listDocumentos({
    search: searchParams?.q,
    tipo: searchParams?.tipo,
    orderBy,
    orderDir,
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
            ← Volver al menú principal
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Documentación</h1>
            <p className="text-muted-foreground">
              Accede a actas, contratos y documentación oficial de la comunidad.
            </p>
          </div>
        </div>
        <CreateDocumentDialog />
      </div>

      <DocumentFilters key={paramsKey} />

      {documentosResult.error ? (
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <p className="text-sm text-muted-foreground">{documentosResult.error}</p>
          </CardHeader>
        </Card>
      ) : documentosResult.data.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
              <SearchX className="size-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No hay documentos disponibles</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Sube actas, contratos o cualquier documento importante para empezar.
            </p>
          </CardContent>
        </Card>
      ) : (
        <DocumentsList documents={documentosResult.data} />
      )}


    </div>
  );
}
