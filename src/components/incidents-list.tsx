"use client";

import type { Incidencia } from "@/app/incidencias/actions";
import { IncidentCard } from "@/components/incident-card";

interface IncidentsListProps {
  incidents: Incidencia[];
}

export function IncidentsList({ incidents }: IncidentsListProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {incidents.map((incident) => (
        <IncidentCard key={incident.id} incident={incident} />
      ))}
    </div>
  );
}
