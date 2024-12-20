let { CommonUtils, TM } = inject();
const path = require('path');
const fs = require('fs');
class HotWheelPage {
  // Function to extract all li texts, including from nested uls
  async getAllLiTexts(locator = 'newCategoryList') {
    let allTexts = [];

    let ulXPath = CommonUtils.identifyLocator(locator);
    // Get all li elements under the current ul
    const liElements = await TM.grabNumberOfVisibleElements(`${ulXPath}/li`);
    for (let i = 1; i <= liElements; i++) {
      // Check if there is a nested ul under this li
      const nestedUlCount = await TM.grabNumberOfVisibleElements(`(${ulXPath}/li)[${i}]/ul`);
      if (nestedUlCount > 0) {
        // Recursive call to get texts from the nested ul
        const nestedUlTexts = await this.getAllLiTexts(`(${ulXPath}/li)[${i}]/ul`);
        allTexts.push(...nestedUlTexts); // Merge nested texts into the main array
      } else {
        // Get the text of the current li only if there's no nested ul
        const liText = await TM.grabTextFrom(`(${ulXPath}/li)[${i}]//span[2]`);
        allTexts.push(liText);
      }
    }

    return allTexts;
  }

  async getCategoryText(categoryName) {
    const categoryText = await TM.grabTextFromAll('//table/preceding-sibling::h3');

    if (categoryText.length === 0) {
      const categoryText = await TM.grabTextFromAll('//table/preceding-sibling::h2[1]');
      return categoryText.length > 0 ? categoryText : ['No Category'];
    }
    // let categoryText = await TM.grabTextFromAll(CommonUtils.identifyLocator('AllCategoryHeadings'));
    return categoryText.filter(
      (text) =>
        !text.includes('Hot Wheels by Year') &&
        !text.includes('Hot Wheels by year') &&
        !text.includes('Gallery'),
    );
  }

  async getNumberOfCars(category, locator, specialYears, otherYears, year) {
    let ele;
    if (specialYears && specialYears.includes(year)) {
      ele = CommonUtils.identifyLocator('specialCarList').replace('REPLACE_ID', category);
    } else if (otherYears && otherYears.includes(year)) {
      ele = CommonUtils.identifyLocator('secondCarTableTitle')
        .replace('REPLACE_ID', category)
        .replace('[REPLACE_SUB_ID]', '');
    } else {
      ele = CommonUtils.identifyLocator(locator)
        .replace('REPLACE_ID', category)
        .replace('[REPLACE_SUB_ID]', '');
    }
    const cars = await TM.grabNumberOfVisibleElements(ele);
    return { cars, ele };
  }

  async grabCarInformation(urls) {
    console.log('Clicked on category');
    // Grab Car name and other information

    await TM.waitForElement(CommonUtils.identifyLocator('carNameHeading'), 30);
    const carHeading = await TM.grabTextFrom(CommonUtils.identifyLocator('carNameHeading'));
    const carAttr = await TM.grabTextFromAll(CommonUtils.identifyLocator('carMainDetailsText'));

    let carMainImage = '';
    const result = await tryTo(() =>
      TM.grabAttributeFrom(CommonUtils.identifyLocator('carMainImage'), 'src'),
    );
    if (result === true) {
      carMainImage = await TM.grabAttributeFrom(CommonUtils.identifyLocator('carMainImage'), 'src');
    }

    return { carHeading, carAttr, carMainImage };
  }

  getUniqueFileName(folderName, fileName) {
    const ext = path.extname(fileName); // Get file extension
    const baseName = path.basename(fileName, ext); // Get file name without extension
    let newFileName = fileName;
    let count = 1;

    // Keep checking if the file exists, and add count if it does
    while (fs.existsSync(newFileName)) {
      const fileName = `${baseName}_${count}${ext}`;
      newFileName = path.join(folderName, fileName);
      console.log('New File name: ', newFileName);
      count++;
    }
    console.log('Final file name: ', newFileName);

    return newFileName;
  }
}

module.exports = new HotWheelPage();
module.exports.HotWheelPage = HotWheelPage;
