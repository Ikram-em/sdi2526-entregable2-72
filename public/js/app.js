(function ($) {
  function bindPasswordToggles() {
    $("[data-password-toggle]").on("click", function () {
      const $button = $(this);
      const fieldId = $button.data("password-toggle");
      const $input = $(`#${fieldId}`);

      if (!$input.length) {
        return;
      }

      const isPassword = $input.attr("type") === "password";
      $input.attr("type", isPassword ? "text" : "password");
      $button.toggleClass("is-active", isPassword);
      $button.attr("aria-label", isPassword ? "Ocultar contraseña" : "Mostrar contraseña");
      $button.attr("title", isPassword ? "Ocultar contraseña" : "Mostrar contraseña");
    });
  }

  function bindDniNormalization() {
    $('input[name="dni"]').on("input blur", function () {
      $(this).val($(this).val().toUpperCase().replace(/\s+/g, ""));
    });
  }

  function bindAccountMenu() {
    const $menu = $(".account-menu");

    if (!$menu.length) {
      return;
    }

    $(document).on("click", function (event) {
      $menu.each(function () {
        if (!this.contains(event.target)) {
          this.removeAttribute("open");
        }
      });
    });

    $(document).on("keydown", function (event) {
      if (event.key === "Escape") {
        $menu.removeAttr("open");
      }
    });
  }

  $(function () {
    bindPasswordToggles();
    bindDniNormalization();
    bindAccountMenu();
  });
})(jQuery);
