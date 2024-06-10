const { CommonUtils, TM } = inject();

class Filter {
  filterAfterText = locate(
    "//div[@title='Sort'][contains(., 'REPLACE_LOCATOR')]/parent::div/*[local-name() = 'svg']",
  );

  formCustomLocator(locator, customLocator) {
    return this[customLocator].value.replace(
      'REPLACE_LOCATOR',
      CommonUtils.identifyLocator(locator),
    );
  }

  async clickOnElement(locator, customLocator) {
    if (typeof customLocator !== 'undefined') {
      await TM.click(this.formCustomLocator(locator, customLocator));
    } else {
      await TM.click(CommonUtils.identifyLocator(locator));
    }
  }
}

module.exports = new Filter();
module.exports.Filter = Filter;
