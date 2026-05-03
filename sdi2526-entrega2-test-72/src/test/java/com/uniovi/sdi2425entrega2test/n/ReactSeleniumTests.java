package com.uniovi.sdi2425entrega2test.n;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.Select;

@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class ReactSeleniumTests extends SeleniumTestBase {

  @Test
  @DisplayName("Prueba 49 - Inicio de sesión React con datos válidos")
  @Order(49)
  void prueba49_inicioSesionConDatosValidos() {
    loginReact(STANDARD_DNI, STANDARD_PASSWORD);

    assertPageContains("Mis reservas");
    assertPageContains("Listado de reservas propias");
  }

  @Test
  @DisplayName("Prueba 50 - Inicio de sesión React con contraseña incorrecta")
  @Order(50)
  void prueba50_inicioSesionConContrasenaIncorrecta() {
    openReactClean();
    type(By.id("react-dni"), STANDARD_DNI);
    type(By.id("react-password"), "PasswordIncorrecta@1");
    clickButton("Entrar");

    wait.until(ExpectedConditions.presenceOfElementLocated(By.cssSelector(".react-login__message.is-error")));
    assertFalse(isPresent(By.cssSelector(".react-dashboard")));
  }

  @Test
  @DisplayName("Prueba 51 - Inicio de sesión React con campos vacíos")
  @Order(51)
  void prueba51_inicioSesionConCamposVacios() {
    openReactClean();
    clickButton("Entrar");

    assertPageContains("Revisa los datos");
    assertPageContains("obligatorio");
  }

  @Test
  @DisplayName("Prueba 52 - Registrar una reserva válida desde React")
  @Order(52)
  void prueba52_registrarReservaValida() {
    loginReact(STANDARD_DNI, STANDARD_PASSWORD);
    createReactReservation(futureStart(420, 9), "Reserva válida Selenium React");

    assertPageContains("Listado de reservas propias");
    assertTrue(tableRowCount() > 0);
  }

  @Test
  @DisplayName("Prueba 53 - Registrar una reserva inválida desde React")
  @Order(53)
  void prueba53_registrarReservaInvalidaInicioPosteriorAlFin() {
    loginReact(STANDARD_DNI, STANDARD_PASSWORD);
    clickButton("Nueva reserva");
    selectFirstSpace();
    LocalDateTime start = futureStart(421, 12);
    setDateTime(By.id("startDateTime"), start);
    setDateTime(By.id("endDateTime"), start.minusHours(1));
    type(By.id("purpose"), "Reserva inválida Selenium React");
    clickButton("Registrar reserva");

    assertPageContains("Revisa los datos");
  }

  @Test
  @DisplayName("Prueba 54 - Consultar listado de reservas propias en React")
  @Order(54)
  void prueba54_consultarListadoReservasPropias() {
    loginReact(STANDARD_DNI, STANDARD_PASSWORD);

    wait.until(ExpectedConditions.presenceOfElementLocated(By.cssSelector("table tbody tr")));
    assertPageContains("Listado de reservas propias");
    assertTrue(tableRowCount() > 0);
  }

  @Test
  @DisplayName("Prueba 55 - Filtrar reservas propias por estado cancelada en React")
  @Order(55)
  void prueba55_filtrarReservasPropiasPorEstadoCancelada() {
    loginReact(STANDARD_DNI, STANDARD_PASSWORD);
    selectByVisibleText(By.id("reservationStatus"), "CANCELADA");

    assertPageContains("CANCELADA");
    assertFalse(pageContains("ACTIVA</span>"));
  }

  @Test
  @DisplayName("Prueba 56 - Cancelar una reserva propia desde React")
  @Order(56)
  void prueba56_cancelarReservaPropia() {
    loginReact(SECOND_STANDARD_DNI, SECOND_STANDARD_PASSWORD);
    createReactReservation(futureStart(422, 9), "Reserva para cancelar Selenium React");
    clickFirstButtonInActiveReservation("Cancelar");

    assertPageContains("Reserva cancelada correctamente");
  }

  @Test
  @DisplayName("Prueba 57 - Editar una reserva existente con datos válidos en React")
  @Order(57)
  void prueba57_editarReservaConDatosValidos() {
    loginReact(STANDARD_DNI, STANDARD_PASSWORD);
    createReactReservation(futureStart(423, 9), "Reserva para editar Selenium React");
    clickFirstButtonInActiveReservation("Editar");
    setDateTime(By.id("startDateTime"), futureStart(424, 11));
    setDateTime(By.id("endDateTime"), futureStart(424, 12));
    type(By.id("purpose"), "Reserva editada Selenium React");
    clickButton("Actualizar reserva");

    wait.until(ExpectedConditions.presenceOfElementLocated(By.cssSelector(".react-reservations")));
    assertPageContains("Listado de reservas propias");
  }

  @Test
  @DisplayName("Prueba 58 - Editar una reserva existente con datos inválidos en React")
  @Order(58)
  void prueba58_editarReservaConSolape() {
    loginReact(STANDARD_DNI, STANDARD_PASSWORD);
    LocalDateTime firstStart = futureStart(425, 9);
    createReactReservation(firstStart, "Reserva origen solape Selenium React");
    createReactReservation(futureStart(426, 9), "Reserva a solapar Selenium React");
    clickFirstButtonInActiveReservation("Editar");
    setDateTime(By.id("startDateTime"), firstStart);
    setDateTime(By.id("endDateTime"), firstStart.plusHours(1));
    type(By.id("purpose"), "Edición solapada Selenium React");
    clickButton("Actualizar reserva");

    assertPageContains("solap");
  }

  @Test
  @DisplayName("Prueba 59 - Crear una reserva recurrente semanal válida en React")
  @Order(59)
  void prueba59_crearReservaRecurrenteSemanalValida() {
    loginReact(SECOND_STANDARD_DNI, SECOND_STANDARD_PASSWORD);
    LocalDateTime baseStart = futureStart(427, 10);
    createReactReservation(baseStart, "Reserva base recurrente Selenium React");
    clickButton("Recurrentes");
    selectFirstRealOption(By.id("baseReservationId"));
    selectByVisibleText(By.id("frequency"), "Semanal");
    setDate(By.id("endDate"), baseStart.toLocalDate().plusDays(8));
    clickButton("Crear recurrencias");

    wait.until(ExpectedConditions.presenceOfElementLocated(By.cssSelector(".react-reservations")));
    assertPageContains("Listado de reservas propias");
  }

  @Test
  @DisplayName("Prueba 60 - Crear una reserva recurrente con solape en React")
  @Order(60)
  void prueba60_crearReservaRecurrenteConSolape() {
    loginReact(STANDARD_DNI, STANDARD_PASSWORD);
    LocalDateTime baseStart = futureStart(429, 10);
    createReactReservation(baseStart, "Reserva base recurrente solapada Selenium React");
    createReactReservation(baseStart.plusDays(7), "Reserva que provoca solape Selenium React");
    clickButton("Recurrentes");
    selectRealOptionByOrdinal(By.id("baseReservationId"), 2);
    selectByVisibleText(By.id("frequency"), "Semanal");
    setDate(By.id("endDate"), baseStart.toLocalDate().plusDays(8));
    clickButton("Crear recurrencias");

    wait.until(ExpectedConditions.presenceOfElementLocated(By.cssSelector(".react-login__message.is-error")));
  }

  private void openReactClean() {
    open("/react");
    wait.until(ExpectedConditions.presenceOfElementLocated(By.id("root")));
    ((JavascriptExecutor) driver).executeScript("window.localStorage.clear();");
    driver.navigate().refresh();
  }

  private void loginReact(String dni, String password) {
    openReactClean();
    type(By.id("react-dni"), dni);
    type(By.id("react-password"), password);
    clickButton("Entrar");
    wait.until(ExpectedConditions.presenceOfElementLocated(By.cssSelector(".react-dashboard")));
  }

  private void createReactReservation(LocalDateTime start, String purpose) {
    clickButton("Nueva reserva");
    selectFirstSpace();
    setDateTime(By.id("startDateTime"), start);
    setDateTime(By.id("endDateTime"), start.plusHours(1));
    type(By.id("purpose"), purpose);
    clickButton("Registrar reserva");
    wait.until(ExpectedConditions.presenceOfElementLocated(By.cssSelector(".react-reservations")));
  }

  private void selectFirstSpace() {
    selectFirstRealOption(By.id("spaceId"));
  }

  private void selectFirstRealOption(By locator) {
    selectRealOptionByOrdinal(locator, 1);
  }

  private void selectRealOptionByOrdinal(By locator, int ordinal) {
    Select select = new Select(wait.until(ExpectedConditions.elementToBeClickable(locator)));
    List<WebElement> options = select.getOptions();
    int selectableOptions = 0;
    for (int index = 0; index < options.size(); index += 1) {
      String value = options.get(index).getAttribute("value");
      if (value != null && !value.isBlank()) {
        selectableOptions += 1;
        if (selectableOptions == ordinal) {
          select.selectByIndex(index);
          return;
        }
      }
    }
    throw new AssertionError("No hay suficientes opciones seleccionables para " + locator);
  }

  private void clickFirstButtonInActiveReservation(String buttonText) {
    WebElement row = wait.until(ExpectedConditions.presenceOfElementLocated(
        By.xpath("//tr[.//span[contains(normalize-space(.),'ACTIVA')]][1]")));
    WebElement button = row.findElement(By.xpath(".//button[contains(normalize-space(.),'" + buttonText + "')]"));
    ((JavascriptExecutor) driver).executeScript("arguments[0].scrollIntoView({block:'center'});", button);
    button.click();
  }

  private void setDate(By locator, LocalDate value) {
    WebElement input = wait.until(ExpectedConditions.presenceOfElementLocated(locator));
    String formatted = value.format(DateTimeFormatter.ISO_LOCAL_DATE);
    ((JavascriptExecutor) driver).executeScript(
        "const input = arguments[0];" +
            "const value = arguments[1];" +
            "const setter = Object.getOwnPropertyDescriptor(input.constructor.prototype, 'value').set;" +
            "setter.call(input, value);" +
            "input.dispatchEvent(new Event('input', { bubbles: true }));" +
            "input.dispatchEvent(new Event('change', { bubbles: true }));",
        input,
        formatted);
  }

  private LocalDateTime futureStart(int dayOffset, int hour) {
    return LocalDateTime.now()
        .plusDays(dayOffset)
        .withHour(hour)
        .withMinute(0)
        .withSecond(0)
        .withNano(0);
  }
}
