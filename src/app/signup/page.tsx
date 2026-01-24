"use client";

import { useState, useEffect, useMemo, startTransition, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/phone-input";
import { signUpWithPhone } from "@/app/signup/actions";
import { Mail, Loader2, LogIn } from "lucide-react";
import { AuthLayout } from "@/components/auth-layout";

function SignUpForm() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Get email and error from URL params
    const urlEmail = useMemo(() => {
        return searchParams.get("email");
    }, [searchParams]);

    const urlError = useMemo(() => {
        const error = searchParams.get("error");
        return error ? { type: "error" as const, text: decodeURIComponent(error) } : null;
    }, [searchParams]);

    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("+34"); // Default to Spanish prefix
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(urlError);
    const [emailInitialized, setEmailInitialized] = useState(false);

    // Initialize email from URL params only once on mount
    useEffect(() => {
        if (urlEmail && !emailInitialized) {
            startTransition(() => {
                setEmail(urlEmail);
                setEmailInitialized(true);
            });
        }
    }, [urlEmail, emailInitialized]);

    // Set error message from URL params
    useEffect(() => {
        if (urlError) {
            startTransition(() => {
                setMessage(urlError);
            });
        }
    }, [urlError]);


    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage(null);

        // Phone already includes the + prefix from PhoneInput
        const formattedPhone = phone.replace(/\s/g, ""); // Remove any spaces

        const formData = new FormData();
        formData.append("email", email);
        formData.append("phone", formattedPhone);

        const result = await signUpWithPhone(formData);

        if (result.error) {
            setMessage({ type: "error", text: result.error });
            setIsLoading(false);
        } else {
            setMessage({
                type: "success",
                text: "¡Cuenta creada! Te hemos enviado un código de verificación por correo.",
            });
            // Redirect to login after a short delay
            setTimeout(() => {
                router.push("/login");
            }, 2000);
        }
    };

    return (
        <AuthLayout message={message}>
            <motion.form
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.5 }}
                onSubmit={handleSubmit}
                className="space-y-4"
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
                            autoComplete="email"
                            disabled={isLoading}
                            className="pl-10 h-10 transition-all focus-visible:ring-2 focus-visible:ring-primary/20 border-2 group-focus-within:border-primary/50"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-semibold">
                        Teléfono
                    </Label>
                    <PhoneInput
                        name="phone"
                        value={phone}
                        onChange={setPhone}
                        disabled={isLoading}
                    />
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        El teléfono debe estar registrado en el sistema
                    </p>
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
                            Creando cuenta...
                        </>
                    ) : (
                        "Crear cuenta"
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
                    className="w-full h-11 text-base font-semibold border-2 hover:bg-muted/50 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                    onClick={() => router.push("/login")}
                >
                    <LogIn className="mr-2 size-4" />
                    Ya tengo una cuenta
                </Button>
            </motion.form>
        </AuthLayout>
    );
}

export default function SignUp() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold">Cargando...</h1>
                </div>
            </div>
        }>
            <SignUpForm />
        </Suspense>
    );
}
