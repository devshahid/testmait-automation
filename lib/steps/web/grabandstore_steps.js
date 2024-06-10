// const { TM } = require('../../testmait/translations/pl-PL');

let { CommonUtils, TestData, Assert, TM } = inject();

/* eslint-disable no-undef */
Then(
  /^I get attribute "([^"]*)" from "([^"]*)" and store it in "([^"]*)"$/,
  async (attr, locator, outVar) => {
    if (typeof TestData.getLocator(locator) !== 'undefined') {
      locator = CommonUtils.identifyLocator(locator);
    }
    let value = await TM.grabAttributeFrom(CommonUtils.identifyLocator(locator), attr);
    TestData.setField(outVar, value);
  },
);

Then(/^I get all attributes of "([^"]*)" and store it in "([^"]*)"$/, async (locator, outVar) => {
  if (typeof TestData.getLocator(locator) !== 'undefined') {
    locator = CommonUtils.identifyLocator(locator);
  }
  let value = await TM.grabAttributeFromAll(CommonUtils.identifyLocator(locator));
  TestData.setField(outVar, value);
});

//TODO
Then(/^I get css property of "([^"]*)" and store it in "([^"]*)"$/, async (locator, outVar) => {
  if (typeof TestData.getLocator(locator) !== 'undefined') {
    locator = CommonUtils.identifyLocator(locator);
  }
  let value = await TM.grabCssPropertyFrom(CommonUtils.identifyLocator(locator));
  TestData.setField(outVar, value);
});

//TODO
Then(/^I get all css property of "([^"]*)" and store it in "([^"]*)"$/, async (locator, outVar) => {
  if (typeof TestData.getLocator(locator) !== 'undefined') {
    locator = CommonUtils.identifyLocator(locator);
  }
  let value = await TM.grabCssPropertyFromAll(CommonUtils.identifyLocator(locator));
  TestData.setField(outVar, value);
});

Then(/^I get current url and store it in "([^"]*)"$/, async (outVar) => {
  let value = await TM.grabCurrentUrl();
  TestData.setField(outVar, value);
});

Then(/^I get value of "([^"]*)" and store in "([^"]*)"$/, async (locator, outVar) => {
  if (typeof TestData.getLocator(locator) !== 'undefined') {
    locator = CommonUtils.identifyLocator(locator);
  }

  await TM.waitForElement(locator, 15);
  let value = await TM.grabTextFrom(locator);
  TestData.setField(outVar, value);
  TM.report('Stored value ' + value + ' of ' + locator + 'in ' + outVar);
});

Then(/^I get all values of "([^"]*)" and store it in "([^"]*)"$/, async (locator, outVar) => {
  if (typeof TestData.getLocator(locator) !== 'undefined') {
    locator = CommonUtils.identifyLocator(locator);
  }
  let value = await TM.grabTextFromAll(CommonUtils.identifyLocator(locator));
  TestData.setField(outVar, value);
});
