const {
  G2Handlers,
  HomePage,
  CommonUtils,
  GenericMethods,
  TM,
  SoapApi,
  CustomerInfoPage,
  LoggerFactory,
} = inject();

const logger = LoggerFactory.init();
/**
 * @Class Search class includes all g2 method calls happens on search page
 */
class SearchPage {
  /**
   * searches the customer, initiates reset PIN from SP portal
   * PIN received to email notification
   * @param {string} custMSISDN
   * @param {string} key
   */
  async searchCustomerAndResetPIN(custMSISDN, key) {
    var actMsisdn = CommonUtils.identifyData(key + '.' + custMSISDN);
    await G2Handlers.waitForPageLoad();
    //Search for Customer and get the Status of the Customer whether it is created or not
    await HomePage.clickOnTopAndSubMenu('Search', 'Customer');
    await G2Handlers.enterValue('MSISDN', actMsisdn.MSISDN, 'textboxUsingLabel');
    await G2Handlers.clickOnElement('Search', 'buttonInDiv');
    await TM.wait(1);
    await G2Handlers.clickOnElement('Search', 'buttonInDiv');
    let count = await GenericMethods.getTotalRecords('Table.Customer');
    if (count === 0) {
      TM.report(actMsisdn.MSISDN + ' Cusustomer not created');
    } else {
      await CustomerInfoPage.resetCustomerPIN(actMsisdn.MSISDN);
      logger.info('Waiting before email for PIN or Password');
      await TM.wait(60);
      let emailData = await GenericMethods.getDataFromEmail('WebCustNewPINCustReplyOk');
      await this.generateInputAndCallAPI(
        'g2soap',
        emailData.initialPin,
        actMsisdn.MSISDN,
        'g2_activate_customer',
      );
    }
  }

  /**
   * This method prepares the input data and API call data before initiating callAPI from SoapApi handler
   * @param {string} projCode
   * @param {string} startPIN
   * @param {string} activateCustMSISDN
   * @param {string} soapAction which xml to pick to render require data for SOAP request
   */
  // TODO - To remove java deps
  // async generateInputAndCallAPI(projCode, startPIN, activateCustMSISDN, soapAction) {
  //   logger.info('Start PIN from email : ' + startPIN);
  //   let apiKeys = ['callerName', 'resultsURL'];
  //   let timeStamp = CommonUtils.formateDate(new Date(), 'yyyyMMddHHmmss');
  //   var algoName = CommonUtils.identifyData(projCode + '.apTM.encryptionAlgo');
  //   var callerKeyValue = CommonUtils.identifyData(projCode + '.apTM.callerKey');
  //   let encryptInputObj = {
  //     baseDir: './bin/dependencies',
  //     className: 'com.mpesa.G2Encryptor',
  //     methodName: 'encrypt',
  //     param1: algoName,
  //     param2: callerKeyValue,
  //   };
  //   var encryptedStartPIN = CommonUtils.executeMethodFromJAR(encryptInputObj, startPIN);
  //   var encryptedNewPIN = CommonUtils.executeMethodFromJAR(
  //     encryptInputObj,
  //     CommonUtils.identifyData('Generic.Customer PIN'),
  //   );
  //   var enPassword = CommonUtils.executeMethodFromJAR(
  //     encryptInputObj,
  //     CommonUtils.identifyData(projCode + '.apTM.callerPassword'),
  //   );
  //   var inputDataObj = {
  //     initiatorMSISDN: activateCustMSISDN,
  //     startPIN: encryptedStartPIN,
  //     resetPIN: encryptedNewPIN,
  //     callTimeStamp: timeStamp,
  //     encryptedPassword: enPassword,
  //   };
  //   await SoapApTM.callApi(soapAction, apiKeys, inputDataObj, projCode);
  // }
}

module.exports = new SearchPage();
module.exports.AdminPage = SearchPage;
