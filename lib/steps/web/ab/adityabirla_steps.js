const { grabNumberOfVisibleElements } = require('../../../components/handlers');

let { CommonUtils, TestData, TM } = inject();

/* eslint-disable no-undef */

When(/^I select option "([^"]*)" which is not already selected$/, async (select) => {
  //await TM.selectOption(CommonUtils.identifyLocator(select), CommonUtils.identifyData(option));
  const optionSelector = '.MuiSelect-root option:not([selected])';
  await TM.click(CommonUtils.identifyLocator(select));
  await TM.waitForVisible(optionSelector);
  await TM.click(optionSelector);
});

When(/^I select dropdown list option "([^"]*)" which is not already selected$/, async (select) => {
  //await TM.selectOption(CommonUtils.identifyLocator(select), CommonUtils.identifyData(option));
  await TM.click(CommonUtils.identifyLocator(select));
  await TM.wait(2);
  await TM.click(`//li[1]`);
  await TM.pressKey('Escape');
});

Then(
  /^I get first "([^"]*)" values of "([^"]*)" and store it in "([^"]*)"$/,
  async (num, locator, outVar) => {
    if (typeof TestData.getLocator(locator) !== 'undefined') {
      locator = CommonUtils.identifyLocator(locator);
    }
    let value = await TM.grabTextFromAll(CommonUtils.identifyLocator(locator));
    let newvalue = value.slice(0, num);
    TestData.setField(outVar, newvalue);
  },
);

Then(/^I check for the duplicate value in "([^"]*)" and "([^"]*)"$/, async (var1, var2) => {
  const hasDuplicates = (array) => new Set(array).size !== array.length;
  const input1 = CommonUtils.identifyData(var1);
  const input2 = CommonUtils.identifyData(var2);
  const inputs = [...input1, ...input2];

  // console.log(`Do we have duplicate values ${hasDuplicates(inputs)}`);
  if (hasDuplicates(inputs)) {
    Assert.fail('The array contains duplicate values.');
  } else {
    console.log('The array does not contain duplicate values.');
  }
});

When(/^I sort as "([^"]*)"$/, async (option) => {
  //await TM.selectOption(CommonUtils.identifyLocator(select), CommonUtils.identifyData(option));
  await TM.click('.CustomDropdown_customSelectMain__zt_mS');
  await TM.wait(2);
  await TM.click(`//li[contains(text(), "${option}")]`);
  // await TM.click(option);
  await TM.pressKey('Escape');
});

When(/^I select size from "([^"]*)" page$/, async (page) => {
  // try {
  //   const elementExists = await TM.seeElement(`//*[@class='size size-web selected']`);
  //   if (!elementExists) {
  //     await TM.click(`//*[@class='size size-web ']`);
  //   } else {
  //     console.log('Size selection not available');
  //   }
  // } catch (err) {
  //   // Handle the error (e.g., log a message)
  //   console.error('Element not found or timeout exceeded');
  if (page == 'Quick View') {
    TM.click(`//*[@class='QuickView__size__Z3Cq1  ']`);
  } else
    TM.click(
      `//div[contains(@class, 'size') and contains(@class, 'size-web') and not(contains(@class, 'not-available'))]`,
    );
  // }
});

When(/^I click on "([^"]*)" category$/, async (category) => {
  await TM.click(
    `//div[contains(@class, 'menu')]/a/span[text()='${CommonUtils.identifyData(category)}']`,
  );
});

When(/^I hover to "([^"]*)" category$/, async (category) => {
  TM.moveCursorTo(
    `//div[contains(@class, 'menu')]/a/span[text()='${CommonUtils.identifyData(category)}']`,
  );
});

When(/^I click on "([^"]*)" subcategory$/, async (category) => {
  TM.click(
    `//a[contains(@class, 'subcategory-content')][text()='${CommonUtils.identifyData(category)}']`,
  );
});

When(/^I click on banner$/, async () => {
  TM.click("//div[contains(@class, 'swiper-slide-active')]//img");
});

When(/^I click on bullet pagination at position (\d+)$/, async (position) => {
  TM.click(`//span[contains(@class, 'swiper-pagination-bullet')][${position}]`);
});

When(/^I apply filter in "([^"]*)"$/, async (filter) => {
  TM.click(`//p[contains(@class, 'MuiTypography-root') and text()='${filter}']`);
  let filterVal = await TM.grabTextFrom(
    `//p[contains(@class, 'MuiTypography-root') and text()='${filter}']/../../following-sibling::div//div[contains(@class, 'PlpWeb_filter-values__1rWUV')]/div`,
  );
  filterVal = filterVal.split('(');
  if (Array.isArray(filterVal)) {
    filterVal = filterVal[0].trim();
  }
  TestData.setField('filterVal', `${filter} -\n${filterVal}`);

  TM.click(
    `//p[contains(@class, 'MuiTypography-root') and text()='${filter}']/../../following-sibling::div//div[contains(@class, 'PlpWeb_filter-values__1rWUV')]/div`,
  );
});

