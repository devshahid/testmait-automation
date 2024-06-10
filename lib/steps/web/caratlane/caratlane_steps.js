let { CommonUtils, TestData, TM } = inject();

/* eslint-disable no-undef */

When(/^I hover to account section and click on "([^"]*)"$/, async (category) => {
  TM.waitForElement("//div[contains(@type, 'USER_PROFILE')]", 15);
  TM.moveCursorTo("//div[contains(@type, 'USER_PROFILE')]");
  TM.click(
    `//div[contains(@type, 'USER_PROFILE')]//following-sibling::div//a[text()='${CommonUtils.identifyData(
      category,
    )}']`,
  );
});

When(/^I hover to "([^"]*)"$/, async (locator) => {
  TM.waitForElement(CommonUtils.identifyLocator(locator), 15);
  TM.moveCursorTo(CommonUtils.identifyLocator(locator));
});
