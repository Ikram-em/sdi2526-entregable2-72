const dniLetters = "TRWAGMYFPDXBNJZSQVHLCKE";
const passwordRule = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])\S{12,20}$/;

/**
 * Normaliza un DNI a mayúsculas sin espacios laterales.
 *
 * @param {string} dni DNI recibido.
 * @returns {string}
 */
function normalizeDni(dni) {
  return String(dni || "").trim().toUpperCase();
}

/**
 * Verifica si un DNI español tiene formato correcto y letra válida.
 *
 * @param {string} dni DNI a validar.
 * @returns {boolean}
 */
function isValidDni(dni) {
  const normalized = normalizeDni(dni);
  const match = normalized.match(/^(\d{8})([A-Z])$/);

  if (!match) {
    return false;
  }

  const number = Number.parseInt(match[1], 10);
  return dniLetters[number % 23] === match[2];
}

/**
 * Comprueba la política de contraseñas de la práctica.
 *
 * @param {string} password Contraseña en texto plano.
 * @returns {boolean}
 */
function isValidPassword(password) {
  return passwordRule.test(password || "");
}

/**
 * Convierte el texto de comodidades en una lista limpia.
 *
 * @param {string} value Texto separado por comas.
 * @returns {string[]}
 */
function parseAmenities(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

/**
 * Genera un DNI válido a partir de un número base para el seeding.
 *
 * @param {number} number Número de ocho dígitos.
 * @returns {string}
 */
function buildDniFromNumber(number) {
  const padded = String(number).padStart(8, "0");
  const letter = dniLetters[Number.parseInt(padded, 10) % 23];
  return `${padded}${letter}`;
}

module.exports = {
  buildDniFromNumber,
  isValidDni,
  isValidPassword,
  normalizeDni,
  parseAmenities
};
