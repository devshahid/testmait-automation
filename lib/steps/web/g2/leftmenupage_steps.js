let { TM, LeftMenuPage, GenericMethods, CommonUtils, ButtonLink } = inject();

/* eslint-disable no-undef */
Then(/^I click on left menu "([^"]*)"$/, async (leftMenu) => {
  await GenericMethods.switchToLeftHandMenuIframe();
  await LeftMenuPage.navigateToLeftMenu(leftMenu, 'buttonLeftMenu');
  await GenericMethods.switchToCurrentWindowFrame();
  TM.report('Clicked on left menu ' + leftMenu);
});

Then(/^I click on left child menu "([^"]*)" in the "([^"]*)" Page$/, async (childMenu, page) => {
  await GenericMethods.switchToLeftHandMenuIframe();
  if (page == 'Home') {
    await LeftMenuPage.navigateToLeftChildMenu(childMenu, 'buttonLeftChildMenu');
  } else {
    alignment = CommonUtils.identifyData('Configuration.' + childMenu);
    path =
      "(//div[contains(@class, 'layout-container')]//div[@class='sidebar-item-container']//span[text()='" +
      childMenu +
      "'])[" +
      alignment +
      ']';
    await ButtonLink.clickOnElement(path);
  }
  await GenericMethods.switchToCurrentWindowFrame();
  TM.report('Clicked on left child menu ' + childMenu + 'in the' + page);
});

Then(
  /^I click on left child menu "([^"]*)" in org of the "([^"]*)" Page$/,
  async (childMenu, page) => {
    await GenericMethods.switchToLeftHandMenuIframe();
    if (page == 'Home') {
      await LeftMenuPage.navigateToLeftChildMenu(childMenu, 'buttonLeftChildMenu');
    } else {
      alignment = CommonUtils.identifyData('Configuration.' + childMenu);
      path =
        "//div[contains(@class, 'layout-container')]//div[@class='sidebar-container']//li[contains(text(),'" +
        childMenu +
        "')]";
      await ButtonLink.clickOnElement(path);
    }
    await GenericMethods.switchToCurrentWindowFrame();
    TM.report('Clicked on left child menu ' + childMenu + 'in the' + page);
  },
);

Then(/^I click on Left child menu "([^"]*)" in config$/, async (childMenu) => {
  await GenericMethods.switchToLeftHandMenuIframe();
  await LeftMenuPage.navigateToLeftMenu(childMenu, 'buttonLeftChildMenuConfig');
  await GenericMethods.switchToCurrentWindowFrame();
  TM.report('Clicked on left child menu ' + childMenu);
});
