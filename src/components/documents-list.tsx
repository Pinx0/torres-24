"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale/es";
import { Calendar, Download, FileText, Tag } from "lucide-react";

import { DOCUMENT_TYPE_LABELS } from "@/lib/document-types";
import type { Documento } from "@/app/documentacion/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function formatBytes(bytes: number) {
  if (!bytes || Number.isNaN(bytes)) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, index);
  return `${value.toFixed(value < 10 && index > 0 ? 1 : 0)} ${units[index]}`;
}

function formatDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Fecha desconocida";
  return format(date, "PPP", { locale: es });
}

interface DocumentsListProps {
  documents: Documento[];
}

export function DocumentsList({ documents }: DocumentsListProps) {
  return (
    <div className="grid gap-4">
      {documents.map((doc) => (
        <Card key={doc.id}>
          <CardHeader className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg">{doc.titulo}</CardTitle>
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2 py-0.5">
                  <Tag className="size-3.5" />
                  {DOCUMENT_TYPE_LABELS[doc.tipo]}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <FileText className="size-4" />
                  {formatBytes(doc.size_bytes)}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="size-4" />
                  {formatDate(doc.created_at)}
                </span>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                if (doc.download_url) {
                  window.open(doc.download_url, "_blank", "noopener,noreferrer");
                }
              }}
              disabled={!doc.download_url}
            >
              <Download className="size-4" />
              Descargar
            </Button>
          </CardHeader>
          {doc.descripcion && (
            <CardContent>
              <p className="text-sm text-foreground/80">{doc.descripcion}</p>
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
}
