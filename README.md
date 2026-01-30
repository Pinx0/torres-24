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
