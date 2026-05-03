package com.uniovi.sdi2526entrega2test.x72x;

import org.junit.jupiter.api.BeforeAll;

abstract class AppTestBase {
  @BeforeAll
  static void ensureApplicationStarted() {
    TestApplicationManager.ensureStarted();
  }
}
