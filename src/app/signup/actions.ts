"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const RATE_LIMIT_WINDOW_MINUTES = 15;
const MAX_ATTEMPTS = 3;

async function checkRateLimit(email: string): Promise<{ allowed: boolean; message?: string }> {
  const adminClient = createAdminClient();
  const now = new Date();

  // Get or create rate limit record
  const { data: rateLimit, error: fetchError } = await adminClient
    .from("limites_registro")
    .select("*")
    .eq("correo", email)
    .single();

  if (fetchError && fetchError.code !== "PGRST116") {
    // PGRST116 is "not found" error, which is expected for new emails
    console.error("Error al obtener límite de registro:", fetchError);
    // Allow the request if we can't check rate limit (fail open for availability)
    return { allowed: true };
  }

  // If bloqueado_hasta is in the future, reject immediately
  if (rateLimit?.bloqueado_hasta) {
    const blockedUntil = new Date(rateLimit.bloqueado_hasta);
    if (blockedUntil > now) {
      const minutesLeft = Math.ceil((blockedUntil.getTime() - now.getTime()) / 60000);
      return {
        allowed: false,
        message: `Demasiados intentos. Por favor, espera ${minutesLeft} minuto${minutesLeft > 1 ? "s" : ""} antes de intentar de nuevo.`,
      };
    }
  }

  // If ultimo_intento was more than RATE_LIMIT_WINDOW_MINUTES ago, reset intentos
  let attempts = rateLimit?.intentos || 0;
  if (rateLimit?.ultimo_intento) {
    const lastAttempt = new Date(rateLimit.ultimo_intento);
    const minutesSinceLastAttempt = (now.getTime() - lastAttempt.getTime()) / 60000;
    if (minutesSinceLastAttempt > RATE_LIMIT_WINDOW_MINUTES) {
      attempts = 0;
    }
  }

  // If attempts >= MAX_ATTEMPTS, block for RATE_LIMIT_WINDOW_MINUTES
  if (attempts >= MAX_ATTEMPTS) {
    const blockedUntil = new Date(now.getTime() + RATE_LIMIT_WINDOW_MINUTES * 60000);
    await adminClient
      .from("limites_registro")
      .upsert({
        correo: email,
        intentos: attempts + 1,
        ultimo_intento: now.toISOString(),
        bloqueado_hasta: blockedUntil.toISOString(),
      });

    return {
      allowed: false,
      message: `Demasiados intentos. Por favor, espera ${RATE_LIMIT_WINDOW_MINUTES} minutos antes de intentar de nuevo.`,
    };
  }

  // Increment attempts and update last_attempt
  await adminClient.from("limites_registro").upsert({
    correo: email,
    intentos: attempts + 1,
    ultimo_intento: now.toISOString(),
    bloqueado_hasta: null,
  });

  return { allowed: true };
}

async function validatePhone(phone: string): Promise<{ valid: boolean; message?: string; apartamento?: string }> {
  const adminClient = createAdminClient();

  // Normalize phone number (remove spaces, ensure + prefix)
  const normalizedPhone = phone.trim().replace(/\s+/g, "");

  // Check if phone exists in telefonos_validos table
  const { data, error } = await adminClient
    .from("telefonos_validos")
    .select("telefono, apartamento, nombre")
    .eq("telefono", normalizedPhone)
    .single();

  if (error || !data) {
    return {
      valid: false,
      message: "El número de teléfono no está registrado en el sistema. Contacta con Pablo.",
    };
  }

  return { valid: true, apartamento: data.apartamento || undefined };
}

export async function signUpWithPhone(formData: FormData) {
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;

  // Los campos requeridos y formato de email se validan con HTML5 nativo
  // Solo validamos errores de backend aquí

  // Validate phone format (should start with + and have digits)
  const phoneRegex = /^\+[1-9]\d{1,14}$/;
  if (!phoneRegex.test(phone)) {
    return { error: "El formato del teléfono no es válido. Debe incluir el código de país (ej: +34...)" };
  }

  // Check rate limiting
  const rateLimitCheck = await checkRateLimit(email);
  if (!rateLimitCheck.allowed) {
    return { error: rateLimitCheck.message || "Demasiados intentos. Por favor, espera antes de intentar de nuevo." };
  }

  // Validate phone exists in telefonos_validos table
  const phoneValidation = await validatePhone(phone);
  if (!phoneValidation.valid) {
    return { error: phoneValidation.message || "El teléfono no está registrado" };
  }

  const apartamento = phoneValidation.apartamento;
  if (!apartamento) {
    return { error: "El teléfono no tiene un apartamento asociado. Contacta con Pablo." };
  }

  // Create user account using Supabase Auth
  const adminClient = createAdminClient();
  
  // Check if user already exists by listing users (with pagination for efficiency)
  const { data: usersData } = await adminClient.auth.admin.listUsers({
    page: 1,
    perPage: 1000, // Adjust based on expected user count
  });
  const existingUser = usersData?.users?.find((user) => user.email?.toLowerCase() === email.toLowerCase());
  if (existingUser) {
    return { error: "Ya existe una cuenta con este correo electrónico. Por favor, inicia sesión." };
  }

  // Verify that the vivienda exists
  const { error: viviendaError } = await adminClient
    .from("viviendas")
    .select("codigo")
    .eq("codigo", apartamento)
    .single();

  if (viviendaError) {
    return { error: "El código de vivienda asociado al teléfono no existe en el sistema. Contacta con Pablo." };
  }

  // Verify that unidad_familiar exists (must exist beforehand)
  const { error: unidadError } = await adminClient
    .from("unidades_familiares")
    .select("codigo")
    .eq("codigo", apartamento)
    .single();

  if (unidadError) {
    return { error: "La unidad familiar asociada al teléfono no existe en el sistema. Contacta con Pablo." };
  }

  // Create user with email and phone in metadata using admin client
  const { data: newUser, error: signUpError } = await adminClient.auth.admin.createUser({
    email,
    email_confirm: false, // User will confirm via OTP
    user_metadata: {
      phone: phone,
    },
  });

  if (signUpError || !newUser?.user) {
    console.error("Error al crear usuario:", signUpError);
    return { error: signUpError?.message || "Error al crear la cuenta. Por favor, intenta de nuevo." };
  }

  // Associate user with unidad familiar
  const { error: asociacionError } = await adminClient
    .from("usuarios_unidades_familiares")
    .insert({
      usuario_id: newUser.user.id,
      unidad_familiar_codigo: apartamento,
    });

  if (asociacionError) {
    console.error("Error al asociar usuario con unidad familiar:", asociacionError);
    // User is created but association failed - this is a problem but we'll continue
    // The user can still log in, but won't have a unidad familiar associated
  }

  // Send OTP email for verification using regular client
  // This will send the OTP to the newly created user
  const regularClient = await createClient();
  const { error: otpSendError } = await regularClient.auth.signInWithOtp({
    email,
  });

  if (otpSendError) {
    console.error("Error al enviar código de verificación:", otpSendError);
    // If OTP fails, we should still allow the user to try logging in
    // The account is created, they just need to request a new OTP from login page
    return { 
      error: "Cuenta creada, pero no se pudo enviar el código de verificación. Por favor, intenta iniciar sesión y solicita un nuevo código." 
    };
  }

  // Reset rate limit on successful signup
  await adminClient
    .from("limites_registro")
    .delete()
    .eq("correo", email);

  return { success: true };
}
