"use client";

import { motion } from "framer-motion";
import { BarChart3, FileText, AlertTriangle, Car, Package } from "lucide-react";
import FeatureCard from "@/components/feature-card";

const features = [
  {
    title: "Visor de gastos",
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
    title: "Gestión de incidencias",
    description: "Reporta problemas con fotos, sigue el estado de resolución y mantén informados a todos los vecinos.",
    icon: AlertTriangle,
    route: "/incidencias",
  },
  {
    title: "ParkShare™",
    description: "Solicita una plaza temporalmente para amigos o familiares y comparte la tuya cuando te vayas fuera.",
    icon: Car,
    route: "/parking",
  },
  {
    title: "Recogida de paquetes",
    description: "¿No estarás en casa? Pide a un vecino que recoja tu paquete.",
    icon: Package,
    route: "/paquetes",
  },
];

const Index = () => {
  return (
    <div className="bg-background">
      {/* Features Grid */}
      <div className="max-w-6xl mx-auto px-4 py-8 relative z-10">
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
