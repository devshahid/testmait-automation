let { CommonUtils, TestData, TM } = inject();
const moment = require('moment');

/* eslint-disable no-undef */

When(
  /^I login to eShipper Portal with user "([^"]*)" and password "([^"]*)"$/,
  async (username, password) => {
    username = CommonUtils.identifyData(username);
    password = CommonUtils.identifyData(password);
    await TM.fillField('Enter your username', username);
    await TM.fillField('Enter your password', password);
    await TM.click("//button[text()='Login']");
  },
);

Then(/^I logout$/, async () => {
  await TM.click({ id: 'profile__dropdown' });
  await TM.click({ id: 'app__logout' });
});

When(/^I select courier service at position (\d+)$/, async (position) => {
  const createDynamicLocator = (position) => {
    return `//jhi-rate-line[${position}]`;
  };

  const myLocator = createDynamicLocator(position);
  await TM.waitForElement(myLocator, 30);
  await TM.click(myLocator);
});

When(
  /^I fill field for "([^"]*)" at position (\d+) with value "([^"]*)"$/,
  async (placeholder, position, value) => {
    const createDynamicLocator = (placeholderValue, position) => {
      return locate('input').withAttr({ placeholder: placeholderValue }).at(position);
    };

    const myLocator = createDynamicLocator(placeholder, position);
    value = CommonUtils.identifyData(value);
    let replaceValue = value;
    if (value === 'pass_rand') {
      replaceValue = value.replace(/pass_rand/g, CommonUtils.generateRandomPassword());
    } else if (value.includes('_rand')) {
      replaceValue = value.replace(/_rand/g, await CommonUtils.generateRandomAlphabetString());
    } else if (value.includes('RAND_')) {
      replaceValue = await CommonUtils.generateRandomNumbers('storeValue', value);
    }
    TestData.setField(value, replaceValue);
    await TM.fillField(myLocator, replaceValue);
    await TM.wait(1);
    // TM.pressKey('Escape');
  },
);

When(
  /^I fill field for textarea "([^"]*)" at position (\d+) with value "([^"]*)"$/,
  async (placeholder, position, value) => {
    const createDynamicLocator = (placeholderValue, position) => {
      return locate('textarea').withAttr({ placeholder: placeholderValue }).at(position);
    };

    const myLocator = createDynamicLocator(placeholder, position);
    await TM.wait(1);
    await TM.fillField(myLocator, CommonUtils.identifyData(value));
  },
);

When(/^I click on input for "([^"]*)" at position (\d+)$/, async (placeholder, position) => {
  const createDynamicLocator = (placeholderValue, position) => {
    return locate('input').withAttr({ placeholder: placeholderValue }).at(position);
  };

  const myLocator = createDynamicLocator(placeholder, position);
  await TM.click(myLocator);
});

When(/^I click on list for "([^"]*)" at position (\d+)$/, async (placeholder, position) => {
  const createDynamicLocator = (placeholderValue, position) => {
    return locate('mat-select').withAttr({ placeholder: placeholderValue }).at(position);
  };

  const myLocator = createDynamicLocator(placeholder, position);
  await TM.click(myLocator);
});

When(/^I click on input for "([^"]*)"$/, async (placeholder) => {
  const createDynamicLocator = (placeholderValue) => {
    return locate('input').withAttr({ placeholder: placeholderValue });
  };

  const myLocator = createDynamicLocator(placeholder);
  await TM.click(myLocator);
});

When(/^I pick "([^"]*)" from option "([^"]*)"$/, async (select, option) => {
  // await TM.click(`//span[contains(text(), "${select}")]`);
  // await TM.click(`//span[contains(text(), "${CommonUtils.identifyLocator(option)}")]`);

  await TM.click(CommonUtils.identifyLocator(select));
  await TM.click(CommonUtils.identifyLocator(option));
});

When(/^I pick option "([^"]*)" from "([^"]*)"$/, async (option, select) => {
  await TM.click(`//span[contains(text(), "${select}")]`);
  await TM.click(`//span[contains(text(), "${CommonUtils.identifyLocator(option)}")]`);

  // TM.click(CommonUtils.identifyLocator(select));
  // TM.click(CommonUtils.identifyLocator(option));
});

When(/^I click on button "([^"]*)"$/, async (locator) => {
  await TM.click(`//button[contains(text(), "${CommonUtils.identifyLocator(locator)}")]`);
});

When(/^I click on "([^"]*)"$/, async (locator) => {
  //await TM.click(`//span[contains(text(), "${CommonUtils.identifyLocator(locator)}")]`);
  await TM.wait(1);
  await TM.click(`//span[(text()="${CommonUtils.identifyLocator(locator)}")]`);
});

When(
  /^I select option "([^"]*)" from "([^"]*)" at position (\d+)$/,
  async (option, select, position) => {
    const createDynamicLocator = (placeholderValue, position) => {
      return locate('mat-select')
        .withAttr({ 'ng-reflect-placeholder': placeholderValue })
        .at(position);
    };

    const myLocator = createDynamicLocator(select, position);
    await TM.click(myLocator);
    await TM.click(locate('span.mat-option-text').withText(option));
  },
);

When(
  /^I select option "([^"]*)" from (placeholder|name|aria-label) "([^"]*)" at position (\d+)$/,
  async (option, ref, select, position) => {
    const createDynamicLocator = (placeholderValue, position) => {
      return locate('mat-select')
        .withAttr({ [`ng-reflect-${ref}`]: placeholderValue })
        .at(position);
    };

    const myLocator = createDynamicLocator(select, position);
    await TM.click(myLocator);
    await TM.click(locate('span.mat-option-text').withText(CommonUtils.identifyData(option)));
  },
);

When(/^I select "([^"]*)" from "([^"]*)" dropdown$/, async (option, select) => {
  await TM.click(CommonUtils.identifyLocator(select));
  await TM.click(CommonUtils.identifyLocator(option));
});

When(/^I remove filtered value "([^"]*)"$/, async (value) => {
  value = CommonUtils.identifyData(value);
  await TM.waitForElement(`//span[normalize-space(text()) = '${value}']//following-sibling::i`, 15);
  await TM.click(`//span[normalize-space(text()) = '${value}']//following-sibling::i`);
  await TM.wait(2);
});

