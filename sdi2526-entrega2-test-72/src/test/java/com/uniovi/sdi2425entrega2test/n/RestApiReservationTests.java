package com.uniovi.sdi2425entrega2test.n;

import io.restassured.RestAssured;
import io.restassured.http.ContentType;
import io.restassured.path.json.JsonPath;
import io.restassured.response.Response;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.MethodOrderer.OrderAnnotation;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.TestMethodOrder;
import org.junit.jupiter.api.Test;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;

import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.hamcrest.Matchers.hasKey;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.nullValue;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

@TestMethodOrder(OrderAnnotation.class)
public class RestApiReservationTests extends AppTestBase {
  private static final String STANDARD_DNI = "10000001S";
  private static final String STANDARD_PASSWORD = "Us3r@1-PASSW";
  private static final int RUN_DAY_OFFSET = Math.floorMod((int) System.nanoTime(), 1000);

  private String apiBaseUrl;

  @BeforeEach
  void setUp() {
    String baseUrl = System.getProperty("baseUrl", "http://localhost:3000");
    apiBaseUrl = baseUrl + "/api";
  }

  @Test
  @Order(39)
  @DisplayName("Prueba 39 - Registrar una reserva valida")
  void prueba39_registrarReservaValida() {
    String token = loginAndGetToken(STANDARD_DNI, STANDARD_PASSWORD);
    String spaceId = findSpaceIdByName("Aula Laboral");
    String startDateTime = futureIsoDate(520, 10, 0);
    String endDateTime = futureIsoDate(520, 11, 0);

    Response response = createReservation(token, spaceId, startDateTime, endDateTime, "Prueba 39 REST");

    response.then()
        .statusCode(201)
        .body("reservation", not(nullValue()))
        .body("reservation.spaceId", equalTo(spaceId))
        .body("reservation.purpose", equalTo("Prueba 39 REST"))
        .body("reservation.status", equalTo("ACTIVA"))
        .body("reservation", hasKey("id"))
        .body("reservation", hasKey("createdAt"));

    assertSameInstant(startDateTime, response.jsonPath().getString("reservation.startDateTime"));
    assertSameInstant(endDateTime, response.jsonPath().getString("reservation.endDateTime"));
  }

  @Test
  @Order(40)
  @DisplayName("Prueba 40 - Registrar una reserva invalida con inicio posterior al fin")
  void prueba40_registrarReservaInicioPosteriorAFin() {
    String token = loginAndGetToken(STANDARD_DNI, STANDARD_PASSWORD);
    String spaceId = findSpaceIdByName("Aula Laboral");

    Response response = createReservation(
        token,
        spaceId,
        futureIsoDate(521, 12, 0),
        futureIsoDate(521, 11, 0),
        "Prueba 40 REST");

    response.then()
        .statusCode(400)
        .body("error", not(nullValue()))
        .body("error.code", equalTo("INVALID_DATE_RANGE"))
        .body("error.message", equalTo("La fecha/hora de inicio debe ser anterior a la de fin."));
  }

  @Test
  @Order(41)
  @DisplayName("Prueba 41 - Intentar crear una reserva solapada en el mismo espacio")
  void prueba41_reservaSolapadaMismoEspacio() {
    String token = loginAndGetToken(STANDARD_DNI, STANDARD_PASSWORD);
    String spaceId = findSpaceIdByName("Aula Laboral");
    String baseStart = futureIsoDate(522, 9, 0);
    String baseEnd = futureIsoDate(522, 10, 0);

    createReservation(token, spaceId, baseStart, baseEnd, "Reserva base Prueba 41")
        .then()
        .statusCode(201);

    Response overlapResponse = createReservation(
        token,
        spaceId,
        futureIsoDate(522, 9, 30),
        futureIsoDate(522, 10, 30),
        "Reserva solapada Prueba 41");

    overlapResponse.then()
        .statusCode(409)
        .body("error", not(nullValue()))
        .body("error.code", equalTo("RESERVATION_OVERLAP"))
        .body("error.message", equalTo("La reserva solicitada se solapa con otra reserva activa del mismo espacio."));
  }

