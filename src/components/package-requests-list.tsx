"use client";

import { useState, useTransition } from "react";
import { PackageRequestCard } from "./package-request-card";
import { PackageRequestWithDetails, acceptRequest } from "@/app/paquetes/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface PackageRequestsListProps {
  requests: PackageRequestWithDetails[];
  showActions?: boolean;
  isMyRequest?: boolean;
  emptyMessage?: string;
}

export function PackageRequestsList({
  requests,
  showActions = false,
  isMyRequest = false,
  emptyMessage = "No hay solicitudes",
}: PackageRequestsListProps) {
  const router = useRouter();
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
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

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {requests.map((request) => (
        <PackageRequestCard
          key={request.id}
          request={request}
          onAccept={showActions ? handleAccept : undefined}
          isAccepting={acceptingId === request.id || isPending}
          showActions={showActions}
          isMyRequest={isMyRequest}
        />
      ))}
    </div>
  );
}
