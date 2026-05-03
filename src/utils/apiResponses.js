/**
 * Envía un payload JSON con el código HTTP indicado.
 *
 * @param {import("express").Response} res Respuesta HTTP.
 * @param {number} statusCode Código HTTP.
 * @param {unknown} payload Cuerpo JSON.
 * @returns {import("express").Response}
 */
function json(res, statusCode, payload) {
  return res.status(statusCode).json(payload);
}

/**
 * Envía una respuesta de error REST homogénea.
 *
 * @param {import("express").Response} res Respuesta HTTP.
 * @param {number} statusCode Código HTTP.
 * @param {string} code Código de error interno.
 * @param {string} message Mensaje legible para cliente/test.
 * @param {Record<string, string>} [details] Detalles opcionales por campo.
 * @returns {import("express").Response}
 */
function sendError(res, statusCode, code, message, details) {
  return json(res, statusCode, {
    error: {
      code,
      message,
      ...(details ? { details } : {})
    }
  });
}

module.exports = {
  json,
  sendError
};
