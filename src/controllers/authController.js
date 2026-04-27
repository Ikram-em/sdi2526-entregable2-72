const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { buildSessionUser, setFlash } = require("../middleware/auth");
const { isValidDni, isValidPassword, normalizeDni } = require("../utils/validation");

async function showRegister(req, res) {
  res.render("auth/register", {
    title: "Registro de usuario",
    formData: {},
    errors: []
  });
}

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
    errors.push("El DNI introducido no es valido.");
  }

  if (!isValidPassword(password)) {
    errors.push("La contrasena debe tener entre 12 y 20 caracteres, incluir mayuscula, minuscula, digito, simbolo y no contener espacios.");
  }

  if (password !== confirmPassword) {
    errors.push("La contrasena y su confirmacion no coinciden.");
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
  return res.redirect("/spaces");
}

async function showLogin(req, res) {
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
}

async function login(req, res) {
  const body = req.body || {};
  const dni = normalizeDni(body.dni);
  const password = body.password || "";

  if (!dni || !password) {
    return res.status(400).render("auth/login", {
      title: "Inicio de sesion",
      error: "Debes indicar DNI y contrasena.",
      formData: { dni }
    });
  }

  const user = await User.findOne({ dni });
  if (!user) {
    return res.status(401).render("auth/login", {
      title: "Inicio de sesion",
      error: "No existe ningun usuario registrado con ese DNI.",
      formData: { dni }
    });
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    return res.status(401).render("auth/login", {
      title: "Inicio de sesion",
      error: "La contrasena no es correcta.",
      formData: { dni }
    });
  }

  req.session.user = buildSessionUser(user);
  setFlash(req, "success", `Bienvenido/a, ${user.firstName}.`);
  return res.redirect(user.role === "admin" ? "/admin/reservations" : "/spaces");
}

async function logout(req, res) {
  req.session.destroy(() => {
    res.redirect("/login?loggedOut=1");
  });
}

async function showChangePassword(req, res) {
  res.render("auth/change-password", {
    title: "Cambiar contrasena",
    errors: []
  });
}

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

  user.passwordHash = await bcrypt.hash(newPassword, 10);
  await user.save();
  setFlash(req, "success", "Contrasena actualizada correctamente.");
  return res.redirect("/spaces");
}

module.exports = {
  changePassword,
  login,
  logout,
  register,
  showChangePassword,
  showLogin,
  showRegister
};
