## Torres 24

Aplicacion web para la gestion vecinal de un edificio. Centraliza documentacion, incidencias, paquetes y parking, con flujos de alta, consulta y seguimiento para residentes.

## Funcionalidades

- Documentacion: subida, filtros y descarga de documentos del edificio.
- Incidencias: alta, seguimiento y detalle por incidencia.
- Paquetes: solicitudes y gestion de recogidas.
- Parking: ofertas y solicitudes entre vecinos.
- Perfil: gestion de datos del usuario.

## Tecnologias

- Next.js (App Router) y React
- TypeScript
- Tailwind CSS y componentes UI propios
- Supabase (auth y base de datos, con migraciones SQL)
- Cloudflare R2 para almacenamiento de documentos

## Desarrollo

```bash
yarn dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Variables de entorno

### Cloudflare R2 (Documentacion)

Configura estas variables para habilitar subida y descarga:

```
R2_ENDPOINT=
R2_BUCKET=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
```

Notas:
- `R2_ENDPOINT` debe apuntar al endpoint S3 compatible de tu bucket.
- Las credenciales deben tener permisos de lectura/escritura en el bucket.
