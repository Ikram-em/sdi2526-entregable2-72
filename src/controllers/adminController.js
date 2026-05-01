const mongoose = require("mongoose");
const Block = require("../models/Block");
const Reservation = require("../models/Reservation");
const Space = require("../models/Space");
const User = require("../models/User");
const { setFlash } = require("../middleware/auth");
const { findBlockConflicts, findReservationConflicts } = require("../services/availabilityService");
const { paginate } = require("../utils/pagination");
const { parseAmenities } = require("../utils/validation");

function buildQueryString(basePath, params) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && String(value) !== "") {
      query.set(key, String(value));
    }
  });

  const serialized = query.toString();
  return serialized ? `${basePath}?${serialized}` : basePath;
}

function normalizeSpaceForm(body = {}) {
  return {
    name: String(body.name || "").trim(),
    type: String(body.type || "").trim(),
    location: String(body.location || "").trim(),
    capacity: Number.parseInt(body.capacity, 10),
    description: String(body.description || "").trim(),
    amenitiesText: String(body.amenitiesText || "").trim()
  };
}

function validateSpaceForm(formData) {
  const errors = [];

  if (!formData.name) {
    errors.push("El nombre del espacio es obligatorio.");
  }

  if (!formData.type) {
    errors.push("El tipo del espacio es obligatorio.");
  }

  if (!formData.location) {
    errors.push("La ubicación del espacio es obligatoria.");
  }

  if (!Number.isInteger(formData.capacity) || formData.capacity < 1) {
    errors.push("La capacidad debe ser un número entero mayor o igual que 1.");
  }

  return errors;
}

async function ensureUniqueActiveSpaceName(name, excludeId = null) {
  const query = { name, active: true };

  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  return Space.findOne(query);
}

async function showSpaceManagement(req, res) {
  const spaces = await Space.find().sort({ active: -1, name: 1 }).lean();

  return res.render("admin/spaces/index", {
    title: "Gestión de espacios",
    spaces,
    errors: [],
    formData: {}
  });
}

async function createSpace(req, res) {
  const formData = normalizeSpaceForm(req.body);
  const errors = validateSpaceForm(formData);
  const duplicated = formData.name ? await ensureUniqueActiveSpaceName(formData.name) : null;

  if (duplicated) {
    errors.push("No se pueden registrar dos espacios activos con el mismo nombre.");
  }

  if (errors.length > 0) {
    const spaces = await Space.find().sort({ active: -1, name: 1 }).lean();
    return res.status(400).render("admin/spaces/index", {
      title: "Gestión de espacios",
      spaces,
      errors,
      formData
    });
  }

  await Space.create({
    name: formData.name,
    type: formData.type,
    location: formData.location,
    capacity: formData.capacity,
    description: formData.description,
    amenities: parseAmenities(formData.amenitiesText),
    active: true
  });

  setFlash(req, "success", "Espacio registrado correctamente.");
  return req.session.save(() => res.redirect("/admin/spaces"));
}

async function showEditSpace(req, res) {
  if (!mongoose.isValidObjectId(req.params.spaceId)) {
    return res.status(404).render("not-found", {
      title: "Espacio no encontrado"
    });
  }

  const space = await Space.findById(req.params.spaceId).lean();

  if (!space) {
    return res.status(404).render("not-found", {
      title: "Espacio no encontrado"
    });
  }

  return res.render("admin/spaces/edit", {
    title: `Editar - ${space.name}`,
    space,
    errors: [],
    formData: {
      name: space.name,
      type: space.type,
      location: space.location,
      capacity: space.capacity,
      description: space.description,
      amenitiesText: (space.amenities || []).join(", ")
    }
  });
}

async function updateSpace(req, res) {
  if (!mongoose.isValidObjectId(req.params.spaceId)) {
    return res.status(404).render("not-found", {
      title: "Espacio no encontrado"
    });
  }

  const space = await Space.findById(req.params.spaceId);

  if (!space) {
    return res.status(404).render("not-found", {
      title: "Espacio no encontrado"
    });
  }

  const formData = normalizeSpaceForm(req.body);
  const errors = validateSpaceForm(formData);

  if (space.active) {
    const duplicated = await ensureUniqueActiveSpaceName(formData.name, space._id);
    if (duplicated) {
      errors.push("Debe mantenerse la unicidad del nombre del espacio entre los espacios activos.");
    }
  }

  if (errors.length > 0) {
    return res.status(400).render("admin/spaces/edit", {
      title: `Editar - ${space.name}`,
      space: space.toObject(),
      errors,
      formData
    });
  }

  space.name = formData.name;
  space.type = formData.type;
  space.location = formData.location;
  space.capacity = formData.capacity;
  space.description = formData.description;
  space.amenities = parseAmenities(formData.amenitiesText);
  await space.save();

  setFlash(req, "success", "Espacio actualizado correctamente.");
  return res.redirect("/admin/spaces");
}

