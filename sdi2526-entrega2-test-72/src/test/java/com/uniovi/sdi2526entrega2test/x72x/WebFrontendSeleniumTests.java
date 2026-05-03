package com.uniovi.sdi2526entrega2test.x72x;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Locale;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;

public class WebFrontendSeleniumTests extends SeleniumTestBase {
  private static final String ADMIN_DNI = "12345678Z";
  private static final String ADMIN_PASSWORD = "@Dm1n1str@D0r";
  private static final String PASSWORD = "Val1d-Passw0rd";
  private static final String UPDATED_PASSWORD = "N3w-Passw0rd!!";

  @Test
  @DisplayName("Prueba 1 - Registro de usuario estÃ¡ndar con datos vÃ¡lidos")
  void prueba1_registroUsuarioValido() {
    TestUser user = buildUniqueUser("registro");

    open("/register");
    registerUser(user);

    wait.until(ExpectedConditions.urlContains("/spaces"));
    assertPageContains("Registro completado correctamente.");
    assertPageContains("Listado de espacios disponibles");
    assertPageContains(user.firstName + " " + user.lastName);
  }

  @Test
  @DisplayName("Prueba 2 - Registro de usuario estÃ¡ndar con nombre, apellidos y DNI en blanco")
  void prueba2_registroConCamposObligatoriosVacios() {
    open("/register");
    type(By.id("password"), PASSWORD);
    type(By.id("confirmPassword"), PASSWORD);
    clickButton("Registrarme");

    wait.until(ExpectedConditions.urlContains("/register"));
    assertPageContains("Todos los campos son obligatorios.");
  }

  @Test
  @DisplayName("Prueba 3 - Registro de usuario estÃ¡ndar con DNI ya registrado")
  void prueba3_registroConDniDuplicado() {
    open("/register");
    type(By.id("dni"), STANDARD_DNI);
    type(By.id("firstName"), "Duplicado");
    type(By.id("lastName"), "Prueba");
    type(By.id("password"), PASSWORD);
    type(By.id("confirmPassword"), PASSWORD);
    clickButton("Registrarme");

    wait.until(ExpectedConditions.urlContains("/register"));
    assertPageContains("Ya existe un usuario registrado con ese DNI.");
  }

  @Test
  @DisplayName("Prueba 4 - Registro con contraseÃ±a que no cumple requisitos")
  void prueba4_registroConContrasenaInvalida() {
    TestUser user = buildUniqueUser("weak");

    open("/register");
    type(By.id("dni"), user.dni);
    type(By.id("firstName"), user.firstName);
    type(By.id("lastName"), user.lastName);
    type(By.id("password"), "corta");
    type(By.id("confirmPassword"), "corta");
    clickButton("Registrarme");

    wait.until(ExpectedConditions.urlContains("/register"));
    assertPageContains("La contraseÃ±a debe tener entre 12 y 20 caracteres");
  }

  @Test
  @DisplayName("Prueba 5 - Inicio de sesiÃ³n con datos vÃ¡lidos de administrador")
  void prueba5_loginAdminValido() {
    loginAdmin();

    assertPageContains("Listado global de reservas");
    assertPageContains("Admin Sistema");
  }

  @Test
  @DisplayName("Prueba 6 - Inicio de sesiÃ³n con datos vÃ¡lidos de usuario estÃ¡ndar")
  void prueba6_loginUsuarioValido() {
    loginStandard(STANDARD_DNI, STANDARD_PASSWORD);

    assertPageContains("Listado de espacios disponibles");
    assertPageContains("Lucia Fernandez Suarez");
  }

  @Test
  @DisplayName("Prueba 7 - Inicio de sesiÃ³n con DNI inexistente")
  void prueba7_loginConDniInexistente() {
    open("/login");
    type(By.id("dni"), "99999999R");
    type(By.id("password"), PASSWORD);
    clickButton("Entrar");

    wait.until(ExpectedConditions.urlContains("/login"));
    assertPageContains("No existe ningÃºn usuario registrado con ese DNI.");
  }

  @Test
  @DisplayName("Prueba 8 - Inicio de sesiÃ³n con contraseÃ±a incorrecta")
  void prueba8_loginConContrasenaIncorrecta() {
    open("/login");
    type(By.id("dni"), STANDARD_DNI);
    type(By.id("password"), "PasswordIncorrecta@1");
    clickButton("Entrar");

    wait.until(ExpectedConditions.urlContains("/login"));
    assertPageContains("La contraseÃ±a no es correcta.");
  }

