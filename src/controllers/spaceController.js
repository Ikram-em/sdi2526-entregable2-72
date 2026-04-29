const mongoose = require("mongoose");
const Reservation = require("../models/Reservation");
const Space = require("../models/Space");
const { setFlash } = require("../middleware/auth");
const { getAvailabilityItems } = require("../services/availabilityService");

async function listSpaces(req, res) {
  const filters = {
    type: req.query.type || "",
    minCapacity: req.query.minCapacity || ""
  };

  const query = { active: true };

  if (filters.type) {
    query.type = filters.type;
  }

  if (filters.minCapacity) {
    query.capacity = { $gte: Number.parseInt(filters.minCapacity, 10) || 1 };
  }

  const [spaces, types] = await Promise.all([
    Space.find(query).sort({ name: 1 }).lean(),
    Space.distinct("type", { active: true })
  ]);

  return res.render("spaces/list", {
    title: "Listado de espacios",
    spaces,
    filters,
    types
  });
}

async function showSpace(req, res) {
  if (!mongoose.isValidObjectId(req.params.spaceId)) {
    return res.status(404).render("not-found", {
      title: "Espacio no encontrado"
    });
  }

  const space = await Space.findOne({ _id: req.params.spaceId, active: true }).lean();

  if (!space) {
    return res.status(404).render("not-found", {
      title: "Espacio no encontrado"
    });
  }

  return res.render("spaces/detail", {
    title: `Detalle - ${space.name}`,
    space
  });
}

async function showAvailability(req, res) {
  if (!mongoose.isValidObjectId(req.params.spaceId)) {
    return res.status(404).render("not-found", {
      title: "Espacio no encontrado"
    });
  }

  const space = await Space.findOne({ _id: req.params.spaceId, active: true }).lean();

  if (!space) {
    return res.status(404).render("not-found", {
      title: "Espacio no encontrado"
    });
  }

  const range = {
    from: req.query.from || "",
    to: req.query.to || ""
  };
  let errors = [];
  let items = [];

  if (range.from || range.to) {
    const fromDate = new Date(range.from);
    const toDate = new Date(range.to);

    if (!range.from || !range.to) {
      errors = ["Debes indicar inicio y fin del rango."];
    } else if (Number.isNaN(fromDate.valueOf()) || Number.isNaN(toDate.valueOf())) {
      errors = ["El rango introducido no es válido."];
    } else if (fromDate >= toDate) {
      errors = ["La fecha y hora inicial debe ser anterior a la final."];
    } else {
      items = await getAvailabilityItems(space._id, fromDate, toDate);
    }
  }

  return res.render("spaces/availability", {
    title: `Disponibilidad - ${space.name}`,
    space,
    range,
    items,
    errors
  });
}

async function showMyReservations(req, res) {
  const statusFilter = req.query.status || "";
  const query = { user: req.session.user.id };

  if (statusFilter) {
    query.status = statusFilter;
  }

  const reservations = await Reservation.find(query)
    .populate("space", "name type location")
    .sort({ startAt: -1 })
    .lean();

  return res.render("standard/my-reservations", {
    title: "Mis reservas",
    reservations,
    statusFilter
  });
}

async function cancelOwnReservation(req, res) {
  if (!mongoose.isValidObjectId(req.params.reservationId)) {
    setFlash(req, "error", "No puedes cancelar una reserva ajena o inexistente.");
    return res.redirect("/reservations/mine");
  }

  const reservation = await Reservation.findOne({
    _id: req.params.reservationId,
    user: req.session.user.id
  }).populate("space", "name");

  if (!reservation) {
    setFlash(req, "error", "No puedes cancelar una reserva ajena o inexistente.");
    return res.redirect("/reservations/mine");
  }

  if (reservation.status === "CANCELADA") {
    setFlash(req, "error", "La reserva ya estaba cancelada.");
    return res.redirect("/reservations/mine");
  }

  reservation.status = "CANCELADA";
  await reservation.save();
  setFlash(req, "success", `Reserva cancelada correctamente para ${reservation.space.name}.`);
  return res.redirect("/reservations/mine");
}

module.exports = {
  cancelOwnReservation,
  listSpaces,
  showAvailability,
  showMyReservations,
  showSpace
};
