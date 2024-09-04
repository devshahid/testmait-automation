let { CommonUtils, TestData, Assert, TM, HotWheelPage } = inject();
const fs = require('fs');
const Helper = require('../../testmait/lib/helper');
const path = require('path');
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

Then(/^I grab the total number of cars category$/, async () => {
  const cars = await TM.grabNumberOfVisibleElements(CommonUtils.identifyLocator('carRoot'));
  console.log('Total Car Category: ', cars);
  TestData.setField('cars', cars);
});

Then(/^I download hotwheels data with below instructions$/, async (table) => {
  let tObj = table.parse().hashes()[0];
  const categories = await HotWheelPage.getCategoryText(tObj.categoryName);

  let categoryCount = 0;
  if (tObj.categoryName !== 'all') {
    const count = categories.findIndex((category) => category === tObj.categoryName);
    categoryCount = Number(count);
  }

  let len = categories.length;
  if (tObj.categoryLoop !== 'all') {
    const count = categories.findIndex((category) => category === tObj.categoryName);
    len = Number(count) + 1;
  }

  for (let category = categoryCount; category < len; category++) {
    let cars = await HotWheelPage.getNumberOfCars(category);
    console.log('Total Car Category: ', cars);

    // let cars = TestData.getField('cars');
    let count = 0;
    if (tObj.from !== 'all') {
      count = Number(tObj.from) - 1;
    }

    if (tObj.to !== 'all') {
      if (tObj.to.includes('-')) {
        const [min, max] = tObj.to.split('-');
        count = Number(min);
        cars = Number(max);
      } else {
        cars = Number(tObj.to);
      }
    }

    let carsJSON = [];
    for (let i = count; i < cars; i++) {
      const locator = CommonUtils.identifyLocator('carRoot')
        .replace('REPLACE_ID', category)
        .replace('REPLACE_SUB_ID', i + 1);
      await TM.click(`${locator}`);

      const { carAttr, carHeading, carMainImage } = await HotWheelPage.grabCarInformation();
      const carData = {
        category: carHeading,
        attributes: {
          debutSeries: carAttr[0],
          produced: carAttr[1],
          designer: carAttr[2],
          number: carAttr[3],
        },
      };

      const carImage = carMainImage.match(/\.(jpg|png)/i);
      if (carImage) {
        const extension = carImage[0];
        carData.categoryImage = carMainImage.split(extension)[0] + extension;
      } else {
        carData.categoryImage = '';
      }

      // Get Table heading and Table Data
      let tableLocator = 'AllTableHeaders';
      let tableHeaders = await TM.grabNumberOfVisibleElements(
        CommonUtils.identifyLocator(tableLocator).replace('[REPLACE_ID]', ''),
      );

      if (tableHeaders === 0 || tableHeaders <= 0) {
        tableLocator = 'AllTableHeadersDifferentLocator';
        tableHeaders = await TM.grabNumberOfVisibleElements(
          CommonUtils.identifyLocator(tableLocator),
        );
      }
      if (tableHeaders === 0 || tableHeaders <= 0) {
        tableLocator = 'TableSpecificHeader';

        tableHeaders = await TM.grabNumberOfVisibleElements(
          CommonUtils.identifyLocator(tableLocator),
        );
      }

      console.log('Updated tableHeaders: ', tableHeaders);

      let tableHeadersList;
      const isLocatorExist = await TM.grabNumberOfVisibleElements(
        CommonUtils.identifyLocator('tableHeadersList'),
      );

      console.log('isLocatorExist : ', isLocatorExist);
      if (isLocatorExist > 0) {
        // await TM.waitForElement(CommonUtils.identifyLocator('tableHeadersList'), 10);
        tableHeadersList = await TM.grabTextFromAll(
          CommonUtils.identifyLocator('tableHeadersList'),
        );
      } else {
        tableHeadersList = await TM.grabTextFromAll(
          CommonUtils.identifyLocator(tableLocator).replace('[REPLACE_ID]', ''),
        );
      }

      tableHeadersList = tableHeadersList.filter(
        (header) => header.includes('Versions') || header.includes('Releases'),
      );
      console.log('TABLE HEADER LIST : ', tableHeadersList);
      // const tableHeaderText = await TM.grabTextFromAll(CommonUtils.identifyLocator(tableHeaders));
      // console.log('tableHeaderText tableHeaderText: ', tableHeaderText);

      // Loop for the tables to get the table data:
      for (let j = 0; j < tableHeadersList.length; j++) {
        // const specificHeader = CommonUtils.identifyLocator(tableLocator).replace(
        //   'REPLACE_ID',
        //   j + 1,
        // );

        // Check if specific header exist or not:

        // let tableHeader = await TM.grabTextFrom(specificHeader);
        // if (tableHeader === 'Description') {
        //   tableHeader = await TM.grabTextFromAll(specificHeader);
        //   tableHeader = tableHeader[tableHeader.length - 1];
        // }

        const tableHeader = tableHeadersList[j];
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
            'year',
            'series',
            'color',
            'sticker',
            'baseColor',
            'windowColor',
            'interiorColor',
            'wheelType',
            'cast',
            'country',
            'variation',
          ];

          // Convert arrays to object
          const object = keys.reduce((obj, key, index) => {
            obj[key] = allText[index];
            return obj;
          }, {});

          tableData.push(object);
        }

        const updatedTableData = tableData.map((data, i) => {
          return {
            ...carData,
            attributes: {
              ...carData.attributes,
              series: data.series,
              color: data.color,
              sticker: data.sticker,
              baseColor: data.baseColor,
              windowColor: data.windowColor,
              interiorColor: data.interiorColor,
              wheelType: data.wheelType,
              cast: data.cast,
              country: data.country,
              variation: data.variation,
            },
            year: data.year,
            versionName: tableHeader,
            carImage: imageURLs[i],
            publicUrl: '',
            gsURI: '',
          };
        });

        carsJSON = [...carsJSON, ...updatedTableData];
      }

      // Create a json file and store all the data there

      const folderPath = path.join(path.resolve('scrapped-data'), tObj.year);
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }

      const categoryFolderPath = path.join(
        folderPath,
        categories[categoryCount].replace(/[^\w]/g, '_'),
      );
      console.log(`Creating folder for category count ${categoryCount}: ${categoryFolderPath}`);
      if (!fs.existsSync(categoryFolderPath)) {
        console.log('CREATED CATEGORY FOLDER');
        fs.mkdirSync(categoryFolderPath, { recursive: true });
      }

      const fileName = path.join(
        categoryFolderPath,
        `${carData.category.replace(/[^\w]/g, '_')}.json`,
      );
      fs.writeFileSync(fileName, JSON.stringify(carsJSON, null, 2), 'utf-8');

      // Redirect back to the URL
      await TM.amOnPage(CommonUtils.identifyData('webURL'));
      console.log('\n\n');
    }
  }
});

