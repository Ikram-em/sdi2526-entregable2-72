package com.uniovi.sdi2425entrega2test.n;

import org.junit.platform.suite.api.SelectClasses;
import org.junit.platform.suite.api.Suite;

@Suite
@SelectClasses({

    RestApiAuthTests.class,
    RestApiReservationTests.class,
    ReactSeleniumTests.class,
        WebFrontendSeleniumTests.class,
})
public class AllTests {
}
