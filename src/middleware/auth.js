const User = require("../models/User");

function setFlash(req, type, message) {
  req.session.flash = { type, message };
}

function buildSessionUser(user) {
  return {
    id: user._id.toString(),
    dni: user.dni,
    fullName: `${user.firstName} ${user.lastName}`,
    role: user.role
  };
}

async function syncSessionUser(req, res, next) {
  if (!req.session.user?.id) {
    return next();
  }

  const user = await User.findById(req.session.user.id);

  if (!user) {
    delete req.session.user;
    setFlash(req, "error", "Tu sesion ya no es valida. Inicia sesion de nuevo.");
    return req.session.save(next);
  }

  req.session.user = buildSessionUser(user);
  return next();
}

function requireGuest(req, res, next) {
  if (req.session.user) {
    return res.redirect(req.session.user.role === "admin" ? "/admin/reservations" : "/spaces");
  }

  return next();
}

function requireAuth(req, res, next) {
  if (!req.session.user) {
    setFlash(req, "error", "Debes iniciar sesión para acceder a esta zona.");
    return res.redirect("/login");
  }

  return next();
}

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
