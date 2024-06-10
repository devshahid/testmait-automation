let { CommonUtils, TestData, Assert, TM } = inject();

/* eslint-disable no-undef */

Then(/^I dont see text "([^"]*)"$/, async (value) => {
  await TM.dontSee(CommonUtils.identifyData(value));
});

Then(/^I dont see text "([^"]*)" inside "([^"]*)"$/, async (value, locator) => {
  await TM.dontSee(CommonUtils.identifyData(value), CommonUtils.identifyLocator(locator));
});

Then(/^I dont see check box "([^"]*)" is checked$/, async (locator) => {
  await TM.dontSeeCheckboxIsChecked(CommonUtils.identifyLocator(locator));
});

Then(/^I dont see cookie "([^"]*)"$/, async (value) => {
  await TM.dontSeeCookie(CommonUtils.identifyData(value));
});

Then(/^I dont see current url is "([^"]*)"$/, async (url) => {
  await TM.dontSeeCurrentUrlEquals(CommonUtils.identifyData(url));
});

Then(/^I dont see element "([^"]*)"$/, async (element) => {
  await TM.dontSeeElement(CommonUtils.identifyData(element));
});

Then(/^I dont see element "([^"]*)" in dom$/, async (element) => {
  await TM.dontSeeElementInDOM(CommonUtils.identifyData(element));
});

Then(/^I dont see "([^"]*)" in ([^"]*)$/, async (value, locator) => {
  await TM.dontSeeInField(CommonUtils.identifyData(value), CommonUtils.identifyData(locator));
});

Then(/^I dont see "([^"]*)" in source$/, async (value) => {
  await TM.dontSeeInSource(CommonUtils.identifyData(value));
});

Then(/^I dont see "([^"]*)" in title$/, async (value) => {
  await TM.dontSeeInTitle(CommonUtils.identifyData(value));
});

Then(/^I see "([^"]*)"$/, async (value) => {
  await TM.waitForText(CommonUtils.identifyData(value).toString(), 30);
});

Then(/^I see check box "([^"]*)" is checked$/, async (locator) => {
  await TM.seeCheckboxIsChecked(CommonUtils.identifyLocator(locator));
});

Then(/^I see cookie "([^"]*)"$/, async (value) => {
  await TM.seeCookie(CommonUtils.identifyData(value));
});

Then(/^I see current url is "([^"]*)"$/, async (url) => {
  if (url.includes('$')) {
    const sepUrl = url.split('$');
    const result = sepUrl[1].replace(/[{}]/g, '');
    const newUrl = sepUrl[0] + CommonUtils.identifyData(result);
    await TM.seeCurrentUrlEquals(CommonUtils.identifyData(newUrl));
  } else await TM.seeCurrentUrlEquals(CommonUtils.identifyData(url));
});

Then(/^I see element "([^"]*)"$/, async (element) => {
  await TM.waitForElement(CommonUtils.identifyLocator(element), 15);
  await TM.seeElement(CommonUtils.identifyLocator(element));
});

Then(/^I see element "([^"]*)" in dom$/, async (element) => {
  await TM.seeElementInDOM(CommonUtils.identifyData(element));
});

Then(/^I see "([^"]*)" in current url$/, async (url_fragment) => {
  await TM.seeInCurrentUrl(CommonUtils.identifyData(url_fragment));
});

Then(/^I see "([^"]*)" in "([^"]*)"$/, async (value, locator) => {
  await TM.seeInField(CommonUtils.identifyData(value), CommonUtils.identifyData(locator));
});

Then(/^I see "([^"]*)" in popup$/, async (value) => {
  await TM.seeInPopup(CommonUtils.identifyData(value));
});

Then(/^I see "([^"]*)" in source$/, async (value) => {
  await TM.seeInSource(CommonUtils.identifyData(value));
});

Then(/^I see "([^"]*)" in title$/, async (value) => {
  await TM.seeInTitle(CommonUtils.identifyData(value));
});

Then(/^I see "([^"]*)" "([^"]*)" times $/, async (locator, num) => {
  await TM.seeNumberOfElements(CommonUtils.identifyLocator(locator), num);
});

Then(/^I see title is "([^"]*)"$/, async (value) => {
  await TM.seeTitleEquals(CommonUtils.identifyData(value));
});

Then(/^I see text "([^"]*)" in "([^"]*)"$/, async (value, locator) => {
  await TM.waitForElement(CommonUtils.identifyLocator(locator), 15);
  await TM.see(CommonUtils.identifyData(value), CommonUtils.identifyLocator(locator));
});
