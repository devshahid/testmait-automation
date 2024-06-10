const { G2Handlers, IFrame, HomePage, GenericMethods } = inject();
/**
 * @Class includes all g2 method calls happens on customer info page
 */
class CustomerInfoPage {
  async resetCustomerPIN(custMSISDN) {
    await G2Handlers.clickValueOnTableData('Table.Customer', custMSISDN, 'Details', 'Operation');
    await HomePage.clickOnCloseTabNearHome();
    await IFrame.switchToLastFrame();
    await IFrame.switchToNextFrame();
    await G2Handlers.verifyText('Customer Info');
    await G2Handlers.clickOnElement('Reset PIN', 'buttonCite');
    await IFrame.switchToPopUpWindow();
    await G2Handlers.enterTextAreaValue('Reason', 'test', 'customTextAreaLocator');
    await G2Handlers.clickOnElement('Submit', 'buttonInDiv');
    await IFrame.switchToCurrentWindowHandle();
    await GenericMethods.makerChecker();
    await IFrame.switchToCurrentWindowHandle();
    await G2Handlers.clickOnElement('Confirm', 'buttonInPopup');
    await GenericMethods.approveOrRejectGroupTask('Approve', 'Reset Customer PIN');
  }
}
module.exports = new CustomerInfoPage();
module.exports.CustomerInfoPage = CustomerInfoPage;