When(/^I apply filter "([^"]*)" and store in "([^"]*)"$/, async (filter, storeVar) => {
  function generateRandPrice(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + Number(min);
  }
  if (filter == 'Price') {
    TM.click(`//p[contains(@class, 'MuiTypography-root') and text()='${filter}']`);
    TM.waitForElement('.PlpWeb_maximum__2GRTT>input', 10);
    const maxPrice = await TM.grabAttributeFrom('.PlpWeb_maximum__2GRTT>input', 'max');
    const minPrice = await TM.grabAttributeFrom('.PlpWeb_minimum__86SZc>input', 'min');
    const currency = await TM.grabTextFrom('.PlpWeb_minimum__86SZc');

    const randPrice = generateRandPrice(minPrice, maxPrice);
    TM.executeScript(() => {
      const maxInputField = document.querySelector('.PlpWeb_maximum__2GRTT>input');
      maxInputField.value = '';
    });

    TM.fillField('.PlpWeb_maximum__2GRTT>input', randPrice);
    TM.click('.PlpWeb_apply__321wr');
    TestData.setField(
      `${storeVar}`,
      `${filter} -\n${currency} ${minPrice} TO ${currency} ${randPrice}`,
    );
  } else {
    TM.click(`//p[contains(@class, 'MuiTypography-root') and text()='${filter}']`);
    let filterVal = await TM.grabTextFrom(
      `//p[contains(@class, 'MuiTypography-root') and text()='${filter}']/../../following-sibling::div//div[contains(@class, 'PlpWeb_filter-values__1rWUV')]/div`,
    );
    filterVal = filterVal.split('(');
    if (Array.isArray(filterVal)) {
      filterVal = filterVal[0].trim();
    }
    TestData.setField(`${storeVar}`, `${filter} -\n${filterVal}`);

    TM.click(
      `//p[contains(@class, 'MuiTypography-root') and text()='${filter}']/../../following-sibling::div//div[contains(@class, 'PlpWeb_filter-values__1rWUV')]/div`,
    );
  }
});

When(/^I tap on Quick View button$/, async () => {
  TM.waitForElement('.PlpWeb_product-wrapper__3U7s0', 10);
  TM.scrollTo('.PlpWeb_product-wrapper__3U7s0');
  TM.moveCursorTo('.PlpWeb_product-wrapper__3U7s0');
  TM.waitForElement('.PlpWeb_product-quickview-button__2CDvM', 10);
  TM.click('.PlpWeb_product-quickview-button__2CDvM');
});

When(/^I click on thumbnail$/, async () => {
  const indexArr = [1, 2, 3, 4, 5, 6, 7];
  TM.waitForElement(`//span[contains(@class, 'swiper-pagination-bullet')][1]`, 10);
  TM.click(`//span[contains(@class, 'swiper-pagination-bullet')][1]`);
  TM.click("//div[contains(@class, 'swiper-slide-active')]//img");

  // eslint-disable-next-line no-unused-vars
  for (const _ of indexArr) {
    TM.wait(2);
    const subBanner = await TM.grabNumberOfVisibleElements(
      '.FloatingBanner_sub-banner-images-land__ivXaq',
    );
    if (subBanner > 0) {
      TM.click('.FloatingBanner_sub-banner-images-land__ivXaq');
      continue;
    }
    break;
  }
});

When(/^I enter OTP "([^"]*)"$/, async (otp) => {
  let otp_arr = CommonUtils.identifyData(otp);
  // console.log(`Entering OTP  ${otp_arr}`);
  TM.waitForElement("//input[@aria-label='Please enter OTP character 1']", 10);
  TM.fillField("//input[@aria-label='Please enter OTP character 1']", otp_arr.slice(0, 1));
  TM.fillField("//input[@aria-label='Please enter OTP character 2']", otp_arr.slice(1, 2));
  TM.fillField("//input[@aria-label='Please enter OTP character 3']", otp_arr.slice(2, 3));
  TM.fillField("//input[@aria-label='Please enter OTP character 4']", otp_arr.slice(3, 4));
  TM.fillField("//input[@aria-label='Please enter OTP character 5']", otp_arr.slice(4, 5));
  TM.fillField("//input[@aria-label='Please enter OTP character 6']", otp_arr.slice(5, 6));
});

