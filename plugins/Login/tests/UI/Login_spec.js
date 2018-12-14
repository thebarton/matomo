/*!
 * Piwik - free/libre analytics platform
 *
 * login & password reset screenshot tests.
 *
 * @link http://piwik.org
 * @license http://www.gnu.org/licenses/gpl-3.0.html GPL v3 or later
 */

describe("Login", function () {
    this.timeout(0);

    var md5Pass = "0adcc0d741277f74c64c8abab7330d1c", // md5("smarty-pants")
        formlessLoginUrl = "?module=Login&action=logme&login=oliverqueen&password=" + md5Pass,
        bruteForceLogUrl = "?module=Login&action=bruteForceLog",
        apiAuthUrl = "?module=API&method=UsersManager.getTokenAuth&format=json&userLogin=ovliverqueen&md5Password=" + md5Pass;

    before(function () {
        testEnvironment.testUseMockAuth = 0;
        testEnvironment.queryParamOverride = {date: "2012-01-01", period: "year"};
        testEnvironment.save();
    });

    beforeEach(function () {
        testEnvironment.testUseMockAuth = 0;
        testEnvironment.queryParamOverride = {date: "2012-01-01", period: "year"};
        testEnvironment.save();
    });

    after(function () {
        testEnvironment.testUseMockAuth = 1;
        delete testEnvironment.bruteForceBlockIps;
        delete testEnvironment.bruteForceBlockThisIp;
        delete testEnvironment.queryParamOverride;
        testEnvironment.save();
    });

    afterEach(function () {
        testEnvironment.testUseMockAuth = 1;
        delete testEnvironment.bruteForceBlockIps;
        delete testEnvironment.bruteForceBlockThisIp;
        delete testEnvironment.queryParamOverride;
        testEnvironment.save();
    });

    it("should show error when trying to log in through login form", function (done) {
        testEnvironment.testUseMockAuth = 0;
        testEnvironment.bruteForceBlockThisIp = 1;
        delete testEnvironment.bruteForceBlockIps;
        delete testEnvironment.queryParamOverride;
        testEnvironment.save();

        expect.screenshot("bruteforcelog_blockedlogin").to.be.capture(function (page) {
            page.load("");
        }, done);
    });

    it("should load correctly", async function() {
        await page.goto("");
        await page.waitForNetworkIdle();

        expect(await page.screenshot({ fullPage: true })).to.matchImage('login_form');
    });

    it("should fail when incorrect credentials are supplied", async function() {
        await page.type('#login_form_login', 'superUserLogin');
        await page.type('#login_form_password', 'wrongpassword');
        await page.click('#login_form_submit');
        await page.waitForNetworkIdle();

        expect(await page.screenshot({ fullPage: true })).to.matchImage('login_fail');
    });

    it("should redirect to Matomo when correct credentials are supplied", async function() {
        await page.type("#login_form_login", "superUserLogin");
        await page.type("#login_form_password", "superUserPass");
        await page.click("#login_form_submit");
        await page.waitForNetworkIdle();

        // check dashboard is shown
        await page.waitForSelector('#dashboard');
        await page.waitForNetworkIdle();
    });

    it("should redirect to login when logout link clicked", async function() {
        await page.click("nav .right .icon-sign-out");
        await page.waitForNetworkIdle();

        expect(await page.screenshot({ fullPage: true })).to.matchImage('login_form');
    });

    it("login with email and password should work", async function() {
        await page.type("#login_form_login", "hello@example.org");
        await page.type("#login_form_password", "superUserPass");
        await page.click("#login_form_submit");

        // check dashboard is shown
        await page.waitForSelector('#dashboard');
        await page.waitForNetworkIdle();
    });

    it("should display password reset form when forgot password link clicked", async function() {
        await page.click("nav .right .icon-sign-out");
        await page.waitForNetworkIdle();
        await page.click("a#login_form_nav");
        await page.waitForNetworkIdle();

        expect(await page.screenshot({ fullPage: true })).to.matchImage('forgot_password');
    });

    it("should show reset password form and error message on error", async function() {
        await page.type("#reset_form_login", "superUserLogin");
        await page.type("#reset_form_password", "superUserPass2");
        await page.click("#reset_form_submit");
        await page.waitForNetworkIdle();

        expect(await page.screenshot({ fullPage: true })).to.matchImage('password_reset_error');
    });

    it("should send email when password reset form submitted", async function() {
        await page.reload();
        await page.click("a#login_form_nav");
        await page.type("#reset_form_login", "superUserLogin");
        await page.type("#reset_form_password", "superUserPass2");
        await page.type("#reset_form_password_bis", "superUserPass2");
        await page.click("#reset_form_submit");
        await page.waitForNetworkIdle();

        expect(await page.screenshot({ fullPage: true })).to.matchImage('password_reset');
    });

    it("should reset password when password reset link is clicked", async function() {
        var expectedMailOutputFile = PIWIK_INCLUDE_PATH + '/tmp/Login.resetPassword.mail.json',
            mailSent = JSON.parse(require("fs").readFileSync(expectedMailOutputFile)),
            resetUrl = mailSent.contents.match(/http:\/\/.*/)[0];

        await page.goto(resetUrl);
        await page.waitForNetworkIdle();

        expect(await page.screenshot({ fullPage: true })).to.matchImage('password_reset_complete');
    });

    it("should login successfully when new credentials used", async function() {
        await page.type("#login_form_login", "superUserLogin");
        await page.type("#login_form_password", "superUserPass2");
        await page.click("#login_form_submit");

        // check dashboard is shown
        await page.waitForSelector('#dashboard');
        await page.waitForNetworkIdle();
    });

    it("should login successfully when formless login used", async function() {
        await page.click("nav .right .icon-sign-out");
        await page.goto(formlessLoginUrl);

        // check dashboard is shown
        await page.waitForSelector('#dashboard');
        await page.waitForNetworkIdle();
    });

    it('should not show login page when ips whitelisted and ip is not matching', async function() {
        testEnvironment.overrideConfig('General', 'login_whitelist_ip', ['199.199.199.199']);
        testEnvironment.save();
        await page.goto('');
        await page.waitForNetworkIdle();

        const element = await page.$('.box');
        expect(await element.screenshot()).to.matchImage('ip_not_whitelisted');
    });

    it("should show brute force log url when there are no entries", function (done) {
        testEnvironment.testUseMockAuth = 1;
        delete testEnvironment.queryParamOverride;
        delete testEnvironment.bruteForceBlockThisIp;
        delete testEnvironment.bruteForceBlockIps;
        testEnvironment.overrideConfig('General', 'login_whitelist_ip', []);
        testEnvironment.save();

        expect.screenshot("bruteforcelog_noentries").to.be.capture(function (page) {
            page.load(bruteForceLogUrl);
        }, done);
    });

    it("should show brute force log url when there are entries", function (done) {
        testEnvironment.testUseMockAuth = 1;
        testEnvironment.bruteForceBlockIps = 1;
        delete testEnvironment.bruteForceBlockThisIp;
        delete testEnvironment.queryParamOverride;
        testEnvironment.save();

        expect.screenshot("bruteforcelog_withentries").to.be.capture(function (page) {
            page.load(bruteForceLogUrl);
        }, done);
    });

    it("should show error when trying to attempt a log in through API", function (done) {
        testEnvironment.testUseMockAuth = 1;
        testEnvironment.bruteForceBlockThisIp = 1;
        delete testEnvironment.bruteForceBlockIps;
        delete testEnvironment.queryParamOverride;
        testEnvironment.save();

        expect.screenshot("bruteforcelog_blockedapi").to.be.capture(function (page) {
            page.load(apiAuthUrl);
        }, done);
    });

    it("should show error when trying to log in through logme", function (done) {
        testEnvironment.testUseMockAuth = 0;
        testEnvironment.bruteForceBlockThisIp = 1;
        delete testEnvironment.bruteForceBlockIps;
        delete testEnvironment.queryParamOverride;
        testEnvironment.save();

        expect.screenshot("bruteforcelog_blockedlogme").to.be.capture(function (page) {
            page.load(formlessLoginUrl);
        }, done);
    });
});