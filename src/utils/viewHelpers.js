function formatDateTime(value) {
  if (!value) {
    return "";
  }

  return new Date(value).toLocaleString("es-ES", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
}

function formatDateInput(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
}

function formatDateTimeLocalInput(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) {
    return "";
  }

  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

function homePath(currentUser) {
  if (!currentUser) {
    return "/login";
  }

  return currentUser.role === "admin" ? "/admin/reservations" : "/spaces";
}

function avatarInitials(fullName) {
  return String(fullName || "")
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0))
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function compactLocation(location) {
  return String(location || "").replace(/,\s*/g, " · ");
}

function amenitiesPreview(amenities, description) {
  const preview = Array.isArray(amenities) ? amenities.slice(0, 3).join(" · ") : "";
  return preview || String(description || "");
}

function pathStartsWith(value, prefix) {
  return String(value || "").startsWith(String(prefix || ""));
}

function roleLabel(role) {
  return role === "admin" ? "Administrador" : "Usuario estándar";
}

module.exports = {
  amenitiesPreview,
  avatarInitials,
  compactLocation,
  formatDateInput,
  formatDateTime,
  formatDateTimeLocalInput,
  homePath,
  pathStartsWith,
  roleLabel
};
