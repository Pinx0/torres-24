"use client";

import { ParkingRequest } from "@/app/parking/actions";
import { ParkingRequestCard } from "@/components/parking-request-card";

interface ParkingRequestsListProps {
  requests: ParkingRequest[];
  currentFamilyCode: string;
}

export function ParkingRequestsList({ requests, currentFamilyCode }: ParkingRequestsListProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {requests.map((request) => (
        <ParkingRequestCard
          key={request.id}
          request={request}
          isMyRequest={request.solicitante_unidad_familiar_codigo === currentFamilyCode}
        />
      ))}
    </div>
  );
}
