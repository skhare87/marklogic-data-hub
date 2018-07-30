import {
  protractor, browser, element, by, By, $, $$, ExpectedConditions as EC, ElementFinder,
  ElementArrayFinder
} from 'protractor'
import { AppPage } from '../appPage';
import { pages } from '../page';
import {Element} from "@angular/compiler";

export class BrowsePage extends AppPage {

  //to get the login box locater
  locator() {
    return by.css('app-search > div');
  }

  databaseDropDown() {
    return element(by.css(`.database-chooser > mdl-select >div > span.mdl-select__toggle.material-icons`));
  }

  selectDatabase(databaseName: string) {
    return element(by.cssContainingText('div.mdl-list__item-primary-content', databaseName));
  }

  entitiesOnlyChkBox() {
    return element(by.css('app-search .mdl-checkbox'));
  }

  searchBox() {
    return element(by.css('.search-box > form > input'));
  }

  searchButton() {
    return element(by.buttonText('Search'));
  }

  get noDataText() {
    return element(by.xpath('//div[contains(text(),\'No Data\')]'));
  }

  resultsPagination() {
    return element(by.css('app-pagination > .container'));
  }

  resultsUri() {
    return element(by.css('.results .result a'));
  }

  resultsSpecificUri(uri: string) {
    return element(by.cssContainingText('.results .result a', uri));
  }

  //TODO Locators for Collection facet

}

var browsePage = new BrowsePage();
export default browsePage;
pages.addPage(browsePage);
