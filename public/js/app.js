(function ($) {
  const dniLetters = "TRWAGMYFPDXBNJZSQVHLCKE";
  const passwordRule = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])\S{12,20}$/;

  function setError($form, field, message) {
    const $input = $form.find(`[name="${field}"]`);
    const $error = $form.find(`[data-error-for="${field}"]`);
    $input.toggleClass("is-invalid", Boolean(message));
    $error.text(message || "");
  }

  function clearErrors($form) {
    $form.find(".is-invalid").removeClass("is-invalid");
    $form.find(".field-error").text("");
  }

  function validateDni(value) {
    const normalized = (value || "").trim().toUpperCase();
    const match = normalized.match(/^(\d{8})([A-Z])$/);

    if (!match) {
      return false;
    }

    const number = Number.parseInt(match[1], 10);
    return dniLetters[number % 23] === match[2];
  }

  function validatePassword(value) {
    return passwordRule.test(value || "");
  }

  function runRegisterValidation($form) {
    const data = Object.fromEntries(new FormData($form[0]).entries());
    let valid = true;
    clearErrors($form);

    ["dni", "firstName", "lastName", "password", "confirmPassword"].forEach((field) => {
      if (!String(data[field] || "").trim()) {
        setError($form, field, "Campo obligatorio.");
        valid = false;
      }
    });

    if (data.dni && !validateDni(data.dni)) {
      setError($form, "dni", "DNI no válido.");
      valid = false;
    }

    if (data.password && !validatePassword(data.password)) {
      setError($form, "password", "No cumple la política de seguridad.");
      valid = false;
    }

    if (data.password !== data.confirmPassword) {
      setError($form, "confirmPassword", "Las contraseñas no coinciden.");
      valid = false;
    }

    return valid;
  }

  function runLoginValidation($form) {
    const data = Object.fromEntries(new FormData($form[0]).entries());
    let valid = true;
    clearErrors($form);

    if (!String(data.dni || "").trim()) {
      setError($form, "dni", "Introduce tu DNI.");
      valid = false;
    } else if (!validateDni(data.dni)) {
      setError($form, "dni", "Formato de DNI no válido.");
      valid = false;
    }

    if (!String(data.password || "").trim()) {
      setError($form, "password", "Introduce tu contraseña.");
      valid = false;
    }

    return valid;
  }

  function runAvailabilityValidation($form) {
    const data = Object.fromEntries(new FormData($form[0]).entries());
    let valid = true;
    clearErrors($form);

    if (!data.from) {
      setError($form, "from", "Indica la fecha inicial.");
      valid = false;
    }

    if (!data.to) {
      setError($form, "to", "Indica la fecha final.");
      valid = false;
    }

    if (data.from && data.to && new Date(data.from) >= new Date(data.to)) {
      setError($form, "to", "El fin debe ser posterior al inicio.");
      valid = false;
    }

    return valid;
  }

  function runChangePasswordValidation($form) {
    const data = Object.fromEntries(new FormData($form[0]).entries());
    let valid = true;
    clearErrors($form);

    ["currentPassword", "newPassword", "confirmPassword"].forEach((field) => {
      if (!String(data[field] || "").trim()) {
        setError($form, field, "Campo obligatorio.");
        valid = false;
      }
    });

    if (data.newPassword && !validatePassword(data.newPassword)) {
      setError($form, "newPassword", "No cumple la política de seguridad.");
      valid = false;
    }

    if (data.newPassword !== data.confirmPassword) {
      setError($form, "confirmPassword", "Las contraseñas no coinciden.");
      valid = false;
    }

    return valid;
  }

  function runSpaceFilterValidation($form) {
    const value = $form.find('[name="minCapacity"]').val();
    clearErrors($form);

    if (value && Number.parseInt(value, 10) < 1) {
      setError($form, "minCapacity", "La capacidad mínima debe ser mayor o igual que 1.");
      return false;
    }

    return true;
  }

  const validators = {
    register: runRegisterValidation,
    login: runLoginValidation,
    availability: runAvailabilityValidation,
    "change-password": runChangePasswordValidation,
    "space-filter": runSpaceFilterValidation
  };

  $(function () {
    $("form[data-validate]").on("submit", function (event) {
      const $form = $(this);
      const kind = $form.data("validate");
      const validator = validators[kind];

      if (validator && !validator($form)) {
        event.preventDefault();
      }
    });
  });
})(jQuery);
