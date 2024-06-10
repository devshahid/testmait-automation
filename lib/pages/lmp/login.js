const { TM, TestData, LoggerFactory, Textbox, ButtonLink, Assert } = inject();

const logger = LoggerFactory.init();

class Login {
  async navigateUrl(url) {
    await TM.amOnPage(TestData.getData(url));
    logger.info('The portal to login is : ' + url);
    logger.info('The URL is : ' + TestData.getData(url));
  }

  async loginServicePortal(url, username) {
    if (url.valueOf() == 'lmp.service_portal') {
      logger.info('Login to service portal block');
      await Assert.verifyText('Username');
      await Textbox.enterValue('Username', TestData.getData('lmp.service_portal_' + username));
      logger.info(
        'The username to login is : ' + TestData.getData('lmp.service_portal_' + username),
      );
      await Textbox.enterValue('Password', TestData.getData('lmp.sp_' + username + '_password'));
      logger.info(
        'The password to login is : ' + TestData.getData('lmp.sp_' + username + '_password'),
      );
      await Textbox.enterValue('#downshift-0-input', TestData.getData('lmp.market'));
      logger.info('The market to login is : ' + TestData.getData('lmp.market'));

      await TM.pressKey('ArrowDown');
      await TM.pressKey('Enter');
      await ButtonLink.clickOnElement('Login');
      logger.info('Pressed Login button and moved to OTP page');
      await TM.wait(3);
    } else if (url.valueOf() == 'lmp.bank_portal') {
      logger.info('Login to Bankportal block');
      await Assert.verifyText('Username');
      await Textbox.enterValue('Username', TestData.getData('lmp.bank_portal_' + username));
      logger.info('The username to login is : ' + TestData.getData('lmp.bank_portal_' + username));
      await Textbox.enterValue('Password', TestData.getData('lmp.bp_' + username + '_password'));
      logger.info(
        'The password to login is : ' + TestData.getData('lmp.bp_' + username + '_password'),
      );
      await ButtonLink.clickOnElement('Login');
      logger.info('Pressed Login button');
      await TM.wait(3);
    }
  }

  async enterOTPLogin(OTP) {
    await TM.switchHelper('WebDriver');
    await Textbox.enterValue('OTP', TestData.getField(OTP));
    await TM.wait(3);
    await ButtonLink.clickOnElement('Login');
    await TM.wait(3);
  }
}
module.exports = new Login();
module.exports.Login = Login;
