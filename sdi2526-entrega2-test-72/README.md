# sdi2526-entrega2-test-72

Proyecto de pruebas Selenium + JUnit 5 basado en la plantilla proporcionada por el profesorado.

## Pruebas implementadas

- `WebFrontendSeleniumTests`: pruebas de la parte de Ikram en la web principal:
  `Prueba1` a `Prueba10`, `Prueba26` a `Prueba29` y `Prueba32` a `Prueba33`.
- `ReactSeleniumTests`: `Prueba49` a `Prueba60` del cliente React.

La clase `Sdi2425Entrega2TestApplicationTests` se mantiene como plantilla original y queda desactivada.

## Ejecución

1. Arrancar la aplicación principal con la base reiniciada:

```bash
RESET_DB_ON_START=true npm start
```

2. Ejecutar las pruebas desde esta carpeta:

```bash
mvn test -DbaseUrl=http://localhost:3000 -Dtest=ReactSeleniumTests
```

Para la suite web:

```bash
mvn test -DbaseUrl=http://localhost:3000 -Dtest=WebFrontendSeleniumTests
```

Opcionalmente se puede cambiar de navegador:

```bash
mvn test -DbaseUrl=http://localhost:3000 -Dtest=ReactSeleniumTests -Dselenium.browser=edge
```
