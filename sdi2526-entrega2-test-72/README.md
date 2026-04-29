# sdi2526-entrega2-test-72

Proyecto de pruebas funcionales Selenium + JUnit 5 para la practica de reservas de espacios.

## Requisitos

- Java 17 o superior.
- Maven o importacion directa del `pom.xml` en IntelliJ IDEA.
- Chrome, Edge o Firefox instalado.
- Aplicacion Node.js arrancada en `http://localhost:3000`.
- MongoDB local arrancado. La aplicacion debe iniciarse con `RESET_DB_ON_START=true` para regenerar los datos de prueba.

## Ejecucion

Desde IntelliJ IDEA:

1. Importar esta carpeta como proyecto Maven.
2. Arrancar la aplicacion Node.js principal con `npm start`.
3. Ejecutar la clase `ReactSeleniumTests`.

Desde terminal con Maven:

```bash
mvn test
```

Opciones:

```bash
mvn test -DbaseUrl=http://localhost:3000
mvn test -Dselenium.browser=edge
mvn test -Dselenium.headless=false
```

