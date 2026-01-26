"use client";

import { motion } from "framer-motion";
import { CalendarClock, X } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale/es";
import { ParkingRequest, cancelParkingRequest } from "@/app/parking/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

interface ParkingRequestCardProps {
  request: ParkingRequest;
  isMyRequest: boolean;
}

export function ParkingRequestCard({ request, isMyRequest }: ParkingRequestCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isCancelling, setIsCancelling] = useState(false);

  const statusBadge = (() => {
    switch (request.estado) {
      case "pendiente":
        return (
          <span className="inline-flex items-center rounded-full bg-yellow-500/10 px-2.5 py-1 text-xs font-medium text-yellow-600 dark:text-yellow-500">
            Pendiente
          </span>
        );
      case "aceptada":
        return (
          <span className="inline-flex items-center rounded-full bg-green-500/10 px-2.5 py-1 text-xs font-medium text-green-600 dark:text-green-500">
            Aceptada
          </span>
        );
      case "cancelada":
        return (
          <span className="inline-flex items-center rounded-full bg-rose-500/10 px-2.5 py-1 text-xs font-medium text-rose-600 dark:text-rose-500">
            Cancelada
          </span>
        );
      default:
        return null;
    }
  })();

  const handleCancel = () => {
    setIsCancelling(true);
    startTransition(async () => {
      const result = await cancelParkingRequest(request.id);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Solicitud cancelada");
        router.refresh();
      }
      setIsCancelling(false);
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      whileHover={{ y: -2 }}
    >
      <Card className="hover:shadow-lg transition-all duration-200 border-border/50">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary shrink-0">
                <CalendarClock className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-base mb-1">Necesidad de plaza</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Planta solicitada: {request.planta_solicitada}
                </p>
              </div>
            </div>
            {statusBadge}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">
              {format(new Date(request.fecha_inicio), "PPpp", { locale: es })} -{" "}
              {format(new Date(request.fecha_fin), "PPpp", { locale: es })}
            </div>

            {isMyRequest && request.estado !== "cancelada" ? (
              <Button
                variant="destructive"
                className="w-full gap-2"
                onClick={handleCancel}
                disabled={isPending || isCancelling}
              >
                <X className="size-4" />
                {isPending || isCancelling ? "Cancelando..." : "Cancelar solicitud"}
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