  @Test
  @DisplayName("Prueba 9 - Cerrar sesiÃ³n y volver al login")
  void prueba9_logout() {
    loginStandard(STANDARD_DNI, STANDARD_PASSWORD);

    clickButton("Cerrar sesiÃ³n");

    wait.until(ExpectedConditions.urlContains("/login"));
    assertPageContains("Has cerrado sesiÃ³n correctamente.");
    open("/spaces");
    wait.until(ExpectedConditions.urlContains("/login"));
    assertPageContains("Debes iniciar sesiÃ³n para acceder a esta zona.");
  }

  @Test
  @DisplayName("Prueba 10 - El botÃ³n cerrar sesiÃ³n no estÃ¡ visible sin autenticar")
  void prueba10_logoutNoVisibleSinAutenticar() {
    open("/login");

    assertFalse(isPresent(By.xpath("//button[contains(normalize-space(.),'Cerrar sesiÃ³n')]")));
  }

  @Test
  @DisplayName("Prueba 26 - Consultar el listado de espacios disponibles")
  void prueba26_listadoEspaciosDisponibles() {
    loginStandard(STANDARD_DNI, STANDARD_PASSWORD);

    assertPageContains("Aula Covadonga");
    assertPageContains("Aula Laboral");
    assertPageContains("Cowork Costa Verde");
    assertPageContains("Sala Naranco");
    assertPageContains("Sala Picos");
    assertFalse(pageContains("Cowork Puerto"));
  }

  @Test
  @DisplayName("Prueba 27 - Aplicar un filtro en el listado de espacios")
  void prueba27_filtrarEspacios() {
    loginStandard(STANDARD_DNI, STANDARD_PASSWORD);
    selectByVisibleText(By.id("type"), "Aula");
    type(By.id("minCapacity"), "30");
    clickButton("Filtrar");

    wait.until(ExpectedConditions.urlContains("/spaces"));
    assertPageContains("Aula Laboral");
    assertFalse(pageContains("Aula Covadonga"));
    assertFalse(pageContains("Sala Naranco"));
  }

  @Test
  @DisplayName("Prueba 28 - Acceder al detalle de un espacio desde el listado")
  void prueba28_detalleEspacio() {
    loginStandard(STANDARD_DNI, STANDARD_PASSWORD);
    clickSpaceCardAction("Sala Naranco", "Ver detalle");

    wait.until(ExpectedConditions.urlContains("/spaces/"));
    assertPageContains("Sala Naranco");
    assertPageContains("Edificio A, Planta 1");
    assertPageContains("8 personas");
    assertPageContains("Pantalla 4K");
  }

  @Test
  @DisplayName("Prueba 29 - Consultar disponibilidad mostrando bloqueos y ocupaciÃ³n")
  void prueba29_consultarDisponibilidad() {
    loginStandard(STANDARD_DNI, STANDARD_PASSWORD);
    clickSpaceCardAction("Sala Naranco", "Disponibilidad");

    setDateTime(By.id("from"), seededDate(1, 8, 0));
    setDateTime(By.id("to"), seededDate(3, 20, 0));
    clickButton("Consultar");

    wait.until(ExpectedConditions.presenceOfElementLocated(By.cssSelector(".timeline__item")));
    assertPageContains("Reserva");
    assertPageContains("Bloqueo");
    assertPageContains("Mantenimiento del sistema de videoconferencia");
  }

  @Test
  @DisplayName("Prueba 32 - Modificar la contraseÃ±a con datos vÃ¡lidos")
  void prueba32_cambiarContrasenaValida() {
    TestUser user = buildUniqueUser("password");

    open("/register");
    registerUser(user);
    open("/account/password");
    type(By.id("currentPassword"), user.password);
    type(By.id("newPassword"), UPDATED_PASSWORD);
    type(By.id("confirmPassword"), UPDATED_PASSWORD);
    clickButton("Actualizar contraseÃ±a");

    wait.until(ExpectedConditions.urlContains("/spaces"));
    assertPageContains("ContraseÃ±a actualizada correctamente.");
    clickButton("Cerrar sesiÃ³n");
    wait.until(ExpectedConditions.urlContains("/login"));

    open("/login");
    type(By.id("dni"), user.dni);
    type(By.id("password"), UPDATED_PASSWORD);
    clickButton("Entrar");

    wait.until(ExpectedConditions.urlContains("/spaces"));
    assertPageContains("Listado de espacios disponibles");
  }

