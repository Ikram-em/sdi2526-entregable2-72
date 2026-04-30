package com.uniovi.sdi2425entrega2test.n;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.LocalDateTime;
import java.util.Locale;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;

class WebFrontendSeleniumTests extends SeleniumTestBase {
  private static final String ADMIN_DNI = "12345678Z";
  private static final String ADMIN_PASSWORD = "@Dm1n1str@D0r";
  private static final String PASSWORD = "Val1d-Passw0rd";
  private static final String UPDATED_PASSWORD = "N3w-Passw0rd!!";

  @Test
  @DisplayName("Prueba 1 - Registro de usuario estándar con datos válidos")
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
  @DisplayName("Prueba 2 - Registro de usuario estándar con nombre, apellidos y DNI en blanco")
  void prueba2_registroConCamposObligatoriosVacios() {
    open("/register");
    type(By.id("password"), PASSWORD);
    type(By.id("confirmPassword"), PASSWORD);
    clickButton("Registrarme");

    wait.until(ExpectedConditions.urlContains("/register"));
    assertPageContains("Todos los campos son obligatorios.");
  }

  @Test
  @DisplayName("Prueba 3 - Registro de usuario estándar con DNI ya registrado")
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
  @DisplayName("Prueba 4 - Registro con contraseña que no cumple requisitos")
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
    assertPageContains("La contraseña debe tener entre 12 y 20 caracteres");
  }

  @Test
  @DisplayName("Prueba 5 - Inicio de sesión con datos válidos de administrador")
  void prueba5_loginAdminValido() {
    loginAdmin();

    assertPageContains("Listado global de reservas");
    assertPageContains("Admin Sistema");
  }

  @Test
  @DisplayName("Prueba 6 - Inicio de sesión con datos válidos de usuario estándar")
  void prueba6_loginUsuarioValido() {
    loginStandard(STANDARD_DNI, STANDARD_PASSWORD);

    assertPageContains("Listado de espacios disponibles");
    assertPageContains("Lucia Fernandez Suarez");
  }

  @Test
  @DisplayName("Prueba 7 - Inicio de sesión con DNI inexistente")
  void prueba7_loginConDniInexistente() {
    open("/login");
    type(By.id("dni"), "99999999R");
    type(By.id("password"), PASSWORD);
    clickButton("Entrar");

    wait.until(ExpectedConditions.urlContains("/login"));
    assertPageContains("No existe ningún usuario registrado con ese DNI.");
  }

  @Test
  @DisplayName("Prueba 8 - Inicio de sesión con contraseña incorrecta")
  void prueba8_loginConContrasenaIncorrecta() {
    open("/login");
    type(By.id("dni"), STANDARD_DNI);
    type(By.id("password"), "PasswordIncorrecta@1");
    clickButton("Entrar");

    wait.until(ExpectedConditions.urlContains("/login"));
    assertPageContains("La contraseña no es correcta.");
  }

  @Test
  @DisplayName("Prueba 9 - Cerrar sesión y volver al login")
  void prueba9_logout() {
    loginStandard(STANDARD_DNI, STANDARD_PASSWORD);

    clickButton("Cerrar sesión");

    wait.until(ExpectedConditions.urlContains("/login"));
    assertPageContains("Has cerrado sesión correctamente.");
    open("/spaces");
    wait.until(ExpectedConditions.urlContains("/login"));
    assertPageContains("Debes iniciar sesión para acceder a esta zona.");
  }

  @Test
  @DisplayName("Prueba 10 - El botón cerrar sesión no está visible sin autenticar")
  void prueba10_logoutNoVisibleSinAutenticar() {
    open("/login");

    assertFalse(isPresent(By.xpath("//button[contains(normalize-space(.),'Cerrar sesión')]")));
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
  @DisplayName("Prueba 29 - Consultar disponibilidad mostrando bloqueos y ocupación")
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
  @DisplayName("Prueba 32 - Modificar la contraseña con datos válidos")
  void prueba32_cambiarContrasenaValida() {
    TestUser user = buildUniqueUser("password");

    open("/register");
    registerUser(user);
    open("/account/password");
    type(By.id("currentPassword"), user.password);
    type(By.id("newPassword"), UPDATED_PASSWORD);
    type(By.id("confirmPassword"), UPDATED_PASSWORD);
    clickButton("Actualizar contraseña");

    wait.until(ExpectedConditions.urlContains("/spaces"));
    assertPageContains("Contraseña actualizada correctamente.");
    clickButton("Cerrar sesión");
    wait.until(ExpectedConditions.urlContains("/login"));

    open("/login");
    type(By.id("dni"), user.dni);
    type(By.id("password"), UPDATED_PASSWORD);
    clickButton("Entrar");

    wait.until(ExpectedConditions.urlContains("/spaces"));
    assertPageContains("Listado de espacios disponibles");
  }

  @Test
  @DisplayName("Prueba 33 - Modificar la contraseña con datos inválidos")
  void prueba33_cambiarContrasenaInvalida() {
    loginStandard(STANDARD_DNI, STANDARD_PASSWORD);
    open("/account/password");
    clickButton("Actualizar contraseña");

    wait.until(ExpectedConditions.urlContains("/account/password"));
    assertPageContains("Todos los campos son obligatorios.");
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
    clickButton("Entrar");
    wait.until(ExpectedConditions.urlContains("/spaces"));
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
