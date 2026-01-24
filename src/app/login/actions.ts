"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";

// Email de desarrollo para saltarse el OTP en local
const DEV_EMAIL = process.env.DEV_EMAIL || "dev@local.com";
const IS_DEV = process.env.NODE_ENV === "development";

/**
 * Crea una sesión directamente para el usuario de desarrollo sin OTP
 * Usa el admin client para generar un magic link y procesarlo automáticamente
 */
async function createDevSession(email: string) {
  const adminClient = createAdminClient();
  
  // Buscar el usuario
  const { data: usersData } = await adminClient.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  
  const user = usersData?.users?.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase()
  );
  
  if (!user) {
    return { error: "Usuario de desarrollo no encontrado. Asegúrate de crear una cuenta con este email primero." };
  }

  // Generar un magic link usando el admin client
  const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
    type: "magiclink",
    email: email,
  });

  if (linkError || !linkData?.properties?.hashed_token) {
    return { error: linkError?.message || "Error al generar link de desarrollo" };
  }

  // Usar el hashed_token para crear la sesión directamente
  const supabase = await createClient();
  const { data, error } = await supabase.auth.verifyOtp({
    token_hash: linkData.properties.hashed_token,
    type: "email",
  });

  if (error || !data.session) {
    return { error: error?.message || "No se pudo crear la sesión" };
  }

  return { success: true };
}

export async function signInWithEmail(formData: FormData) {
  const email = formData.get("email") as string;
  
  if (!email) {
    return { error: "El correo electrónico es requerido" };
  }

  // Check if user exists before sending OTP
  const adminClient = createAdminClient();
  const { data: usersData } = await adminClient.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  
  const existingUser = usersData?.users?.find(
    (user) => user.email?.toLowerCase() === email.toLowerCase()
  );
  
  if (!existingUser) {
    const errorMessage = encodeURIComponent("No existe una cuenta con este correo electrónico. Por favor, regístrate primero.");
    redirect(`/signup?email=${encodeURIComponent(email)}&error=${errorMessage}`);
  }

  // Bypass OTP en desarrollo local para el email de desarrollo
  if (IS_DEV && email.toLowerCase() === DEV_EMAIL.toLowerCase()) {
    const result = await createDevSession(email);
    if (result.error) {
      return { error: result.error };
    }
    // Redirigir directamente sin necesidad de OTP
    redirect("/");
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithOtp({
    email,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function verifyOtp(formData: FormData) {
  const email = formData.get("email") as string;
  const token = formData.get("token") as string;
  
  // Bypass OTP en desarrollo local para el email de desarrollo
  if (IS_DEV && email.toLowerCase() === DEV_EMAIL.toLowerCase()) {
    const result = await createDevSession(email);
    if (result.error) {
      return { error: result.error };
    }
    redirect("/");
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "email",
  });

  if (error) {
    return { error: error.message };
  }

  if (data.session) {
    redirect("/");
  }

  return { error: "No se pudo crear la sesión" };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