  @Test
  @DisplayName("Prueba 33 - Modificar la contraseÃ±a con datos invÃ¡lidos")
  void prueba33_cambiarContrasenaInvalida() {
    loginStandard(STANDARD_DNI, STANDARD_PASSWORD);
    open("/account/password");
    clickButton("Actualizar contraseÃ±a");

    wait.until(ExpectedConditions.urlContains("/account/password"));
    assertPageContains("Todos los campos son obligatorios.");
  }

  @Test
  @DisplayName("Prueba 11 - Registrar un nuevo espacio con datos vÃ¡lidos (administrador).")
  void prueba11_registrarEspacioValidoAdmin() {
    String spaceName = "Espacio Selenium " + System.nanoTime();
    try {
      loginAdmin();
      open("/admin/spaces");

      createSpace(spaceName, "Sala de reuniones", 6, "Edificio Test, Planta 1", "Wifi, Pizarra", "Espacio creado por Selenium.");

      wait.until(ExpectedConditions.urlContains("/admin/spaces"));
      assertPageContains("Espacio registrado correctamente.");
      assertPageContains(spaceName);
    } finally {
      deactivateSpaceIfPresent(spaceName);
    }
  }

  @Test
  @DisplayName("Prueba 12 - Registrar un nuevo espacio con datos invÃ¡lidos (nombre vacÃ­o).")
  void prueba12_registrarEspacioNombreVacio() {
    loginAdmin();
    open("/admin/spaces");

    type(By.id("name"), " ");
    selectByVisibleText(By.id("type"), "Sala de reuniones");
    type(By.id("capacity"), "5");
    type(By.id("location"), "Edificio Test, Planta 2");
    clickButton("Registrar espacio");

    wait.until(ExpectedConditions.urlContains("/admin/spaces"));
    assertPageContains("El nombre del espacio es obligatorio.");
  }

  @Test
  @DisplayName("Prueba 13 - Registrar un nuevo espacio con datos invÃ¡lidos (capacidad menor que 1).")
  void prueba13_registrarEspacioCapacidadInvalida() {
    loginAdmin();
    open("/admin/spaces");

    type(By.id("name"), "Espacio Capacidad 0 " + System.nanoTime());
    selectByVisibleText(By.id("type"), "Aula");
    type(By.id("capacity"), "0");
    type(By.id("location"), "Edificio Test, Planta 3");
    clickButton("Registrar espacio");

    wait.until(ExpectedConditions.urlContains("/admin/spaces"));
    assertPageContains("La capacidad debe ser un nÃºmero entero mayor o igual que 1.");
  }

  @Test
  @DisplayName("Prueba 14 - Registrar un nuevo espacio con datos invÃ¡lidos (nombre duplicado).")
  void prueba14_registrarEspacioNombreDuplicado() {
    String spaceName = "Espacio Duplicado " + System.nanoTime();
    try {
      loginAdmin();
      open("/admin/spaces");

      createSpace(spaceName, "Sala de reuniones", 6, "Edificio Test, Planta 4", "", "");
      wait.until(ExpectedConditions.urlContains("/admin/spaces"));
      assertPageContains("Espacio registrado correctamente.");

      createSpace(spaceName, "Aula", 10, "Edificio Test, Planta 5", "", "");

      wait.until(ExpectedConditions.urlContains("/admin/spaces"));
      assertPageContains("No se pueden registrar dos espacios activos con el mismo nombre.");
    } finally {
      deactivateSpaceIfPresent(spaceName);
    }
  }

  @Test
  @DisplayName("Prueba 15 - Editar un espacio existente con datos vÃ¡lidos. Hay que confirmar que los datos se modifican.")
  void prueba15_editarEspacioValido() {
    String spaceName = "Espacio Editar " + System.nanoTime();
    try {
      loginAdmin();
      open("/admin/spaces");

      createSpace(spaceName, "Coworking", 8, "UbicaciÃ³n inicial", "", "");
      String spaceId = findSpaceIdByName(spaceName);

      open("/admin/spaces/" + spaceId + "/edit");
      type(By.id("location"), "UbicaciÃ³n modificada");
      type(By.id("capacity"), "9");
      type(By.id("description"), "DescripciÃ³n modificada");
      clickButton("Guardar cambios");

      wait.until(ExpectedConditions.urlContains("/admin/spaces"));
      assertPageContains("Espacio actualizado correctamente.");
      assertPageContains("UbicaciÃ³n modificada");
    } finally {
      deactivateSpaceIfPresent(spaceName);
    }
  }

