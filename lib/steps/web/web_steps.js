let { CommonUtils, TestData, Assert, TM } = inject();
const fs = require('fs');
const Helper = require('../../testmait/lib/helper');
/* eslint-disable no-undef */

Given(/^I open the url "([^"]*)"$/, async (gurl) => {
  final_url = CommonUtils.identifyData(gurl);
  await TM.amOnPage(final_url);
  TM.report('URL ' + final_url + ' opened');
});

When(/^I accept popup"$/, async () => {
  await TM.acceptPopup();
});

When(/^I fill field for "([^"]*)" with value "([^"]*)"$/, async (locator, value) => {
  let replaceValue = value;
  if (value.includes('_rand')) {
    replaceValue = value.replace(/_rand/g, await CommonUtils.generateRandomAlphabetString());
  }

  TM.fillField(CommonUtils.identifyLocator(locator), CommonUtils.identifyData(replaceValue));
});

When(/^I append field for "([^"]*)" with value "([^"]*)"$/, async (locator, value) => {
  let replaceValue = value;
  if (value.includes('_rand')) {
    replaceValue = value.replace(/_rand/g, await CommonUtils.generateRandomAlphabetString());
  }

  await TM.appendField(
    CommonUtils.identifyLocator(locator),
    CommonUtils.identifyData(replaceValue),
  );
});

When(/^I attach file with locator "([^"]*)" located in "([^"]*)"$/, async (locator, pathToFile) => {
  await TM.attachFile(CommonUtils.identifyLocator(locator), CommonUtils.identifyData(pathToFile));
  await TM.report('File attached from ' + pathToFile);
});

When(/^I cancel popup$/, async () => {
  TM.cancelPopup();
});

When(/^I check option "([^"]*)"$/, async (locator) => {
  await TM.checkOption(CommonUtils.identifyLocator(locator));
});

When(/^I clear cookie"$/, async () => {
  await TM.clearCookie();
});

When(/^I clear field "([^"]*)"$/, async (locator) => {
  await TM.clearField(CommonUtils.identifyLocator(locator));
});

When(/^I click "([^"]*)"$/, async (locator) => {
  // if (process.env.AI_PW === 'false') {
  //   await TM.waitForClickable(CommonUtils.identifyLocator(locator), 30);
  // }
  await TM.waitForElement(CommonUtils.identifyLocator(locator), 15);
  await TM.click(CommonUtils.identifyLocator(locator));
});

When(/^I close popup window$/, async () => {
  TM.executeScript(() => {
    const shadowRoot = document.querySelector('#wzrkImageOnlyDiv ct-web-popup-imageonly')
      .shadowRoot;
    const closeButton = shadowRoot.querySelector('#close');
    closeButton.click();
  });
});

When(/^I click button "([^"]*)"$/, async (buttonName) => {
  //TM.click(CommonUtils.identifyLocator(locator));
  // TM.waitForClickable(CommonUtils.identifyLocator(locator), 15);
  await TM.click(`//button[contains(text(), "${buttonName}")]`);
});

When(/^I close current tab"$/, async () => {
  await TM.closeCurrentTab();
});

When(/^I close other tabs"$/, async () => {
  await TM.closeOtherTabs();
});

When(/^I double click "([^"]*)"$/, async (locator) => {
  await TM.doubleClick(CommonUtils.identifyLocator(locator));
});

When(/^I drag from "([^"]*)" to "([^"]*)"$/, async (srcElement, destElement) => {
  await TM.dragAndDrop(
    CommonUtils.identifyLocator(srcElement),
    CommonUtils.identifyLocator(destElement),
  );
});

When(/^I drag slider "([^"]*)" to location "([^"]*)"$/, async (locator, offsetX) => {
  await TM.dragSlider(CommonUtils.identifyLocator(locator), CommonUtils.identifyLocator(offsetX));
});

When(/^I focus on "([^"]*)"$/, async (locator) => {
  await TM.focus(CommonUtils.identifyLocator(locator));
});

