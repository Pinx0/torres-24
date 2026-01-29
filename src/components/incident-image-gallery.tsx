"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { buttonVariants } from "@/components/ui/button";

interface IncidentImage {
  id: string;
  download_url?: string | null;
}

interface IncidentImageGalleryProps {
  title: string;
  images: IncidentImage[];
  thumbnailHeight?: string;
}

export function IncidentImageGallery({
  title,
  images,
  thumbnailHeight = "h-40",
}: IncidentImageGalleryProps) {
  const availableImages = useMemo(
    () => images.filter((image) => image.download_url),
    [images]
  );
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<IncidentImage | null>(null);

  if (!images.length) {
    return null;
  }

  const handleOpen = (image: IncidentImage) => {
    if (!image.download_url) {
      return;
    }
    setSelected(image);
    setOpen(true);
  };

  return (
    <>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {images.map((image) => (
          <button
            key={image.id}
            type="button"
            onClick={() => handleOpen(image)}
            className="group relative overflow-hidden rounded-lg border border-border/60 bg-muted/20 text-left"
            disabled={!image.download_url}
          >
            {image.download_url ? (
              <>
                <Image
                  src={image.download_url}
                  alt={title}
                  width={640}
                  height={320}
                  className={`${thumbnailHeight} w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]`}
                  unoptimized
                />
                <div className="absolute inset-0 bg-black/0 transition-colors duration-200 group-hover:bg-black/10" />
              </>
            ) : (
              <div className={`flex ${thumbnailHeight} items-center justify-center text-xs text-muted-foreground`}>
                Imagen no disponible
              </div>
            )}
          </button>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          {selected?.download_url ? (
            <div className="space-y-4">
              <div className="overflow-hidden rounded-lg border border-border/60 bg-muted/10">
                <Image
                  src={selected.download_url}
                  alt={title}
                  width={1200}
                  height={900}
                  className="w-full object-contain"
                  unoptimized
                />
              </div>
              <div className="flex justify-end">
                <a
                  href={selected.download_url ?? ""}
                  download
                  target="_blank"
                  rel="noreferrer"
                  className={buttonVariants()}
                >
                  Descargar imagen
                </a>
              </div>
              {availableImages.length > 1 ? (
                <div className="grid gap-2 sm:grid-cols-3">
                  {availableImages.map((image) => (
                    <button
                      key={image.id}
                      type="button"
                      onClick={() => setSelected(image)}
                      className={`overflow-hidden rounded-lg border ${selected.id === image.id ? "border-primary" : "border-border/60"
                        }`}
                    >
                      <Image
                        src={image.download_url ?? ""}
                        alt={title}
                        width={320}
                        height={240}
                        className="h-20 w-full object-cover"
                        unoptimized
                      />
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Imagen no disponible.</p>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
