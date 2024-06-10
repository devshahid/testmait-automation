const { TM, LoggerFactory, Mobile, CommonUtils, TestData } = inject();
const { USSD } = require('./ussd');
const logger = LoggerFactory.init();

class G2Ussd extends USSD {
  //this method is used for selecting the menus for the service
  async _selectMenus(menuItems, customer) {
    await TM.waitForElement(TestData.getLocator('ussd.menu_input'), 30);
    let menus = await TM.grabTextFromAll(TestData.getLocator('ussd.menu_message'));
    logger.info('Menu Items are', menus);
    logger.info('Selecting the menu id for', menuItems);
    let regex = new RegExp('\\d+(?=.?\\s?' + menuItems + ')');
    if (regex.test(menus)) {
      let match = menus.toString().match(regex);
      logger.info('Menu id is ' + match[0] + ' for ' + menuItems);
      if (match != null) {
        await TM.waitForElement(TestData.getLocator('ussd.menu_input'), 40);
        await TM.appendField(TestData.getLocator('ussd.menu_input'), match);
        //await TM.tap(TestData.getLocator('ussd.menu_button'));
        await TM.tap(TestData.getLocator('ussd.send_button'));
        await TM.waitForInvisible(TestData.getLocator('ussd.menu_progress'), 40);
      }
    } else {
      let value = CommonUtils.identifyData(menuItems);
      if (value == 'PIN') {
        value = TestData.getData(customer + '.PIN');
      } else if (value == 'AssistantID') {
        value = TestData.getData(customer + '.AssistantID');
      }
      logger.info('Value is ' + value + ' for ' + menuItems);
      await TM.waitForElement(TestData.getLocator('ussd.menu_input'), 30);
      await TM.appendField(TestData.getLocator('ussd.menu_input'), value);
      //await TM.tap(TestData.getLocator('ussd.menu_button'));
      await TM.tap(TestData.getLocator('ussd.send_button'));
    }
  }

  //this method is used to get some value from the sms in messages
  async checkMessage(message, customer, sms) {
    await TM.wait(10);
    if (sms !== undefined) {
      sms = CommonUtils.identifyData(sms);
    }
    await TM.switchHelper('Appium');
    // let testing = await TM.grabTextFromAll(CommonUtils.identifyLocator('ussd.menu_message'));
    // if (testing.length !== 0) {
    //   await TM.tap(TestData.getLocator('ussd.menu_button'));
    // }
    await Mobile.startApp('messageapp', customer);
    //await TM.wait(60);
    // let time1 = await TM.grabTextFromAll(
    //   "//android.widget.TextView[@resource-id='com.android.mms:id/from']//ancestor::android.widget.LinearLayout//following-sibling::android.widget.LinearLayout//android.widget.TextView[@resource-id='com.android.mms:id/unread']",
    // );
    await TM.waitForElement(TestData.getLocator('ussd.message_search'), 30);
    await TM.seeElement(TestData.getLocator('ussd.message_search'));
    await TM.tap(TestData.getLocator('ussd.message_search'));
    await TM.seeElement(TestData.getLocator('ussd.search_text'));
    if (sms !== undefined) {
      await TM.appendField(TestData.getLocator('ussd.search_text'), sms);
    } else {
      await TM.appendField(TestData.getLocator('ussd.search_text'), message); //sms
    }
    await TM.sendDeviceKeyEvent(66);
    await TM.waitForElement(TestData.getLocator('ussd.message_title'), 30);
    if (sms !== undefined) {
      await TM.tap(sms);
    } else {
      await TM.tap(TestData.getLocator('ussd.message_title')); //sms
    }

    await TM.waitForElement(TestData.getLocator('ussd.message_text'), 60);
    //let time2 = await TM.grabTextFromAll(TestData.getLocator('ussd.message_received_time'));
    //let deviceTime = await this.helpers['appium'].getDeviceTime();
    const messages = await TM.grabTextFromAll(TestData.getLocator('ussd.message_text'));
    TestData.setField('strSMS', messages[messages.length - 1]);
    logger.info('Message received on handset : ' + messages[messages.length - 1]);
    TM.report('Grabbed Message : ' + messages[messages.length - 1]);
    const verifyMessage = CommonUtils.identifyData(message);
    logger.info('Verifying sms : ' + verifyMessage);
    if (messages[messages.length - 1].toString().includes(verifyMessage)) {
      TM.report(verifyMessage + ' is found');
    } else {
      TM.fail(verifyMessage + ' not found in Messages');
    }
    await TM.switchHelper('WebDriver');
  }

