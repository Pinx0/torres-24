"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";

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
