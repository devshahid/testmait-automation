const { Handlers } = require('./handlers.js');

class Textbox extends Handlers {
  /**
   * to enter value in textbox
   *
   * @param {object} locator
   * @param {string} textvalue is value to set in textbox
   */
  async enterValue(locator, textValue, customLocator) {
    await super.enterValue(locator, customLocator, textValue);
  }
}

module.exports = new Textbox();
module.exports.Textbox = Textbox;
