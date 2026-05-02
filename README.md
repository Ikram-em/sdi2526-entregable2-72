# sdi2526-entrega2-72

Aplicación web de gestión de reservas de espacios para SDI 2025/2026.

## Requisitos locales

- Node.js
- MongoDB local escuchando en `mongodb://127.0.0.1:27017`

## Arranque

1. Copia `.env.example` a `.env` si quieres cambiar configuración.
2. Arranca MongoDB local.
3. Ejecuta:

```bash
npm install
npm start
```

Por defecto la aplicación usa `RESET_DB_ON_START=false`, así que conserva usuarios, reservas y sesiones entre reinicios.

Si necesitas regenerar los datos de prueba para una ejecución concreta, arranca con `RESET_DB_ON_START=true`.
