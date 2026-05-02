package com.uniovi.sdi2425entrega2test.n;

import io.restassured.RestAssured;
import io.restassured.http.ContentType;
import io.restassured.response.Response;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.hasKey;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.nullValue;

class RestApiAuthTests {
  private String apiBaseUrl;

  @BeforeEach
  void setUp() {
    String baseUrl = System.getProperty("baseUrl", "http://localhost:3000");
    apiBaseUrl = baseUrl + "/api";
  }

  @Test
  @DisplayName("Prueba 36 - Inicio de sesion con datos validos")
  void prueba36_loginValido() {
    Response response = RestAssured.given()
        .contentType(ContentType.JSON)
        .body("""
            {
              "dni": "10000001S",
              "password": "Us3r@1-PASSW"
            }
            """)
        .post(apiBaseUrl + "/auth/login");

    response.then()
        .statusCode(200)
        .body("$", hasKey("token"))
        .body("user", not(nullValue()))
        .body("user", hasKey("id"))
        .body("user.dni", equalTo("10000001S"))
        .body("user", hasKey("name"))
        .body("user.role", equalTo("STANDARD"));
  }

  @Test
  @DisplayName("Prueba 37 - Inicio de sesion con DNI valido y contrasena incorrecta")
  void prueba37_loginPasswordIncorrecta() {
    Response response = RestAssured.given()
        .contentType(ContentType.JSON)
        .body("""
            {
              "dni": "10000001S",
              "password": "PasswordIncorrecta@1"
            }
            """)
        .post(apiBaseUrl + "/auth/login");

    response.then()
        .statusCode(401)
        .body("error", not(nullValue()))
        .body("error.code", equalTo("INVALID_CREDENTIALS"))
        .body("error.message", equalTo("Inicio de sesion no correcto."));
  }

  @Test
  @DisplayName("Prueba 38 - Inicio de sesion con DNI o contrasena vacios")
  void prueba38_loginCamposVacios() {
    Response response = RestAssured.given()
        .contentType(ContentType.JSON)
        .body("""
            {
              "dni": "",
              "password": ""
            }
            """)
        .post(apiBaseUrl + "/auth/login");

    response.then()
        .statusCode(400)
        .body("error", not(nullValue()))
        .body("error.code", equalTo("VALIDATION_ERROR"))
        .body("error.message", equalTo("Revisa los datos de autenticacion."))
        .body("error.details", not(nullValue()))
        .body("error.details", hasKey("dni"))
        .body("error.details", hasKey("password"))
        .body("error.details.dni", equalTo("El DNI es obligatorio."))
        .body("error.details.password", equalTo("La contrasena es obligatoria."));
  }
}