  @Test
  @DisplayName("Prueba 16 - Editar un espacio existente con datos invÃ¡lidos (capacidad menor que 1). Hay que confirmar que los datos NO se modifican y se devuelven los mensajes de errores correspondientes.")
  void prueba16_editarEspacioCapacidadInvalidaNoModifica() {
    String spaceName = "Espacio Editar Inv " + System.nanoTime();
    try {
      loginAdmin();
      open("/admin/spaces");

      createSpace(spaceName, "Aula", 10, "UbicaciÃ³n estable", "", "Descripcion estable");
      String spaceId = findSpaceIdByName(spaceName);

      open("/admin/spaces/" + spaceId + "/edit");
      type(By.id("capacity"), "0");
      clickButton("Guardar cambios");

      wait.until(ExpectedConditions.urlContains("/admin/spaces/" + spaceId + "/edit"));
      assertPageContains("La capacidad debe ser un nÃºmero entero mayor o igual que 1.");

      open("/admin/spaces");
      assertPageContains(spaceName);
      assertPageContains("UbicaciÃ³n estable");
    } finally {
      deactivateSpaceIfPresent(spaceName);
    }
  }

  @Test
  @DisplayName("Prueba 17 - Desactivar un espacio y verificar que no se puede reservar.")
  void prueba17_desactivarEspacioNoReservable() {
    loginAdmin();
    open("/admin/spaces");

    String targetName = "Sala Naranco";
    String spaceId = findSpaceIdByName(targetName);
    boolean wasActive = isSpaceActiveByName(targetName);
    if (!wasActive) {
      toggleSpaceByName(targetName);
      wait.until(ExpectedConditions.urlContains("/admin/spaces"));
    }

    toggleSpaceByName(targetName);
    assertPageContains("Espacio desactivado correctamente.");

    clickButton("Cerrar sesiÃ³n");
    wait.until(ExpectedConditions.urlContains("/login"));

    loginStandard(STANDARD_DNI, STANDARD_PASSWORD);
    open("/spaces");
    wait.until(ExpectedConditions.urlContains("/spaces"));
    assertFalse(pageContains(targetName));

    // ValidaciÃ³n server-side: acceso directo por URL debe fallar.
    open("/spaces/" + spaceId);
    wait.until(ExpectedConditions.presenceOfElementLocated(By.tagName("body")));
    assertPageContains("Espacio no encontrado");
  }

  @Test
  @DisplayName("Prueba 18 - Activar un espacio y verificar que si se puede reservar.")
  void prueba18_activarEspacioReservable() {
    loginAdmin();
    open("/admin/spaces");

    String targetName = "Sala Naranco";
    String spaceId = findSpaceIdByName(targetName);
    if (isSpaceActiveByName(targetName)) {
      toggleSpaceByName(targetName);
      wait.until(ExpectedConditions.urlContains("/admin/spaces"));
    }

    toggleSpaceByName(targetName);
    assertPageContains("Espacio activado correctamente.");

    clickButton("Cerrar sesiÃ³n");
    wait.until(ExpectedConditions.urlContains("/login"));

    loginStandard(STANDARD_DNI, STANDARD_PASSWORD);
    open("/spaces");
    wait.until(ExpectedConditions.urlContains("/spaces"));
    assertPageContains(targetName);

    open("/spaces/" + spaceId);
    wait.until(ExpectedConditions.urlContains("/spaces/" + spaceId));
    assertPageContains(targetName);
  }

  @Test
  @DisplayName("Prueba 19 - Crear un bloqueo de mantenimiento vÃ¡lido.")
  void prueba19_crearBloqueoValido() {
    loginAdmin();
    open("/admin/spaces");

    String spaceId = findSpaceIdByName("Aula Covadonga");
    open("/admin/spaces/" + spaceId + "/blocks");

    LocalDateTime start = seededDate(5, 10, 0);
    LocalDateTime end = seededDate(5, 12, 0);
    setDateTime(By.id("startAt"), start);
    setDateTime(By.id("endAt"), end);
    type(By.id("reason"), "Bloqueo Selenium vÃ¡lido");
    clickButton("Crear bloqueo");

    wait.until(ExpectedConditions.urlContains("/admin/spaces/" + spaceId + "/blocks"));
    assertPageContains("Bloqueo creado correctamente.");
    assertPageContains("Bloqueo Selenium vÃ¡lido");
  }

