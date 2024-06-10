const { Handlers } = require('./handlers.js');

class DropDownComponent extends Handlers {
  async selectFirstItem(locator) {
    await super.clickOnElement(locator);
    await super.clickOnElement('#dropdown-items li');
  }

  async selectItemByName(locator, name) {
    await super.clickOnElement(locator);
    await super.clickOnElement(locate('li').withText(name), '#dropdown-items');
  }
}

module.exports = new DropDownComponent();
module.exports.Dropdown = DropDownComponent;
