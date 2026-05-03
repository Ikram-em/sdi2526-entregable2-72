const crypto = require("crypto");

const tokens = new Map();

/**
 * Emite un token de autenticación efímero asociado a un usuario.
 *
 * @param {string|import("mongoose").Types.ObjectId} userId Identificador del usuario.
 * @returns {string}
 */
function issueToken(userId) {
  const token = crypto.randomBytes(24).toString("hex");
  tokens.set(token, userId.toString());
  return token;
}

/**
 * Resuelve el usuario asociado a un token Bearer.
 *
 * @param {string} token Token recibido en la petición.
 * @returns {string|null}
 */
function getUserIdByToken(token) {
  return tokens.get(token) || null;
}

module.exports = {
  getUserIdByToken,
  issueToken
};