Then(/^I get OTP from "([^"]*)" and save it as "([^"]*)"$/, async (message, otp) => {
  let smsTemplate = CommonUtils.identifyData(message);

  // Convert smsTemplate to a string if it's not already
  if (typeof smsTemplate !== 'string') {
    smsTemplate = smsTemplate.toString();
  }

  // Define regular expression to match the code pattern
  const codeRegex = /\b(\d{6})\b/;

  // Extract the code using regular expression
  const match = smsTemplate.match(codeRegex);

  // Check if a match is found
  if (match && match.length > 1) {
    const code = match[1];
    TestData.setField(otp, code);
    TM.report('OTP code:', code);
  } else {
    TM.fail('No OTP code found in the SMS.');
  }
});

When(/^I apply "([^"]*)"$/, async () => {
  const clearAllBtn = await TM.grabNumberOfVisibleElements('.PlpWeb_clearAll-btn__b27U5');
  if (clearAllBtn > 0) {
    TM.click('.PlpWeb_clearAll-btn__b27U5');
    TM.wait(5);
  }
});

When(
  /^I hover to category "([^"]*)" and select subcategory "([^"]*)"$/,
  async (category, subcategory) => {
    TM.waitForElement(
      `//div[contains(@class, 'menu')]/a/span[text()='${CommonUtils.identifyData(category)}']`,
      5,
    );
    TM.moveCursorTo(
      `//div[contains(@class, 'menu')]/a/span[text()='${CommonUtils.identifyData(category)}']`,
    );
    TM.click(
      `//a[@title='${category}']/following-sibling::div//a[contains(@class, 'subcategory-content')][text()='${subcategory}']`,
    );
  },
);
When(/^I validate filter list$/, async () => {
  const FilterList = await TM.grabTextFromAll('.PlpWeb_accordion-summary-text__2jTMu');
  if (FilterList === 0) {
    TM.fail("Filtered list doesn't contain any items");
  }
  const list = FilterList.join(',');
  // console.log(list);
  TM.report(`Filter List : ${list}`);
});

When(/^I select "([^"]*)" filter$/, async (filterType) => {
  TM.click(`//p[contains(@class, 'MuiTypography-root') and text()='${filterType}']`);
});

When(/^I validate Options available in selected "([^"]*)" filter$/, async (filterType) => {
  let filterOption = await TM.grabTextFromAll(
    `//p[contains(@class, 'MuiTypography-root') and text()='${filterType}']/../../following-sibling::div//div[contains(@class, 'PlpWeb_filter-values__1rWUV')]/div`,
  );
  if (filterOption.length === 0) {
    TM.fail('Options are not available for this filter type');
  }
  const availableOption = filterOption.join(',' + '\n');
  TM.report(`Options Available in ${filterType} Filter: ${availableOption}`);
  // console.log(`Options Available in ${filterType} Filter: ${availableOption}`);
});

When(/^I validate some "([^"]*)" exist in "([^"]*)"$/, async (value1, value2) => {
  function checkWordContains(value1, value2) {
    const str1 = value1.split(' ');
    const str2 = value2.split(' ');
    for (let i = 0; i < str1.length; i++) {
      if (str2.includes(str1[i])) {
        return true;
      }
    }
    return false;
  }
  value1 = CommonUtils.identifyData(value1);
  value2 = CommonUtils.identifyData(value2);
  if (checkWordContains(value1, value2)) {
    TM.report(`some word from ${value1} exist in ${value2}`);
  } else {
    TM.fail(`No word from ${value1} is contained in ${value2}`);
  }
});

When(/^I apply "([^"]*)" filter and select option "([^"]*)"$/, async (filterType, storeVar) => {
  if (filterType == 'Discount') {
    TM.click(`//p[contains(@class, 'MuiTypography-root') and text()='${filterType}']`);
    let options = await TM.grabTextFromAll(
      `//p[contains(@class, 'MuiTypography-root') and text()='${filterType}']/../../following-sibling::div//div[contains(@class, 'PlpWeb_filter-values__1rWUV')]/div`,
    );

    const newOption = options
      .map((item) => item.split('(')[0].trim())
      .filter((item) => {
        const newOption = item.split('-');
        if (newOption.length > 1 && Number(newOption[0]) >= 10) {
          return newOption;
        }
      });

    // console.log('newOption', newOption);
    if (newOption.length === 0) {
      TM.fail('There are no available options');
    }
    TestData.setField(`${storeVar}`, `${filterType} -\n${newOption[0]}`);
    TM.click(
      `//p[contains(@class, 'MuiTypography-root') and text()='${filterType}']/../../following-sibling::div//div[contains(@class, 'PlpWeb_filter-values__1rWUV')]/div[contains(text(), '${newOption[0]}')]`,
    );
  }
});

When(/^I click on "([^"]*)" button in style finder$/, async (button) => {
  TM.click(`//button[contains(@class, 'MuiButton-root')]/span[text()='${button}']`);
});

