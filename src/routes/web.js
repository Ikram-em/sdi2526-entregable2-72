const express = require("express");
const { users, spaces, reservations, blocks } = require("../data/mockData");

const router = express.Router();

function isValidDni(dni) {
  const dniPattern = /^(\d{8})([A-Z])$/;
  const letters = "TRWAGMYFPDXBNJZSQVHLCKE";
  const normalized = (dni || "").trim().toUpperCase();
  const match = normalized.match(dniPattern);

  if (!match) {
    return false;
  }

  const number = Number.parseInt(match[1], 10);
  const expectedLetter = letters[number % 23];
  return expectedLetter === match[2];
}

function isValidPassword(password) {
  const rule = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])\S{12,20}$/;
  return rule.test(password || "");
}

function setFlash(req, type, message) {
  req.session.flash = { type, message };
}

function requireGuest(req, res, next) {
  if (req.session.user) {
    return res.redirect(req.session.user.role === "admin" ? "/admin/reservations" : "/spaces");
  }
  return next();
}

function requireAuth(req, res, next) {
  if (!req.session.user) {
    setFlash(req, "error", "Debes iniciar sesion para acceder a esta zona.");
    return res.redirect("/login");
  }
  return next();
}

function requireStandard(req, res, next) {
  if (!req.session.user) {
    setFlash(req, "error", "Debes iniciar sesion para acceder a esta zona.");
    return res.redirect("/login");
  }

  if (req.session.user.role !== "standard") {
    setFlash(req, "error", "Acceso denegado. Esta vista es solo para usuarios estandar.");
    return res.redirect("/admin/reservations");
  }

  return next();
}

function requireAdmin(req, res, next) {
  if (!req.session.user) {
    setFlash(req, "error", "Debes iniciar sesion para acceder a esta zona.");
    return res.redirect("/login");
  }

  if (req.session.user.role !== "admin") {
    setFlash(req, "error", "Acceso denegado. No puedes acceder a recursos de administracion.");
    return res.redirect("/spaces");
  }

  return next();
}

function getVisibleSpaces(filters = {}) {
  return spaces.filter((space) => {
    if (!space.active) {
      return false;
    }

    if (filters.type && space.type !== filters.type) {
      return false;
    }

    if (filters.minCapacity && space.capacity < Number.parseInt(filters.minCapacity, 10)) {
      return false;
    }

    return true;
  });
}

function getSpaceById(spaceId) {
  return spaces.find((space) => space.id === spaceId && space.active);
}

function getAvailabilityItems(spaceId, from, to) {
  if (!from || !to) {
    return [];
  }

  const fromDate = new Date(from);
  const toDate = new Date(to);

  if (Number.isNaN(fromDate.valueOf()) || Number.isNaN(toDate.valueOf())) {
    return [];
  }

  const reservationItems = reservations
    .filter((item) => item.spaceId === spaceId && item.status === "ACTIVA")
    .filter((item) => new Date(item.start) < toDate && new Date(item.end) > fromDate)
    .map((item) => ({
      type: "Reserva",
      start: item.start,
      end: item.end,
      label: `Reserva activa - ${item.userDni}`
    }));

  const blockItems = blocks
    .filter((item) => item.spaceId === spaceId && item.status === "ACTIVO")
    .filter((item) => new Date(item.start) < toDate && new Date(item.end) > fromDate)
    .map((item) => ({
      type: "Bloqueo",
      start: item.start,
      end: item.end,
      label: item.reason
    }));

  return [...reservationItems, ...blockItems].sort((a, b) => new Date(a.start) - new Date(b.start));
}

router.get("/", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login");
  }

  return res.redirect(req.session.user.role === "admin" ? "/admin/reservations" : "/spaces");
});

router.get("/register", requireGuest, (req, res) => {
  res.render("auth/register", {
    title: "Registro de usuario",
    formData: {},
    errors: []
  });
});

router.post("/register", requireGuest, (req, res) => {
  const body = req.body || {};
  const formData = {
    dni: (body.dni || "").trim().toUpperCase(),
    firstName: (body.firstName || "").trim(),
    lastName: (body.lastName || "").trim()
  };
  const password = body.password || "";
  const confirmPassword = body.confirmPassword || "";
  const errors = [];

  if (!formData.dni || !formData.firstName || !formData.lastName || !password || !confirmPassword) {
    errors.push("Todos los campos son obligatorios.");
  }

  if (formData.dni && !isValidDni(formData.dni)) {
    errors.push("El DNI introducido no es valido.");
  }

  if (users.some((user) => user.dni === formData.dni)) {
    errors.push("Ya existe un usuario registrado con ese DNI.");
  }

  if (!isValidPassword(password)) {
    errors.push("La contrasena debe tener entre 12 y 20 caracteres, incluir mayuscula, minuscula, digito, simbolo y no contener espacios.");
  }

  if (password !== confirmPassword) {
    errors.push("La contrasena y su confirmacion no coinciden.");
  }

  if (errors.length > 0) {
    return res.status(400).render("auth/register", {
      title: "Registro de usuario",
      errors,
      formData
    });
  }

  users.push({
    dni: formData.dni,
    firstName: formData.firstName,
    lastName: formData.lastName,
    password,
    role: "standard"
  });

  req.session.user = {
    dni: formData.dni,
    fullName: `${formData.firstName} ${formData.lastName}`,
    role: "standard"
  };

  setFlash(req, "success", "Registro completado correctamente.");
  return res.redirect("/spaces");
});

