// const { CommonUtils } = require('../../configs/utils');

let { TestData, TM, Mobile, CommonUtils } = inject();

Given(/^I launch the application "([^"]*)" on "([^"]*)"$/, async (app, device) => {
  await TM.switchHelper('Appium');
  await Mobile.startApp(app, device);
});

When(/^I navigate to "([^"]*)"$/, async (category) => {
  await TM.waitForElement(CommonUtils.identifyLocator(category), 15);
  await TM.tap(CommonUtils.identifyLocator(category), 15);
});

When(
  /^I login to caratlane with user "([^"]*)" and password "([^"]*)"$/,
  async (user, password) => {
    // await TM.waitForElement(CommonUtils.identifyLocator('bottom_tab_you'), 15);
    // await TM.tap(CommonUtils.identifyLocator('bottom_tab_you'));
    // await TM.waitForElement(CommonUtils.identifyLocator('login'), 15);
    // await TM.tap(CommonUtils.identifyLocator('login'));
    await TM.see('Welcome back!');
    await TM.fillField('Enter Mobile Number or Email', CommonUtils.identifyData(user));
    const close_icon = await TM.grabNumberOfVisibleElements(
      CommonUtils.identifyLocator('//android.widget.ImageView[@content-desc="Close"]'),
    );
    if (close_icon) {
      await TM.tap(
        CommonUtils.identifyLocator('//android.widget.ImageView[@content-desc="Close"]'),
      );
    }
    await TM.tap('CONTINUE TO LOGIN');
    await TM.fillField('Password', CommonUtils.identifyData(password));
  },
);

When(/^I navigate to "([^"]*)" from account tab$/, async (option) => {
  await TM.waitForElement(CommonUtils.identifyLocator('bottom_tab_you'), 15);
  await TM.tap(CommonUtils.identifyLocator('bottom_tab_you'));
  await TM.tap(CommonUtils.identifyLocator('my_account'));
  await TM.waitForElement("//*[@resource-id='com.caratlane.android:id/sidemenu_rv']", 10);

  let screenElements = await TM.grabTextFromAll(
    "//*[@resource-id='com.caratlane.android:id/text']",
  );
  const value = await TM.grabElementBoundingRect(
    "//*[@resource-id='com.caratlane.android:id/sidemenu_rv']",
  );
  const sourceX = parseInt(value['x']) + parseInt(value['width']) / 2;
  const sourceY = parseInt(value['y']) + parseInt(value['height']) - 100;
  const halfSourceY = parseInt(value['y']) + parseInt(value['height']) / 2;
  while (!screenElements.includes(option)) {
    await TM.performSwipe({ x: sourceX, y: sourceY }, { x: sourceX, y: sourceY - halfSourceY });
    screenElements = await TM.grabTextFromAll("//*[@resource-id='com.caratlane.android:id/text']");
  }
  await TM.tap(CommonUtils.identifyLocator('logout'));
  await TM.waitForElement(CommonUtils.identifyLocator('warning_confirm_btn'), 10);
  await TM.tap(CommonUtils.identifyLocator('warning_confirm_btn'));
});

When(/^I cancel "([^"]*)" popup$/, async (popup_title) => {
  await TM.wait(5);
  const title = await TM.grabNumberOfVisibleElements(
    CommonUtils.identifyLocator('warning_cancel_btn'),
  );
  if (title > 0) {
    await TM.tap(CommonUtils.identifyLocator('warning_cancel_btn'), 15);
  }
});

When(/^I remove added product from cart$/, async () => {
  await TM.waitForElement('//android.widget.ImageView[@content-desc="CANCEL"]', 15);
  const remove_icon = await TM.grabNumberOfVisibleElements(
    '//android.widget.ImageView[@content-desc="CANCEL"]',
  );
  if (remove_icon > 0) {
    for (let i = 1; i <= remove_icon; i++) {
      const del_icon = await TM.grabNumberOfVisibleElements(
        CommonUtils.identifyLocator('delete_icon'),
      );
      if (del_icon > 0) {
        await TM.waitForElement(CommonUtils.identifyLocator('delete_icon'), 10);
        await TM.tap(CommonUtils.identifyLocator('delete_icon'));
        await TM.waitForText('REMOVE', 5);
        await TM.tap('REMOVE');
        await TM.wait(3);
      }
    }
  }
});

When(/^I get product price from "([^"]*)" and store in "([^"]*)"$/, async (locator, store) => {
  await TM.waitForElement(CommonUtils.identifyLocator(locator), 15);
  const productPrice = await TM.grabTextFrom(CommonUtils.identifyLocator(locator));
  TestData.setField(store, productPrice);
});

When(/^I validate "([^"]*)" is present in SKU code$/, async (targetLetter) => {
  let sku_code = await TM.grabTextFrom(CommonUtils.identifyLocator('sku_code'));
  sku_code = sku_code.trim();
  console.log(sku_code);
  if (sku_code.charAt(5) === targetLetter) {
    TM.report(`${targetLetter} is present as second letter in SKU code`);
  } else TM.fail(`${targetLetter} is not present as second letter in SKU code`);
});
