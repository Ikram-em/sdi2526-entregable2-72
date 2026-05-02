const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const User = require("../models/User");
const Space = require("../models/Space");
const Reservation = require("../models/Reservation");
const Block = require("../models/Block");
const { findBlockConflicts, findReservationConflicts } = require("../services/availabilityService");
const { issueToken } = require("../services/apiTokenService");
const { json, sendError } = require("../utils/apiResponses");
const { normalizeDni } = require("../utils/validation");

const RECURRENCE_FREQUENCIES = new Set(["DAILY", "WEEKLY", "MONTHLY", "YEARLY"]);

function serializeUser(user) {
  return {
    id: user._id.toString(),
    dni: user.dni,
    name: `${user.firstName} ${user.lastName}`,
    role: user.role.toUpperCase()
  };
}

function serializeSpace(space) {
  return {
    id: space._id.toString(),
    name: space.name,
    active: space.active
  };
}

function serializeBlock(block) {
  return {
    id: block._id.toString(),
    spaceId: block.space.toString(),
    startDateTime: block.startAt.toISOString(),
    endDateTime: block.endAt.toISOString(),
    status: block.status,
    reason: block.reason
  };
}

function serializeReservation(reservation) {
  const spaceId = reservation.space?._id ? reservation.space._id.toString() : reservation.space.toString();
  const spaceName = reservation.space?.name || spaceId;

  return {
    id: reservation._id.toString(),
    spaceId,
    spaceName,
    startDateTime: reservation.startAt.toISOString(),
    endDateTime: reservation.endAt.toISOString(),
    purpose: reservation.reason || "",
    status: reservation.status,
    createdAt: reservation.createdAt.toISOString()
  };
}

function parseDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? null : date;
}

function validateReservationInput(body) {
  const details = {};
  const spaceId = String(body.spaceId || "").trim();
  const purpose = typeof body.purpose === "string" ? body.purpose.trim() : "";
  const startAt = parseDate(body.startDateTime);
  const endAt = parseDate(body.endDateTime);

  if (!spaceId) {
    details.spaceId = "El espacio es obligatorio.";
  }

  if (!body.startDateTime) {
    details.startDateTime = "La fecha/hora de inicio es obligatoria.";
  } else if (!startAt) {
    details.startDateTime = "La fecha/hora de inicio no es válida.";
  }

  if (!body.endDateTime) {
    details.endDateTime = "La fecha/hora de fin es obligatoria.";
  } else if (!endAt) {
    details.endDateTime = "La fecha/hora de fin no es válida.";
  }

  return {
    details,
    endAt,
    purpose,
    spaceId,
    startAt
  };
}

async function ensureReservationConstraints({ spaceId, startAt, endAt, excludeReservationId = null }) {
  if (!mongoose.isValidObjectId(spaceId)) {
    return {
      error: {
        statusCode: 404,
        code: "SPACE_NOT_FOUND",
        message: "El espacio indicado no existe."
      }
    };
  }

  if (startAt >= endAt) {
    return {
      error: {
        statusCode: 400,
        code: "INVALID_DATE_RANGE",
        message: "La fecha/hora de inicio debe ser anterior a la de fin."
      }
    };
  }

  if (startAt.getTime() < Date.now()) {
    return {
      error: {
        statusCode: 400,
        code: "PAST_RESERVATION",
        message: "No se pueden crear reservas en el pasado."
      }
    };
  }

  const space = await Space.findById(spaceId);
  if (!space) {
    return {
      error: {
        statusCode: 404,
        code: "SPACE_NOT_FOUND",
        message: "El espacio indicado no existe."
      }
    };
  }

  if (!space.active) {
    return {
      error: {
        statusCode: 409,
        code: "SPACE_INACTIVE",
        message: "No se pueden reservar espacios desactivados."
      }
    };
  }

  const [reservationConflicts, blockConflicts] = await Promise.all([
    findReservationConflicts(spaceId, startAt, endAt, excludeReservationId),
    findBlockConflicts(spaceId, startAt, endAt)
  ]);

  if (reservationConflicts.length > 0) {
    return {
      error: {
        statusCode: 409,
        code: "RESERVATION_OVERLAP",
        message: "La reserva solicitada se solapa con otra reserva activa del mismo espacio."
      }
    };
  }

  if (blockConflicts.length > 0) {
    return {
      error: {
        statusCode: 409,
        code: "BLOCK_OVERLAP",
        message: "La reserva solicitada coincide con un bloqueo activo del espacio."
      }
    };
  }

  return { space };
}