  //this method is used for deleting the conversation in messages.
  async _deleteMessage() {
    await TM.tap(CommonUtils.identifyLocator('ussd.more_options'));
    await TM.tap('Delete conversation', CommonUtils.identifyLocator('ussd.text_view'));
    //await TM.see('Delete');
    await TM.tap(CommonUtils.identifyLocator('ussd.delete_button'));
  }

  async selectService(service, customer) {
    await TM.switchHelper('Appium');
    const items = await this._getMenuCommands(service);
    if (items !== 'Commands not found') {
      for (let i = 0; i < items.length; i++) {
        items[i] = CommonUtils.identifyData(items[i]);
        await this._selectMenus(items[i], customer);
      }
      await TM.waitForElement(TestData.getLocator('ussd.menu_message'), 30);
      // await TM.seeElement(TestData.getLocator('ussd.menu_button'));
      // await TM.tap(TestData.getLocator('ussd.menu_button'));
      await TM.seeElement(CommonUtils.identifyLocator('ussd.ok_button'), 30);
      await TM.tap(CommonUtils.identifyLocator('ussd.ok_button'));
      await TM.wait(1);
      await TM.sendDeviceKeyEvent(4);
    } else {
      logger.error('commands not found');
      TM.fail('Menu commands not found to select the menu');
    }
  }

  async getMessage(sms, customer) {
    sms = CommonUtils.identifyData(sms);
    await TM.switchHelper('Appium');
    await Mobile.startApp('messageapp', customer);
    await TM.waitForElement(TestData.getLocator('ussd.message_search'), 30);
    await TM.seeElement(TestData.getLocator('ussd.message_search'));
    await TM.tap(TestData.getLocator('ussd.message_search'));
    await TM.seeElement(TestData.getLocator('ussd.search_text'));
    await TM.appendField(TestData.getLocator('ussd.search_text'), sms);
    await TM.sendDeviceKeyEvent(66);
    await TM.waitForElement(TestData.getLocator('ussd.message_title'), 30);
    await TM.tap(sms);
    await TM.waitForElement(TestData.getLocator('ussd.message_text'), 30);
    const messages = await TM.grabTextFromAll(TestData.getLocator('ussd.message_text'));
    TestData.setField('strSMS', messages[messages.length - 1]);
    await TM.switchHelper('WebDriver');
  }

  async getVoucherCode(sms, customer) {
    await this.getMessage(sms, customer);
    let strMessage = CommonUtils.identifyData('strSMS');
    // let getVoucherCode = strMessage.split('Voucher number is ')[1].toString();
    // getVoucherCode = getVoucherCode.split('.')[0].toString();
    let getVoucherCode = strMessage.toString().match('(?<=.oucher\\s?.*)\\d{9}');
    logger.info('getVoucherCode - ', getVoucherCode);
    return getVoucherCode[0];
  }

  async getReceiptNumber(sms, customer) {
    await this.checkMessage(sms, customer, CommonUtils.identifyData('USSD.Sender'));
    let strMessage = CommonUtils.identifyData('strSMS');
    // let getReceiptNumber = strMessage.split(' ')[0].toString();
    let getReceiptNumber = strMessage.toString().match('(\\d{3}[A-Z]{2}\\d{3}[A-Z0-9]{4})');
    return getReceiptNumber[0];
  }

