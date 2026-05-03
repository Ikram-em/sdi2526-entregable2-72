package com.uniovi.sdi2526entrega2test.x72x;

import org.junit.platform.suite.api.SelectClasses;
import org.junit.platform.suite.api.Suite;

@Suite
@SelectClasses({
        com.uniovi.sdi2526entrega2test.x72x.RestApiAuthTests.class,
        com.uniovi.sdi2526entrega2test.x72x.RestApiReservationTests.class,
        com.uniovi.sdi2526entrega2test.x72x.ReactSeleniumTests.class,
        com.uniovi.sdi2526entrega2test.x72x.WebFrontendSeleniumTests.class,
})
public class AllTests {
}
