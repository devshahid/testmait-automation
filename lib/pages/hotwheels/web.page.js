let { CommonUtils, TM } = inject();
const path = require('path');
const fs = require('fs');
class HotWheelPage {
  async getCategoryText(categoryName) {
    let categoryText = await TM.grabTextFromAll(CommonUtils.identifyLocator('AllCategoryHeadings'));
    return categoryText.filter(
      (text) => !text.includes('Hot Wheels by Year') && !text.includes('Gallery'),
    );
  }

  async getNumberOfCars(category, locator) {
    return await TM.grabNumberOfVisibleElements(
      CommonUtils.identifyLocator(locator)
        .replace('REPLACE_ID', category)
        .replace('[REPLACE_SUB_ID]', ''),
    );
  }

  async grabCarInformation() {
    console.log('Clicked on category');
    // Grab Car name and other information
    await TM.waitForElement(CommonUtils.identifyLocator('carNameHeading'), 30);
    const carHeading = await TM.grabTextFrom(CommonUtils.identifyLocator('carNameHeading'));
    const carAttr = await TM.grabTextFromAll(CommonUtils.identifyLocator('carMainDetailsText'));
    const carMainImage = await TM.grabAttributeFrom(
      CommonUtils.identifyLocator('carMainImage'),
      'src',
    );

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