When(/^I get the filterd value and store in "([^"]*)"$/, async (storeVar) => {
  const filteredValue = await TM.grabTextFromAll('.PlpWeb_filter-selected__1hcyY');
  if (filteredValue.length === 0) {
    TM.fail('No filter Applied');
  }
  const filter = filteredValue[filteredValue.length - 1].split('-')[1].trim();
  TestData.setField(storeVar, filter);
});

When(/^I delete the added address$/, async () => {
  const del_icon = await TM.grabNumberOfVisibleElements('.address_delete-icon__1WCWV');
  TM.click(`(//*[contains(@class,'address_delete-icon__1WCWV')])[${del_icon}]`);
});

When(/^I click on Account menu "([^"]*)"$/, async (menu) => {
  TM.click(`//div[contains(@class,"myAccountListMenuDesktop")]/span[text()='${menu}']`);
});

When(/^I apply coupon if available$/, async () => {
  const available_coupon = await TM.grabAttributeFromAll(
    '//div[contains(@class, "Coupon_promotion-text-head__1OuLX")]/button',
    'class',
  );
  if (available_coupon.every((el) => el.includes('disabled'))) {
    TM.waitForElement('.Coupon_close-icon__2yVf3', 10);
    TM.click('.Coupon_close-icon__2yVf3');
    TM.report('No coupons avaialable');
  } else {
    TM.click(
      '//div[contains(@class, "Coupon_promotion-text-head__1OuLX")]/button[contains(@class, "Coupon_apply__1QuJz")]',
    );
    // console.log('Coupon Applid');
  }
});

When(/^I click payment method "([^"]*)"$/, async (pay_method) => {
  TM.click(
    `//div[contains(@class, 'PaymentOption_app-tab-list__NiU6w')]//span[text()='${pay_method}']`,
  );
});

When(/^I remove products from cart$/, async () => {
  const remove_icon = await TM.grabNumberOfVisibleElements(
    '//div[contains(@class, "Cart_remove-icon__2ONDj remove-icon")]/span',
  );
  if (remove_icon > 0) {
    for (let i = 1; i <= remove_icon; i++) {
      const del_icon = await TM.grabNumberOfVisibleElements(
        '(//div[contains(@class, "Cart_remove-icon__2ONDj")]/span)[1]',
      );
      if (del_icon > 0) {
        TM.waitForElement(`(//div[contains(@class, "Cart_remove-icon__2ONDj")]/span)[1]`, 10);
        TM.click(`(//div[contains(@class, "Cart_remove-icon__2ONDj")]/span)[1]`);
        TM.waitForText('REMOVE', 5);
        TM.click('REMOVE');
        TM.wait(3);
      }
    }
  }
});

When(/^I set default address$/, async () => {
  const default_add = await TM.grabNumberOfVisibleElements('.address_app-checkout-default__3kEr9');
  if (default_add == 0) {
    TM.click('Add Address');
    TM.fillField('postcode', CommonUtils.identifyData('postcode'));
    TM.fillField('building', CommonUtils.identifyData('building'));
    TM.fillField('street', CommonUtils.identifyData('street'));
    TM.click(CommonUtils.identifyLocator('default_address_checkbox'));
    TM.click('Add address');
    TM.see('Default Address');
  }
});

When(/^I remove products from wishlist$/, async () => {
  const remove_icon = await TM.grabNumberOfVisibleElements('.wishlist_my-wishlist-cross__23h1Q');
  if (remove_icon > 0) {
    for (let i = 1; i <= remove_icon; i++) {
      const cross_icon = await TM.grabNumberOfVisibleElements(
        '(//div[contains(@class, "wishlist_my-wishlist-cross__23h1Q")])[1]',
      );
      if (cross_icon > 0) {
        TM.waitForElement(`(//div[contains(@class, "wishlist_my-wishlist-cross__23h1Q")])[1]`, 10);
        TM.moveCursorTo('(//div[contains(@class, "wishlist_my-wishlist-cross__23h1Q")])[1]');
        TM.click(`(//div[contains(@class, "wishlist_my-wishlist-cross__23h1Q")])[1]`);
        TM.wait(5);
        // TM.waitForText('Product Removed From wishlist', 10);
        // console.log('Product Removed From Wishlist!');
      }
    }
  }
});

When(/^I check "([^"]*)" is available in "([^"]*)"$/, async (str1, str2) => {
  const value1 = CommonUtils.identifyData(str1);
  const value2 = CommonUtils.identifyData(str2);
  const arr1 = value1.split(' ');
  const arr2 = value2.split(' ');
  function allPresent(arr1, arr2) {
    return arr1.every((ele) => arr2.includes(ele));
  }
  if (allPresent(arr1, arr2)) {
    TM.report(`${value1} is present in ${value2}`);
  } else {
    TM.report(`${value1} is not present in ${value2}`);
  }
});