When(/^I force click "([^"]*)"$/, async (locator) => {
  await TM.forceClick(CommonUtils.identifyLocator(locator));
});

When(/^I force right click "([^"]*)"$/, async (locator) => {
  await TM.forceRightClick(CommonUtils.identifyLocator(locator));
});

When(/^I open new tab"$/, async () => {
  await TM.openNewTab();
});

When(/^I press key "([^"]*)"$/, async (key) => {
  await TM.pressKey(key);
});

When(/^I press down key "([^"]*)"$/, async (key) => {
  await TM.pressKeyDown(key);
});

When(/^I press up key "([^"]*)"$/, async (key) => {
  await TM.pressKeyUp(key);
});

When(/^I refresh the page$/, async () => {
  await TM.refreshPage();
});

When(/^I right click "([^"]*)"$/, async (locator) => {
  await TM.rightClick(CommonUtils.identifyLocator(locator));
});

//TODO Remove Next hardcoded for eShipper
When(/^I scroll to the page end$/, async () => {
  await TM.scrollIntoView(locate('button').withText('Next'));
});

When(/^I scroll page to the bottom$/, async () => {
  await TM.scrollPageToBottom();
});

When(/^I scroll page to the top$/, async () => {
  await TM.scrollPageToTop();
});

When(/^I scroll to "([^"]*)"$/, async (locator) => {
  await TM.scrollTo(CommonUtils.identifyLocator(locator), 0, -100);
});

When(/^I scroll till element "([^"]*)" appears$/, async (locator) => {
  const scrollStep = 200;
  let scrollPosition = 0;

  for (let i = 0; i < 10; i++) {
    const element = await TM.grabNumberOfVisibleElements(CommonUtils.identifyLocator(locator));
    if (element > 0) break;

    scrollPosition += scrollStep;
    await TM.executeScript((scrollPos) => window.scrollTo(0, scrollPos), scrollPosition);
  }
});

When(/^I select option "([^"]*)" with value "([^"]*)"$/, async (select, option) => {
  //await TM.selectOption(CommonUtils.identifyLocator(select), CommonUtils.identifyData(option));
  await TM.click(CommonUtils.identifyLocator(select));
  await TM.wait(2);
  await TM.click(`//option[contains(text(), "${option}")]`);
  await TM.pressKey('Escape');
});

When(/^I switch to main page$/, async () => {
  await TM.switchTo();
});

When(/^I switch to "([^"]*)"$/, async (iframe_name) => {
  await TM.switchTo(CommonUtils.identifyLocator(iframe_name));
});

When(/^I switch to next tab$/, async () => {
  await TM.switchToNextTab();
});

When(/^I switch to next tab by "([^"]*)"$/, async (number) => {
  await TM.switchToNextTab(number);
});

When(/^I switch to previous tab$/, async () => {
  await TM.switchToPreviousTab();
});

When(/^I switch to next tab by "([^"]*)"$/, async (number) => {
  await TM.switchToPreviousTab(number);
});

When(/^I switch to previous window$/, async () => {
  if (process.env.AI_PW === 'false') {
    const window = await TM.grabCurrentWindowHandle();
    await TM.switchToWindow(window);
  }
});

When(/^I uncheck option "([^"]*)"$/, async (locator) => {
  await TM.uncheckOption(CommonUtils.identifyLocator(locator));
});

Then(/^I scroll "([^"]*)" to view using "([^"]*)" parameter$/, async (locator, parameter) => {
  if (process.env.AI_PW === 'false') {
    await TM.scrollIntoView(CommonUtils.identifyLocator(locator), parameter);
    await TM.report('Scrolled to ' + locator);
  }
});

Then(/^I pause$/, async () => {
  await TM.pause();
});

Then(/^I close current tab$/, async () => {
  await TM.closeCurrentTab();
});

Then(/^I wait for element "([^"]*)"$/, async (element) => {
  await TM.waitForElement(CommonUtils.identifyLocator(element), 15);
});

