export function normalizeCredentials(credentials) {
  return {
    dni: String(credentials?.dni || "").trim().toUpperCase(),
    password: String(credentials?.password || "")
  };
}

export function validateLoginForm(credentials) {
  const values = normalizeCredentials(credentials);
  const errors = {};

  if (!values.dni) {
    errors.dni = "El DNI es obligatorio.";
  }

  if (!values.password) {
    errors.password = "La contraseña es obligatoria.";
  }

  return {
    errors,
    isValid: Object.keys(errors).length === 0,
    values
  };
}

export async function loginWithApi(credentials, options = {}) {
  const validation = validateLoginForm(credentials);

  if (!validation.isValid) {
    return {
      ok: false,
      status: 400,
      errors: validation.errors,
      message: "Revisa los datos de autenticación."
    };
  }

  const fetchImpl = options.fetchImpl || fetch;
  const endpoint = options.endpoint || "/api/auth/login";
  const response = await fetchImpl(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(validation.values)
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      errors: payload.error?.details || {},
      message: payload.error?.message || "No se ha podido iniciar sesión."
    };
  }

  if (options.storage && payload.token) {
    options.storage.setItem("apiToken", payload.token);
    options.storage.setItem("apiUser", JSON.stringify(payload.user));
  }

  return {
    ok: true,
    status: response.status,
    token: payload.token,
    user: payload.user
  };
}
