package com.uniovi.sdi2526entrega2test.x72x;

import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;

public abstract class AppTestBase {
  @BeforeAll
  static void ensureApplicationStarted() {
    TestApplicationManager.ensureStarted();
  }

  @BeforeEach
  void resetDatabaseBeforeEachTest() {
    TestApplicationManager.resetDatabase();
  }
}
