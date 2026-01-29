"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FileText, Plus, Upload } from "lucide-react";
import { toast } from "sonner";

import { DOCUMENT_TYPES, type DocumentType } from "@/lib/document-types";
import { createDocumento, createDocumentoUploadUrl } from "@/app/documentacion/actions";
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

const MAX_FILE_SIZE = 50 * 1024 * 1024;

const selectClassName =
  "border-input focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:aria-invalid:border-destructive/50 disabled:bg-input/50 dark:disabled:bg-input/80 h-8 rounded-lg border bg-background/50 backdrop-blur-sm px-2.5 py-1 text-base transition-colors focus-visible:ring-[3px] aria-invalid:ring-[3px] md:text-sm placeholder:text-muted-foreground w-full min-w-0 outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50";

interface CreateDocumentDialogProps {
  onSuccess?: () => void;
}

export function CreateDocumentDialog({ onSuccess }: CreateDocumentDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [tipo, setTipo] = useState<DocumentType>("acta");
  const [archivo, setArchivo] = useState<File | null>(null);
  const [isPending, startTransition] = useTransition();

  const fileName = useMemo(() => archivo?.name ?? "", [archivo]);

  const resetForm = () => {
    setTitulo("");
    setDescripcion("");
    setTipo("acta");
    setArchivo(null);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!titulo.trim()) {
      toast.error("El título es obligatorio");
      return;
    }

    if (!archivo) {
      toast.error("Selecciona un archivo");
      return;
    }

    if (archivo.size > MAX_FILE_SIZE) {
      toast.error("El archivo supera los 50MB");
      return;
    }

    startTransition(async () => {
      const uploadResult = await createDocumentoUploadUrl({
        fileName: archivo.name,
        contentType: archivo.type,
        sizeBytes: archivo.size,
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
            "Content-Type": archivo.type || "application/octet-stream",
          },
          body: archivo,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Error desconocido";
        toast.error(`No se pudo subir el archivo: ${message}`);
        return;
      }

      if (!uploadResponse.ok) {
        toast.error(`No se pudo subir el archivo (HTTP ${uploadResponse.status})`);
        return;
      }

      const createResult = await createDocumento({
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        tipo,
        r2Key: uploadResult.data.r2Key,
        mimeType: archivo.type || "application/octet-stream",
        sizeBytes: archivo.size,
      });

      if (createResult.error) {
        toast.error(createResult.error);
        return;
      }

      toast.success("Documento subido correctamente");
      resetForm();
      setOpen(false);
      router.refresh();
      onSuccess?.();
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button className="gap-2 shadow-sm">
            <Plus className="size-4" />
            Subir documento
          </Button>
        }
      />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary">
              <FileText className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <DialogTitle>Subir documento</DialogTitle>
              <p className="text-sm text-muted-foreground">
                Guarda actas, contratos o cualquier documentación importante.
              </p>
            </div>
          </div>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-6">
            <div className="space-y-2">
              <Label htmlFor="documento-titulo">Título</Label>
              <Input
                id="documento-titulo"
                placeholder="Ej: Acta junta mayo 2026"
                value={titulo}
                onChange={(event) => setTitulo(event.target.value)}
                disabled={isPending}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="documento-tipo">Tipo</Label>
              <select
                id="documento-tipo"
                className={selectClassName}
                value={tipo}
                onChange={(event) => setTipo(event.target.value as DocumentType)}
                disabled={isPending}
                required
              >
                {DOCUMENT_TYPES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="documento-archivo">Archivo</Label>
              <Input
                id="documento-archivo"
                type="file"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                onChange={(event) => setArchivo(event.target.files?.[0] ?? null)}
                disabled={isPending}
                required
              />
              {fileName && (
                <p className="text-xs text-muted-foreground flex items-center gap-2">
                  <Upload className="size-3.5" />
                  {fileName}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="documento-descripcion">Descripción (opcional)</Label>
              <Textarea
                id="documento-descripcion"
                placeholder="Añade un contexto o resumen..."
                value={descripcion}
                onChange={(event) => setDescripcion(event.target.value)}
                rows={3}
                disabled={isPending}
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
            <Button type="submit" disabled={isPending || !titulo.trim() || !archivo}>
              {isPending ? "Subiendo..." : "Subir"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
