package com.uniovi.sdi2425entrega2test.n;

import org.junit.platform.suite.api.SelectClasses;
import org.junit.platform.suite.api.Suite;

@Suite
@SelectClasses({
    WebFrontendSeleniumTests.class,
    RestApiAuthTests.class,
    RestApiReservationTests.class,
    ReactSeleniumTests.class
})
public class AllTests {
}
