"use client";

import { ParkingRequest } from "@/app/parking/actions";
import { Garaje } from "@/app/mis-datos/actions";
import { ParkingRequestCard } from "@/components/parking-request-card";

interface ParkingRequestsListProps {
  requests: ParkingRequest[];
  currentFamilyCode: string;
  garajes: Garaje[];
}

export function ParkingRequestsList({
  requests,
  currentFamilyCode,
  garajes,
}: ParkingRequestsListProps) {
  const now = new Date();
  const activeRequests = requests.filter((request) => {
    const end = new Date(request.fecha_fin);
    return Number.isNaN(end.getTime()) || end >= now;
  });

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {activeRequests.map((request) => (
        <ParkingRequestCard
          key={request.id}
          request={request}
          isMyRequest={request.solicitante_unidad_familiar_codigo === currentFamilyCode}
          currentFamilyCode={currentFamilyCode}
          garajes={garajes}
        />
      ))}
    </div>
  );
}
