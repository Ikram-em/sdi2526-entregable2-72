package com.uniovi.sdi2526entrega2test.x72x;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URI;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicBoolean;

final class TestApplicationManager {
  private static final AtomicBoolean START_ATTEMPTED = new AtomicBoolean(false);
  private static volatile Process appProcess;
  @SuppressWarnings("unused")
  private static volatile Thread logThread;

  private TestApplicationManager() {
  }

  static void ensureStarted() {
    String baseUrl = System.getProperty("baseUrl", "http://localhost:3000");

    if (isServerUp(baseUrl)) {
      // La app ya esta levantada (por ejemplo el usuario la tiene ejecutando).
      // Para que los tests sean deterministas, reseteamos/sembramos la BD igualmente.
      Path repoRoot = resolveRepoRoot();
      runCommand(repoRoot, List.of(npmCommand(), "run", "db:reset"), Map.of(), "No se pudo resetear la base de datos.");
      return;
    }

    synchronized (TestApplicationManager.class) {
      if (isServerUp(baseUrl)) {
        return;
      }

      if (!START_ATTEMPTED.compareAndSet(false, true)) {
        waitUntilAvailable(baseUrl, Duration.ofSeconds(40));
        return;
      }

      Path repoRoot = resolveRepoRoot();
      buildReactClient(repoRoot);
      startNodeApplication(repoRoot);
      waitUntilAvailable(baseUrl, Duration.ofSeconds(40));
      Runtime.getRuntime().addShutdownHook(new Thread(TestApplicationManager::stopIfOwned));
    }
  }

  static void resetDatabase() {
    Path repoRoot = resolveRepoRoot();
    runCommand(repoRoot, List.of(npmCommand(), "run", "db:reset"), Map.of(), "No se pudo resetear la base de datos.");
  }

  private static Path resolveRepoRoot() {
    String explicitPath = System.getProperty("nodeProjectPath");
    if (explicitPath != null && !explicitPath.trim().isEmpty()) {
      Path candidate = Path.of(explicitPath.trim()).toAbsolutePath().normalize();
      if (!Files.exists(candidate.resolve("package.json"))) {
        throw new IllegalStateException(
            "nodeProjectPath no apunta a un proyecto Node valido (package.json no encontrado): " + candidate);
      }
      return candidate;
    }

    Path current = Path.of("").toAbsolutePath();
    Path repoRoot = current.getParent();

    if (repoRoot == null || !Files.exists(repoRoot.resolve("package.json"))) {
      throw new IllegalStateException("No se ha podido localizar la raíz del proyecto Node.js desde " + current);
    }

    return repoRoot;
  }

  private static void buildReactClient(Path repoRoot) {
    // En Windows/CI es frecuente que quede un `client/dist` de ejecuciones previas.
    // Los tests Selenium dependen del markup actual, asi que recompilamos siempre.
    runCommand(repoRoot, List.of(npmCommand(), "run", "react:build"), Map.of(), "No se pudo compilar el cliente React.");
  }

  private static void startNodeApplication(Path repoRoot) {
    try {
      ProcessBuilder builder = new ProcessBuilder(npmCommand(), "start");
      builder.directory(repoRoot.toFile());
      builder.environment().put("RESET_DB_ON_START", "true");
      builder.environment().putIfAbsent("PORT", "3000");
      builder.redirectErrorStream(true);

      appProcess = builder.start();
      logThread = streamLogs(appProcess);
    } catch (IOException error) {
      throw new IllegalStateException("No se pudo arrancar la aplicación Node.js automáticamente.", error);
    }
  }

  private static Thread streamLogs(Process process) {
    Thread thread = new Thread(() -> {
      try (BufferedReader reader = new BufferedReader(
          new InputStreamReader(process.getInputStream(), StandardCharsets.UTF_8))) {
        String line;
        while ((line = reader.readLine()) != null) {
          System.out.println("[node-app] " + line);
        }
      } catch (IOException ignored) {
        // The process may terminate while the stream is being consumed.
      }
    });
    thread.setName("node-app-log");
    thread.setDaemon(true);
    thread.start();
    return thread;
  }

  private static void runCommand(Path workdir, List<String> command, Map<String, String> extraEnv, String errorMessage) {
    try {
      ProcessBuilder builder = new ProcessBuilder(command);
      builder.directory(workdir.toFile());
      builder.environment().putAll(extraEnv);
      builder.redirectErrorStream(true);
      Process process = builder.start();

      String output;
      try (BufferedReader reader = new BufferedReader(
          new InputStreamReader(process.getInputStream(), StandardCharsets.UTF_8))) {
        output = reader.lines().reduce("", (left, right) -> left + right + System.lineSeparator());
      }

      int exitCode = process.waitFor();
      if (exitCode != 0) {
        throw new IllegalStateException(errorMessage + System.lineSeparator() + output);
      }
    } catch (InterruptedException error) {
      Thread.currentThread().interrupt();
      throw new IllegalStateException(errorMessage, error);
    } catch (IOException error) {
      throw new IllegalStateException(errorMessage, error);
    }
  }

  private static String npmCommand() {
    String os = System.getProperty("os.name", "").toLowerCase();
    return os.contains("win") ? "npm.cmd" : "npm";
  }

  private static void waitUntilAvailable(String baseUrl, Duration timeout) {
    Instant deadline = Instant.now().plus(timeout);

    while (Instant.now().isBefore(deadline)) {
      if (appProcess != null && !appProcess.isAlive()) {
        throw new IllegalStateException("La aplicación Node.js se ha detenido antes de quedar disponible.");
      }

      if (isServerUp(baseUrl)) {
        return;
      }

      try {
        Thread.sleep(1000);
      } catch (InterruptedException error) {
        Thread.currentThread().interrupt();
        throw new IllegalStateException("La espera de arranque de la aplicación fue interrumpida.", error);
      }
    }

    throw new IllegalStateException("La aplicación no respondió en " + baseUrl + " dentro del tiempo de espera.");
  }

  private static boolean isServerUp(String baseUrl) {
    try {
      String normalizedBaseUrl = baseUrl == null ? "" : baseUrl.trim();
      if (!normalizedBaseUrl.contains("://")) {
        normalizedBaseUrl = "http://" + normalizedBaseUrl;
      }
      URL url = URI.create(normalizedBaseUrl + "/api/health").toURL();
      HttpURLConnection connection = (HttpURLConnection) url.openConnection();
      connection.setConnectTimeout(1500);
      connection.setReadTimeout(1500);
      connection.setRequestMethod("GET");
      int status = connection.getResponseCode();
      return status >= 200 && status < 500;
    } catch (IOException error) {
      return false;
    }
  }

  private static void stopIfOwned() {
    synchronized (TestApplicationManager.class) {
      if (appProcess == null) {
        return;
      }

      if (appProcess.isAlive()) {
        appProcess.destroy();
        try {
          if (!appProcess.waitFor(5, java.util.concurrent.TimeUnit.SECONDS)) {
            appProcess.destroyForcibly();
          }
        } catch (InterruptedException error) {
          Thread.currentThread().interrupt();
        }
      }

      appProcess = null;
      logThread = null;
    }
  }
}
