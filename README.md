# sdi2526-entregable2-72

Aplicacion web de gestion de reservas de espacios para SDI 2025/2026.

## Requisitos locales

- Node.js
- MongoDB local escuchando en `mongodb://127.0.0.1:27017`

## Arranque

1. Copia `.env.example` a `.env` si quieres cambiar configuracion.
2. Arranca MongoDB local.
3. Ejecuta:

```bash
npm install
npm start
```

Por defecto la aplicacion usa `RESET_DB_ON_START=true`, asi que regenera datos de prueba en cada arranque para que las pruebas sean repetibles.
