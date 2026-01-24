"use client";

import { motion } from "framer-motion";
import fachadaImg from "@/assets/fachada.png";
import Image from "next/image";
import Link from "next/link";

export function MainHeader() {
  return (
    <div className="relative h-72 md:h-96 overflow-hidden">
      <Image
        src={fachadaImg}
        alt="Fachada Torres 24"
        className="w-full h-full object-cover"
        priority
      />
      <div className="absolute inset-0 bg-linear-to-b from-foreground/70 via-foreground/50 to-background" />
      <Link
        href="/"
        className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 cursor-pointer transition-opacity hover:opacity-90"
      >
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
            className="inline-block text-white/80 text-xs tracking-[0.35em] uppercase font-semibold"
          >
            Bienvenido a
          </motion.span>
          <h1 className="text-5xl md:text-7xl font-display uppercase tracking-[0.15em] text-white drop-shadow-lg leading-none">
            Torres 24
          </h1>
        </motion.div>
      </Link>
    </div>
  );
}
