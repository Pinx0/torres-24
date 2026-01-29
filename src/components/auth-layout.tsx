"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import fachadaImg from "@/assets/fachada.png";
import Image from "next/image";
import { ReactNode } from "react";

interface AuthLayoutProps {
    children: ReactNode;
    message?: { type: "success" | "error"; text: string } | null;
}

export function AuthLayout({ children, message }: AuthLayoutProps) {
    return (
        <div className="relative min-h-screen flex items-center justify-center overflow-hidden p-4">
            {/* Full-screen background image with reduced overlay */}
            <div className="fixed inset-0 z-0">
                <Image
                    src={fachadaImg}
                    alt="Fachada Torres 24"
                    fill
                    className="object-cover scale-105 transition-transform duration-700"
                    priority
                />
                <div className="absolute inset-0 bg-linear-to-br from-foreground/40 via-foreground/30 to-foreground/40" />
                <div className="absolute inset-0 bg-background/10" />
            </div>

            {/* Auth Form Card */}
            <div className="relative z-10 w-full max-w-md">
                <motion.div
                    initial={{ opacity: 0, y: 30, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: 0.2, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                >
                    <Card className="backdrop-blur-xl bg-card/95 border-border/50 shadow-2xl ring-1 ring-border/50">
                        <CardHeader className="space-y-3 text-center pb-6 pt-6">
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4, duration: 0.5 }}
                                className="space-y-2"
                            >
                                <motion.span
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.5, duration: 0.4 }}
                                    className="inline-block text-muted-foreground text-xs tracking-[0.35em] uppercase font-semibold"
                                >
                                    Bienvenido a
                                </motion.span>
                                <motion.h1
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.6, duration: 0.5 }}
                                    className="text-5xl uppercase font-display tracking-[0.15em] bg-linear-to-br from-foreground via-foreground to-foreground/90 bg-clip-text text-transparent leading-none"
                                >
                                    Torres 24
                                </motion.h1>
                            </motion.div>

                            {/* Mostrar errores del servidor después del header */}
                            {message?.type === "error" && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <Alert variant="destructive" className="mt-2 border-destructive/50 bg-destructive/10 backdrop-blur-sm">
                                        <AlertCircle className="size-4" />
                                        <AlertDescription className="font-medium">{message.text}</AlertDescription>
                                    </Alert>
                                </motion.div>
                            )}

                            {message?.type === "success" && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <Alert className="mt-2 border-primary/30 bg-primary/10 backdrop-blur-sm">
                                        <CheckCircle2 className="size-4 text-primary" />
                                        <AlertDescription className="font-medium text-primary">{message.text}</AlertDescription>
                                    </Alert>
                                </motion.div>
                            )}
                        </CardHeader>

                        <CardContent className="space-y-4 pb-4">
                            {children}
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </div>
    );
}
