const { ButtonLink, CommonUtils, Dropdown, TM, Textbox, Assert, TestData, G2Handlers } = inject();
const randomstring = require('randomstring');

/* eslint-disable no-undef */

// Then(/^I click on button "([^"]*)"$/, async (locator) => {
//   await ButtonLink.clickOnElement(locator);
// });

Then(/^I click on "([^"]*)"$/, async (locator) => {
  await ButtonLink.clickOnElement(locator);
});

Then(/^I click on "([^"]*)" with value "([^"]*)"$/, async (locator, customLocator) => {
  await ButtonLink.clickOnElement(locator, customLocator);
});

When(/^I can see text "([^"]*)"$/, async (locator) => {
  await Assert.verifyText(locator);
});

// ZeroQE todo Remove below
When(/^Verify text "([^"]*)" is available$/, async (locator) => {
  await Assert.verifyText(locator);
});

Then(/^I Verify element "([^"]*)" not available$/, async (locator) => {
  await Assert.verifyTextNotPresent(locator);
});

Then(/^I enter text "([^"]*)" with value "([^"]*)"$/, async (locator, value) => {
  await Textbox.enterValue(locator, value.toString());
});

Then(/^I select drop down "([^"]*)" with "([^"]*)"$/, async (locator, optionValue) => {
  await Dropdown.selectItemByName(locator, optionValue);
  await TM.report('Selected option ' + optionValue + ' for dropdown ' + locator);
});

Then(/^I wait "([^"]*)"$/, async (timeInterval) => {
  await TM.wait(timeInterval);
  await TM.report('I wait for ' + timeInterval + ' seconds');
});

Then(/^I wait for page to be loaded max to "([^"]*)"$/, async (timeInterval) => {
  await TM.wait(timeInterval);
  await TM.report('I wait for ' + timeInterval + ' seconds');
});

Then(/^I click on "([^"]*)"$/, async (locator) => {
  await ButtonLink.clickOnElement(locator);
});

// Todo - check if needed to remove or keep for manual test writing
Then(/^Validate the below values available in "([^"]*)"$/, async (locator, table) => {
  let expectedData = table.parse().rawData[1];
  await CommonUtils.compareFieldValuesWithList(locator, expectedData);
  await TM.report('Validated that values ' + expectedData + ' is present in list ' + locator);
});

// Todo - check if needed to remove or keep for manual test writing
Then(/^I click on check box "([^"]*)" with text "([^"]*)"$/, async (locator, text) => {
  await CheckBox.clickOnElement(locator, text);
});

// Todo - check if needed to remove or keep for manual test writing
Given(/^I generate name "([^"]*)" with value "([^"]*)"$/, async (outVar, randNum) => {
  await CommonUtils.generateRandomNumbers(outVar, randNum);
  await TM.report(
    'Generated random number ' + TestData.getField(outVar) + ' and stored it in ' + outVar,
  );
});

// Todo - check if needed to remove or keep for manual test writing
Then(/^I check value of "([^"]*)" is "([^"]*)"$/, async (value1, value2) => {
  value1 = CommonUtils.identifyData(value1);
  value2 = CommonUtils.identifyData(value2);
  await Assert.verifyIfTwoStringsAreEqual(value1, value2);
  await TM.report('Verified two strings ' + value1 + ' and ' + value2 + ' are equal');
});

// Todo - check if needed to remove or keep for manual test writing
Then(/^I record SystemDateTime and store in "([^"]*)"$/, async (strDate) => {
  await CommonUtils.getDateInFormat(strDate);
  await TM.report('Recorded current date and time ' + strDate);
});

// Todo - check if needed to remove or keep for manual test writing
Then(/^I check value of "([^"]*)" is not equal to "([^"]*)"$/, async (value1, value2) => {
  value1 = CommonUtils.identifyData(value1);
  value2 = CommonUtils.identifyData(value2);
  await Assert.compareTwoStringsNotEqual(value1, value2);
  await TM.report('Verified ' + value1 + ' is not equal to ' + value2);
});

// Todo - check if needed to remove or keep for manual test writing
Then(/^I report "([^"]*)"$/, async (message) => {
  await TM.report(message);
});

// Todo - check if needed to remove or keep for manual test writing
Then(
  /^concatenate strings "([^"]*)" with "([^"]*)" and store in "([^"]*)"$/,
  async (value1, value2, strVariable) => {
    value1 = CommonUtils.identifyData(value1);
    value2 = CommonUtils.identifyData(value2);
    TestData.setField(strVariable, value1 + value2);
  },
);

Then(/^I press key "([^"]*)"$/, async (key) => {
  await TM.pressKey(key);
  await TM.wait(2);
});

// Todo
Given(
  /^I generate random string "([^"]*)" with value "([^"]*)"$/,
  async (stringValue, stringLength) => {
    let len, str, s;
    if (stringLength.includes('_')) {
      len = stringLength.split('_')[1];
      str = stringLength.split('_')[0];
      s = randomstring.generate({ length: len, charset: 'alphabetic' });
      s = str + s;
    } else {
      s = randomstring.generate({ length: stringLength, charset: 'alphabetic' });
    }
    TestData.setField(stringValue, s);
  },
);

Then(/^I check transaction value of "([^"]*)" is "([^"]*)"$/, async (value1, value2) => {
  value1 = CommonUtils.identifyData(value1);
  value1 = value1.replace('-', '');
  value2 = CommonUtils.identifyData(value2);
  await Assert.verifyIfTwoStringsAreEqual(value1, value2);
  await TM.report('Verified two strings ' + value1 + ' and ' + value2 + ' are equal');
});

// Todo - check if needed to remove or keep for manual test writing
Then(/^I click on a button "([^"]*)"$/, async (locator) => {
  await G2Handlers.clickOnElement(locator, 'buttonLeftMenu');
});

// Todo - check if needed to remove or keep for manual test writing
Then(/^I click on menu "([^"]*)"$/, async (menu) => {
  await G2Handlers.clickOnElement(menu, 'buttonInSpan1');
  await TM.report('Clicked on menu ' + menu);
});
