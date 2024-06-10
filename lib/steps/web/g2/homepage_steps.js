let { TM, HomePage } = inject();
/* eslint-disable no-undef */
Then(/^I click on top menu "([^"]*)"$/, async (locator) => {
  await HomePage.clickOnTopAndSubMenu(locator);
  TM.report('Clicked on Top Menu ' + locator);
});

When(/^I click on top menu "([^"]*)" and select sub menu "([^"]*)"$/, async (topMenu, subMenu) => {
  await HomePage.clickOnTopAndSubMenu(topMenu, subMenu);
  TM.report('Clicked on top menu ' + topMenu + ' and sub menu ' + subMenu);
});

Then(/^I close tab near to home tab$/, async () => {
  await HomePage.clickOnCloseTabNearHome();
  TM.report('Closed tab near home tab');
});

Then(/^I close current tab$/, async () => {
  await HomePage.closeCurrentTab();
  TM.report('Closed current tab');
});

Then(/^I logout the "([^"]*)" portal and close the browser$/, async (logout_details) => {
  await HomePage.clickOnLogout(logout_details);
  TM.report('Logged out and closed the browser');
});

Then(/^I refresh the page$/, async () => {
  await TM.refreshPage();
  TM.report('Page reloaded');
});