  async getPIN(sms, customer) {
    await this.checkMessage(sms, customer, CommonUtils.identifyData('USSD.Sender'));
    var strMessage = CommonUtils.identifyData('strSMS');
    // let index = strMessage.toString().indexOf('PIN');
    // let pin = strMessage.toString().substr(parseInt(index) + 7, 4);
    let pin = strMessage.toString().match('(?<=PIN\\s?.*\\s?)\\d+');
    return pin[0];
  }

  async selectServiceOnSTK(service, device) {
    await TM.switchHelper('Appium');
    await Mobile.setStkDevice(device);
    TM.wait(5);
    service = CommonUtils.identifyData(service);
    service = service.split('/');
    for (let i = 0; i < service.length; i++) {
      TM.wait(2);
      await TM.waitForInvisible(CommonUtils.identifyLocator('ussd.stk_progress'), 30);
      let menuItems = await TM.grabTextFromAll(CommonUtils.identifyLocator('ussd.stk_menu_items'));
      if (menuItems.includes(service[i])) {
        await TM.tap(service[i], CommonUtils.identifyLocator('ussd.text_view'));
      } else {
        let value = TestData.getData(device + '.' + service[i]);
        if (typeof value == 'undefined') {
          service[i] = CommonUtils.identifyData(service[i]);
        } else {
          service[i] = value;
        }
        await TM.appendField(CommonUtils.identifyLocator('ussd.stk_input'), service[i]);
        await TM.tap(CommonUtils.identifyLocator('ussd.stk_ok_button'));
      }
      await TM.waitForInvisible(CommonUtils.identifyLocator('ussd.stk_progress'), 30);
    }
    await TM.tap(CommonUtils.identifyLocator('ussd.stk_ok_button'));
    // await Assert.verifyText('SIM Menu');
    TM.wait(2);
    await TM.tap(CommonUtils.identifyLocator('ussd.stk_ok_button'));
    TM.wait(3);
    await TM.sendDeviceKeyEvent(36);
  }

  //this method is used for dialing ussd menu
  async dialUSSD(numbers, customer) {
    await TM.switchHelper('Appium');
    await this._deleteMessage();
    await Mobile.startApp('dialerapp', customer);
    let menuMessage = await TM.grabTextFromAll(CommonUtils.identifyLocator('ussd.menu_message'));
    let widget = await TM.grabTextFromAll(CommonUtils.identifyLocator('ussd.widget_frame'));
    if (menuMessage.length !== 0 || widget.length !== 0) {
      await TM.tap(TestData.getLocator('ussd.menu_button'));
    }
    await TM.waitForElement(CommonUtils.identifyLocator('ussd.dialer_button'), 30);
    await TM.tap(CommonUtils.identifyLocator('ussd.dialer_button'));
    await TM.appendField(
      CommonUtils.identifyLocator('ussd.dialer_input'),
      CommonUtils.identifyData(numbers),
    );
    await TM.tap(CommonUtils.identifyLocator('ussd.dialer_call'));
    await TM.waitForElement(CommonUtils.identifyLocator('ussd.menu_input'), 30);
  }

  async closeRecentApps() {
    await TM.wait(70);
    await TM.sendDeviceKeyEvent(187);
    await TM.wait(2);
    let task = await TM.grabNumberOfVisibleElements(TestData.getLocator('ussd.dismiss_task'));
    while (task > 0) {
      await TM.tap(TestData.getLocator('ussd.clear_all'));
      await TM.wait(2);
      await TM.sendDeviceKeyEvent(187);
      await TM.wait(2);
      task = await TM.grabNumberOfVisibleElements(TestData.getLocator('ussd.dismiss_task'));
    }
    await TM.wait(1);
    await TM.sendDeviceKeyEvent(4);
  }

  async getVoucherNumber(sms, customer, numOfDigits) {
    await this.getMessage(sms, customer);
    let strMessage = CommonUtils.identifyData('strSMS');
    // let getVoucherCode = strMessage.split('Voucher number is ')[1].toString();
    // getVoucherCode = getVoucherCode.split('.')[0].toString();
    let getVoucherCode = strMessage.toString().match('(?<=.oucher\\s?.*)\\d{' + numOfDigits + '}');
    logger.info('getVoucherCode - ', getVoucherCode);
    return getVoucherCode[0];
  }

