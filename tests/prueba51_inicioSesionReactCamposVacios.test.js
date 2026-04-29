const assert = require("node:assert/strict");
const test = require("node:test");

test("Prueba51: inicio de sesión React con DNI o contraseña vacíos", async () => {
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
