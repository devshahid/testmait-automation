const { Handlers } = require('./handlers.js');

class ButtonLink extends Handlers {
  buttonInSpan = locate('p').withText('REPLACE_LOCATOR');
  buttonInLink = locate('p').withText('REPLACE_LOCATOR').inside('.btn');
  buttonInDiv = locate('div').withText('REPLACE_LOCATOR').inside('button');

  /**
   * to click on element
   *
   * @param {object} locator
   * @param {object} customLocator picksup the property of this class and parameter is optional
   */
  async clickOnElement(locator, customLocator) {
    await super.clickOnElement(locator, this[customLocator]);
  }
}

module.exports = new ButtonLink();
module.exports.ButtonLink = ButtonLink;