  @Test
  @Order(42)
  @DisplayName("Prueba 42 - Intentar reservar dentro de un bloqueo")
  void prueba42_reservaDentroDeBloqueo() {
    String token = loginAndGetToken(STANDARD_DNI, STANDARD_PASSWORD);
    Map<String, Object> block = findFirstActiveFutureBlock();
    String spaceId = String.valueOf(block.get("spaceId"));
    OffsetDateTime blockStart = OffsetDateTime.parse(String.valueOf(block.get("startDateTime")));
    OffsetDateTime blockEnd = OffsetDateTime.parse(String.valueOf(block.get("endDateTime")));
    OffsetDateTime start = blockStart.plusMinutes(15);
    OffsetDateTime end = blockStart.plusMinutes(45);

    if (!end.isBefore(blockEnd)) {
      start = blockStart.plusMinutes(5);
      end = blockEnd.minusMinutes(5);
    }

    String startDateTime = start.truncatedTo(ChronoUnit.SECONDS).format(DateTimeFormatter.ISO_INSTANT);
    String endDateTime = end.truncatedTo(ChronoUnit.SECONDS).format(DateTimeFormatter.ISO_INSTANT);

    Response response = createReservation(token, spaceId, startDateTime, endDateTime, "Prueba 42 REST");

    response.then()
        .statusCode(409)
        .body("error", not(nullValue()))
        .body("error.code", equalTo("BLOCK_OVERLAP"))
        .body("error.message", equalTo("La reserva solicitada coincide con un bloqueo activo del espacio."));
  }

  @Test
  @Order(43)
  @DisplayName("Prueba 43 - Obtener todas las reservas propias realizadas por un usuario")
  void prueba43_listarReservasPropias() {
    String token = loginAndGetToken(STANDARD_DNI, STANDARD_PASSWORD);
    String spaceId = findSpaceIdByName("Aula Laboral");

    createReservation(token, spaceId, futureIsoDate(523, 9, 0), futureIsoDate(523, 10, 0), "Prueba 43 A")
        .then()
        .statusCode(201);
    createReservation(token, spaceId, futureIsoDate(524, 11, 0), futureIsoDate(524, 12, 0), "Prueba 43 B")
        .then()
        .statusCode(201);

    Response response = getOwnReservations(token);

    response.then()
        .statusCode(200)
        .body("reservations", not(nullValue()))
        .body("reservations.size()", greaterThanOrEqualTo(2));

    List<String> purposes = response.jsonPath().getList("reservations.purpose");
    assertTrue(purposes.contains("Prueba 43 A"));
    assertTrue(purposes.contains("Prueba 43 B"));
  }

  @Test
  @Order(44)
  @DisplayName("Prueba 44 - Cancelar una reserva propia y verificar que deja de ocupar espacio")
  void prueba44_cancelarReservaPropia() {
    String token = loginAndGetToken(STANDARD_DNI, STANDARD_PASSWORD);
    String spaceId = findSpaceIdByName("Aula Laboral");
    String startDateTime = futureIsoDate(525, 10, 0);
    String endDateTime = futureIsoDate(525, 11, 0);

    Response creationResponse = createReservation(token, spaceId, startDateTime, endDateTime, "Prueba 44 REST");
    String reservationId = creationResponse.jsonPath().getString("reservation.id");

    cancelReservation(token, reservationId).then()
        .statusCode(200)
        .body("reservation.status", equalTo("CANCELADA"));

    createReservation(token, spaceId, startDateTime, endDateTime, "Prueba 44 REST reutilizada")
        .then()
        .statusCode(201);
  }

  @Test
  @Order(45)
  @DisplayName("Prueba 45 - Editar una reserva existente con datos validos")
  void prueba45_editarReservaValida() {
    String token = loginAndGetToken(STANDARD_DNI, STANDARD_PASSWORD);
    String initialSpaceId = findSpaceIdByName("Aula Laboral");
    String updatedSpaceId = findSpaceIdByName("Sala Picos");

    Response creationResponse = createReservation(
        token,
        initialSpaceId,
        futureIsoDate(526, 9, 0),
        futureIsoDate(526, 10, 0),
        "Prueba 45 inicial");
    String reservationId = creationResponse.jsonPath().getString("reservation.id");

    Response updateResponse = updateReservation(
        token,
        reservationId,
        updatedSpaceId,
        futureIsoDate(526, 12, 0),
        futureIsoDate(526, 13, 0),
        "Prueba 45 editada");

    updateResponse.then()
        .statusCode(200)
        .body("reservation.id", equalTo(reservationId))
        .body("reservation.spaceId", equalTo(updatedSpaceId))
        .body("reservation.purpose", equalTo("Prueba 45 editada"))
        .body("reservation.status", equalTo("ACTIVA"));

    assertSameInstant(futureIsoDate(526, 12, 0), updateResponse.jsonPath().getString("reservation.startDateTime"));
    assertSameInstant(futureIsoDate(526, 13, 0), updateResponse.jsonPath().getString("reservation.endDateTime"));
  }

