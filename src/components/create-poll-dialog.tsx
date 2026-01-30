"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Vote } from "lucide-react";
import { toast } from "sonner";
import { createPoll, createPollOptionUpload } from "@/app/votaciones/actions";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_FILE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

type PollOptionDraft = {
  id: string;
  texto: string;
  file: File | null;
};

interface CreatePollDialogProps {
  onSuccess?: () => void;
}

export function CreatePollDialog({ onSuccess }: CreatePollDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [options, setOptions] = useState<PollOptionDraft[]>([
    { id: crypto.randomUUID(), texto: "", file: null },
    { id: crypto.randomUUID(), texto: "", file: null },
  ]);
  const [isPending, startTransition] = useTransition();

  const optionFileNames = useMemo(
    () =>
      options.reduce<Record<string, string | null>>((acc, option) => {
        acc[option.id] = option.file?.name ?? null;
        return acc;
      }, {}),
    [options],
  );

  const updateOption = (id: string, updates: Partial<PollOptionDraft>) => {
    setOptions((prev) =>
      prev.map((option) => (option.id === id ? { ...option, ...updates } : option)),
    );
  };

  const handleAddOption = () => {
    setOptions((prev) => [...prev, { id: crypto.randomUUID(), texto: "", file: null }]);
  };

  const handleRemoveOption = (id: string) => {
    setOptions((prev) => prev.filter((option) => option.id !== id));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      toast.error("El título es obligatorio");
      return;
    }

    if (options.length < 2) {
      toast.error("Añade al menos dos opciones");
      return;
    }

    for (const option of options) {
      const trimmedText = option.texto.trim();
      if (!trimmedText) {
        toast.error("Cada opción debe tener texto");
        return;
      }
      if (option.file) {
        if (!ALLOWED_FILE_TYPES.has(option.file.type)) {
          toast.error("Solo se permiten imágenes o PDF");
          return;
        }
        if (option.file.size > MAX_FILE_SIZE) {
          toast.error("Algún archivo supera los 10MB");
          return;
        }
      }
    }

    startTransition(async () => {
      const optionsPayload: {
        texto?: string;
        asset?: { path: string; mimeType: string; sizeBytes: number } | null;
      }[] = [];

      for (const option of options) {
        let asset:
          | { path: string; mimeType: string; sizeBytes: number }
          | null = null;

        if (option.file) {
          const uploadResult = await createPollOptionUpload({
            fileName: option.file.name,
            contentType: option.file.type,
            sizeBytes: option.file.size,
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
                "Content-Type": option.file.type || "application/octet-stream",
              },
              body: option.file,
            });
          } catch (error) {
            const message = error instanceof Error ? error.message : "Error desconocido";
            toast.error(`No se pudo subir un archivo: ${message}`);
            return;
          }

          if (!uploadResponse.ok) {
            toast.error(`No se pudo subir un archivo (HTTP ${uploadResponse.status})`);
            return;
          }

          asset = {
            path: uploadResult.data.r2Key,
            mimeType: option.file.type || "application/octet-stream",
            sizeBytes: option.file.size,
          };
        }

        optionsPayload.push({
          texto: option.texto.trim() || undefined,
          asset,
        });
      }

      const result = await createPoll({
        titulo: trimmedTitle,
        descripcion: description.trim() || undefined,
        opciones: optionsPayload,
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Encuesta creada");
      setTitle("");
      setDescription("");
      setOptions([
        { id: crypto.randomUUID(), texto: "", file: null },
        { id: crypto.randomUUID(), texto: "", file: null },
      ]);
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
            Crear encuesta
          </Button>
        }
      />
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary">
              <Vote className="w-5 h-5" />
            </div>
            <DialogTitle>Nueva encuesta</DialogTitle>
          </div>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="poll-title">Título</Label>
              <Input
                id="poll-title"
                placeholder="Ej: ¿Preferimos renovar el ascensor este año?"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                disabled={isPending}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="poll-description">Descripción (opcional)</Label>
              <Textarea
                id="poll-description"
                placeholder="Contexto, detalles o información adicional..."
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={4}
                disabled={isPending}
              />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Opciones</Label>
                <Button type="button" variant="outline" size="sm" onClick={handleAddOption}>
                  Añadir opción
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                El texto es obligatorio. Puedes añadir un archivo opcional (10MB máx).
              </p>
              <div className="space-y-2">
                {options.map((option, index) => (
                  <div
                    key={option.id}
                    className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                      <span className="text-xs font-medium text-muted-foreground shrink-0">
                        Opción {index + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <Label className="sr-only" htmlFor={`poll-option-${option.id}`}>
                          Texto de la opción
                        </Label>
                        <Input
                          id={`poll-option-${option.id}`}
                          placeholder="Texto de la opción"
                          value={option.texto}
                          onChange={(event) =>
                            updateOption(option.id, { texto: event.target.value })
                          }
                          disabled={isPending}
                          className="h-9 text-sm"
                          required
                        />
                      </div>
                      <div className="sm:max-w-[220px] w-full">
                        <Label className="sr-only" htmlFor={`poll-file-${option.id}`}>
                          Archivo de la opción
                        </Label>
                        <Input
                          id={`poll-file-${option.id}`}
                          type="file"
                          accept="image/png,image/jpeg,image/webp,application/pdf"
                          onChange={(event) =>
                            updateOption(option.id, {
                              file: event.target.files?.[0] ?? null,
                            })
                          }
                          disabled={isPending}
                          className="h-9 text-xs file:h-7 file:text-xs file:px-2"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveOption(option.id)}
                        disabled={options.length <= 2 || isPending}
                        className="text-muted-foreground"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                    {optionFileNames[option.id] ? (
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {optionFileNames[option.id]}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
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
            <Button type="submit" disabled={isPending}>
              {isPending ? "Creando..." : "Crear encuesta"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
