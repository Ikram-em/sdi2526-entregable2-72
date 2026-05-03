const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Reservation = require("../models/Reservation");
const Space = require("../models/Space");
const { buildSessionUser, setFlash } = require("../middleware/auth");
const { isValidDni, isValidPassword, normalizeDni } = require("../utils/validation");

/**
 * Renderiza el formulario de registro para usuarios no autenticados.
 *
 * @param {import("express").Request} req Peticion HTTP.
 * @param {import("express").Response} res Respuesta HTTP.
 * @returns {Promise<void>}
 */
async function showRegister(req, res) {
  res.render("auth/register", {
    title: "Registro de usuario",
    formData: {},
    errors: []
  });
}

/**
 * Registra un nuevo usuario estándar, valida el formulario y crea la sesión.
 *
 * @param {import("express").Request} req Peticion HTTP con los datos del formulario.
 * @param {import("express").Response} res Respuesta HTTP.
 * @returns {Promise<void>}
 */
async function register(req, res) {
  const body = req.body || {};
  const formData = {
    dni: normalizeDni(body.dni),
    firstName: String(body.firstName || "").trim(),
    lastName: String(body.lastName || "").trim()
  };
  const password = body.password || "";
  const confirmPassword = body.confirmPassword || "";
  const errors = [];

  if (!formData.dni || !formData.firstName || !formData.lastName || !password || !confirmPassword) {
    errors.push("Todos los campos son obligatorios.");
  }

  if (formData.dni && !isValidDni(formData.dni)) {
    errors.push("El DNI introducido no es válido.");
  }

  if (!isValidPassword(password)) {
    errors.push("La contraseña debe tener entre 12 y 20 caracteres, incluir mayúscula, minúscula, dígito, símbolo y no contener espacios.");
  }

  if (password !== confirmPassword) {
    errors.push("La contraseña y su confirmación no coinciden.");
  }

  const existingUser = formData.dni ? await User.findOne({ dni: formData.dni }) : null;
  if (existingUser) {
    errors.push("Ya existe un usuario registrado con ese DNI.");
  }

  if (errors.length > 0) {
    return res.status(400).render("auth/register", {
      title: "Registro de usuario",
      errors,
      formData
    });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    dni: formData.dni,
    firstName: formData.firstName,
    lastName: formData.lastName,
    passwordHash,
    role: "standard"
  });

  req.session.user = buildSessionUser(user);
  setFlash(req, "success", "Registro completado correctamente.");
  return req.session.save(() => res.redirect("/spaces"));
}

/**
 * Renderiza el formulario de inicio de sesión.
 *
 * @param {import("express").Request} req Peticion HTTP.
 * @param {import("express").Response} res Respuesta HTTP.
 * @returns {Promise<void>}
 */
async function showLogin(req, res) {
  if (req.query.loggedOut === "1") {
    res.locals.flash = {
      type: "success",
      message: "Has cerrado sesión correctamente."
    };
  }

  res.render("auth/login", {
    title: "Inicio de sesión",
    formData: {},
    error: null
  });
}

/**
 * Autentica a un usuario por DNI y contraseña y redirige según su rol.
 *
 * @param {import("express").Request} req Peticion HTTP con credenciales.
 * @param {import("express").Response} res Respuesta HTTP.
 * @returns {Promise<void>}
 */
async function login(req, res) {
  const body = req.body || {};
  const dni = normalizeDni(body.dni);
  const password = body.password || "";

  if (!dni || !password) {
    return res.status(400).render("auth/login", {
      title: "Inicio de sesión",
      error: "Debes indicar DNI y contraseña.",
      formData: { dni }
    });
  }

  const user = await User.findOne({ dni });
  if (!user) {
    return res.status(401).render("auth/login", {
      title: "Inicio de sesión",
      error: "No existe ningún usuario registrado con ese DNI.",
      formData: { dni }
    });
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    return res.status(401).render("auth/login", {
      title: "Inicio de sesión",
      error: "La contraseña no es correcta.",
      formData: { dni }
    });
  }

  req.session.user = buildSessionUser(user);
  setFlash(req, "success", `Bienvenido/a, ${user.firstName}.`);
  return req.session.save(() => res.redirect(user.role === "admin" ? "/admin/reservations" : "/spaces"));
}

/**
 * Cierra la sesión actual y redirige al login.
 *
 * @param {import("express").Request} req Peticion HTTP.
 * @param {import("express").Response} res Respuesta HTTP.
 * @returns {Promise<void>}
 */
async function logout(req, res) {
  req.session.destroy(() => {
    res.redirect("/login?loggedOut=1");
  });
}

/**
 * Renderiza la vista para cambiar la contraseña del usuario estándar.
 *
 * @param {import("express").Request} req Peticion HTTP.
 * @param {import("express").Response} res Respuesta HTTP.
 * @returns {Promise<void>}
 */
async function showChangePassword(req, res) {
  res.render("auth/change-password", {
    title: "Cambiar contraseña",
    errors: []
  });
}

/**
 * Muestra el perfil del usuario autenticado con métricas básicas.
 *
 * @param {import("express").Request} req Peticion HTTP.
 * @param {import("express").Response} res Respuesta HTTP.
 * @returns {Promise<void>}
 */
async function showProfile(req, res) {
  const user = await User.findById(req.session.user.id).lean();

  if (!user) {
    setFlash(req, "error", "No se ha podido cargar tu perfil.");
    return res.redirect("/login");
  }

  const metrics = user.role === "admin"
    ? {
        primaryLabel: "Reservas registradas",
        primaryValue: await Reservation.countDocuments(),
        secondaryLabel: "Espacios activos",
        secondaryValue: await Space.countDocuments({ active: true })
      }
    : {
        primaryLabel: "Reservas activas",
        primaryValue: await Reservation.countDocuments({ user: user._id, status: "ACTIVA" }),
        secondaryLabel: "Reservas totales",
        secondaryValue: await Reservation.countDocuments({ user: user._id })
      };

  return res.render("auth/profile", {
    title: "Mi perfil",
    profile: user,
    metrics
  });
}

/**
 * Actualiza la contraseña del usuario autenticado tras validar la política de seguridad.
 *
 * @param {import("express").Request} req Peticion HTTP con la contraseña actual y la nueva.
 * @param {import("express").Response} res Respuesta HTTP.
 * @returns {Promise<void>}
 */
async function changePassword(req, res) {
  const body = req.body || {};
  const currentPassword = body.currentPassword || "";
  const newPassword = body.newPassword || "";
  const confirmPassword = body.confirmPassword || "";
  const errors = [];
  const user = await User.findById(req.session.user.id);

  if (!currentPassword || !newPassword || !confirmPassword) {
    errors.push("Todos los campos son obligatorios.");
  }

  if (user && !(await bcrypt.compare(currentPassword, user.passwordHash))) {
    errors.push("La contraseña actual no es correcta.");
  }

  if (!isValidPassword(newPassword)) {
    errors.push("La nueva contraseña no cumple la política de seguridad.");
  }

  if (newPassword !== confirmPassword) {
    errors.push("La nueva contraseña y su confirmación no coinciden.");
  }

  if (errors.length > 0) {
    return res.status(400).render("auth/change-password", {
      title: "Cambiar contraseña",
      errors
    });
  }

  user.passwordHash = await bcrypt.hash(newPassword, 10);
  await user.save();
  setFlash(req, "success", "Contraseña actualizada correctamente.");
  return req.session.save(() => res.redirect("/spaces"));
}

module.exports = {
  changePassword,
  login,
  logout,
  register,
  showChangePassword,
  showProfile,
  showLogin,
  showRegister
};
