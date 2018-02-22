import { protractor , browser, element, by, By, $, $$, ExpectedConditions as EC} from 'protractor';
import { pages } from '../../page-objects/page';
import loginPage from '../../page-objects/auth/login';
import dashboardPage from '../../page-objects/dashboard/dashboard';
import entityPage from '../../page-objects/entities/entities';
import flowPage from '../../page-objects/flows/flows';
import jobsPage from '../../page-objects/jobs/jobs';
import browsePage from '../../page-objects/browse/browse';
import viewerPage from '../../page-objects/viewer/viewer';

export default function() {
  describe('Run Flows', () => {
    beforeAll(() => {
      flowPage.isLoaded();
    });

    it ('should redeploy modules', function() {
      flowPage.redeployButton.click();
      browser.wait(element(by.css('#last-deployed-time')).getText().then((txt) => {
        return (
          txt === 'Last Deployed: less than a minute ago' ||
          txt === 'Last Deployed: 1 minute ago'
        );
      }));
    });

    it ('should run Load Products flow', function() {
      flowPage.entityDisclosure('Product').click();
      browser.wait(EC.elementToBeClickable(flowPage.getFlow('Product', 'Load Products', 'INPUT')));
      flowPage.runInputFlow('Product', 'Load Products', 'json', 1);
    });

    it('should verify the loaded data', function() {
      //verify on jobs page
      flowPage.jobsTab.click();
      jobsPage.isLoaded();
      expect(jobsPage.finishedFlows.isPresent()).toBe(true);
      //verify the output
      jobsPage.jobOutputByPosition(1).click();
      browser.wait(EC.visibilityOf(jobsPage.jobOutputTitle()));
      expect(jobsPage.jobOutputTitle().isPresent()).toBe(true);
      expect(jobsPage.jobOutputContent('OUTPUT_RECORDS: 450').isPresent()).toBe(true);
      expect(jobsPage.jobOutputContent('OUTPUT_RECORDS_FAILED: 0').isPresent()).toBe(true);
      jobsPage.jobOutputCloseButton().click();
      //verify on browse data page
      jobsPage.browseDataTab.click();
      browsePage.isLoaded();
      expect(browsePage.resultsPagination().getText()).toContain('Showing Results 1 to 10 of 450');
      browsePage.databaseDropDown().click();
      browsePage.selectDatabase('STAGING').click();
      browser.wait(EC.elementToBeClickable(browsePage.resultsUri()));
      browsePage.searchBox().clear();
      browsePage.searchBox().sendKeys('442403950907');
      browsePage.searchButton().click();
      browser.wait(EC.elementToBeClickable(browsePage.resultsUri()));
      expect(browsePage.resultsUri().getText()).toContain('/board_games_accessories.csv-0-1');
      //verify on viewer page
      browsePage.resultsUri().click();
      viewerPage.isLoaded();
      expect(viewerPage.searchResultUri().getText()).toContain('/board_games_accessories.csv-0-1');
      expect(element(by.cssContainingText('.cm-variable', 'sku')).isPresent()).toBe(true);
      expect(element(by.cssContainingText('.cm-string', '442403950907')).isPresent()).toBe(true);
      expect(element(by.cssContainingText('.cm-variable', 'attachments')).isPresent()).toBe(true);
      expect(element(by.cssContainingText('.cm-variable', 'null')).isPresent()).toBe(true);
      expect(element(by.cssContainingText('.cm-variable', 'opt1')).isPresent()).toBe(false);
      expect(element(by.cssContainingText('.cm-string', 'world')).isPresent()).toBe(false);
      //verfiy on dashboard page
      viewerPage.dashboardTab.click();
      dashboardPage.isLoaded();
      expect(dashboardPage.stagingCount().getText()).toEqual('450');
      dashboardPage.flowsTab.click();
      flowPage.isLoaded();
    });

    it ('should setup Harmonize Products flow', function() {
      let contentWithOptionsFilePath = 'e2e/qa-data/plugins/contentWithOptions.sjs';
      flowPage.entityDisclosure('Product').click();
      browser.wait(EC.elementToBeClickable(flowPage.getFlow('Product', 'Harmonize Products', 'HARMONIZE')));
      flowPage.getFlow('Product', 'Harmonize Products', 'HARMONIZE').click();
      browser.wait(EC.visibilityOf(flowPage.tabs));
      //change content.sjs to include flow options
      flowPage.getFlowTab('content').click();
      flowPage.pluginTextArea().click();
      browser.actions().sendKeys(flowPage.ctrlA(), protractor.Key.DELETE, flowPage.readFileContent(contentWithOptionsFilePath)).perform();
      browser.actions().sendKeys(flowPage.ctrlS()).perform();
      browser.sleep(5000);
      browser.executeScript('window.document.getElementById("jobs-tab").click()');
      flowPage.flowsTab.click();
      flowPage.isLoaded();
    });

    it ('should logout', function() {
      flowPage.logout();
      loginPage.isLoaded();
    });

    it('should login', function() {
      loginPage.clickNext('ProjectDirTab');
      browser.wait(EC.elementToBeClickable(loginPage.environmentTab));
      loginPage.clickNext('EnvironmentTab');
      browser.wait(EC.elementToBeClickable(loginPage.loginTab));
      loginPage.login();
    });

    it('should run Harmonize Products flow', function() {
      flowPage.isLoaded();
      flowPage.entityDisclosure('Product').click();
      browser.wait(EC.elementToBeClickable(flowPage.getFlow('Product', 'Harmonize Products', 'HARMONIZE')));
      flowPage.getFlow('Product', 'Harmonize Products', 'HARMONIZE').click();
      browser.wait(EC.visibilityOf(flowPage.tabs));
      flowPage.getFlowTab('flowInfo').click();
      browser.wait(EC.elementToBeClickable(flowPage.runHarmonizeButton()));
      flowPage.runHarmonizeButton().click();
      browser.wait(EC.elementToBeClickable(flowPage.toastButton));
      flowPage.toastButton.click();
      flowPage.jobsTab.click();
      jobsPage.isLoaded();
      expect(jobsPage.finishedHarmonizedFlows.isPresent()).toBe(true);
      jobsPage.flowsTab.click();
      flowPage.isLoaded();
    });

    it('should verify the harmonized data', function() {
      flowPage.browseDataTab.click();
      browsePage.isLoaded();
      expect(browsePage.resultsPagination().getText()).toContain('Showing Results 1 to 10 of 450');
      browsePage.databaseDropDown().click();
      browsePage.selectDatabase('FINAL').click();
      browser.wait(EC.elementToBeClickable(browsePage.resultsUri()));
      browsePage.searchBox().clear();
      browsePage.searchBox().sendKeys('442403950907');
      browsePage.searchButton().click();
      browser.wait(EC.elementToBeClickable(browsePage.resultsUri()));
      expect(browsePage.resultsUri().getText()).toContain('/board_games_accessories.csv-0-1');
      browsePage.resultsUri().click();
      viewerPage.isLoaded();
      expect(viewerPage.searchResultUri().getText()).toContain('/board_games_accessories.csv-0-1');
      expect(element(by.cssContainingText('.cm-variable', 'opt1')).isPresent()).toBe(true);
      expect(element(by.cssContainingText('.cm-string', 'world')).isPresent()).toBe(true);
      viewerPage.flowsTab.click();
    });

    it ('should open the TestEntity disclosure', function() {
      flowPage.entityDisclosure('TestEntity').click();
      browser.wait(EC.elementToBeClickable(flowPage.getFlow('TestEntity', 'sjs json INPUT', 'INPUT')));
    });

    let flowCount = 1;
    ['sjs', 'xqy'].forEach((codeFormat) => {
      ['xml', 'json'].forEach((dataFormat) => {
        let flowType = 'INPUT';
        let flowName = `${codeFormat} ${dataFormat} ${flowType}`;
        it (`should run a ${flowName} flow`, function() {
          flowPage.runInputFlow('TestEntity', flowName, dataFormat, flowCount);
          flowCount++;
        });
      });
    });

    it ('should go to jobs page', function() {
      flowPage.jobsTab.click();
      jobsPage.isLoaded();
    });
  });
}
