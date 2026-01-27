"use client";

import { motion } from "framer-motion";
import { Package, Clock, CheckCircle, User, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PackageRequestWithDetails } from "@/app/paquetes/actions";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale/es";

interface PackageRequestCardProps {
  request: PackageRequestWithDetails;
  onAccept?: (requestId: string) => void;
  onCancel?: (requestId: string) => void;
  onComplete?: (requestId: string) => void;
  isAccepting?: boolean;
  isCanceling?: boolean;
  isCompleting?: boolean;
  showActions?: boolean;
}

export function PackageRequestCard({
  request,
  onAccept,
  onCancel,
  onComplete,
  isAccepting = false,
  isCanceling = false,
  isCompleting = false,
  showActions = false,
}: PackageRequestCardProps) {
  const solicitanteLabel = request.solicitante_display ?? request.solicitante_unidad_familiar_codigo;
  const aceptanteLabel =
    request.aceptante_display ?? request.aceptante_unidad_familiar_codigo ?? "Sin datos";

  const getStatusBadge = () => {
    switch (request.estado) {
      case "pendiente":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-500/10 px-2.5 py-1 text-xs font-medium text-yellow-600 dark:text-yellow-500">
            <Clock className="size-3" />
            Pendiente
          </span>
        );
      case "aceptada":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/10 px-2.5 py-1 text-xs font-medium text-green-600 dark:text-green-500">
            <CheckCircle className="size-3" />
            Aceptada
          </span>
        );
      case "completada":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-2.5 py-1 text-xs font-medium text-blue-600 dark:text-blue-500">
            Completada
          </span>
        );
      default:
        return null;
    }
  };

  const getDaysRemaining = () => {
    if (request.estado === "aceptada" && request.fecha_expiracion) {
      const expiration = new Date(request.fecha_expiracion);
      const now = new Date();
      const diffTime = expiration.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    }
    return null;
  };

  const daysRemaining = getDaysRemaining();

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
            <div className="flex items-center gap-3 flex-1">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary shrink-0">
                <Package className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-base mb-1">{request.descripcion}</CardTitle>
              </div>
            </div>
            {getStatusBadge()}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="size-4" />
              <span>
                Solicitante: {solicitanteLabel}
              </span>
            </div>

            {request.estado === "pendiente" && request.isRequester && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle className="size-4" />
                <span>Aún sin aceptar</span>
              </div>
            )}

            {(request.estado === "aceptada" || request.estado === "completada") &&
              request.isRequester && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="size-4" />
                  <span>Aceptada por: {aceptanteLabel}</span>
                </div>
              )}

            {request.estado === "aceptada" && request.fecha_aceptacion && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="size-4" />
                <span>
                  Aceptada{" "}
                  {formatDistanceToNow(new Date(request.fecha_aceptacion), {
                    addSuffix: true,
                    locale: es,
                  })}
                </span>
              </div>
            )}

            {request.estado === "aceptada" && daysRemaining !== null && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="size-4 text-muted-foreground" />
                <span
                  className={
                    daysRemaining <= 7
                      ? "text-orange-600 dark:text-orange-500 font-medium"
                      : "text-muted-foreground"
                  }
                >
                  {daysRemaining > 0
                    ? `${daysRemaining} día${daysRemaining !== 1 ? "s" : ""} restante${daysRemaining !== 1 ? "s" : ""}`
                    : "Expirada"}
                </span>
              </div>
            )}

            {request.created_at && (
              <div className="text-xs text-muted-foreground pt-2 border-t">
                Creada{" "}
                {formatDistanceToNow(new Date(request.created_at), {
                  addSuffix: true,
                  locale: es,
                })}
              </div>
            )}

            {showActions && request.estado === "pendiente" && !request.isRequester && onAccept && (
              <div className="pt-2">
                <Button
                  onClick={() => onAccept(request.id)}
                  disabled={isAccepting}
                  className="w-full"
                >
                  {isAccepting ? "Aceptando..." : "Aceptar Solicitud"}
                </Button>
              </div>
            )}

            {request.isRequester && request.estado === "pendiente" && onCancel && (
              <div className="pt-2">
                <Button
                  onClick={() => onCancel(request.id)}
                  disabled={isCanceling}
                  variant="outline"
                  className="w-full"
                >
                  {isCanceling ? "Cancelando..." : "Cancelar"}
                </Button>
              </div>
            )}

            {request.isRequester && request.estado === "aceptada" && onComplete && (
              <div className="pt-2">
                <Button
                  onClick={() => onComplete(request.id)}
                  disabled={isCompleting}
                  className="w-full"
                >
                  {isCompleting ? "Marcando..." : "Marcar como resuelta"}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
