package es.uniovi.sdi2526.entrega2;

import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.NoSuchElementException;
import org.openqa.selenium.TimeoutException;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.edge.EdgeDriver;
import org.openqa.selenium.edge.EdgeOptions;
import org.openqa.selenium.firefox.FirefoxDriver;
import org.openqa.selenium.firefox.FirefoxOptions;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.Select;
import org.openqa.selenium.support.ui.WebDriverWait;

abstract class SeleniumTestBase {
  protected static final String ADMIN_DNI = "12345678Z";
  protected static final String ADMIN_PASSWORD = "@Dm1n1str@D0r";
  protected static final String STANDARD_DNI = "10000001S";
  protected static final String STANDARD_PASSWORD = "Us3r@1-PASSW";
  protected static final String SECOND_STANDARD_DNI = "10000002Q";
  protected static final String SECOND_STANDARD_PASSWORD = "Us3r@2-PASSW";

  protected WebDriver driver;
  protected WebDriverWait wait;
  protected String baseUrl;

  @BeforeEach
  void setUpSelenium() {
    Locale.setDefault(Locale.forLanguageTag("es-ES"));
    baseUrl = System.getProperty("baseUrl", "http://localhost:3000");
    driver = createDriver();
    wait = new WebDriverWait(driver, Duration.ofSeconds(8));
  }

  @AfterEach
  void tearDownSelenium() {
    if (driver != null) {
      driver.quit();
    }
  }

  private WebDriver createDriver() {
    String browser = System.getProperty("selenium.browser", "chrome").toLowerCase(Locale.ROOT);
    boolean headless = Boolean.parseBoolean(System.getProperty("selenium.headless", "true"));

    return switch (browser) {
      case "edge" -> {
        EdgeOptions options = new EdgeOptions();
        if (headless) {
          options.addArguments("--headless=new");
        }
        options.addArguments("--window-size=1440,1000");
        yield new EdgeDriver(options);
      }
      case "firefox" -> {
        FirefoxOptions options = new FirefoxOptions();
        if (headless) {
          options.addArguments("-headless");
        }
        yield new FirefoxDriver(options);
      }
      default -> {
        ChromeOptions options = new ChromeOptions();
        if (headless) {
          options.addArguments("--headless=new");
        }
        options.addArguments("--window-size=1440,1000");
        yield new ChromeDriver(options);
      }
    };
  }

  protected void open(String path) {
    driver.get(baseUrl + path);
  }

  protected void loginAsAdmin() {
    login(ADMIN_DNI, ADMIN_PASSWORD);
    waitForPath("/admin/reservations");
  }

  protected void loginAsStandard() {
    login(STANDARD_DNI, STANDARD_PASSWORD);
    waitForPath("/spaces");
  }

  protected void login(String dni, String password) {
    open("/login");
    type(By.id("dni"), dni);
    type(By.id("password"), password);
    clickButton("Entrar");
  }

  protected void logout() {
    clickButton("Cerrar");
    wait.until(ExpectedConditions.urlContains("/login"));
  }

  protected void type(By locator, String value) {
    WebElement input = wait.until(ExpectedConditions.elementToBeClickable(locator));
    input.clear();
    input.sendKeys(value);
  }

  protected void selectByVisibleText(By locator, String text) {
    new Select(wait.until(ExpectedConditions.elementToBeClickable(locator))).selectByVisibleText(text);
  }

  protected void setDateTime(By locator, LocalDateTime value) {
    WebElement input = wait.until(ExpectedConditions.presenceOfElementLocated(locator));
    String formatted = value.format(DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm"));
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

  protected void clickButton(String textFragment) {
    click(By.xpath(
        "//button[contains(normalize-space(.),'" + textFragment + "')]" +
        " | //a[contains(normalize-space(.),'" + textFragment + "')]"));
  }

  protected void click(By locator) {
    WebElement element = wait.until(ExpectedConditions.elementToBeClickable(locator));
    ((JavascriptExecutor) driver).executeScript("arguments[0].scrollIntoView({block:'center'});", element);
    element.click();
  }

  protected void waitForPath(String path) {
    wait.until(ExpectedConditions.urlContains(path));
  }

  protected void assertCurrentPathContains(String path) {
    assertTrue(driver.getCurrentUrl().contains(path), "URL actual: " + driver.getCurrentUrl());
  }

  protected void assertPageContains(String text) {
    wait.until(ExpectedConditions.presenceOfElementLocated(By.tagName("body")));
    assertTrue(driver.getPageSource().contains(text), "No se encontro el texto: " + text);
  }

  protected boolean pageContains(String text) {
    return driver.getPageSource().contains(text);
  }

  protected boolean isPresent(By locator) {
    try {
      driver.findElement(locator);
      return true;
    } catch (NoSuchElementException error) {
      return false;
    }
  }

  protected boolean isFieldValid(By locator) {
    WebElement field = wait.until(ExpectedConditions.presenceOfElementLocated(locator));
    return Boolean.TRUE.equals(((JavascriptExecutor) driver).executeScript(
        "return arguments[0].validity.valid;",
        field));
  }

  protected WebElement rowContaining(String text) {
    return wait.until(ExpectedConditions.presenceOfElementLocated(
        By.xpath("//tr[.//*[contains(normalize-space(.),'" + text + "')] or contains(normalize-space(.),'" + text + "')]")));
  }

  protected WebElement cardContaining(String text) {
    return wait.until(ExpectedConditions.presenceOfElementLocated(
        By.xpath("//article[.//*[contains(normalize-space(.),'" + text + "')] or contains(normalize-space(.),'" + text + "')]")));
  }

  protected void clickInRow(String rowText, String actionText) {
    WebElement row = rowContaining(rowText);
    WebElement action = row.findElement(By.xpath(
        ".//button[contains(normalize-space(.),'" + actionText + "')]" +
        " | .//a[contains(normalize-space(.),'" + actionText + "')]"));
    ((JavascriptExecutor) driver).executeScript("arguments[0].scrollIntoView({block:'center'});", action);
    action.click();
  }

  protected int tableRowCount() {
    try {
      wait.until(ExpectedConditions.presenceOfElementLocated(By.cssSelector("table tbody tr")));
      return driver.findElements(By.cssSelector("table tbody tr")).size();
    } catch (TimeoutException error) {
      return 0;
    }
  }

  protected String uniqueSuffix() {
    return String.valueOf(System.nanoTime());
  }

  protected String uniqueDni() {
    int number = 70000000 + Math.floorMod((int) System.nanoTime(), 999999);
    return dniFromNumber(number);
  }

  private String dniFromNumber(int number) {
    String letters = "TRWAGMYFPDXBNJZSQVHLCKE";
    return String.format("%08d%s", number, letters.charAt(number % letters.length()));
  }
}