function addFrequency(date, frequency) {
  const nextDate = new Date(date);

  if (frequency === "DAILY") {
    nextDate.setDate(nextDate.getDate() + 1);
  } else if (frequency === "WEEKLY") {
    nextDate.setDate(nextDate.getDate() + 7);
  } else if (frequency === "MONTHLY") {
    nextDate.setMonth(nextDate.getMonth() + 1);
  } else if (frequency === "YEARLY") {
    nextDate.setFullYear(nextDate.getFullYear() + 1);
  }

  return nextDate;
}

function normalizeRecurrenceEndDate(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) {
    return null;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(String(value))) {
    date.setHours(23, 59, 59, 999);
  }

  return date;
}

function calculateRecurrenceCount(baseStartAt, endDate, frequency) {
  let count = 0;
  let cursor = baseStartAt;

  while (true) {
    cursor = addFrequency(cursor, frequency);

    if (cursor > endDate) {
      return count;
    }

    count += 1;
  }
}

async function health(req, res) {
  return json(res, 200, { status: "ok" });
}

async function login(req, res) {
  const dni = normalizeDni(req.body?.dni);
  const password = req.body?.password || "";
  const details = {};

  if (!dni) {
    details.dni = "El DNI es obligatorio.";
  }

  if (!password) {
    details.password = "La contrasena es obligatoria.";
  }

  if (Object.keys(details).length > 0) {
    return sendError(res, 400, "VALIDATION_ERROR", "Revisa los datos de autenticacion.", details);
  }

  const user = await User.findOne({ dni });
  if (!user) {
    return sendError(res, 401, "INVALID_CREDENTIALS", "Inicio de sesion no correcto.");
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    return sendError(res, 401, "INVALID_CREDENTIALS", "Inicio de sesion no correcto.");
  }

  const token = issueToken(user._id);
  return json(res, 200, {
    token,
    user: serializeUser(user)
  });
}

async function listSpaces(req, res) {
  const [spaces, activeBlocks] = await Promise.all([
    Space.find({ active: true }).sort({ name: 1 }).lean(),
    Block.find({ status: "ACTIVO" }).lean()
  ]);

  return json(res, 200, {
    spaces: spaces.map(serializeSpace),
    activeBlocks: activeBlocks.map(serializeBlock)
  });
}

async function createReservation(req, res) {
  const { details, endAt, purpose, spaceId, startAt } = validateReservationInput(req.body || {});

  if (Object.keys(details).length > 0) {
    return sendError(res, 400, "VALIDATION_ERROR", "Revisa los datos de la reserva.", details);
  }

  const constraintResult = await ensureReservationConstraints({ spaceId, startAt, endAt });
  if (constraintResult.error) {
    return sendError(
      res,
      constraintResult.error.statusCode,
      constraintResult.error.code,
      constraintResult.error.message
    );
  }

  const reservation = await Reservation.create({
    user: req.apiUser._id,
    space: constraintResult.space._id,
    startAt,
    endAt,
    reason: purpose,
    status: "ACTIVA"
  });

  await reservation.populate("space", "name");

  return json(res, 201, {
    reservation: serializeReservation(reservation)
  });
}

async function listOwnReservations(req, res) {
  const reservations = await Reservation.find({ user: req.apiUser._id })
    .populate("space", "name")
    .sort({ startAt: -1 });

  return json(res, 200, {
    reservations: reservations.map(serializeReservation)
  });
}

async function cancelReservation(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return sendError(res, 404, "RESERVATION_NOT_FOUND", "La reserva indicada no existe.");
  }

  const reservation = await Reservation.findById(req.params.id).populate("space", "name");
  if (!reservation) {
    return sendError(res, 404, "RESERVATION_NOT_FOUND", "La reserva indicada no existe.");
  }

  if (reservation.user.toString() !== req.apiUser._id.toString()) {
    return sendError(res, 403, "FORBIDDEN", "Solo puedes cancelar reservas propias.");
  }

  if (reservation.status === "CANCELADA") {
    return sendError(res, 409, "ALREADY_CANCELLED", "La reserva ya estaba cancelada.");
  }

  reservation.status = "CANCELADA";
  await reservation.save();

  return json(res, 200, {
    reservation: serializeReservation(reservation)
  });
}

