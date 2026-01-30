import type { createAdminClient } from "@/lib/supabase/admin";

type AdminClient = ReturnType<typeof createAdminClient>;

export async function getNeighborEmailsByFloor(
  adminClient: AdminClient,
  floor: number,
  excludeFamilyCode?: string | null,
): Promise<string[]> {
  const { data: garages, error: garagesError } = await adminClient
    .from("garajes")
    .select("unidad_familiar_codigo")
    .eq("numero_planta", floor);

  if (garagesError) {
    console.error("Error al obtener garajes:", garagesError);
    return [];
  }

  const familyCodes = Array.from(
    new Set(
      (garages ?? [])
        .map((garage) => garage.unidad_familiar_codigo)
        .filter((code): code is string => Boolean(code)),
    ),
  ).filter((code) => code !== excludeFamilyCode);

  if (familyCodes.length === 0) {
    return [];
  }

  const { data: familyUsers, error: familyUsersError } = await adminClient
    .from("usuarios_unidades_familiares")
    .select("usuario_id")
    .in("unidad_familiar_codigo", familyCodes);

  if (familyUsersError) {
    console.error(
      "Error al obtener usuarios de las unidades familiares:",
      familyUsersError,
    );
    return [];
  }

  const userIds = Array.from(
    new Set(
      (familyUsers ?? [])
        .map((user) => user.usuario_id)
        .filter((userId): userId is string => Boolean(userId)),
    ),
  );

  if (userIds.length === 0) {
    return [];
  }

  const emailResults = await Promise.all(
    userIds.map(async (userId) => {
      const { data: userData, error: userError } =
        await adminClient.auth.admin.getUserById(userId);

      if (userError) {
        console.error("Error al obtener email del usuario:", userError);
        return null;
      }

      return userData?.user?.email ?? null;
    }),
  );

  return Array.from(
    new Set(emailResults.filter((email): email is string => Boolean(email))),
  );
}

export async function getNeighborEmailsByStairway(
  adminClient: AdminClient,
  stairway: string,
  excludeFamilyCode?: string | null,
): Promise<string[]> {
  const { data: viviendas, error: viviendasError } = await adminClient
    .from("viviendas")
    .select("unidad_familiar_codigo")
    .eq("escalera", stairway);

  if (viviendasError) {
    console.error("Error al obtener viviendas:", viviendasError);
    return [];
  }

  const familyCodes = Array.from(
    new Set(
      (viviendas ?? [])
        .map((vivienda) => vivienda.unidad_familiar_codigo)
        .filter((code): code is string => Boolean(code)),
    ),
  ).filter((code) => code !== excludeFamilyCode);

  if (familyCodes.length === 0) {
    return [];
  }

  const { data: familyUsers, error: familyUsersError } = await adminClient
    .from("usuarios_unidades_familiares")
    .select("usuario_id")
    .in("unidad_familiar_codigo", familyCodes);

  if (familyUsersError) {
    console.error(
      "Error al obtener usuarios de las unidades familiares:",
      familyUsersError,
    );
    return [];
  }

  const userIds = Array.from(
    new Set(
      (familyUsers ?? [])
        .map((user) => user.usuario_id)
        .filter((userId): userId is string => Boolean(userId)),
    ),
  );

  if (userIds.length === 0) {
    return [];
  }

  const emailResults = await Promise.all(
    userIds.map(async (userId) => {
      const { data: userData, error: userError } =
        await adminClient.auth.admin.getUserById(userId);

      if (userError) {
        console.error("Error al obtener email del usuario:", userError);
        return null;
      }

      return userData?.user?.email ?? null;
    }),
  );

  return Array.from(
    new Set(emailResults.filter((email): email is string => Boolean(email))),
  );
}
