"use client";

import { useState, useEffect, useMemo, startTransition, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { signInWithEmail, verifyOtp } from "./actions";
import { Mail, Loader2, KeyRound } from "lucide-react";

function LoginForm() {
    const searchParams = useSearchParams();
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
        <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
            <main className="flex min-h-screen w-full max-w-md flex-col items-center justify-center px-6 py-12">
                <div className="w-full space-y-8">
                    <div className="space-y-2 text-center">
                        <h1 className="text-3xl font-bold tracking-tight">Iniciar sesión</h1>
                        <p className="text-muted-foreground">
                            {otpSent
                                ? "Ingresa el código de verificación que te enviamos por correo"
                                : "Ingresa tu correo electrónico y te enviaremos un código de verificación"}
                        </p>
                    </div>

                    {!otpSent ? (
                        <form onSubmit={handleEmailSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Correo electrónico</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="tu@correo.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        disabled={isLoading}
                                        className="pl-9"
                                    />
                                </div>
                            </div>

                            {message && (
                                <Alert variant={message.type === "error" ? "destructive" : "default"}>
                                    <AlertDescription>{message.text}</AlertDescription>
                                </Alert>
                            )}

                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 size-4 animate-spin" />
                                        Enviando...
                                    </>
                                ) : (
                                    "Enviar código OTP"
                                )}
                            </Button>
                        </form>
                    ) : (
                        <form onSubmit={handleOtpSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="otp">Código de verificación</Label>
                                <div className="relative">
                                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
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
                                        className="pl-9 text-center text-2xl tracking-widest font-mono"
                                        maxLength={8}
                                        autoComplete="one-time-code"
                                    />
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Ingresa el código de 8 dígitos enviado a {email}
                                </p>
                            </div>

                            {message && (
                                <Alert variant={message.type === "error" ? "destructive" : "default"}>
                                    <AlertDescription>{message.text}</AlertDescription>
                                </Alert>
                            )}

                            <div className="space-y-2">
                                <Button type="submit" className="w-full" disabled={isLoading || otp.length !== 8}>
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
                                    className="w-full"
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
                        </form>
                    )}
                </div>
            </main>
        </div>
    );
}

export default function Login() {
    return (
        <Suspense fallback={
            <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
                <main className="flex min-h-screen w-full max-w-md flex-col items-center justify-center px-6 py-12">
                    <div className="w-full space-y-8">
                        <div className="space-y-2 text-center">
                            <h1 className="text-3xl font-bold tracking-tight">Iniciar sesión</h1>
                            <p className="text-muted-foreground">Cargando...</p>
                        </div>
                    </div>
                </main>
            </div>
        }>
            <LoginForm />
        </Suspense>
    );
}
