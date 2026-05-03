const Twig = require("twig");
const {
  amenitiesPreview,
  avatarInitials,
  compactLocation,
  formatDateInput,
  formatDateTime,
  formatDateTimeLocalInput,
  homePath,
  pathStartsWith,
  roleLabel
} = require("../utils/viewHelpers");

let configured = false;

function configureTwig(app) {
  if (!configured) {
    Twig.extendFunction("format_date_time", formatDateTime);
    Twig.extendFunction("format_date_input", formatDateInput);
    Twig.extendFunction("format_datetime_local_input", formatDateTimeLocalInput);
    Twig.extendFunction("home_path", homePath);
    Twig.extendFunction("avatar_initials", avatarInitials);
    Twig.extendFunction("compact_location", compactLocation);
    Twig.extendFunction("amenities_preview", amenitiesPreview);
    Twig.extendFunction("path_starts_with", pathStartsWith);
    Twig.extendFunction("role_label", roleLabel);
    configured = true;
  }

  app.engine("twig", Twig.__express);
  app.set("view engine", "twig");
  app.set("twig options", {
    allowAsync: false,
    strict_variables: false
  });
}

module.exports = {
  configureTwig
};
