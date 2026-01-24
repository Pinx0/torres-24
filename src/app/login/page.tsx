"use client";

import { useState, useEffect, useMemo, startTransition, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { signInWithEmail, verifyOtp } from "./actions";
import { Mail, Loader2, KeyRound, UserPlus } from "lucide-react";
import { AuthLayout } from "@/components/auth-layout";

function LoginForm() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [otpSent, setOtpSent] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const urlError = useMemo(() => {
        const error = searchParams.get("error");
        return error ? { type: "error" as const, text: decodeURIComponent(error) } : null;
    }, [searchParams]);

    useEffect(() => {
        if (urlError) {
            startTransition(() => {
                setMessage(urlError);
            });
        }
    }, [urlError]);

    const handleEmailSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage(null);

        const formData = new FormData();
        formData.append("email", email);

        const result = await signInWithEmail(formData);

        if (result.error) {
            setMessage({ type: "error", text: result.error });
        } else {
            setMessage({
                type: "success",
                text: "¡Revisa tu correo! Te hemos enviado un código de verificación.",
            });
            setOtpSent(true);
        }

        setIsLoading(false);
    };

    const handleOtpSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage(null);

        const formData = new FormData();
        formData.append("email", email);
        formData.append("token", otp);

        const result = await verifyOtp(formData);

        // If verifyOtp returns an error (not a redirect), show it
        if (result?.error) {
            setMessage({ type: "error", text: result.error });
            setIsLoading(false);
        }
        // Note: verifyOtp will redirect on success, so we won't reach here if successful
    };

    return (
        <AuthLayout message={message}>
            {!otpSent ? (
                <motion.form
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8, duration: 0.5 }}
                    onSubmit={handleEmailSubmit}
                    className="space-y-4"
                    noValidate
                >
                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-semibold">
                            Correo electrónico
                        </Label>
                        <div className="relative group">
                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground z-10 pointer-events-none transition-colors group-focus-within:text-primary" />
                            <Input
                                id="email"
                                type="email"
                                placeholder="tu@correo.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={isLoading}
                                className="pl-10 h-10 transition-all focus-visible:ring-2 focus-visible:ring-primary/20 border-2 group-focus-within:border-primary/50"
                            />
                        </div>
                    </div>

                    <Button
                        type="submit"
                        className="w-full h-11 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                        size="lg"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 size-4 animate-spin" />
                                Enviando...
                            </>
                        ) : (
                            "Enviar código de acceso"
                        )}
                    </Button>

                    <div className="relative py-0.5">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-border/60" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="px-3 text-muted-foreground font-medium">O</span>
                        </div>
                    </div>

                    <Button
                        type="button"
                        variant="outline"
                        size="lg"
                        className="w-full h-11 text-base font-semibold border-2 hover:bg-accent/40 hover:border-accent/60 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                        onClick={() => router.push("/signup")}
                    >
                        <UserPlus className="mr-2 size-4" />
                        Crear cuenta
                    </Button>
                </motion.form>
            ) : (
                <motion.form
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8, duration: 0.5 }}
                    onSubmit={handleOtpSubmit}
                    className="space-y-4"
                    noValidate
                >
                    <div className="space-y-2">
                        <Label htmlFor="otp" className="text-sm font-semibold">
                            Código de verificación
                        </Label>
                        <div className="relative group">
                            <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground z-10 pointer-events-none transition-colors group-focus-within:text-primary" />
                            <Input
                                id="otp"
                                type="text"
                                placeholder="12345678"
                                value={otp}
                                onChange={(e) => {
                                    const value = e.target.value.replace(/\D/g, "").slice(0, 8);
                                    setOtp(value);
                                }}
                                required
                                disabled={isLoading}
                                className="pl-10 text-center text-2xl tracking-widest font-mono h-10 border-2 group-focus-within:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/20"
                                maxLength={8}
                                autoComplete="one-time-code"
                                pattern="[0-9]{8}"
                                title="El código debe tener exactamente 8 dígitos"
                            />
                        </div>
                        {!message && (
                            <p className="text-sm text-muted-foreground">
                                Ingresa el código de 8 dígitos enviado a {email}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Button
                            type="submit"
                            className="w-full h-11 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                            size="lg"
                            disabled={isLoading || otp.length !== 8}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 size-4 animate-spin" />
                                    Verificando...
                                </>
                            ) : (
                                "Verificar código"
                            )}
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            className="w-full h-11 text-base font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                            size="lg"
                            disabled={isLoading}
                            onClick={() => {
                                setOtpSent(false);
                                setOtp("");
                                setMessage(null);
                            }}
                        >
                            Cambiar correo electrónico
                        </Button>
                    </div>
                </motion.form>
            )}
        </AuthLayout>
    );
}

export default function Login() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold">Cargando...</h1>
                </div>
            </div>
        }>
            <LoginForm />
        </Suspense>
    );
}