  @Test
  @DisplayName("Prueba 20 - Crear un bloqueo solapado con otro bloqueo (debe fallar).")
  void prueba20_crearBloqueoSolapadoConBloqueoDebeFallar() {
    loginAdmin();
    open("/admin/spaces");

    String spaceId = findSpaceIdByName("Aula Covadonga");
    open("/admin/spaces/" + spaceId + "/blocks");

    LocalDateTime start = seededDate(6, 10, 0);
    LocalDateTime end = seededDate(6, 12, 0);
    setDateTime(By.id("startAt"), start);
    setDateTime(By.id("endAt"), end);
    type(By.id("reason"), "Bloqueo Selenium base");
    clickButton("Crear bloqueo");
    wait.until(ExpectedConditions.urlContains("/admin/spaces/" + spaceId + "/blocks"));
    assertPageContains("Bloqueo creado correctamente.");

    // Intento solapado
    setDateTime(By.id("startAt"), seededDate(6, 11, 0));
    setDateTime(By.id("endAt"), seededDate(6, 13, 0));
    type(By.id("reason"), "Bloqueo Selenium solapado");
    clickButton("Crear bloqueo");

    wait.until(ExpectedConditions.urlContains("/admin/spaces/" + spaceId + "/blocks"));
    assertPageContains("No se permite crear un bloqueo solapado con otro bloqueo activo del mismo espacio.");
  }

  @Test
  @DisplayName("Prueba 21 - Crear un bloqueo solapado con una reserva activa (debe fallar).")
  void prueba21_crearBloqueoSolapadoConReservaDebeFallar() {
    loginAdmin();
    open("/admin/spaces");

    String spaceId = findSpaceIdByName("Sala Naranco");
    open("/admin/spaces/" + spaceId + "/blocks");

    // Rango amplio para asegurar solape con alguna reserva activa sembrada.
    setDateTime(By.id("startAt"), seededDate(1, 8, 0));
    setDateTime(By.id("endAt"), seededDate(1, 20, 0));
    type(By.id("reason"), "Bloqueo Selenium solape reserva");
    clickButton("Crear bloqueo");

    wait.until(ExpectedConditions.urlContains("/admin/spaces/" + spaceId + "/blocks"));
    assertPageContains("No se permite crear un bloqueo que se solape con una reserva activa del mismo espacio.");
  }

  @Test
  @DisplayName("Prueba 22 - Cancelar un bloqueo de mantenimiento y verificar que deja de impedir reservas.")
  void prueba22_cancelarBloqueo() {
    loginAdmin();
    open("/admin/spaces");

    String spaceId = findSpaceIdByName("Sala Naranco");
    open("/admin/spaces/" + spaceId + "/blocks");

    String reason = "Bloqueo Selenium cancelable " + System.nanoTime();
    setDateTime(By.id("startAt"), seededDate(4, 15, 0));
    setDateTime(By.id("endAt"), seededDate(4, 16, 0));
    type(By.id("reason"), reason);
    clickButton("Crear bloqueo");
    wait.until(ExpectedConditions.urlContains("/admin/spaces/" + spaceId + "/blocks"));
    assertPageContains("Bloqueo creado correctamente.");

    cancelBlockByReason(reason);
    assertPageContains("Bloqueo cancelado correctamente.");

    clickButton("Cerrar sesiÃ³n");
    wait.until(ExpectedConditions.urlContains("/login"));

    loginStandard(STANDARD_DNI, STANDARD_PASSWORD);
    open("/spaces/" + spaceId + "/availability");
    setDateTime(By.id("from"), seededDate(4, 14, 0));
    setDateTime(By.id("to"), seededDate(4, 17, 0));
    clickButton("Consultar");

    wait.until(ExpectedConditions.presenceOfElementLocated(By.cssSelector(".timeline")));
    assertFalse(pageContains(reason));
  }