  @Test
  @Order(46)
  @DisplayName("Prueba 46 - Editar una reserva existente con datos invalidos por solape")
  void prueba46_editarReservaInvalidaPorSolape() {
    String token = loginAndGetToken(STANDARD_DNI, STANDARD_PASSWORD);
    String spaceId = findSpaceIdByName("Sala Picos");

    Response baseA = createReservation(
        token,
        spaceId,
        futureIsoDate(527, 9, 0),
        futureIsoDate(527, 10, 0),
        "Prueba 46 A");
    String reservationIdA = baseA.jsonPath().getString("reservation.id");

    createReservation(
        token,
        spaceId,
        futureIsoDate(527, 11, 0),
        futureIsoDate(527, 12, 0),
        "Prueba 46 B")
        .then()
        .statusCode(201);

    Response invalidUpdate = updateReservation(
        token,
        reservationIdA,
        spaceId,
        futureIsoDate(527, 11, 30),
        futureIsoDate(527, 12, 30),
        "Prueba 46 editada solapada");

    invalidUpdate.then()
        .statusCode(409)
        .body("error.code", equalTo("RESERVATION_OVERLAP"))
        .body("error.message", equalTo("La reserva solicitada se solapa con otra reserva activa del mismo espacio."));

    Response ownReservations = getOwnReservations(token);
    JsonPath json = ownReservations.jsonPath();
    List<Map<String, Object>> reservations = json.getList("reservations");
    Map<String, Object> reservationA = reservations.stream()
        .filter(item -> reservationIdA.equals(String.valueOf(item.get("id"))))
        .findFirst()
        .orElseThrow();

    assertSameInstant(futureIsoDate(527, 9, 0), String.valueOf(reservationA.get("startDateTime")));
    assertSameInstant(futureIsoDate(527, 10, 0), String.valueOf(reservationA.get("endDateTime")));
    assertEquals("Prueba 46 A", reservationA.get("purpose"));
  }

  @Test
  @Order(47)
  @DisplayName("Prueba 47 - Crear una reserva recurrente semanal valida")
  void prueba47_crearReservaRecurrenteSemanalValida() {
    String token = loginAndGetToken(STANDARD_DNI, STANDARD_PASSWORD);
    String spaceId = findSpaceIdByName("Aula Laboral");

    Response baseReservation = createReservation(
        token,
        spaceId,
        futureIsoDate(528, 9, 0),
        futureIsoDate(528, 10, 0),
        "Prueba 47 base");
    String reservationId = baseReservation.jsonPath().getString("reservation.id");

    Response recurrenceResponse = createRecurrence(token, reservationId, "WEEKLY", 2);

    recurrenceResponse.then()
        .statusCode(201)
        .body("baseReservationId", equalTo(reservationId))
        .body("frequency", equalTo("WEEKLY"))
        .body("createdReservations.size()", equalTo(2));

    List<String> createdIds = recurrenceResponse.jsonPath().getList("createdReservations.id");
    assertEquals(2, createdIds.size());
    assertNotEquals(createdIds.get(0), createdIds.get(1));
  }

  @Test
  @Order(48)
  @DisplayName("Prueba 48 - Intentar crear una reserva recurrente que genere un solape")
  void prueba48_crearReservaRecurrenteConSolape() {
    String token = loginAndGetToken(STANDARD_DNI, STANDARD_PASSWORD);
    String spaceId = findSpaceIdByName("Aula Laboral");
    String basePurpose = "Prueba 48 base " + System.nanoTime();
    String conflictPurpose = "Prueba 48 conflicto " + System.nanoTime();

    Response baseReservation = createReservation(
        token,
        spaceId,
        futureIsoDate(529, 9, 0),
        futureIsoDate(529, 10, 0),
        basePurpose);
    String reservationId = baseReservation.jsonPath().getString("reservation.id");

    createReservation(
        token,
        spaceId,
        futureIsoDate(536, 9, 0),
        futureIsoDate(536, 10, 0),
        conflictPurpose)
        .then()
        .statusCode(201);

    Response recurrenceResponse = createRecurrence(token, reservationId, "WEEKLY", 2);

    recurrenceResponse.then()
        .statusCode(409)
        .body("error", not(nullValue()))
        .body("error.code", equalTo("RECURRENCE_OVERLAP"))
        .body("error.message", equalTo("La recurrencia solicitada genera al menos un solape o incumple las reglas de reserva."));

    Response ownReservations = getOwnReservations(token);
    List<String> purposes = ownReservations.jsonPath().getList("reservations.purpose");
    long baseCount = purposes.stream().filter(basePurpose::equals).count();
    long conflictCount = purposes.stream().filter(conflictPurpose::equals).count();
    assertEquals(1, baseCount);
    assertEquals(1, conflictCount);
  }