router.get("/login", requireGuest, (req, res) => {
  if (req.query.loggedOut === "1") {
    res.locals.flash = {
      type: "success",
      message: "Has cerrado sesion correctamente."
    };
  }

  res.render("auth/login", {
    title: "Inicio de sesion",
    formData: {},
    error: null
  });
});

router.post("/login", requireGuest, (req, res) => {
  const body = req.body || {};
  const dni = (body.dni || "").trim().toUpperCase();
  const password = body.password || "";
  const user = users.find((entry) => entry.dni === dni);

  if (!dni || !password) {
    return res.status(400).render("auth/login", {
      title: "Inicio de sesion",
      error: "Debes indicar DNI y contrasena.",
      formData: { dni }
    });
  }

  if (!user) {
    return res.status(401).render("auth/login", {
      title: "Inicio de sesion",
      error: "No existe ningun usuario registrado con ese DNI.",
      formData: { dni }
    });
  }

  if (user.password !== password) {
    return res.status(401).render("auth/login", {
      title: "Inicio de sesion",
      error: "La contrasena no es correcta.",
      formData: { dni }
    });
  }

  req.session.user = {
    dni: user.dni,
    fullName: `${user.firstName} ${user.lastName}`,
    role: user.role
  };

  setFlash(req, "success", `Bienvenido/a, ${user.firstName}.`);
  return res.redirect(user.role === "admin" ? "/admin/reservations" : "/spaces");
});

router.post("/logout", requireAuth, (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login?loggedOut=1");
  });
});

router.get("/spaces", requireStandard, (req, res) => {
  const filters = {
    type: req.query.type || "",
    minCapacity: req.query.minCapacity || ""
  };
  const filteredSpaces = getVisibleSpaces(filters);
  const types = [...new Set(spaces.filter((space) => space.active).map((space) => space.type))];

  res.render("spaces/list", {
    title: "Listado de espacios",
    spaces: filteredSpaces,
    filters,
    types
  });
});

router.get("/spaces/:spaceId", requireStandard, (req, res) => {
  const space = getSpaceById(req.params.spaceId);

  if (!space) {
    return res.status(404).render("not-found", {
      title: "Espacio no encontrado"
    });
  }

  return res.render("spaces/detail", {
    title: `Detalle - ${space.name}`,
    space
  });
});

router.get("/spaces/:spaceId/availability", requireStandard, (req, res) => {
  const space = getSpaceById(req.params.spaceId);

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
      errors = ["El rango introducido no es valido."];
    } else if (fromDate >= toDate) {
      errors = ["La fecha y hora inicial debe ser anterior a la final."];
    } else {
      items = getAvailabilityItems(space.id, range.from, range.to);
    }
  }

  return res.render("spaces/availability", {
    title: `Disponibilidad - ${space.name}`,
    space,
    range,
    items,
    errors
  });
});

router.get("/account/password", requireStandard, (req, res) => {
  res.render("auth/change-password", {
    title: "Cambiar contrasena",
    errors: []
  });
});

router.post("/account/password", requireStandard, (req, res) => {
  const body = req.body || {};
  const currentPassword = body.currentPassword || "";
  const newPassword = body.newPassword || "";
  const confirmPassword = body.confirmPassword || "";
  const currentUser = users.find((user) => user.dni === req.session.user.dni);
  const errors = [];

  if (!currentPassword || !newPassword || !confirmPassword) {
    errors.push("Todos los campos son obligatorios.");
  }

  if (currentUser.password !== currentPassword) {
    errors.push("La contrasena actual no es correcta.");
  }

  if (!isValidPassword(newPassword)) {
    errors.push("La nueva contrasena no cumple la politica de seguridad.");
  }

  if (newPassword !== confirmPassword) {
    errors.push("La nueva contrasena y su confirmacion no coinciden.");
  }

  if (errors.length > 0) {
    return res.status(400).render("auth/change-password", {
      title: "Cambiar contrasena",
      errors
    });
  }

  currentUser.password = newPassword;
  setFlash(req, "success", "Contrasena actualizada correctamente.");
  return res.redirect("/spaces");
});

router.get("/admin/reservations", requireAdmin, (req, res) => {
  const rows = reservations.map((reservation) => {
    const user = users.find((entry) => entry.dni === reservation.userDni);
    const space = spaces.find((entry) => entry.id === reservation.spaceId);

    return {
      ...reservation,
      userName: `${user.firstName} ${user.lastName}`,
      spaceName: space.name
    };
  });

  return res.render("admin-reservations", {
    title: "Listado global de reservas",
    reservations: rows
  });
});

module.exports = router;