  @Test
  @DisplayName("Prueba 23 - Consultar listado global de reservas. Probar con paginaciÃ³n.")
  void prueba23_listadoGlobalReservasPaginacion() {
    loginAdmin();
    open("/admin/reservations");

    wait.until(ExpectedConditions.presenceOfElementLocated(By.cssSelector("table tbody tr")));
    assertPageContains("Listado global de reservas");
    assertPageContains("PÃ¡gina 1 de");
    clickButton("Siguiente");
    wait.until(ExpectedConditions.presenceOfElementLocated(By.cssSelector("table tbody tr")));
    assertPageContains("PÃ¡gina 2 de");
  }

  @Test
  @DisplayName("Prueba 24 - Filtrar listado global de reservas por espacio (desplegable). Probar con paginaciÃ³n.")
  void prueba24_filtrarListadoGlobalPorEspacio() {
    loginAdmin();
    open("/admin/reservations");

    selectByVisibleText(By.id("space"), "Sala Naranco");
    clickButton("Filtrar");
    wait.until(ExpectedConditions.presenceOfElementLocated(By.cssSelector("table tbody tr")));
    assertPageContains("Sala Naranco");

    if (isPresent(By.xpath("//a[contains(normalize-space(.),'Siguiente')]"))) {
      clickButton("Siguiente");
      wait.until(ExpectedConditions.presenceOfElementLocated(By.cssSelector("table tbody tr")));
      assertPageContains("Sala Naranco");
    }
  }

  @Test
  @DisplayName("Prueba 25 - Filtrar listado global de reservas por rango de fechas (calendario popup). Probar con PaginaciÃ³n.")
  void prueba25_filtrarListadoGlobalPorRangoFechas() {
    loginAdmin();
    open("/admin/reservations");

    type(By.id("from"), LocalDate.now().plusDays(1).toString());
    type(By.id("to"), LocalDate.now().plusDays(30).toString());
    clickButton("Filtrar");

    wait.until(ExpectedConditions.presenceOfElementLocated(By.cssSelector("table tbody tr")));
    assertPageContains("PÃ¡gina 1 de");
    if (isPresent(By.xpath("//a[contains(normalize-space(.),'Siguiente')]"))) {
      clickButton("Siguiente");
      wait.until(ExpectedConditions.presenceOfElementLocated(By.cssSelector("table tbody tr")));
      assertPageContains("PÃ¡gina 2 de");
    }
  }

  @Test
  @DisplayName("Prueba 30 - Acceso denegado de usuario estÃ¡ndar a recursos de administraciÃ³n.")
  void prueba30_accesoDenegadoStandardAdmin() {
    loginStandard(STANDARD_DNI, STANDARD_PASSWORD);
    open("/admin/spaces");

    wait.until(ExpectedConditions.urlContains("/spaces"));
    assertPageContains("Acceso denegado. No puedes acceder a recursos de administraciÃ³n.");
  }

  @Test
  @DisplayName("Prueba 31 - Intento de cancelar reserva ajena (debe fallar).")
  void prueba31_cancelarReservaAjenaDebeFallar() {
    loginAdmin();
    open("/admin/reservations");
    wait.until(ExpectedConditions.presenceOfElementLocated(By.cssSelector("table tbody tr")));

    String reservationId = pickFirstReservationIdNotOwnedBy(STANDARD_DNI);

    clickButton("Cerrar sesiÃ³n");
    wait.until(ExpectedConditions.urlContains("/login"));

    loginStandard(STANDARD_DNI, STANDARD_PASSWORD);

    submitPost("/reservations/" + reservationId + "/cancel");
    wait.until(ExpectedConditions.urlContains("/reservations/mine"));
    assertPageContains("No puedes cancelar una reserva ajena o inexistente.");

    // VerificaciÃ³n backend: el estado de la reserva debe seguir siendo ACTIVA.
    clickButton("Cerrar sesiÃ³n");
    wait.until(ExpectedConditions.urlContains("/login"));
    loginAdmin();
    open("/admin/reservations");
    wait.until(ExpectedConditions.presenceOfElementLocated(By.cssSelector("table tbody tr")));
    assertTrue(isReservationStatus(reservationId, "ACTIVA"));
  }