  private String loginAndGetToken(String dni, String password) {
    Response response = RestAssured.given()
        .contentType(ContentType.JSON)
        .body("""
            {
              "dni": "%s",
              "password": "%s"
            }
            """.formatted(escapeJson(dni), escapeJson(password)))
        .post(apiBaseUrl + "/auth/login");

    response.then().statusCode(200);
    String token = response.jsonPath().getString("token");
    assertNotNull(token);
    return token;
  }

  private String findSpaceIdByName(String spaceName) {
    Response response = RestAssured.given()
        .accept(ContentType.JSON)
        .get(apiBaseUrl + "/spaces");

    response.then().statusCode(200);

    List<Map<String, Object>> spaces = response.jsonPath().getList("spaces");
    return spaces.stream()
        .filter(space -> spaceName.equals(space.get("name")))
        .map(space -> String.valueOf(space.get("id")))
        .findFirst()
        .orElseThrow();
  }

  private Map<String, Object> findFirstActiveFutureBlock() {
    Response response = RestAssured.given()
        .accept(ContentType.JSON)
        .get(apiBaseUrl + "/spaces");

    response.then().statusCode(200);

    List<Map<String, Object>> activeBlocks = response.jsonPath().getList("activeBlocks");
    OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);

    return activeBlocks.stream()
        .filter(block -> OffsetDateTime.parse(String.valueOf(block.get("endDateTime"))).isAfter(now))
        .findFirst()
        .orElseThrow(() -> new AssertionError("Se esperaba al menos un bloqueo activo futuro sembrado."));
  }

  private Response getOwnReservations(String token) {
    return RestAssured.given()
        .header("Authorization", "Bearer " + token)
        .accept(ContentType.JSON)
        .get(apiBaseUrl + "/reservations/me");
  }

  private Response createReservation(
      String token,
      String spaceId,
      String startDateTime,
      String endDateTime,
      String purpose) {
    return RestAssured.given()
        .header("Authorization", "Bearer " + token)
        .contentType(ContentType.JSON)
        .body("""
            {
              "spaceId": "%s",
              "startDateTime": "%s",
              "endDateTime": "%s",
              "purpose": "%s"
            }
            """.formatted(
            escapeJson(spaceId),
            escapeJson(startDateTime),
            escapeJson(endDateTime),
            escapeJson(purpose)))
        .post(apiBaseUrl + "/reservations");
  }

  private Response cancelReservation(String token, String reservationId) {
    return RestAssured.given()
        .header("Authorization", "Bearer " + token)
        .accept(ContentType.JSON)
        .patch(apiBaseUrl + "/reservations/" + reservationId + "/cancel");
  }

  private Response updateReservation(
      String token,
      String reservationId,
      String spaceId,
      String startDateTime,
      String endDateTime,
      String purpose) {
    return RestAssured.given()
        .header("Authorization", "Bearer " + token)
        .contentType(ContentType.JSON)
        .body("""
            {
              "spaceId": "%s",
              "startDateTime": "%s",
              "endDateTime": "%s",
              "purpose": "%s"
            }
            """.formatted(
            escapeJson(spaceId),
            escapeJson(startDateTime),
            escapeJson(endDateTime),
            escapeJson(purpose)))
        .put(apiBaseUrl + "/reservations/" + reservationId);
  }

  private Response createRecurrence(String token, String reservationId, String frequency, int count) {
    return RestAssured.given()
        .header("Authorization", "Bearer " + token)
        .contentType(ContentType.JSON)
        .body("""
            {
              "frequency": "%s",
              "count": %d
            }
            """.formatted(escapeJson(frequency), count))
        .post(apiBaseUrl + "/reservations/" + reservationId + "/recurrence");
  }

  private String futureIsoDate(int daysAhead, int hour, int minute) {
    return OffsetDateTime.now(ZoneOffset.UTC)
        .plusDays(daysAhead + RUN_DAY_OFFSET)
        .withHour(hour)
        .withMinute(minute)
        .withSecond(0)
        .withNano(0)
        .format(DateTimeFormatter.ISO_INSTANT);
  }

  private void assertSameInstant(String expectedIso, String actualIso) {
    assertEquals(
        OffsetDateTime.parse(expectedIso).toInstant(),
        OffsetDateTime.parse(actualIso).toInstant());
  }

  private String escapeJson(String value) {
    return value
        .replace("\\", "\\\\")
        .replace("\"", "\\\"");
  }
}
