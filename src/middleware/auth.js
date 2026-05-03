const User = require("../models/User");

/**
 * Guarda un mensaje flash en la sesión para mostrarlo en la siguiente respuesta.
 *
 * @param {import("express").Request} req Peticion HTTP.
 * @param {"success"|"error"} type Tipo de mensaje.
 * @param {string} message Texto del mensaje.
 */
function setFlash(req, type, message) {
  req.session.flash = { type, message };
}

/**
 * Proyecta un usuario persistido a la forma mínima almacenada en sesión.
 *
 * @param {import("../models/User")} user Documento de usuario.
 * @returns {{id: string, dni: string, fullName: string, role: string}}
 */
function buildSessionUser(user) {
  return {
    id: user._id.toString(),
    dni: user.dni,
    fullName: `${user.firstName} ${user.lastName}`,
    role: user.role
  };
}

/**
 * Sincroniza el usuario guardado en sesión con la base de datos.
 *
 * @param {import("express").Request} req Peticion HTTP.
 * @param {import("express").Response} res Respuesta HTTP.
 * @param {import("express").NextFunction} next Siguiente middleware.
 * @returns {Promise<void>}
 */
async function syncSessionUser(req, res, next) {
  if (!req.session.user?.id) {
    return next();
  }

  try {
    const user = await User.findById(req.session.user.id);
    if (user) {
      req.session.user = buildSessionUser(user);
    }
  } catch (error) {
    // Keep the current session if the database lookup fails transiently.
  }

  return next();
}

/**
 * Restringe el acceso a visitantes anónimos.
 *
 * @param {import("express").Request} req Peticion HTTP.
 * @param {import("express").Response} res Respuesta HTTP.
 * @param {import("express").NextFunction} next Siguiente middleware.
 * @returns {void}
 */
function requireGuest(req, res, next) {
  if (req.session.user) {
    return res.redirect(req.session.user.role === "admin" ? "/admin/reservations" : "/spaces");
  }

  return next();
}

/**
 * Obliga a que exista una sesión autenticada.
 *
 * @param {import("express").Request} req Peticion HTTP.
 * @param {import("express").Response} res Respuesta HTTP.
 * @param {import("express").NextFunction} next Siguiente middleware.
 * @returns {void}
 */
function requireAuth(req, res, next) {
  if (!req.session.user) {
    setFlash(req, "error", "Debes iniciar sesión para acceder a esta zona.");
    return res.redirect("/login");
  }

  return next();
}

/**
 * Permite acceso solo a usuarios estándar autenticados.
 *
 * @param {import("express").Request} req Peticion HTTP.
 * @param {import("express").Response} res Respuesta HTTP.
 * @param {import("express").NextFunction} next Siguiente middleware.
 * @returns {void}
 */
function requireStandard(req, res, next) {
  if (!req.session.user) {
    setFlash(req, "error", "Debes iniciar sesión para acceder a esta zona.");
    return res.redirect("/login");
  }

  if (req.session.user.role !== "standard") {
    setFlash(req, "error", "Acceso denegado. Esta vista es solo para usuarios estándar.");
    return res.redirect("/admin/reservations");
  }

  return next();
}

/**
 * Permite acceso solo a usuarios administradores autenticados.
 *
 * @param {import("express").Request} req Peticion HTTP.
 * @param {import("express").Response} res Respuesta HTTP.
 * @param {import("express").NextFunction} next Siguiente middleware.
 * @returns {void}
 */
function requireAdmin(req, res, next) {
  if (!req.session.user) {
    setFlash(req, "error", "Debes iniciar sesión para acceder a esta zona.");
    return res.redirect("/login");
  }

  if (req.session.user.role !== "admin") {
    setFlash(req, "error", "Acceso denegado. No puedes acceder a recursos de administración.");
    return res.redirect("/spaces");
  }

  return next();
}

module.exports = {
  buildSessionUser,
  requireAdmin,
  requireAuth,
  requireGuest,
  requireStandard,
  syncSessionUser,
  setFlash
};
