let { CommonUtils, TestData, TM } = inject();

/* eslint-disable no-undef */

Given(/^I login into Lamdatest$/, async () => {
  username = CommonUtils.identifyData('lambdatest_username');
  password = CommonUtils.identifyData('lambdatest_password');
  username_locator = CommonUtils.identifyLocator('lambdatest_username');
  password_locator = CommonUtils.identifyLocator('lambdatest_password');
  await TM.fillField(username_locator, username);
  await TM.fillField(password_locator, password);
  await TM.click('Login');
});

Then(/^I logout$/, async () => {
  await TM.click({ id: 'profile__dropdown' });
  await TM.click({ id: 'app__logout' });
});