Then(
  /^I download hotwheels data "([^"]*)" for "([^"]*)" car of range "([^"]*)"$/,
  async (year, type, range) => {
    let tObj = table.parse().hashes()[0];
    console.log(tObj);

    let categoryText = await TM.grabTextFromAll(CommonUtils.identifyLocator('AllCategoryHeadings'));
    categoryText = categoryText.filter(
      (text) => !text.includes('Hot Wheels by Year') && !text.includes('Gallery'),
    );

    for (let category = 0; category < categoryText.length; category++) {
      const cars = await TM.grabNumberOfVisibleElements(
        CommonUtils.identifyLocator('carRoot').replace('REPLACE_ID', category),
      );
      console.log('Total Car Category: ', cars);

      // let cars = TestData.getField('cars');
      let count = 0;
      if (type !== 'all') {
        count = Number(type) - 1;
      }

      if (range !== 'all') {
        if (range.includes('-')) {
          const [min, max] = range.split('-');
          count = Number(min);
          cars = Number(max);
        } else {
          cars = Number(range);
        }
      }

      let carsJSON = [];
      for (let i = count; i < cars; i++) {
        const locator = CommonUtils.identifyLocator('carRoot').replace('REPLACE_ID', category);
        await TM.click(`${locator}[${i + 1}]`);

        // Grab Car name and other information
        await TM.waitForElement(CommonUtils.identifyLocator('carNameHeading'), 30);
        const carHeading = await TM.grabTextFrom(CommonUtils.identifyLocator('carNameHeading'));
        const carAttr = await TM.grabTextFromAll(CommonUtils.identifyLocator('carMainDetailsText'));
        const carMainImage = await TM.grabAttributeFrom(
          CommonUtils.identifyLocator('carMainImage'),
          'src',
        );

        const carData = {
          category: carHeading,
          attributes: {
            debutSeries: carAttr[0],
            produced: carAttr[1],
            designer: carAttr[2],
            number: carAttr[3],
          },
          // tableData: [],
        };

        const carImage = carMainImage.match(/\.(jpg|png)/i);
        if (carImage) {
          const extension = carImage[0];
          carData.categoryImage = carMainImage.split(extension)[0] + extension;
        } else {
          carData.categoryImage = '';
        }

        // Get Table heading and Table Data
        let tableLocator = 'AllTableHeaders';
        let tableHeaders = await TM.grabNumberOfVisibleElements(
          CommonUtils.identifyLocator(tableLocator).replace('[REPLACE_ID]', ''),
        );

        if (tableHeaders === 0 || tableHeaders <= 0) {
          tableLocator = 'AllTableHeadersDifferentLocator';
          tableHeaders = await TM.grabNumberOfVisibleElements(
            CommonUtils.identifyLocator(tableLocator),
          );
        }
        if (tableHeaders === 0 || tableHeaders <= 0) {
          tableLocator = 'TableSpecificHeader';

          tableHeaders = await TM.grabNumberOfVisibleElements(
            CommonUtils.identifyLocator(tableLocator),
          );
        }

        console.log('Updated tableHeaders: ', tableHeaders);

        let tableHeadersList;
        const isLocatorExist = await TM.grabNumberOfVisibleElements(
          CommonUtils.identifyLocator('tableHeadersList'),
        );

        console.log('isLocatorExist : ', isLocatorExist);
        if (isLocatorExist > 0) {
          // await TM.waitForElement(CommonUtils.identifyLocator('tableHeadersList'), 10);
          tableHeadersList = await TM.grabTextFromAll(
            CommonUtils.identifyLocator('tableHeadersList'),
          );
        } else {
          tableHeadersList = await TM.grabTextFromAll(
            CommonUtils.identifyLocator(tableLocator).replace('[REPLACE_ID]', ''),
          );
        }

        tableHeadersList = tableHeadersList.filter((header) => header.includes('Versions'));
        console.log('TABLE HEADER LIST : ', tableHeadersList);
        // const tableHeaderText = await TM.grabTextFromAll(CommonUtils.identifyLocator(tableHeaders));
        // console.log('tableHeaderText tableHeaderText: ', tableHeaderText);

        // Loop for the tables to get the table data:
        for (let j = 0; j < tableHeadersList.length; j++) {
          // const specificHeader = CommonUtils.identifyLocator(tableLocator).replace(
          //   'REPLACE_ID',
          //   j + 1,
          // );

          // Check if specific header exist or not:

          // let tableHeader = await TM.grabTextFrom(specificHeader);
          // if (tableHeader === 'Description') {
          //   tableHeader = await TM.grabTextFromAll(specificHeader);
          //   tableHeader = tableHeader[tableHeader.length - 1];
          // }

          const tableHeader = tableHeadersList[j];
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
            const locator = CommonUtils.identifyLocator('tableRowsData').replace(
              'REPLACE_ID',
              j + 1,
            );
            const allText = await TM.grabTextFromAll(`${locator}[${row + 1}]//td`);

            // Map texts to an object with keys
            const keys = [
              'year',
              'series',
              'color',
              'sticker',
              'baseColor',
              'windowColor',
              'interiorColor',
              'wheelType',
              'cast',
              'country',
              'variation',
            ];

            // Convert arrays to object
            const object = keys.reduce((obj, key, index) => {
              obj[key] = allText[index];
              return obj;
            }, {});

            tableData.push(object);
          }

          const updatedTableData = tableData.map((data, i) => {
            return {
              ...carData,
              attributes: {
                ...carData.attributes,
                series: data.series,
                color: data.color,
                sticker: data.sticker,
                baseColor: data.baseColor,
                windowColor: data.windowColor,
                interiorColor: data.interiorColor,
                wheelType: data.wheelType,
                cast: data.cast,
                country: data.country,
                variation: data.variation,
              },
              year: data.year,
              versionName: tableHeader,
              carImage: imageURLs[i],
              publicUrl: '',
              gsURI: '',
            };
          });

          carsJSON = [...carsJSON, ...updatedTableData];
        }

        // Create a json file and store all the data there

        const folderPath = path.join(path.resolve('scrapped-data'), year);
        if (!fs.existsSync(folderPath)) {
          fs.mkdirSync(folderPath, { recursive: true });
        }

        const fileName = path.join(folderPath, `${carData.category.replace(/[^\w]/g, '_')}.json`);
        fs.writeFileSync(fileName, JSON.stringify(carsJSON, null, 2), 'utf-8');

        // Redirect back to the URL
        await TM.amOnPage(CommonUtils.identifyData('webURL'));
        console.log('\n\n');
      }
    }
  },
);

Then(/^I set year to "([^"]*)"$/, async (year) => {
  TestData.setField('year', year);
});
