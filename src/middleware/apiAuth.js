const User = require("../models/User");
const { getUserIdByToken } = require("../services/apiTokenService");
const { sendError } = require("../utils/apiResponses");

function getTokenFromHeader(req) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return null;
  }

  return header.slice("Bearer ".length).trim();
}

async function requireApiAuth(req, res, next) {
  const token = getTokenFromHeader(req);

  if (!token) {
    return sendError(res, 401, "UNAUTHORIZED", "Debes autenticarte con un token Bearer.");
  }

  const userId = getUserIdByToken(token);
  if (!userId) {
    return sendError(res, 401, "INVALID_TOKEN", "El token de autenticación no es válido.");
  }

  const user = await User.findById(userId);
  if (!user) {
    return sendError(res, 401, "INVALID_TOKEN", "El token de autenticación no es válido.");
  }

  req.apiUser = user;
  return next();
}

function requireApiStandard(req, res, next) {
  if (!req.apiUser) {
    return sendError(res, 401, "UNAUTHORIZED", "Debes autenticarte con un token Bearer.");
  }

  if (req.apiUser.role !== "standard") {
    return sendError(
      res,
      403,
      "FORBIDDEN",
      "Solo los usuarios estándar pueden realizar esta operación."
    );
  }

  return next();
}

module.exports = {
  requireApiAuth,
  requireApiStandard
};