Then(/^I close browser$/, async () => {
  if (process.env.AI_PW === 'true') {
    await Helper.prototype.helpers.Playwright.browserContext.close();
  }
});

Then(/^I download hotwheels data$/, async () => {
  const cars = await TM.grabNumberOfVisibleElements(CommonUtils.identifyLocator('carRoot'));

  const carsJSON = [];
  for (let i = 0; i < cars; i++) {
    const locator = CommonUtils.identifyLocator('carRoot');
    await TM.click(`${locator}[${i + 1}]`);

    // Grab Car name and other information
    await TM.waitForElement(CommonUtils.identifyLocator('carNameHeading'), 10);
    const carHeading = await TM.grabTextFrom(CommonUtils.identifyLocator('carNameHeading'));
    const carAttr = await TM.grabTextFromAll(CommonUtils.identifyLocator('carMainDetailsText'));
    const carMainImage = await TM.grabAttributeFrom(
      CommonUtils.identifyLocator('carMainImage'),
      'src',
    );

    const carData = {
      carName: carHeading,
      attributes: {
        'Debut series': carAttr[0],
        Produced: carAttr[1],
        Designer: carAttr[2],
        Number: carAttr[3],
      },
      tableData: [],
    };

    const carImage = carMainImage.match(/\.(jpg|png)/i);
    if (carImage) {
      const extension = carImage[0];
      carData.carImage = carMainImage.split(extension)[0] + extension;
    } else {
      carData.carImage = '';
    }

    // Get Table heading and Table Data
    const tableHeaders = await TM.grabNumberOfVisibleElements(
      CommonUtils.identifyLocator('AllTableHeaders'),
    );

    // Loop for the tables to get the table data:
    for (let j = 0; j < tableHeaders; j++) {
      const specificHeader = CommonUtils.identifyLocator('TableSpecificHeader').replace(
        'REPLACE_ID',
        j + 1,
      );

      let tableHeader = await TM.grabTextFromAll(specificHeader);
      tableHeader = tableHeader[tableHeader.length - 1];
      console.log('Table Header: ', tableHeader);

      const tableRows = await TM.grabNumberOfVisibleElements(
        CommonUtils.identifyLocator('tableRowsData').replace('REPLACE_ID', j + 1),
      );

      // Get all images of a row
      let imageURLs = await TM.grabAttributeFromAll(
        CommonUtils.identifyLocator('allLastRowData').replace('REPLACE_ID', j + 1),
        'href',
      );

      imageURLs = imageURLs
        .filter((url) => url.match(/\.(jpg|png)/i))
        .map((url) => {
          const match = url.match(/.+\.(jpg|png)/i);
          return match ? match[0] : url;
        });

      const tableData = [];
      // Loop over each row to get the row data
      for (let row = 0; row < tableRows; row++) {
        const locator = CommonUtils.identifyLocator('tableRowsData').replace('REPLACE_ID', j + 1);
        const allText = await TM.grabTextFromAll(`${locator}[${row + 1}]//td`);

        // Map texts to an object with keys
        const keys = [
          'Year',
          'Series',
          'Color',
          'Sticker',
          'Base Color / Type',
          'Window Color',
          'Interior Color',
          'Wheel Type',
          'Cast',
          'Country',
          'Variation',
          'Photo',
        ];

        // Convert arrays to object
        const object = keys.reduce((obj, key, index) => {
          obj[key] = allText[index];
          return obj;
        }, {});

        tableData.push(object);
      }

      const updatedTableData = tableData.map((data, i) => {
        return { ...data, Photo: imageURLs[i] };
      });

      carData.tableData.push({ [tableHeader]: updatedTableData });
    }

    // Add data to Global JSON
    carsJSON.push(carData);

    // Redirect back to the URL
    await TM.amOnPage(CommonUtils.identifyData('webURL'));
    console.log('\n\n');
  }

  // Create a json file and store all the data there
  console.log('carsJSON: ', carsJSON);
  fs.writeFileSync('1968-cars.json', JSON.stringify(carsJSON, null, 2), 'utf-8');
});