async function toggleSpace(req, res) {
  if (!mongoose.isValidObjectId(req.params.spaceId)) {
    return res.status(404).render("not-found", {
      title: "Espacio no encontrado"
    });
  }

  const space = await Space.findById(req.params.spaceId);

  if (!space) {
    return res.status(404).render("not-found", {
      title: "Espacio no encontrado"
    });
  }

  if (!space.active) {
    const duplicated = await ensureUniqueActiveSpaceName(space.name, space._id);
    if (duplicated) {
      setFlash(req, "error", "No se puede reactivar el espacio mientras exista otro activo con el mismo nombre.");
      return res.redirect("/admin/spaces");
    }
  }

  space.active = !space.active;
  await space.save();
  setFlash(req, "success", `Espacio ${space.active ? "activado" : "desactivado"} correctamente.`);
  return res.redirect("/admin/spaces");
}

async function showBlocks(req, res) {
  if (!mongoose.isValidObjectId(req.params.spaceId)) {
    return res.status(404).render("not-found", {
      title: "Espacio no encontrado"
    });
  }

  const space = await Space.findById(req.params.spaceId).lean();

  if (!space) {
    return res.status(404).render("not-found", {
      title: "Espacio no encontrado"
    });
  }

  const blocks = await Block.find({ space: space._id })
    .populate("createdBy", "firstName lastName")
    .sort({ startAt: -1 })
    .lean();

  return res.render("admin/spaces/blocks", {
    title: `Bloqueos - ${space.name}`,
    space,
    blocks,
    errors: [],
    formData: {}
  });
}

async function createBlock(req, res) {
  if (!mongoose.isValidObjectId(req.params.spaceId)) {
    return res.status(404).render("not-found", {
      title: "Espacio no encontrado"
    });
  }

  const space = await Space.findById(req.params.spaceId).lean();

  if (!space) {
    return res.status(404).render("not-found", {
      title: "Espacio no encontrado"
    });
  }

  const formData = {
    startAt: req.body.startAt || "",
    endAt: req.body.endAt || "",
    reason: String(req.body.reason || "").trim()
  };
  const errors = [];
  const startAt = new Date(formData.startAt);
  const endAt = new Date(formData.endAt);

  if (!formData.startAt || !formData.endAt || !formData.reason) {
    errors.push("Debes indicar inicio, fin y motivo del bloqueo.");
  }

  if (Number.isNaN(startAt.valueOf()) || Number.isNaN(endAt.valueOf())) {
    errors.push("El rango de bloqueo no es válido.");
  } else if (startAt >= endAt) {
    errors.push("El inicio del bloqueo debe ser anterior al fin.");
  }

  if (errors.length === 0) {
    const [blockConflicts, reservationConflicts] = await Promise.all([
      findBlockConflicts(space._id, startAt, endAt),
      findReservationConflicts(space._id, startAt, endAt)
    ]);

    if (blockConflicts.length > 0) {
      errors.push("No se permite crear un bloqueo solapado con otro bloqueo activo del mismo espacio.");
    }

    if (reservationConflicts.length > 0) {
      errors.push("No se permite crear un bloqueo que se solape con una reserva activa del mismo espacio.");
    }
  }

  if (errors.length > 0) {
    const blocks = await Block.find({ space: space._id })
      .populate("createdBy", "firstName lastName")
      .sort({ startAt: -1 })
      .lean();

    return res.status(400).render("admin/spaces/blocks", {
      title: `Bloqueos - ${space.name}`,
      space,
      blocks,
      errors,
      formData
    });
  }

  await Block.create({
    space: space._id,
    createdBy: req.session.user.id,
    startAt,
    endAt,
    reason: formData.reason,
    status: "ACTIVO"
  });

  setFlash(req, "success", "Bloqueo creado correctamente.");
  return req.session.save(() => res.redirect(`/admin/spaces/${space._id}/blocks`));
}

