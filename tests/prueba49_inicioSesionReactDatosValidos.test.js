const assert = require("node:assert/strict");
const test = require("node:test");

test("Prueba49: inicio de sesión React con datos válidos", async () => {
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
