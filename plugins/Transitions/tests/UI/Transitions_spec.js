/*!
 * Matomo - free/libre analytics platform
 *
 * transitions screenshot tests
 *
 * @link https://matomo.org
 * @license http://www.gnu.org/licenses/gpl-3.0.html GPL v3 or later
 */

describe("Transitions", function () {
    this.timeout(0);

    var generalParams = 'idSite=1&period=year&date=2012-08-09',
        urlBase = 'module=CoreHome&action=index&' + generalParams;


    function selectValue(page, field, title)
    {
        page.execCallback(function () {
            page.webpage.evaluate(function(field) {
                $(field + ' input.select-dropdown').click()
            }, field);
        });
        page.wait(800);
        page.execCallback(function () {
            page.webpage.evaluate(function(field, title) {
                $(field + ' .dropdown-content.active li:contains("' + title + '"):first').click()
            }, field, title);
        });
    };

    it('should load the transitions popup correctly for the page titles report', async function() {
        await page.goto("?" + urlBase + "#?" + generalParams + "&category=General_Actions&subcategory=Actions_SubmenuPageTitles");

        await (await page.jQuery('div.dataTable tbody tr:eq(2)')).hover();
        await (await page.jQuery('a.actionTransitions:visible')).hover(); // necessary to get popover to display
        await (await page.jQuery('a.actionTransitions:visible')).click();

        await page.waitForNetworkIdle();

        expect(await page.screenshotSelector('.ui-dialog')).to.matchImage('transitions_popup_titles');
    });

    it('should load the transitions popup correctly for the page urls report', async function() {
        await page.goto("?" + urlBase + "#?" + generalParams + "&category=General_Actions&subcategory=General_Pages&"
                    + "popover=RowAction$3ATransitions$3Aurl$3Ahttp$3A$2F$2Fpiwik.net$2Fdocs$2Fmanage-websites$2F");
        await page.hover('.Transitions_CurveTextRight');

        expect(await page.screenshotSelector('.ui-dialog')).to.matchImage('transitions_popup_urls');
    });

    it('should show no data message in selector', function (done) {
        expect.screenshot('transitions_report_no_data_widget').to.be.captureSelector('body', function (page) {
            page.load("?module=Widgetize&action=iframe&widget=1&moduleToWidgetize=Transitions&actionToWidgetize=getTransitions&idSite=1&period=day&date=today&disableLink=1&widget=1");
        }, done);
    });

    it('should show report in reporting ui with data', function (done) {
        expect.screenshot('transitions_report_with_data_report').to.be.captureSelector('.pageWrap', function (page) {
            page.load("?" + urlBase + "#?" + generalParams + "&category=General_Actions&subcategory=Transitions_Transitions");
            page.wait(1000);
        }, done);
    });

    it('should show report in widget ui in selector', function (done) {
        expect.screenshot('transitions_report_with_data_widget').to.be.captureSelector('body', function (page) {
            page.load("?module=Widgetize&action=iframe&widget=1&moduleToWidgetize=Transitions&actionToWidgetize=getTransitions&"+generalParams+"&disableLink=1&widget=1");
            page.wait(1000);
        }, done);
    });

    it('should be possible to switch report', function (done) {
        expect.screenshot('transitions_report_switch_url').to.be.captureSelector('body', function (page) {
            selectValue(page, '[name="actionName"]', 'category/meta');
        }, done);
    });

    it('should be possible to show page titles', function (done) {
        expect.screenshot('transitions_report_switch_type_title').to.be.captureSelector('body', function (page) {
            selectValue(page, '[name="actionType"]', 'Title');
        }, done);
    });

});