async function cancelBlock(req, res) {
  if (!mongoose.isValidObjectId(req.params.blockId)) {
    return res.status(404).render("not-found", {
      title: "Bloqueo no encontrado"
    });
  }

  const block = await Block.findById(req.params.blockId);

  if (!block) {
    return res.status(404).render("not-found", {
      title: "Bloqueo no encontrado"
    });
  }

  block.status = "CANCELADO";
  await block.save();
  setFlash(req, "success", "Bloqueo cancelado correctamente.");
  return req.session.save(() => res.redirect(`/admin/spaces/${block.space.toString()}/blocks`));
}

function buildReservationFilters(query) {
  return {
    space: query.space || "",
    from: query.from || "",
    to: query.to || ""
  };
}

function buildReservationQuery(filters) {
  const query = {};

  if (filters.space) {
    query.space = filters.space;
  }

  if (filters.from || filters.to) {
    query.$and = [];

    if (filters.from) {
      query.$and.push({ endAt: { $gte: new Date(filters.from) } });
    }

    if (filters.to) {
      const endDate = new Date(filters.to);
      endDate.setHours(23, 59, 59, 999);
      query.$and.push({ startAt: { $lte: endDate } });
    }

    if (query.$and.length === 0) {
      delete query.$and;
    }
  }

  return query;
}

async function showReservations(req, res) {
  const filters = buildReservationFilters(req.query);
  const page = Number.parseInt(req.query.page, 10) || 1;
  const pageSize = 5;
  const query = buildReservationQuery(filters);
  const totalItems = await Reservation.countDocuments(query);
  const pagination = paginate(totalItems, page, pageSize);

  const [reservations, spaces] = await Promise.all([
    Reservation.find(query)
      .populate("user", "dni firstName lastName")
      .populate("space", "name")
      .sort({ startAt: -1 })
      .skip(pagination.skip)
      .limit(pageSize)
      .lean(),
    Space.find().sort({ name: 1 }).lean()
  ]);
  const rows = reservations.map((reservation) => ({
    id: reservation._id.toString(),
    userName: `${reservation.user.firstName} ${reservation.user.lastName}`,
    userDni: reservation.user.dni,
    spaceName: reservation.space.name,
    startAt: reservation.startAt,
    endAt: reservation.endAt,
    status: reservation.status
  }));

  return res.render("admin-reservations", {
    title: "Listado global de reservas",
    reservations: rows,
    spaces,
    filters,
    pagination,
    buildPageLink: (targetPage) =>
      buildQueryString("/admin/reservations", {
        ...filters,
        page: targetPage
      }),
    exportLink: buildQueryString("/admin/reservations/export.csv", filters)
  });
}

async function exportReservationsCsv(req, res) {
  const filters = buildReservationFilters(req.query);
  const query = buildReservationQuery(filters);
  const reservations = await Reservation.find(query)
    .populate("user", "dni firstName lastName")
    .populate("space", "name")
    .sort({ startAt: -1 })
    .lean();

  const header = ["espacio", "usuario", "inicio", "fin", "estado"];
  const rows = reservations.map((reservation) => [
    reservation.space.name,
    `${reservation.user.firstName} ${reservation.user.lastName} (${reservation.user.dni})`,
    new Date(reservation.startAt).toISOString(),
    new Date(reservation.endAt).toISOString(),
    reservation.status
  ]);

  const csv = [header, ...rows]
    .map((columns) =>
      columns
        .map((value) => `"${String(value).replace(/"/g, "\"\"")}"`)
        .join(",")
    )
    .join("\n");

  // Expose CSV as inline content so Selenium tests can assert on the response body.
  // Use text/plain to avoid download behavior in some browsers/drivers when using text/csv.
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  return res.send(csv);
}

async function showUsers(req, res) {
  const page = Number.parseInt(req.query.page, 10) || 1;
  const pageSize = 5;
  const totalItems = await User.countDocuments();
  const pagination = paginate(totalItems, page, pageSize);
  const users = await User.find()
    // Admin users first (tests assert the admin user appears in page 1).
    .sort({ role: 1, lastName: 1, firstName: 1 })
    .skip(pagination.skip)
    .limit(pageSize)
    .lean();

  return res.render("admin/users/index", {
    title: "Listado de usuarios",
    users,
    pagination,
    buildPageLink: (targetPage) => buildQueryString("/admin/users", { page: targetPage })
  });
}

module.exports = {
  cancelBlock,
  createBlock,
  createSpace,
  exportReservationsCsv,
  showBlocks,
  showEditSpace,
  showReservations,
  showSpaceManagement,
  showUsers,
  toggleSpace,
  updateSpace
};
