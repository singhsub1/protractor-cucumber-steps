'use strict';
/* global browser, expect, element, by, EC */
/* eslint new-cap: 0 */ // --> OFF for Given, When, Then

/*
 * Created by marketionist on 13.11.2016
 */
// #############################################################################

// Use the external Chai As Promised to deal with resolving promises in
// expectations
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const fs = require('fs');
const protractor = require('protractor');
const censor = require('./utils/helpers.js').censor;

chai.use(chaiAsPromised);
let expect = chai.expect;
let EC = protractor.ExpectedConditions;
let defaultCustomTimeout = 5000;
let customTimeout = browser.params.customTimeout || defaultCustomTimeout;
let pageObjects = browser.params.pageObjects;
let timeToWaitMax = 300100; // Maximum time to wait for in 'I wait for (\d+) ms' step

module.exports = function () {
    /**
     * Waits for the element to be present and displayed on the page
     * @param {string} elementSelector
     */
    function waitForDisplayed(elementSelector) {
        browser.wait(EC.presenceOf(elementSelector), customTimeout,
            'Element should be present, but it is not');
    }
    /**
     * Composes proper element locator for fuether actions
     * @param {string} page
     * @param {string} elem
     * @returns {object} elmnt
     */
    function composeLocator(page, elem) {
        let locator = pageObjects[page][elem];
        let elmnt;

        if (locator[0] + locator[1] === '//') {
            elmnt = element(by.xpath(locator));
        } else {
            elmnt = element(by.css(locator));
        }

        return elmnt;
    }

    // #### When steps #############################################################

    this.When(/^I go to URL "([^"]*)"$/, function (url, callback) {
        browser.get(url);
        callback();
    });

    this.When(/^I go to "([^"]*)"."([^"]*)"$/, function (page, elem, callback) {
        let url = pageObjects[page][elem];

        browser.get(url);
        callback();
    });

    this.When(/^I click "([^"]*)"."([^"]*)"$/, function (page, elem, callback) {
        let elmnt = composeLocator(page, elem);

        waitForDisplayed(elmnt);
        browser.wait(EC.elementToBeClickable(elmnt), customTimeout,
            `"${pageObjects[page][elem]}" should be clickable, but it is not`);
        elmnt.click();
        callback();
    });

    this.When(/^I wait and click "([^"]*)"."([^"]*)"$/, function (page, elem, callback) {
        let elmnt = composeLocator(page, elem);
        let timeToWait = 300;

        waitForDisplayed(elmnt);
        browser.wait(EC.elementToBeClickable(elmnt), customTimeout,
            `"${pageObjects[page][elem]}" should be clickable, but it is not`);
        setTimeout(function () {
            elmnt.click();
            callback();
        }, timeToWait);
    });

    this.When(/^I click "([^"]*)"."([^"]*)" if present$/, function (page, elem, callback) {
        let elmnt = composeLocator(page, elem);

        elmnt.isPresent().then(function (isPresent) {
            if (isPresent) {
                // Click only if element is present
                elmnt.click();
            }
            callback();
        });
    });

    this.When(/^I wait for (\d+) ms$/, { timeout: timeToWaitMax }, function (timeToWait, callback) {
        setTimeout(callback, timeToWait);
    });

    this.When(/^I type "([^"]*)" in the "([^"]*)"."([^"]*)"$/, function (
            text, page, elem, callback) {
        let inputField = composeLocator(page, elem);

        waitForDisplayed(inputField);
        browser.wait(EC.elementToBeClickable(inputField), customTimeout,
            `${pageObjects[page][elem]} should be clickable, but it is not`);
        browser.actions().mouseMove(inputField).click().perform();
        inputField.sendKeys(text);
        callback();
    });

    this.When(/^I type "([^"]*)"."([^"]*)" in the "([^"]*)"."([^"]*)"$/, function (
            page1, element1, page2, element2, callback) {
        let inputField = composeLocator(page2, element2);

        waitForDisplayed(inputField);
        browser.wait(EC.elementToBeClickable(inputField), customTimeout,
            `${pageObjects[page2][element2]} should be clickable, but it is not`);
        browser.actions().mouseMove(inputField).click().perform();
        inputField.sendKeys(pageObjects[page1][element1]);
        callback();
    });

    // #### Then steps #############################################################

    this.Then(/the title should equal to "([^"]*)"$/, function (text, callback) {
        expect(browser.getTitle()).to.eventually.equal(text).and.notify(callback);
    });

    this.Then(/^"([^"]*)"."([^"]*)" should be present$/, function (page, elem, callback) {
        let elmnt = composeLocator(page, elem);

        browser.wait(EC.presenceOf(elmnt), customTimeout,
            `"${pageObjects[page][elem]}" should be present, but it is not`);
        callback();
    });

    this.Then(/^"([^"]*)"."([^"]*)" has text "([^"]*)"$/, function (page, elem, text, callback) {
        let elmnt = composeLocator(page, elem);

        expect(elmnt.getText()).to.eventually.equal(text).and.notify(callback);
    });

    this.Then(/^"([^"]*)"."([^"]*)" has text "([^"]*)"."([^"]*)"$/, function (
            page1, element1, page2, element2, callback) {
        let elmnt = composeLocator(page1, element1);
        let text = pageObjects[page2][element2];

        expect(elmnt.getText()).to.eventually.equal(text).and.notify(callback);
    });

    // Take a callback as an additional argument to execute when the step is done
    this.Then(/^the file "([^"]*)" is empty$/, function (fileName, callback) {
        fs.readFile(fileName, 'utf8', function (error, contents) {
            if (error) {
                callback(error);
            } else {
                expect(contents).to.eventually.equal('').and.notify(callback);
            }
        });
    });

};