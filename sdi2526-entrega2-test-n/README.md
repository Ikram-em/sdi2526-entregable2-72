# sdi2526-entrega2-test-n

Proyecto de pruebas Selenium + JUnit 5 basado en la plantilla proporcionada por el profesorado.

## Pruebas implementadas

La clase `ReactSeleniumTests` contiene las pruebas de React de la `Prueba49` a la `Prueba60`.

La clase `Sdi2425Entrega2TestApplicationTests` se mantiene como plantilla original, pero queda desactivada para que no fallen las pruebas placeholder.

## Ejecución

1. Arrancar la aplicación principal con la base reiniciada:

```bash
RESET_DB_ON_START=true npm start
```

2. Ejecutar las pruebas desde esta carpeta:

```bash
mvn test -DbaseUrl=http://localhost:3000 -Dtest=ReactSeleniumTests
```

Opcionalmente se puede cambiar de navegador:

```bash
mvn test -DbaseUrl=http://localhost:3000 -Dtest=ReactSeleniumTests -Dselenium.browser=edge
```