  @Test
  @DisplayName("Prueba 34 - Mostrar el listado de usuarios y comprobar que se muestran todos los que existen en el sistema, incluyendo el usuario actual y los usuarios administradores.")
  void prueba34_listadoUsuariosConPaginacion() {
    loginAdmin();
    open("/admin/users");

    wait.until(ExpectedConditions.presenceOfElementLocated(By.cssSelector("table tbody tr")));
    assertPageContains("Listado de usuarios");
    assertPageContains("12345678Z");
    assertPageContains("Admin");
    assertPageContains("Sistema");

    assertPageContains("PÃ¡gina 1 de");
    clickButton("Siguiente");
    wait.until(ExpectedConditions.presenceOfElementLocated(By.cssSelector("table tbody tr")));
    assertPageContains("PÃ¡gina 2 de");
    clickButton("Siguiente");
    wait.until(ExpectedConditions.presenceOfElementLocated(By.cssSelector("table tbody tr")));
    assertPageContains("PÃ¡gina 3 de");
  }

  @Test
  @DisplayName("Prueba 35 - El usuario administrador dispondrÃ¡ de una acciÃ³n para exportar a CSV el listado global de reservas (o el resultado de un filtro). El CSV deberÃ¡ incluir, al menos: espacio, usuario, inicio, fin y estado.")
  void prueba35_exportarReservasCsv() {
    loginAdmin();
    open("/admin/reservations");
    clickButton("Exportar CSV");

    wait.until(ExpectedConditions.presenceOfElementLocated(By.tagName("body")));
    assertPageContains("\"espacio\",\"usuario\",\"inicio\",\"fin\",\"estado\"");
  }

  private void loginAdmin() {
    open("/login");
    type(By.id("dni"), ADMIN_DNI);
    type(By.id("password"), ADMIN_PASSWORD);
    clickButton("Entrar");
    wait.until(ExpectedConditions.urlContains("/admin/reservations"));
  }

  private void loginStandard(String dni, String password) {
    open("/login");
    type(By.id("dni"), dni);
    type(By.id("password"), password);
    WebElement form = wait.until(ExpectedConditions.presenceOfElementLocated(By.cssSelector("form[action='/login']")));
    ((JavascriptExecutor) driver).executeScript("arguments[0].requestSubmit();", form);
    wait.until(ExpectedConditions.or(
        ExpectedConditions.urlContains("/spaces"),
        ExpectedConditions.presenceOfElementLocated(By.cssSelector(".space-grid"))));
  }

  private void registerUser(TestUser user) {
    type(By.id("dni"), user.dni);
    type(By.id("firstName"), user.firstName);
    type(By.id("lastName"), user.lastName);
    type(By.id("password"), user.password);
    type(By.id("confirmPassword"), user.password);
    clickButton("Registrarme");
  }

  private void clickSpaceCardAction(String spaceName, String actionText) {
    WebElement link = wait.until(ExpectedConditions.elementToBeClickable(By.xpath(
        "//article[contains(@class,'space-card')][.//h2[normalize-space(.)='" + spaceName + "']]"
            + "//a[contains(normalize-space(.),'" + actionText + "')]")));
    link.click();
  }

  private LocalDateTime seededDate(int days, int hour, int minute) {
    return LocalDateTime.now()
        .plusDays(days)
        .withHour(hour)
        .withMinute(minute)
        .withSecond(0)
        .withNano(0);
  }

  private void createSpace(
      String name,
      String typeLabel,
      int capacity,
      String location,
      String amenitiesText,
      String description) {
    type(By.id("name"), name);
    selectByVisibleText(By.id("type"), typeLabel);
    type(By.id("capacity"), String.valueOf(capacity));
    type(By.id("location"), location);
    if (amenitiesText != null && !amenitiesText.isBlank()) {
      type(By.id("amenitiesText"), amenitiesText);
    }
    if (description != null && !description.isBlank()) {
      type(By.id("description"), description);
    }
    clickButton("Registrar espacio");
  }

  private void deactivateSpaceIfPresent(String spaceName) {
    try {
      loginAdmin();
      open("/admin/spaces");
      if (!isPresent(By.xpath("//tr[.//td[normalize-space(.)='" + spaceName + "']]"))) {
        return;
      }
      if (isSpaceActiveByName(spaceName)) {
        toggleSpaceByName(spaceName);
      }
    } catch (Exception ignored) {
      // Cleanup best effort only.
    }
  }

