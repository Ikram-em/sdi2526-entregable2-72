const assert = require("node:assert/strict");
const test = require("node:test");

test("prueba49_inicioSesionReactDatosValidos", async () => {
  const { loginWithApi } = await import("../client/src/services/loginApi.js");
  const storedValues = new Map();
  const storage = {
    setItem(key, value) {
      storedValues.set(key, value);
    }
  };
  const fetchCalls = [];
  const fetchImpl = async (url, options) => {
    fetchCalls.push({ url, options });
    return {
      ok: true,
      status: 200,
      async json() {
        return {
          token: "token-de-prueba",
          user: {
            id: "user-1",
            dni: "10000001S",
            name: "Lucia Fernandez Suarez",
            role: "STANDARD"
          }
        };
      }
    };
  };

  const result = await loginWithApi(
    { dni: "10000001s", password: "Us3r@1-PASSW" },
    { fetchImpl, storage }
  );

  assert.equal(result.ok, true);
  assert.equal(result.status, 200);
  assert.equal(result.token, "token-de-prueba");
  assert.equal(fetchCalls.length, 1);
  assert.equal(fetchCalls[0].url, "/api/auth/login");
  assert.deepEqual(JSON.parse(fetchCalls[0].options.body), {
    dni: "10000001S",
    password: "Us3r@1-PASSW"
  });
  assert.equal(storedValues.get("apiToken"), "token-de-prueba");
});

test("prueba50_inicioSesionReactCredencialesInvalidas", async () => {
  const { loginWithApi } = await import("../client/src/services/loginApi.js");
  const fetchImpl = async () => ({
    ok: false,
    status: 401,
    async json() {
      return {
        error: {
          code: "INVALID_CREDENTIALS",
          message: "Inicio de sesión no correcto."
        }
      };
    }
  });

  const result = await loginWithApi(
    { dni: "10000001S", password: "incorrecta" },
    { fetchImpl }
  );

  assert.equal(result.ok, false);
  assert.equal(result.status, 401);
  assert.equal(result.message, "Inicio de sesión no correcto.");
});

test("prueba51_inicioSesionReactCamposVacios", async () => {
  const { loginWithApi } = await import("../client/src/services/loginApi.js");
  let fetchWasCalled = false;
  const fetchImpl = async () => {
    fetchWasCalled = true;
    throw new Error("No debería invocarse la API con campos vacíos.");
  };

  const result = await loginWithApi(
    { dni: "", password: "" },
    { fetchImpl }
  );

  assert.equal(result.ok, false);
  assert.equal(result.status, 400);
  assert.equal(fetchWasCalled, false);
  assert.deepEqual(result.errors, {
    dni: "El DNI es obligatorio.",
    password: "La contraseña es obligatoria."
  });
});

test("prueba52_registrarReservaReactDatosValidos", async () => {
  const { createReservationWithApi } = await import("../client/src/services/reservationApi.js");
  const fetchCalls = [];
  const fetchImpl = async (url, options) => {
    fetchCalls.push({ url, options });
    return {
      ok: true,
      status: 201,
      async json() {
        return {
          reservation: {
            id: "reservation-1",
            spaceId: "space-1",
            spaceName: "Sala Naranco",
            startDateTime: "2026-05-05T10:00:00.000Z",
            endDateTime: "2026-05-05T11:00:00.000Z",
            purpose: "Reunión de equipo",
            status: "ACTIVA"
          }
        };
      }
    };
  };

  const result = await createReservationWithApi(
    {
      spaceId: "space-1",
      startDateTime: "2026-05-05T10:00",
      endDateTime: "2026-05-05T11:00",
      purpose: " Reunión de equipo "
    },
    {
      fetchImpl,
      token: "token-de-prueba"
    }
  );

  assert.equal(result.ok, true);
  assert.equal(result.status, 201);
  assert.equal(result.message, "Reserva registrada correctamente.");
  assert.equal(fetchCalls.length, 1);
  assert.equal(fetchCalls[0].url, "/api/reservations");
  assert.equal(fetchCalls[0].options.method, "POST");
  assert.equal(fetchCalls[0].options.headers.Authorization, "Bearer token-de-prueba");
  assert.deepEqual(JSON.parse(fetchCalls[0].options.body), {
    spaceId: "space-1",
    startDateTime: "2026-05-05T10:00",
    endDateTime: "2026-05-05T11:00",
    purpose: "Reunión de equipo"
  });
});

test("prueba53_registrarReservaReactInicioPosteriorFin", async () => {
  const { createReservationWithApi } = await import("../client/src/services/reservationApi.js");
  let fetchWasCalled = false;
  const fetchImpl = async () => {
    fetchWasCalled = true;
    throw new Error("No debería invocarse la API con un rango inválido.");
  };

  const result = await createReservationWithApi(
    {
      spaceId: "space-1",
      startDateTime: "2026-05-05T12:00",
      endDateTime: "2026-05-05T11:00",
      purpose: "Rango incorrecto"
    },
    {
      fetchImpl,
      token: "token-de-prueba"
    }
  );

  assert.equal(result.ok, false);
  assert.equal(result.status, 400);
  assert.equal(fetchWasCalled, false);
  assert.deepEqual(result.errors, {
    endDateTime: "La fecha/hora de fin debe ser posterior al inicio."
  });
});

test("prueba54_consultarListadoReservasPropiasReact", async () => {
  const { fetchOwnReservations } = await import("../client/src/services/reservationApi.js");
  const fetchCalls = [];
  const fetchImpl = async (url, options) => {
    fetchCalls.push({ url, options });
    return {
      ok: true,
      status: 200,
      async json() {
        return {
          reservations: [
            {
              id: "reservation-1",
              spaceName: "Sala Naranco",
              startDateTime: "2026-05-05T10:00:00.000Z",
              endDateTime: "2026-05-05T11:00:00.000Z",
              status: "ACTIVA"
            },
            {
              id: "reservation-2",
              spaceName: "Aula Covadonga",
              startDateTime: "2026-05-06T12:00:00.000Z",
              endDateTime: "2026-05-06T13:00:00.000Z",
              status: "CANCELADA"
            }
          ]
        };
      }
    };
  };

  const result = await fetchOwnReservations({
    fetchImpl,
    token: "token-de-prueba"
  });

  assert.equal(result.ok, true);
  assert.equal(result.status, 200);
  assert.equal(result.reservations.length, 2);
  assert.equal(fetchCalls.length, 1);
  assert.equal(fetchCalls[0].url, "/api/reservations/me");
  assert.equal(fetchCalls[0].options.headers.Authorization, "Bearer token-de-prueba");
});

test("prueba55_filtrarReservasPropiasPorEstadoCancelada", async () => {
  const { filterReservationsByStatus } = await import("../client/src/services/reservationApi.js");
  const reservations = [
    { id: "reservation-1", status: "ACTIVA", spaceName: "Sala Naranco" },
    { id: "reservation-2", status: "CANCELADA", spaceName: "Aula Covadonga" },
    { id: "reservation-3", status: "CANCELADA", spaceName: "Cowork Costa Verde" }
  ];

  const filtered = filterReservationsByStatus(reservations, "CANCELADA");

  assert.equal(filtered.length, 2);
  assert.deepEqual(
    filtered.map((reservation) => reservation.id),
    ["reservation-2", "reservation-3"]
  );
});
