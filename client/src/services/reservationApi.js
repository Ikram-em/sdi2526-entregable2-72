export function normalizeReservationForm(values) {
  return {
    spaceId: String(values?.spaceId || "").trim(),
    startDateTime: String(values?.startDateTime || "").trim(),
    endDateTime: String(values?.endDateTime || "").trim(),
    purpose: String(values?.purpose || "").trim()
  };
}

export async function fetchSpaces(options = {}) {
  const fetchImpl = options.fetchImpl || fetch;
  const endpoint = options.endpoint || "/api/spaces";
  const response = await fetchImpl(endpoint);
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      spaces: [],
      message: payload.error?.message || "No se han podido cargar los espacios."
    };
  }

  return {
    ok: true,
    status: response.status,
    spaces: payload.spaces || []
  };
}

export async function createReservationWithApi(values, options = {}) {
  const normalizedValues = normalizeReservationForm(values);
  const token = options.token || "";
  if (!token) {
    return {
      ok: false,
      status: 401,
      errors: {},
      message: "Debes iniciar sesión para crear reservas."
    };
  }

  const fetchImpl = options.fetchImpl || fetch;
  const endpoint = options.endpoint || "/api/reservations";
  const response = await fetchImpl(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(normalizedValues)
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      errors: payload.error?.details || {},
      message: payload.error?.code === "VALIDATION_ERROR" || payload.error?.code === "INVALID_DATE_RANGE"
        ? "Revisa los datos de la reserva."
        : payload.error?.message || "No se ha podido registrar la reserva."
    };
  }

  return {
    ok: true,
    status: response.status,
    reservation: payload.reservation,
    message: "Reserva registrada correctamente."
  };
}

export async function editReservationWithApi(reservationId, values, options = {}) {
  const normalizedValues = normalizeReservationForm(values);
  const token = options.token || "";
  if (!token) {
    return {
      ok: false,
      status: 401,
      errors: {},
      message: "Debes iniciar sesión para editar reservas."
    };
  }

  const id = String(reservationId || "").trim();
  if (!id) {
    return {
      ok: false,
      status: 400,
      errors: {},
      message: "La reserva es obligatoria."
    };
  }

  const fetchImpl = options.fetchImpl || fetch;
  const endpoint = options.endpoint || `/api/reservations/${id}`;
  const response = await fetchImpl(endpoint, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(normalizedValues)
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      errors: payload.error?.details || {},
      message: payload.error?.code === "VALIDATION_ERROR" || payload.error?.code === "INVALID_DATE_RANGE"
        ? "Revisa los datos de la reserva."
        : payload.error?.message || "No se ha podido actualizar la reserva."
    };
  }

  return {
    ok: true,
    status: response.status,
    reservation: payload.reservation,
    message: "Reserva actualizada correctamente."
  };
}

export function filterReservationsByStatus(reservations, status) {
  const selectedStatus = String(status || "").trim();

  if (!selectedStatus) {
    return reservations;
  }

  return reservations.filter((reservation) => reservation.status === selectedStatus);
}

export async function fetchOwnReservations(options = {}) {
  const token = options.token || "";
  if (!token) {
    return {
      ok: false,
      status: 401,
      reservations: [],
      message: "Debes iniciar sesión para consultar tus reservas."
    };
  }

  const fetchImpl = options.fetchImpl || fetch;
  const endpoint = options.endpoint || "/api/reservations/me";
  const response = await fetchImpl(endpoint, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      reservations: [],
      message: payload.error?.message || "No se han podido cargar tus reservas."
    };
  }

  return {
    ok: true,
    status: response.status,
    reservations: payload.reservations || []
  };
}

export function replaceReservation(reservations, updatedReservation) {
  return reservations.map((reservation) =>
    reservation.id === updatedReservation.id ? updatedReservation : reservation
  );
}

export async function cancelReservationWithApi(reservationId, options = {}) {
  const token = options.token || "";
  if (!token) {
    return {
      ok: false,
      status: 401,
      message: "Debes iniciar sesión para cancelar reservas."
    };
  }

  const id = String(reservationId || "").trim();
  if (!id) {
    return {
      ok: false,
      status: 400,
      message: "La reserva es obligatoria."
    };
  }

  const fetchImpl = options.fetchImpl || fetch;
  const endpoint = options.endpoint || `/api/reservations/${id}/cancel`;
  const response = await fetchImpl(endpoint, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      message: payload.error?.message || "No se ha podido cancelar la reserva."
    };
  }

  return {
    ok: true,
    status: response.status,
    reservation: payload.reservation,
    message: "Reserva cancelada correctamente."
  };
}

export function validateRecurrenceForm(values, baseReservation) {
  const frequency = String(values?.frequency || "").trim().toUpperCase();
  const endDate = String(values?.endDate || "").trim();
  const errors = {};

  if (!baseReservation?.id) {
    errors.baseReservationId = "Selecciona una reserva base.";
  }

  return {
    errors,
    isValid: Object.keys(errors).length === 0,
    values: {
      frequency,
      endDate
    }
  };
}

export async function createRecurrenceWithApi(baseReservation, values, options = {}) {
  const validation = validateRecurrenceForm(values, baseReservation);

  if (!validation.isValid) {
    return {
      ok: false,
      status: 400,
      errors: validation.errors,
      message: "Revisa los datos de la recurrencia."
    };
  }

  const token = options.token || "";
  if (!token) {
    return {
      ok: false,
      status: 401,
      errors: {},
      message: "Debes iniciar sesión para crear recurrencias."
    };
  }

  const fetchImpl = options.fetchImpl || fetch;
  const endpoint = options.endpoint || `/api/reservations/${baseReservation.id}/recurrence`;
  const response = await fetchImpl(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      frequency: validation.values.frequency,
      endDate: validation.values.endDate
    })
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      errors: payload.error?.details || {},
      message: payload.error?.message || "No se han podido crear las reservas recurrentes."
    };
  }

  return {
    ok: true,
    status: response.status,
    createdReservations: payload.createdReservations || [],
    frequency: payload.frequency || validation.values.frequency,
    message: "Reservas recurrentes creadas correctamente."
  };
}
