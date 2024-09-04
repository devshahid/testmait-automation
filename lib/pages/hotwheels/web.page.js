let { CommonUtils, TM } = inject();

class HotWheelPage {
  async getCategoryText(categoryName) {
    let categoryText = await TM.grabTextFromAll(CommonUtils.identifyLocator('AllCategoryHeadings'));
    return categoryText.filter(
      (text) => !text.includes('Hot Wheels by Year') && !text.includes('Gallery'),
    );
  }

  async getNumberOfCars(category) {
    return await TM.grabNumberOfVisibleElements(
      CommonUtils.identifyLocator('carRoot')
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
}

module.exports = new HotWheelPage();
module.exports.HotWheelPage = HotWheelPage;
