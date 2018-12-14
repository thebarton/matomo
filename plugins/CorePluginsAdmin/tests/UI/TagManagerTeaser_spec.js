/*!
 * Matomo - free/libre analytics platform
 *
 * Screenshot integration tests.
 *
 * @link https://matomo.org
 * @license http://www.gnu.org/licenses/gpl-3.0.html GPL v3 or later
 */

describe("TagManagerTeaser", function () {
    this.timeout(0);

    var urlBase = '?module=CorePluginsAdmin&action=tagManagerTeaser&idSite=1&period=day&date=2010-01-03',
        pageSelector = '.activateTagManager';

    function setPluginsToLoad(plugins)
    {
        testEnvironment.pluginsToLoad = plugins;
        testEnvironment.save();
    }

    function unloadTagManager()
    {
        testEnvironment.unloadTagManager = 1;
        testEnvironment.save();
    }

    function setAdminUser()
    {
        delete testEnvironment.idSitesViewAccess;
        delete testEnvironment.idSitesWriteAccess;
        testEnvironment.idSitesAdminAccess = [1];
        testEnvironment.save();
    }

    function reset()
    {
        delete testEnvironment.idSitesViewAccess;
        delete testEnvironment.idSitesWriteAccess;
        delete testEnvironment.idSitesAdminAccess;
        delete testEnvironment.idSitesCapabilities;
        delete testEnvironment.unloadTagManager;
        testEnvironment.save();
    }

    beforeEach(function () {
        setPluginsToLoad(['CorePluginsAdmin']);
    });

    afterEach(reset);

    async function capturePage(screenshotName, test, selector)
    {
        await test();

        if (!selector) {
            selector = pageSelector;
        }
        expect(await page.screenshotSelector(selector)).to.matchImage(screenshotName);
    }

    it('should show teaser to super user', async function () {
        unloadTagManager();
        await capturePage('superuser_page', async function () {
            unloadTagManager();
            await page.goto(urlBase);
        });
    });

    it('should be possible to activate plugin and redirect to tag manager', async function () {
        await capturePage('super_user_activate_plugin', async function () {
            await page.click('.activateTagManager .activateTagManagerPlugin');
        }, '.pageWrap');
    });

    it('should show teaser to admin', async function () {
        unloadTagManager();
        setAdminUser();
        await capturePage('admin_page', async function () {
            unloadTagManager();
            setAdminUser();
            await page.goto(urlBase);
        });
    });

    it('should be possible to disable page and redirect to home', async function () {
        await capturePage('admin_page_disable', async function () {
            unloadTagManager();
            setAdminUser();
            await page.click('.activateTagManager .dontShowAgainBtn');
        }, '.pageWrap');
    });

});