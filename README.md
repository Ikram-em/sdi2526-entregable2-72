# sdi2526-entrega2-72

Aplicación web de gestión de reservas de espacios para SDI 2025/2026.

La aplicación web del backend Express usa vistas `Twig` y la API REST queda documentada con `Swagger/OpenAPI`.

## Stack y requisitos locales

- Node.js 20+
- MongoDB 7 local escuchando en `mongodb://127.0.0.1:27017`
- npm 10+

## Arranque backend web

1. Copia `.env.example` a `.env` si quieres cambiar configuración.
2. Arranca MongoDB local.
3. Ejecuta:

```bash
npm install
npm start
```

La aplicación queda disponible en:

- Web EJS: `http://localhost:3000`
- Swagger UI: `http://localhost:3000/api/docs`
- OpenAPI JSON: `http://localhost:3000/api/openapi.json`

Por defecto la aplicación usa `RESET_DB_ON_START=false`, así que conserva usuarios, reservas y sesiones entre reinicios. Si necesitas regenerar los datos de prueba para una ejecución concreta, arranca con `RESET_DB_ON_START=true`.

## Arranque cliente React

Desarrollo:

```bash
npm run react:dev
```

Build:

```bash
npm run react:build
```

Tras generar el build, el cliente queda servido por Express en `http://localhost:3000/react`.

## Datos base para pruebas

El seeding genera automáticamente:

- 1 administrador: `12345678Z` / `@Dm1n1str@D0r`
- 15 usuarios estándar con DNIs `10000001S`, `10000002Q`, ... y contraseñas `Us3r@1-PASSW`, `Us3r@2-PASSW`, ...
- 6 espacios con tipos variados y 1 desactivado
- Reservas y bloqueos suficientes para pruebas de listado, solapes, disponibilidad e histórico

## Uso de la API REST

### Autenticación Bearer

1. Obtén token con `POST /api/auth/login`.
2. Envía `Authorization: Bearer <token>` en los endpoints protegidos.

Ejemplo:

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"dni":"10000001S","password":"Us3r@1-PASSW"}'
```

Respuesta esperada:

```json
{
  "token": "TOKEN",
  "user": {
    "id": "680000000000000000000001",
    "dni": "10000001S",
    "name": "Lucia Fernandez Suarez",
    "role": "STANDARD"
  }
}
```

### Endpoints

| Método | Ruta | Auth | Descripción |
| --- | --- | --- | --- |
| `GET` | `/api/health` | No | Estado de la API |
| `POST` | `/api/auth/login` | No | Login y obtención de token |
| `GET` | `/api/spaces` | No | Espacios activos y bloqueos activos |
| `POST` | `/api/reservations` | Sí | Crear reserva propia |
| `GET` | `/api/reservations/me` | Sí | Listar reservas propias |
| `PATCH` | `/api/reservations/:id/cancel` | Sí | Cancelar reserva propia |
| `PUT` | `/api/reservations/:id` | Sí | Editar reserva propia |
| `POST` | `/api/reservations/:id/recurrence` | Sí | Crear recurrencias |

### Ejemplos rápidos

Crear reserva:

```bash
curl -X POST http://localhost:3000/api/reservations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "spaceId":"SPACE_ID",
    "startDateTime":"2026-05-20T09:00:00.000Z",
    "endDateTime":"2026-05-20T10:00:00.000Z",
    "purpose":"Reunion de proyecto"
  }'
```

Listar reservas propias:

```bash
curl http://localhost:3000/api/reservations/me \
  -H "Authorization: Bearer TOKEN"
```

Cancelar reserva:

```bash
curl -X PATCH http://localhost:3000/api/reservations/RESERVATION_ID/cancel \
  -H "Authorization: Bearer TOKEN"
```

### Formato de errores

Los errores REST siguen este formato:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Revisa los datos de la reserva.",
    "details": {
      "startDateTime": "La fecha/hora de inicio es obligatoria."
    }
  }
}
```

## Proyecto de pruebas automáticas

Las pruebas Selenium/JUnit están en `sdi2526-entrega2-test-72/`.

Si abres la raíz del repositorio en IntelliJ IDEA, el archivo [pom.xml](/Users/ikramelmabroukmorhnane/Desktop/sdi2526-entrega2-72/pom.xml) actúa como agregador Maven para que IntelliJ importe también el módulo `sdi2526-entrega2-test-72` y reconozca sus tests como ejecutables.

## Entrega final

El ZIP de entrega debe llamarse `sdi2526-entrega2-72.zip` y contener en su raíz:

- `sdi2526-entrega2-72.pdf`
- `sdi2526-entrega2-72.xlsx`
- carpeta `sdi2526-entrega2-72`
- carpeta `sdi2526-entrega2-test-72`

Este repositorio contiene el proyecto Node.js y el proyecto de pruebas. El PDF y el XLSX siguen siendo entregables obligatorios que deben prepararse aparte con esos nombres exactos.

Para validar la estructura una vez montada la carpeta raíz de entrega:

```bash
npm run delivery:check -- /ruta/a/la/carpeta-que-sera-la-raiz-del-zip
```
