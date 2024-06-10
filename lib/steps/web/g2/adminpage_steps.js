let { TM, AdminPage } = inject();

/* eslint-disable no-undef */
When(/^I navigate to Admin -> "([^"]*)" page$/, async (subMenu) => {
  await AdminPage.navigateToAdminPage(subMenu);
  TM.report('Successfully navigated to Admin-> ' + subMenu + ' page');
});

Then(/^I create sp operator with below details$/, async (table) => {
  await AdminPage.createSpOperator(table);
  TM.report('Successfully created sp operator');
});

Then(/^I create organization operator with below details$/, async (table) => {
  await AdminPage.createOrgOperator(table);
  TM.report('Successfully created organization operator');
});
