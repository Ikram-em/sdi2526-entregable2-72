const assert = require("node:assert/strict");
const test = require("node:test");

test("Prueba50: inicio de sesión React con credenciales inválidas", async () => {
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
