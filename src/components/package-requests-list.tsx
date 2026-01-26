"use client";

import { useState, useTransition } from "react";
import { PackageRequestCard } from "./package-request-card";
import {
  PackageRequestWithDetails,
  acceptRequest,
  cancelRequest,
  completeRequest,
} from "@/app/paquetes/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface PackageRequestsListProps {
  requests: PackageRequestWithDetails[];
  showActions?: boolean;
  emptyMessage?: string;
}

export function PackageRequestsList({
  requests,
  showActions = false,
}: PackageRequestsListProps) {
  const router = useRouter();
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleAccept = (requestId: string) => {
    setAcceptingId(requestId);
    startTransition(async () => {
      const result = await acceptRequest(requestId);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Solicitud aceptada exitosamente");
        router.refresh();
      }
      setAcceptingId(null);
    });
  };

  const handleCancel = (requestId: string) => {
    setCancelingId(requestId);
    startTransition(async () => {
      const result = await cancelRequest(requestId);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Solicitud cancelada");
        router.refresh();
      }
      setCancelingId(null);
    });
  };

  const handleComplete = (requestId: string) => {
    setCompletingId(requestId);
    startTransition(async () => {
      const result = await completeRequest(requestId);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Solicitud marcada como resuelta");
        router.refresh();
      }
      setCompletingId(null);
    });
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {requests.map((request) => (
        <PackageRequestCard
          key={request.id}
          request={request}
          onAccept={showActions ? handleAccept : undefined}
          onCancel={handleCancel}
          onComplete={handleComplete}
          isAccepting={acceptingId === request.id || isPending}
          isCanceling={cancelingId === request.id || isPending}
          isCompleting={completingId === request.id || isPending}
          showActions={showActions}
        />
      ))}
    </div>
  );
}
