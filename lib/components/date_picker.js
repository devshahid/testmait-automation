const { Handlers } = require('./handlers.js');

class DatePicker extends Handlers {
  /**
   * Select today
   *
   * @param {object} locator
   */
  async selectToday(locator) {
    await super.clickOnElement(locator);
    await super.clickOnElement('.currentDate', '.date-picker');
  }

  async selectInNextMonth(locator, date = '15') {
    await super.clickOnElement(locator);
    await super.clickOnElement('show next month', '.date-picker');
    await super.clickOnElement(date, '.date-picker');
  }
}

module.exports = new DatePicker();
module.exports.DatePicker = DatePicker;
