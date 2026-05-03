package com.uniovi.sdi2425entrega2test.n;

import org.junit.jupiter.api.BeforeAll;

abstract class AppTestBase {
  @BeforeAll
  static void ensureApplicationStarted() {
    TestApplicationManager.ensureStarted();
  }
}
