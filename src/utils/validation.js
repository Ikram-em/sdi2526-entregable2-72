const dniLetters = "TRWAGMYFPDXBNJZSQVHLCKE";
const passwordRule = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])\S{12,20}$/;

function normalizeDni(dni) {
  return String(dni || "").trim().toUpperCase();
}

function isValidDni(dni) {
  const normalized = normalizeDni(dni);
  const match = normalized.match(/^(\d{8})([A-Z])$/);

  if (!match) {
    return false;
  }

  const number = Number.parseInt(match[1], 10);
  return dniLetters[number % 23] === match[2];
}

function isValidPassword(password) {
  return passwordRule.test(password || "");
}

function parseAmenities(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

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