  // This method is created by Jaivikram. It updates the required field in the required json file
  /*This method is updated to only change or update the value of specific json file */
  async addOrUpdateJsonFile(key, value, jsonFile) {
    let jsonDataObject = null,
      jsonDataString = null;
    if (
      key == 'Handset.RegisteredCustomer.PIN' ||
      key == 'Handset.RegisteredCustomerTwo' ||
      key == 'Handset.RegisteredCustomerThree.PIN'
    ) {
      //Determine the location of json file
      const fs = require('fs');
      fs.readFile(
        './environments/lso/uat/gptc/' + jsonFile + '.json',
        'utf8',
        (err, jsonString) => {
          if (err) {
            console.log('File read failed:', err);
            return;
          }
          try {
            //parse the string, update the respective value, again converted into string and overwriiten in the same json file
            jsonDataObject = JSON.parse(jsonString);
            jsonDataObject.Handset.RegisteredCustomerThree.PIN = JSON.stringify(
              TestData.getField(value),
            );
            jsonDataString = JSON.stringify(jsonDataObject);
            fs.writeFile(
              './environments/lso/uat/gptc/' + jsonFile + '.json',
              jsonDataString,
              (err) => {
                if (err) {
                  console.log('Error writing file', err);
                } else {
                  console.log('Successfully updated the ' + jsonFile + '.json file');
                }
              },
            );
          } catch (err) {
            console.log('Error parsing JSON string:', err);
          }
        },
      );
    }
  }

  /*This Method is created by SHLOK PANDEY, 
  It is a dynamic method and can be used anywhere the eariler method is not dynamic and required a lot of changes so i have created this method!
  This method can be used to modify the json file directly from the gherkin code itself
  The variable Folderlocation species the exact folder Location of the variable to be stored or changed !
  */
  async appendAFileLocation(key, value, jsonFile, FolderLocation) {
    let jsonDataObject = null,
      jsonDataString;
    if (key !== undefined) {
      var FolderLocation = CommonUtils.identifyData(FolderLocation);
      //Determine the location of json file
      const fs = require('fs');
      fs.readFile(FolderLocation + jsonFile + '.json', 'utf8', (err, jsonString) => {
        if (err) {
          console.log('File read failed:', err);
          return;
        }
        try {
          //Parse the string and update the respective value
          jsonDataObject = JSON.parse(jsonString);
          const propertyNames = key.split('.');
          let currentObject = jsonDataObject;
          for (let i = 0; i < propertyNames.length - 1; i++) {
            currentObject = currentObject[propertyNames[i]];
          }
          currentObject[propertyNames[propertyNames.length - 1]] = TestData.getField(value);
          jsonDataString = JSON.stringify(jsonDataObject);
          //jsonDataString = jsonDataString.replace(new RegExp(TestData.getField(value), 'g'), '"' + TestData.getField(value) + '"');
          // Convert the updated object to JSON string and overwrite the file
          fs.writeFile(FolderLocation + jsonFile + '.json', jsonDataString, (err) => {
            if (err) {
              console.log('Error writing file', err);
            } else {
              console.log('Successfully updated the ' + jsonFile + '.json file');
            }
          });
        } catch (err) {
          console.log('Error parsing JSON string:', err);
        }
      });
    }
  }

  async checkMenuNotAvailable(menuname) {
    await TM.waitForElement(TestData.getLocator('ussd.menu_input'), 30);
    let menus = await TM.grabTextFromAll(TestData.getLocator('ussd.menu_message'));
    logger.info('Menu Items are', menus);
    if (menus.includes(menuname) == false) {
      TM.report('The ' + menuname + ' is not available');
    } else {
      TM.fail('The ' + menuname + ' is available');
    }
  }
}
module.exports = new G2Ussd();
module.exports.G2Ussd = G2Ussd;
