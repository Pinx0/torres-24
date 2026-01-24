"use client";

import { motion } from "framer-motion";
import { BarChart3, FileText, AlertTriangle, Car, Package } from "lucide-react";
import FeatureCard from "@/components/feature-card";

const features = [
  {
    title: "Visor de Gastos",
    description: "Consulta las gráficas de gastos de la comunidad y conoce cuánto corresponde a cada vecino según su coeficiente.",
    icon: BarChart3,
    route: "/gastos",
  },
  {
    title: "Documentación",
    description: "Accede a las actas de juntas, el libro del edificio y toda la documentación oficial de la comunidad.",
    icon: FileText,
    route: "/documentacion",
  },
  {
    title: "Gestión de Incidencias",
    description: "Reporta problemas con fotos, sigue el estado de resolución y mantén informados a todos los vecinos.",
    icon: AlertTriangle,
    route: "/incidencias",
  },
  {
    title: "Gestión del Parking",
    description: "Solicita una plaza cuando te visite alguien o comparte la tuya cuando te vayas de viaje.",
    icon: Car,
    route: "/parking",
  },
  {
    title: "Recogida de Paquetes",
    description: "¿No estarás en casa? Pide a un vecino que recoja tu paquete y coordina la entrega fácilmente.",
    icon: Package,
    route: "/paquetes",
  },
];

const Index = () => {
  return (
    <div className="bg-background">
      {/* Features Grid */}
      <div className="max-w-4xl mx-auto px-4 py-8 -mt-8 relative z-10">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <h2 className="text-xl font-semibold text-foreground text-center">
            ¿Qué quieres hacer hoy?
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature, index) => (
            <FeatureCard
              key={feature.title}
              {...feature}
              delay={0.2 + index * 0.1}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Index;
