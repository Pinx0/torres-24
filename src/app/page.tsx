"use client";

import { motion } from "framer-motion";
import { BarChart3, FileText, AlertTriangle, Car, Package } from "lucide-react";
import FeatureCard from "@/components/feature-card";
import fachadaImg from "@/assets/fachada.png";
import Image from "next/image";

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
    <div className="min-h-screen bg-background">
      <div className="relative h-72 md:h-96 overflow-hidden">
        <Image
          src={fachadaImg}
          alt="Fachada Torres 24"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-linear-to-b from-foreground/70 via-foreground/50 to-background" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-3"
          >
            <motion.span
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="inline-block text-white/80 text-sm tracking-[0.3em] uppercase font-medium"
            >
              Bienvenido a
            </motion.span>
            <h1 className="text-5xl md:text-7xl font-bold text-white drop-shadow-lg tracking-tight">
              Torres 24
            </h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="text-white/90 text-lg md:text-xl drop-shadow font-light"
            >
              Tu comunidad, más conectada
            </motion.p>
          </motion.div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-4xl mx-auto px-4 py-8 -mt-8 relative z-10">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
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
              delay={0.4 + index * 0.1}
            />
          ))}
        </div>

        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-center mt-12 pb-8"
        >
          <p className="text-muted-foreground text-sm">
            Comunidad de propietarios Torres 24
          </p>
        </motion.footer>
      </div>
    </div>
  );
};

export default Index;