  private String findSpaceIdByName(String spaceName) {
    WebElement link = wait.until(ExpectedConditions.presenceOfElementLocated(By.xpath(
        "//tr[.//td[normalize-space(.)='" + spaceName + "']]//a[contains(@href,'/admin/spaces/') and contains(@href,'/edit')]")));
    String href = link.getAttribute("href");
    String marker = "/admin/spaces/";
    int start = href.lastIndexOf(marker);
    int end = href.lastIndexOf("/edit");
    if (start < 0 || end < 0 || end <= start) {
      throw new AssertionError("No se pudo extraer el id del espacio para " + spaceName);
    }
    return href.substring(start + marker.length(), end);
  }

  private boolean isSpaceActiveByName(String spaceName) {
    WebElement badge = wait.until(ExpectedConditions.presenceOfElementLocated(By.xpath(
        "//tr[.//td[normalize-space(.)='" + spaceName + "']]//span[contains(@class,'badge')]")));
    return badge.getText().trim().equalsIgnoreCase("Activo");
  }

  private void toggleSpaceByName(String spaceName) {
    WebElement button = wait.until(ExpectedConditions.elementToBeClickable(By.xpath(
        "//tr[.//td[normalize-space(.)='" + spaceName + "']]//button[contains(normalize-space(.),'Activar') or contains(normalize-space(.),'Desactivar')]")));
    button.click();
    wait.until(ExpectedConditions.urlContains("/admin/spaces"));
  }

  private void cancelBlockByReason(String reason) {
    WebElement button = wait.until(ExpectedConditions.elementToBeClickable(By.xpath(
        "//tr[.//td[normalize-space(.)='" + reason + "']]//button[contains(normalize-space(.),'Cancelar')]")));
    button.click();
    wait.until(ExpectedConditions.urlContains("/admin/spaces/"));
  }

  private String pickFirstReservationIdNotOwnedBy(String excludedDni) {
    while (true) {
      java.util.List<WebElement> rows = driver.findElements(By.xpath(
          "//tr[@data-reservation-id and .//td[2][normalize-space(.)!='" + excludedDni + "']]"));
      if (!rows.isEmpty()) {
        String id = rows.get(0).getAttribute("data-reservation-id");
        if (id == null || id.isBlank()) {
          throw new AssertionError("No se encontro data-reservation-id en la fila seleccionada.");
        }
        return id;
      }

      java.util.List<WebElement> nextLinks = driver.findElements(
          By.xpath("//a[contains(normalize-space(.),'Siguiente')]"));
      if (nextLinks.isEmpty()) {
        throw new AssertionError("No se encontro ninguna reserva ajena a " + excludedDni + ".");
      }
      nextLinks.get(0).click();
      wait.until(ExpectedConditions.presenceOfElementLocated(By.cssSelector("table tbody tr")));
    }
  }

  private boolean isReservationStatus(String reservationId, String expectedStatus) {
    while (true) {
      java.util.List<WebElement> cells = driver.findElements(By.xpath(
          "//tr[@data-reservation-id='" + reservationId + "']//td[6]"));
      if (!cells.isEmpty()) {
        return cells.get(0).getText().trim().equalsIgnoreCase(expectedStatus);
      }

      java.util.List<WebElement> nextLinks = driver.findElements(
          By.xpath("//a[contains(normalize-space(.),'Siguiente')]"));
      if (nextLinks.isEmpty()) {
        return false;
      }
      nextLinks.get(0).click();
      wait.until(ExpectedConditions.presenceOfElementLocated(By.cssSelector("table tbody tr")));
    }
  }

  private void submitPost(String path) {
    String script =
        "const form = document.createElement('form');" +
            "form.method = 'POST';" +
            "form.action = arguments[0];" +
            "document.body.appendChild(form);" +
            "form.submit();";
    ((JavascriptExecutor) driver).executeScript(script, baseUrl + path);
  }

  private TestUser buildUniqueUser(String suffix) {
    int numericDni = 70000000 + (int) (Math.abs(System.nanoTime()) % 9000000);
    String dni = buildValidDni(numericDni);
    String normalizedSuffix = suffix.toLowerCase(Locale.ROOT);
    return new TestUser(
        dni,
        "Ikram" + normalizedSuffix,
        "Test" + normalizedSuffix,
        PASSWORD);
  }

  private String buildValidDni(int numericDni) {
    String letters = "TRWAGMYFPDXBNJZSQVHLCKE";
    String number = String.format(Locale.ROOT, "%08d", numericDni);
    char letter = letters.charAt(Integer.parseInt(number) % 23);
    return number + letter;
  }

  private record TestUser(String dni, String firstName, String lastName, String password) {
  }
}

