import "server-only";

import { TZDate } from "@date-fns/tz";
import { format } from "date-fns";
import { createAdminClient } from "@/lib/supabase/admin";
import { DOCUMENT_TYPE_LABELS, type DocumentType } from "@/lib/document-types";
import { sendTransactionalEmail } from "./brevo";
import {
  buildEmailForEvent,
  type CommunityPublicationParams,
  type EmailEventPayload,
} from "./email-events";

type Publication = {
  id: string;
  titulo: string;
  descripcion: string | null;
  authorUserId: string;
  authorFamilyCode?: string;
  createdAt: string;
} & (
  | { event: "poll_created" | "incident_created" }
  | { event: "document_created"; tipo: DocumentType }
);

const PAGE_SIZE = 1000;
const BATCH_SIZE = 10;
const APP_URL = "https://torres24.org";

/** Notify registered neighbours after a publication and its children are saved. */
export async function notifyCommunityPublication(publication: Publication) {
  // Email failures must never turn a successful creation into an error/retry.
  try {
    const adminClient = createAdminClient();
    const familyUsers: {
      usuario_id: string;
      unidad_familiar_codigo: string;
    }[] = [];
    for (let offset = 0; ; offset += PAGE_SIZE) {
      const { data, error } = await adminClient
        .from("usuarios_unidades_familiares")
        .select("usuario_id, unidad_familiar_codigo")
        .order("usuario_id")
        .range(offset, offset + PAGE_SIZE - 1);

      if (error) throw error;
      familyUsers.push(...(data ?? []));
      if (!data || data.length < PAGE_SIZE) break;
    }

    const { data: authorData, error: authorError } =
      await adminClient.auth.admin.getUserById(publication.authorUserId);
    if (authorError)
      console.error("Error al obtener autor del aviso:", authorError);

    const author = authorData?.user;
    const metadataName =
      author?.user_metadata?.name || author?.user_metadata?.nombre;
    const authorEmail = author?.email?.trim().toLowerCase();
    const emails = new Set<string>();
    const userIds = [
      ...new Set(familyUsers.map((row) => row.usuario_id)),
    ].filter((id) => id !== publication.authorUserId);

    for (let offset = 0; offset < userIds.length; offset += BATCH_SIZE) {
      await Promise.all(
        userIds.slice(offset, offset + BATCH_SIZE).map(async (id) => {
          try {
            const { data, error } =
              await adminClient.auth.admin.getUserById(id);
            if (error) throw error;
            const email = data?.user?.email?.trim().toLowerCase();
            if (email && email !== authorEmail) emails.add(email);
          } catch (error) {
            console.error("Error al obtener destinatario del aviso:", error);
          }
        }),
      );
    }

    if (emails.size === 0) return;

    const common: CommunityPublicationParams = {
      titulo: publication.titulo,
      descripcion: publication.descripcion || "Sin descripción adicional.",
      autorNombre:
        typeof metadataName === "string" && metadataName.trim()
          ? metadataName.trim()
          : "Vecino",
      autorUnidad:
        publication.authorFamilyCode ||
        familyUsers.find((row) => row.usuario_id === publication.authorUserId)
          ?.unidad_familiar_codigo ||
        "Sin vivienda asociada",
      fechaCreacion: format(
        new TZDate(publication.createdAt, "Europe/Madrid"),
        "dd/MM/yyyy HH:mm",
      ),
      urlDetalle:
        APP_URL +
        (publication.event === "poll_created"
          ? `/votaciones/${encodeURIComponent(publication.id)}`
          : publication.event === "incident_created"
            ? `/incidencias/${encodeURIComponent(publication.id)}`
            : "/documentacion"),
    };

    let payload: EmailEventPayload;
    switch (publication.event) {
      case "poll_created":
        payload = {
          event: publication.event,
          data: { ...common, encuestaId: publication.id },
        };
        break;
      case "incident_created":
        payload = {
          event: publication.event,
          data: { ...common, incidenciaId: publication.id },
        };
        break;
      case "document_created":
        payload = {
          event: publication.event,
          data: {
            ...common,
            documentoId: publication.id,
            tipoDocumento: DOCUMENT_TYPE_LABELS[publication.tipo],
          },
        };
        break;
    }

    const email = buildEmailForEvent(payload);
    if (!email) return;

    const recipients = [...emails];
    for (let offset = 0; offset < recipients.length; offset += BATCH_SIZE) {
      await Promise.all(
        recipients.slice(offset, offset + BATCH_SIZE).map(async (address) => {
          // Individual sends keep neighbour addresses private.
          const result = await sendTransactionalEmail({
            ...email,
            to: [{ email: address }],
          });
          if (!result.success) {
            console.error(
              `No se pudo enviar aviso ${publication.event}:`,
              result.error,
            );
          }
        }),
      );
    }
  } catch (error) {
    console.error(`Error preparando aviso ${publication.event}:`, error);
  }
}
