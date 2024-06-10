let { MobileComponent, CommonUtils, Mobile } = inject();

/* eslint-disable no-undef */

Given(
  /^I dial phone number of "([^"]*)" from "([^"]*)"$/,
  async (calling_number, caller_handset) => {
    numbers = CommonUtils.identifyData(calling_number);
    await MobileComponent.dialPhoneNumber(calling_number, caller_handset);
  },
);

Given(
  /^I dial special number of "([^"]*)" from "([^"]*)"$/,
  async (calling_number, caller_handset) => {
    numbers = CommonUtils.identifyData(calling_number);
    await MobileComponent.dialSpecialNumber(calling_number, caller_handset);
  },
);

When(/^I recieve call on "([^"]*)"/, async (reciever_phone) => {
  await MobileComponent.recieveCall(reciever_phone);
});

Then(/^I pick call on "([^"]*)"/, async (customer) => {
  await MobileComponent.pickCall(customer);
});

Then(/^I reject call on "([^"]*)"/, async (customer) => {
  await MobileComponent.rejectCall(customer);
});

Then(/^I talk for "([^"]*)"/, async (duration) => {
  await MobileComponent.waitForTime(duration);
});

Then(/^I disconnect the call from "([^"]*)"/, async (customer) => {
  await MobileComponent.disconnectCall(customer);
});

Then(/^I check message "([^"]*)" from "([^"]*)" on "([^"]*)"/, async (message, sms, customer) => {
  message = CommonUtils.identifyData(message);
  await MobileComponent.checkMessage(message, sms, customer);
});

// eslint-disable-next-line no-undef
Then(/^app is started in "([^"]*)"/, async (customer) => {
  await MobileComponent.startApp(customer);
});

// eslint-disable-next-line no-undef
Given(/^app is started in "([^"]*)"/, async (customer) => {
  await MobileComponent.startApp(customer);
});

When(/^I see "([^"]*)" on "([^"]*)"/, async (message, reciever_phone) => {
  message = CommonUtils.identifyData(message);
  await MobileComponent.checkText(message, reciever_phone);
});

Then(/^I click "([^"]*)" on "([^"]*)"/, async (nametoclick, reciever_phone) => {
  message = CommonUtils.identifyLocator(nametoclick);
  await MobileComponent.clickOnText(message, reciever_phone);
});

Then(/^I navigate to back from native screen/, async () => {
  await Mobile.navigateMobileBack();
});

Then(/^I perform multiple back action from mobile/, async () => {
  await Mobile.navigateMultipleBack();
});
