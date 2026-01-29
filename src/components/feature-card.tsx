"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface FeatureCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  route: string;
  delay?: number;
}

const FeatureCard = ({ title, description, icon: Icon, route, delay = 0 }: FeatureCardProps) => {
  const router = useRouter();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={cn(
        "feature-card",
        "bg-card text-card-foreground rounded-xl border p-6 shadow-sm",
        "cursor-pointer transition-colors hover:bg-accent hover:text-accent-foreground",
        "flex flex-col gap-4"
      )}
      onClick={() => router.push(route)}
    >
      <div className="feature-icon flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
    </motion.div>
  );
};

export default FeatureCard;
