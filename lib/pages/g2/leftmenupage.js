let { G2Handlers, GenericMethods } = inject();
class LeftMenuPage {
  async navigateToLeftMenu(leftMenu, customLocator) {
    await GenericMethods.switchToLeftHandMenuIframe();
    await G2Handlers.clickOnElement(leftMenu, customLocator);
    await GenericMethods.switchToCurrentWindowFrame();
  }

  async navigateToLeftChildMenu(leftMenu, customLocator) {
    await GenericMethods.switchToLeftHandMenuIframe();
    await G2Handlers.clickOnElement(leftMenu, customLocator);
    await GenericMethods.switchToCurrentWindowFrame();
  }
}
module.exports = new LeftMenuPage();
module.exports.LeftMenuPage = LeftMenuPage;
