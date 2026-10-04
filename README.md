## Torres 24

Aplicacion web para la gestion vecinal de un edificio. Centraliza documentacion, incidencias, paquetes y parking, con flujos de alta, consulta y seguimiento para residentes.

**Nota importante**: este repositorio es un experimento de vibe-coding. El codigo no se ha tocado de forma directa en ningun momento y todo es puramente experimental.

## Funcionalidades

- Documentacion: subida, filtros y descarga de documentos del edificio.
- Incidencias: alta, seguimiento y detalle por incidencia.
- Paquetes: solicitudes y gestion de recogidas.
- Parking: ofertas y solicitudes entre vecinos.
- Perfil: gestion de datos del usuario.
- Votaciones (futuro): espacio para consultas y votaciones de vecinos.
- Avisos por email: notificaciones a los vecinos (se usa Brevo para el envio).

## Tecnologias

- Next.js (App Router) y React
- TypeScript
- Tailwind CSS y componentes UI propios
- Supabase (auth y base de datos, con migraciones SQL)
- Supabase Storage para almacenamiento de archivos
- Brevo para avisos por email

## Desarrollo

```bash
yarn dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Variables de entorno

Consulta el archivo `.env.example` para ver la lista completa de variables necesarias.

### Supabase (Archivos)

Configura las variables de Supabase para habilitar subida y descarga en Storage.

### Brevo (Avisos por email)

Configura las variables de Brevo para habilitar el envio de avisos por email.

Al crear una votacion, incidencia o documento se avisa a los usuarios registrados
con vivienda asociada, excepto al autor. Cada destinatario recibe un correo
individual. Las opciones y los adjuntos se guardan antes de enviar el aviso;
un fallo de email se registra en el servidor y no revierte la publicacion.

Las plantillas activas de Brevo se configuran en
`src/lib/notifications/email-templates.ts`: nueva votacion **5**, nueva incidencia
**6** y nuevo documento **7**. Reciben `titulo`, `descripcion`, `autorNombre`,
`autorUnidad` (etiquetada como Vivienda), `fechaCreacion` en `Europe/Madrid` y
`urlDetalle`, ademas de `encuestaId`, `incidenciaId` o `documentoId` segun el aviso.
La plantilla de documento tambien recibe `tipoDocumento` con su etiqueta legible.
Los enlaces apuntan a `https://torres24.org`; las descargas se consultan desde la
app, sin enviar URLs temporales de Storage por correo.

### ParkShare: solicitudes caducadas

La migracion `20261004000000_cancel_expired_parking_requests.sql` activa un job
de Supabase Cron que cancela una vez al dia las solicitudes pendientes cuya
fecha de fin ya ha pasado. Tambien cancela las antiguas al aplicar la migracion.
Las solicitudes aceptadas conservan su estado y el historico no se elimina.

Aplica la migracion con `yarn supabase:push` en el proyecto Supabase vinculado.
El job `parkshare-cancel-expired-requests` y su historial se pueden consultar en
la seccion Cron del dashboard de Supabase. La limpieza funciona aunque nadie
abra ParkShare y compara las fechas como instantes, sin depender de la zona
horaria del servidor.
Se ejecuta a las 00:00 UTC: la 01:00 en invierno y las 02:00 en verano en Madrid.
