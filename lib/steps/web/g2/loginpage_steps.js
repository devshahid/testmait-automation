let { TM, LoginPage } = inject();

/* eslint-disable no-undef */
Given(/^I login to Fintech as "([^"]*)" operator$/, async (login_details) => {
  await LoginPage.login(login_details);
  TM.report('Logged into mpesa as ' + login_details);
});

Given(
  /^browser is open and not able to login into mpesa with user "([^"]*)"$/,
  async (login_details) => {
    await LoginPage.loginError(login_details);
  },
);

Given(
  /^I login to Mpesa as "([^"]*)" operator and enter the wrong password for "([^"]*)" times$/,
  async (login_details, numberOfTimes) => {
    await LoginPage.loginRepeatedly(login_details, numberOfTimes);
  },
);
