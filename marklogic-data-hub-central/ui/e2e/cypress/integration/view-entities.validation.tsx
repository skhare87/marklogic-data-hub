/// <reference types="cypress"/>

import viewPage from '../support/pages/view';
import homePage from "../support/pages/home";
import { Application } from '../support/application.config';


describe('view page validation', () => {
  //login with valid account
  beforeEach(() => {
    cy.visit('/');
    cy.contains(Application.title);
    cy.loginAsDeveloper().withRequest();
    // temporary change as tile is not working
    homePage.getTitle().click();
    cy.wait(500);
    // temporary change end here
    homePage.getViewEntities().click();
  });

  it('check last harmonized', () => {
    viewPage.getLastharmonized('Customer').should('contain', 'ago');
    viewPage.getLastharmonized('Person').should('contain', 'ago');
  });

  it('check total document count', () => {
    viewPage.getEachEntityCount('Customer').should('be.equal', '1,003');
    viewPage.getEachEntityCount('Person').should('be.equal', '6');
  });

  it('check if entity row is clicked', () => {
    viewPage.getEntityRowClicked('Customer');
    viewPage.getEntityRowClicked('Person');
  });

  it('check entity properties', () => {
    viewPage.getEntityRowClicked('Customer');
    let customerPropertyName = ['id', 'firstname', 'lastname', 'email', 'zip'];
    let customerPropertyValues = ['Primary Key', 'Element Range Index', 'Element Range Index', 'Element Range Index', 'None'];
    for (let i = 0; i < customerPropertyName.length; i++) {
      viewPage.getEntityProperties(customerPropertyName[i], 'Customer').should('be.equal', customerPropertyValues[i]);
    }
  });


})