When(/^I select (future|current) date at position (\d+)$/, async (type, position) => {
  let date = moment().format('YYYY/MMM/D');
  if (type == 'future') {
    date = moment().add(3, 'days').format('YYYY/MMM/D');
  }
  const dateStr = date.split('/');
  const createDynamicLocator = (position) => {
    return locate('button').withAttr({ 'aria-label': 'Open calendar' }).at(position);
  };
  const myLocator = createDynamicLocator(position);
  await TM.click(CommonUtils.identifyLocator(myLocator));
  await TM.click(
    CommonUtils.identifyLocator(
      "//button[@aria-label='Choose month and year']/span[contains(@class, 'mat-button-wrapper')]",
    ),
  );
  for (let i of dateStr) {
    await TM.click(
      `//div[contains(@class, 'mat-calendar-body-cell-content') and normalize-space(text()) = '${i.toUpperCase()}']`,
    );
  }
});

When(
  /^I select "([^"]*)" (button|option|dropdown) at position (\d+)$/,
  async (value, option, position) => {
    if (option == 'button') {
      await TM.click(`(//button[contains(@class, 'mat-menu-trigger')])[${position}]`);
      await TM.wait(2);
      await TM.click(
        `//button[contains(@class, 'mat-menu-item') and normalize-space(text())='${value}']`,
      );
    } else if (option == 'dropdown') {
      await TM.click(
        `//button[contains(@class, 'mat-menu-trigger')]//span[normalize-space(text())='${value}']`,
      );
    } else {
      await TM.click(`//button[contains(@class, 'mat-menu-item')]//span[text()= '${value}']`);
    }
  },
);

When(/^I get request id from "([^"]*)" and store in "([^"]*)"$/, async (data, storeVar) => {
  let value = CommonUtils.identifyData(data).match(/WO#\s(\d+)/);
  if (!value) TM.fail('Request Id not available');
  TestData.setField(storeVar, value[1]);
});

When(/^I navigate to "([^"]*)" tab$/, async (value) => {
  const createDynamicLocator = (text) => {
    return locate('div').withAttr({ class: 'mat-tab-label-content' }).withText(text);
  };
  const myLocator = createDynamicLocator(value);
  await TM.click(myLocator);
});

When(/^I navigate to "([^"]*)" tab under customer$/, async (value) => {
  const myLocator = locate('div.mat-tab-links').find('a').withText(value);
  console.log(myLocator);
  await TM.click(myLocator);
});

When(/^I click on searched value "([^"]*)" in (dropdown|list)$/, async (value, location) => {
  if (location == 'dropdown') {
    const myLocator = locate('mat-option').find('span').withText(CommonUtils.identifyData(value));
    await TM.click(myLocator);
  } else {
    const myLocator = locate('span')
      .withAttr({ class: 'mat-tooltip-trigger' })
      .withText(CommonUtils.identifyData(value));
    await TM.click(myLocator);
  }
});

When(/^I search for value "([^"]*)"$/, async (value) => {
  const myLocator = locate('input').withAttr({ 'ng-reflect-type': 'search' });
  await TM.wait(1);
  await TM.fillField(myLocator, CommonUtils.identifyData(value));
});

When(/^I opt for "([^"]*)" at position (\d+)$/, async (option, position) => {
  const myLocator = locate('input').withAttr({ placeholder: 'Search' }).at(position);
  await TM.fillField(myLocator, CommonUtils.identifyData(option));
  await TM.checkOption(
    "//div[contains(@class, 'mat-menu-content')]//div[contains(@class, 'mat-checkbox-inner-container')]",
  );
});

When(/^I click on apply$/, async () => {
  await TM.click("//div[contains(@class, 'mat-menu-content')]//button[(text()='Apply')]");
});

When(/^I calculate future time and store in "([^"]*)"$/, async (variable) => {
  // Get current system time
  const currentTime = moment();
  let nearestTime;
  // Check if the current time is between 12:00 am and 7:00 am
  if (currentTime.isBetween(moment('00:00', 'HH:mm'), moment('06:30', 'HH:mm'))) {
    // Set nearest time to 7:00 am
    nearestTime = moment('07:00', 'HH:mm').format('HH:mm');
  } else {
    // Round up the current time to the nearest 30 minutes
    nearestTime = moment(currentTime)
      .add(60 - (currentTime.minute() % 30), 'minutes')
      .format('HH:mm');
  }

  if (nearestTime > moment('20:30', 'HH:mm').format('HH:mm')) {
    await TM.fail(`Request not available at this time: ${nearestTime}`);
  } else {
    TestData.setField(variable, nearestTime);
  }
});

When(/^I toggle "([^"]*)" button$/, async (option) => {
  if (process.env.AI_PW === 'false') {
    await TM.checkOption(
      `//span[text()= ' ${option} ']/..//div[contains(@class, 'mat-slide-toggle-bar')]`,
    );
  } else {
    await TM.click(
      `//span[text()= ' ${option} ']/..//div[contains(@class, 'mat-slide-toggle-bar')]`,
    );
  }
  await TM.wait(2);
});
