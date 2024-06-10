const { CommonUtils, TM } = inject();

class Handlers {
  /**
   * to form custom locator pattern ex: locate('p').withText('REPLACE_LOCATOR')
   *
   * @param {object} locator
   * @param {object} customLocator properties from the buttonlink class files
   */
  formCustomLocator(locator, customLocator) {
    return customLocator.value.replace('REPLACE_LOCATOR', CommonUtils.identifyLocator(locator));
  }

  /**
   * to click on element
   *
   * @param {object} locator
   * @param {object} [customLocator] this is optional
   * @param {number} global.explicitWait this is taken from properties.json 'ExplicitWait.Seconds'
   */
  async clickOnElement(locator, customLocator) {
    if (typeof customLocator !== 'undefined') {
      await TM.waitForElement(this.formCustomLocator(locator, customLocator), global.explicitWait);
      await TM.click(this.formCustomLocator(locator, customLocator));
    } else {
      await TM.waitForElement(CommonUtils.identifyLocator(locator), global.explicitWait);
      await TM.click(CommonUtils.identifyLocator(locator));
    }
  }

  /**
   * to double click on element
   *
   * @param {object} locator
   * @param {object} [customLocator] this is optional
   * @param {number} global.explicitWait this is taken from properties.json 'ExplicitWait.Seconds'
   */
  async doubleClickOnElement(locator, customLocator) {
    if (typeof customLocator !== 'undefined') {
      await TM.waitForElement(this.formCustomLocator(locator, customLocator), global.explicitWait);
      await TM.doubleClick(this.formCustomLocator(locator, customLocator));
    } else {
      await TM.waitForElement(CommonUtils.identifyLocator(locator), global.explicitWait);
      await TM.doubleClick(CommonUtils.identifyLocator(locator));
    }
  }

  /**
   * to move cursor on element
   *
   * @param {object} locator
   * @param {object} [customLocator] this is optional
   * @param {number} global.explicitWait this is taken from properties.json 'ExplicitWait.Seconds'
   */
  async moveCursorTo(locator, customLocator) {
    if (typeof customLocator !== 'undefined') {
      await TM.waitForElement(this.formCustomLocator(locator, customLocator), global.explicitWait);
      await TM.moveCursorTo(this.formCustomLocator(locator, customLocator), 5, 5);
    } else {
      await TM.waitForElement(CommonUtils.identifyLocator(locator), global.explicitWait);
      await TM.moveCursorTo(CommonUtils.identifyLocator(locator), 5, 5);
    }
  }

  /**
   * to select radio or checkbox option
   *
   * @param {object} locator
   * @param {object} customLocator this is optional
   * @param {number} global.explicitWait this is taken from properties.json 'ExplicitWait.Seconds'
   */
  async selectRadioOrCheckbox(locator, customLocator) {
    if (typeof customLocator !== 'undefined') {
      await TM.waitForElement(this.formCustomLocator(locator, customLocator), global.explicitWait);
      await TM.checkOption(this.formCustomLocator(locator, customLocator));
    } else {
      await TM.waitForElement(CommonUtils.identifyLocator(locator), global.explicitWait);
      await TM.checkOption(CommonUtils.identifyLocator(locator));
    }
  }

  async enterValue(locator, textValue, customLocator) {
    if (typeof customLocator !== 'undefined') {
      await TM.waitForElement(
        this.formCustomLocator(CommonUtils.identifyData(locator), customLocator),
        global.explicitWait,
      );
      await TM.fillField(
        this.formCustomLocator(CommonUtils.identifyData(locator), customLocator),
        textValue,
      );
    } else {
      await TM.waitForElement(CommonUtils.identifyLocator(locator), global.explicitWait);
      await TM.fillField(CommonUtils.identifyLocator(locator), textValue);
    }
  }

  /**
   * Used to select option by passing dropdown field name and Option value
   * @param {*} dropdown field name
   * @param {*} option value
   * @param {number} global.explicitWait this is taken from properties.json 'ExplicitWait.Seconds'
   */
  async selectOption(dropdown, option, customLocator) {
    if (typeof customLocator !== 'undefined') {
      await TM.waitForElement(this.formCustomLocator(dropdown, customLocator), global.explicitWait);
      await TM.selectOption(this.formCustomLocator(dropdown, customLocator), option);
    } else {
      await TM.waitForElement(CommonUtils.identifyLocator(dropdown), global.explicitWait);
      await TM.selectOption(CommonUtils.identifyLocator(dropdown), option);
    }
  }

  /**
   * to enter value to textbox by passing text area field name and value
   * @param {*} label
   * @param {*} value
   */
  async enterTextAreaValue(label, value, customLocator) {
    if (typeof customLocator !== 'undefined') {
      await TM.waitForElement(this.formCustomLocator(label, customLocator), global.explicitWait);
      await this.clickOnElement(this.formCustomLocator(label, customLocator));
    } else {
      await TM.waitForElement(CommonUtils.identifyLocator(label), global.explicitWait);
      await this.clickOnElement(CommonUtils.identifyLocator(label));
    }
    await TM.type(CommonUtils.identifyData(value));
  }

  async grabNumberOfVisibleElements(locator, customLocator) {
    let number;
    if (typeof customLocator !== 'undefined') {
      number = await TM.grabNumberOfVisibleElements(
        this.formCustomLocator(CommonUtils.identifyData(locator), customLocator),
      );
    } else {
      number = await TM.grabNumberOfVisibleElements(CommonUtils.identifyLocator(locator));
    }
    return number;
  }
}

module.exports = new Handlers();
module.exports.Handlers = Handlers;
