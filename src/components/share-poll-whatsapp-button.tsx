"use client";

import { MessageCircle } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

interface SharePollWhatsAppButtonProps {
  pollId: string;
  title: string;
  isFinalized?: boolean;
}

export function SharePollWhatsAppButton({
  pollId,
  title,
  isFinalized = false,
}: SharePollWhatsAppButtonProps) {
  const pollUrl = `https://torres24.org/votaciones/${encodeURIComponent(pollId)}`;
  const message = [
    isFinalized ? "🗳️ Votación finalizada en Torres 24" : "🗳️ Votación en Torres 24",
    title,
    isFinalized
      ? "Consulta los resultados aquí:"
      : "Consulta las opciones y vota aquí (un voto por vivienda):",
    pollUrl,
  ].join("\n\n");

  return (
    <a
      href={`https://wa.me/?text=${encodeURIComponent(message)}`}
      target="_blank"
      rel="noopener noreferrer"
      className={buttonVariants({ variant: "outline" })}
    >
      <MessageCircle className="size-4" aria-hidden="true" />
      Compartir en WhatsApp
    </a>
  );
}