async function updateReservation(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return sendError(res, 404, "RESERVATION_NOT_FOUND", "La reserva indicada no existe.");
  }

  const reservation = await Reservation.findById(req.params.id);
  if (!reservation) {
    return sendError(res, 404, "RESERVATION_NOT_FOUND", "La reserva indicada no existe.");
  }

  if (reservation.user.toString() !== req.apiUser._id.toString()) {
    return sendError(res, 403, "FORBIDDEN", "Solo puedes editar reservas propias.");
  }

  if (reservation.status === "CANCELADA") {
    return sendError(res, 409, "ALREADY_CANCELLED", "No se puede editar una reserva cancelada.");
  }

  const { details, endAt, purpose, spaceId, startAt } = validateReservationInput(req.body || {});
  if (Object.keys(details).length > 0) {
    return sendError(res, 400, "VALIDATION_ERROR", "Revisa los datos de la reserva.", details);
  }

  const constraintResult = await ensureReservationConstraints({
    spaceId,
    startAt,
    endAt,
    excludeReservationId: reservation._id.toString()
  });
  if (constraintResult.error) {
    return sendError(
      res,
      constraintResult.error.statusCode,
      constraintResult.error.code,
      constraintResult.error.message
    );
  }

  reservation.space = constraintResult.space._id;
  reservation.startAt = startAt;
  reservation.endAt = endAt;
  reservation.reason = purpose;
  await reservation.save();
  await reservation.populate("space", "name");

  return json(res, 200, {
    reservation: serializeReservation(reservation)
  });
}

async function createRecurrence(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return sendError(res, 404, "RESERVATION_NOT_FOUND", "La reserva indicada no existe.");
  }

  const reservation = await Reservation.findById(req.params.id).populate("space", "name active");
  if (!reservation) {
    return sendError(res, 404, "RESERVATION_NOT_FOUND", "La reserva indicada no existe.");
  }

  if (reservation.user.toString() !== req.apiUser._id.toString()) {
    return sendError(res, 403, "FORBIDDEN", "Solo puedes crear recurrencias de reservas propias.");
  }

  if (reservation.status === "CANCELADA") {
    return sendError(
      res,
      409,
      "ALREADY_CANCELLED",
      "No se puede crear recurrencia desde una reserva cancelada."
    );
  }

  const frequency = String(req.body?.frequency || "").trim().toUpperCase();
  const endDate = normalizeRecurrenceEndDate(req.body?.endDate);
  const count = endDate
    ? calculateRecurrenceCount(reservation.startAt, endDate, frequency)
    : Number.parseInt(req.body?.count, 10);

  if (!RECURRENCE_FREQUENCIES.has(frequency)) {
    return sendError(
      res,
      400,
      "INVALID_FREQUENCY",
      "La frecuencia indicada no es válida."
    );
  }

  if (!Number.isInteger(count) || count < 1) {
    return sendError(
      res,
      400,
      "INVALID_COUNT",
      endDate
        ? "La fecha fin debe permitir al menos una recurrencia."
        : "El número de recurrencias debe ser un entero mayor que cero."
    );
  }

  const candidates = [];
  let cursorStart = reservation.startAt;
  let cursorEnd = reservation.endAt;

  for (let index = 0; index < count; index += 1) {
    cursorStart = addFrequency(cursorStart, frequency);
    cursorEnd = addFrequency(cursorEnd, frequency);

    const constraintResult = await ensureReservationConstraints({
      spaceId: reservation.space._id.toString(),
      startAt: cursorStart,
      endAt: cursorEnd
    });

    if (constraintResult.error) {
      return sendError(
        res,
        409,
        "RECURRENCE_OVERLAP",
        "La recurrencia solicitada genera al menos un solape o incumple las reglas de reserva."
      );
    }

    candidates.push({
      user: req.apiUser._id,
      space: reservation.space._id,
      startAt: new Date(cursorStart),
      endAt: new Date(cursorEnd),
      reason: reservation.reason || "",
      status: "ACTIVA"
    });
  }

  const createdReservations = await Reservation.insertMany(candidates);
  await Reservation.populate(createdReservations, { path: "space", select: "name" });

  return json(res, 201, {
    baseReservationId: reservation._id.toString(),
    frequency,
    createdReservations: createdReservations.map(serializeReservation)
  });
}

module.exports = {
  cancelReservation,
  createRecurrence,
  createReservation,
  health,
  listOwnReservations,
  listSpaces,
  login,
  updateReservation
};
