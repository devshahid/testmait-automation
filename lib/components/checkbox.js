const { CommonUtils, TM } = inject();

class CheckBox {
  checkWithText = locate("//*[text()='REPLACE_LOCATOR']/following::input[@type='checkbox']");

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

module.exports = new CheckBox();
module.exports.CheckBox = CheckBox;
