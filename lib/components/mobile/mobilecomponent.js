const { TM, LoggerFactory, Mobile, CommonUtils } = inject();

const logger = LoggerFactory.init();

class MobileComponent {
  //this method is used for getting the menus for the service

  async startApp(customer) {
    await TM.switchHelper('Appium');
    await Mobile.startApp('dialerapp', customer);
  }

  async dialPhoneNumber(numbers, customer) {
    await TM.switchHelper('Appium');
    await Mobile.startApp('dialerapp', customer);
    TM.sendDeviceKeyEvent(3);
    await TM.waitForElement(CommonUtils.identifyLocator('menu_button'), 30);
    await TM.tap(CommonUtils.identifyLocator('menu_button'));
    await TM.waitForElement(CommonUtils.identifyLocator('dialer_button'), 30);
    await TM.tap(CommonUtils.identifyLocator('dialer_button'));
    await TM.appendField(
      CommonUtils.identifyLocator('dialer_input'),
      CommonUtils.identifyData(numbers),
    );
    await TM.tap(CommonUtils.identifyLocator('dialer_call'));
    await TM.waitForElement(CommonUtils.identifyLocator('end_call_button'), 30);
  }

  async dialSpecialNumber(numbers, customer) {
    await TM.switchHelper('Appium');
    await Mobile.startApp('dialerapp', customer);
    TM.sendDeviceKeyEvent(3);
    await TM.waitForElement(CommonUtils.identifyLocator('menu_button'), 30);
    await TM.tap(CommonUtils.identifyLocator('menu_button'));
    await TM.waitForElement(CommonUtils.identifyLocator('dialer_button'), 30);
    await TM.tap(CommonUtils.identifyLocator('dialer_button'));
    await TM.appendField(
      CommonUtils.identifyLocator('dialer_input'),
      CommonUtils.identifyData(numbers),
    );
    await TM.tap(CommonUtils.identifyLocator('dialer_call'));
  }

  async recieveCall(reciever_phone) {
    await TM.switchHelper('Appium');
    await TM.wait(2);
    //await Mobile.startApp('dialerapp', customer);
    await Mobile.setDevice(reciever_phone);
    await TM.sendDeviceKeyEvent(3);
    //let caller_number = CommonUtils.identifyData(`${caller_phone}_number`);
    TM.see('Phone');
  }
  async pickCall(customer) {
    await TM.switchHelper('Appium');
    //await Mobile.startApp('dialerapp', customer);
    await Mobile.setDevice(customer);
    TM.sendDeviceKeyEvent(3);
    let incomeingcall = 0;
    let count = 0;
    do {
      await TM.touchPerform([
        {
          action: 'press',
          options: {
            x: 510,
            y: 245,
          },
        },
        { action: 'release' },
      ]);
      TM.wait(5);
      incomeingcall = await TM.grabNumberOfVisibleElements(
        '//android.widget.Button[@content-desc="Speaker, is Off"]/android.widget.ImageView',
      );
      count++;
    } while (incomeingcall === 0 && count < 5);
    if (incomeingcall === 0) {
      TM.fail('Call not recieved');
    }
  }

  async rejectCall(customer) {
    await TM.switchHelper('Appium');
    //await Mobile.startApp('dialerapp', customer);
    await Mobile.setDevice(customer);
    TM.sendDeviceKeyEvent(3);
    let incomeingcall = 0;
    let count = 0;
    do {
      await TM.touchPerform([
        {
          action: 'press',
          options: {
            x: 185,
            y: 245,
          },
        },
        { action: 'release' },
      ]);
      TM.wait(5);
      incomeingcall = await TM.grabNumberOfVisibleElements(
        '//android.widget.TextView[@content-desc="Phone"]',
      );
      count++;
    } while (incomeingcall === 0 && count < 5);
    if (incomeingcall === 0) {
      TM.fail('Call not recieved');
    }
  }

  async waitForTime(duration) {
    await TM.wait(duration);
  }
  async disconnectCall(customer) {
    await TM.switchHelper('Appium');
    //await Mobile.startApp('dialerapp', customer);
    await Mobile.setDevice(customer);
    await TM.waitForElement(CommonUtils.identifyLocator('end_call_button'), 30);
    await TM.tap(CommonUtils.identifyLocator('end_call_button'));
    TM.sendDeviceKeyEvent(3);
  }

  async checkText(message, reciever_phone) {
    await TM.switchHelper('Appium');
    //await Mobile.startApp('dialerapp', customer);
    await Mobile.setDevice(reciever_phone);
    await TM.see(message);
  }

  async clickOnText(message, reciever_phone) {
    await TM.switchHelper('Appium');
    //await Mobile.startApp('dialerapp', customer);
    await Mobile.setDevice(reciever_phone);
    await Mobile.setDevice(reciever_phone);
    await TM.click(message);
  }

  async checkMessage(message, sms, customer) {
    await TM.switchHelper('Appium');
    await Mobile.startApp('messageapp', customer);
    //await TM.seeElement(CommonUtils.identifyLocator('message_search'));
    //await TM.tap(CommonUtils.identifyLocator('message_search'));
    //await TM.seeElement(CommonUtils.identifyLocator('search_text'));
    //await TM.appendField(CommonUtils.identifyLocator('search_text'), sms);
    //await TM.sendDeviceKeyEvent(66);
    //await TM.waitForElement(CommonUtils.identifyLocator('message_title'), 30);
    //await TM.tap(sms);
    await TM.see(sms);
    await TM.click(sms);
    await TM.see(message);
    await TM.click(CommonUtils.identifyLocator('deletemessage'));
    await TM.see('Delete');
    await TM.click('Delete');
    await TM.see('Delete');
    await TM.click('Delete');
    TM.sendDeviceKeyEvent(3);
    //await TM.waitForElement(CommonUtils.identifyLocator('message_text'), 30);
    // const messages = await TM.grabTextFromAll(CommonUtils.identifyLocator('message_text'));
    // const verifyMessage = CommonUtils.identifyData(message);
    // Mobile.getMsgRegex(verifyMessage, messages);
  }

  //this method is used to verify the sms in messages
  async verifyMessage(message, sms, customer) {
    await TM.switchHelper('Appium');
    await Mobile.startApp('messageapp', customer);
    await TM.waitForElement(CommonUtils.identifyLocator('message_search'), 30);
    await TM.seeElement(CommonUtils.identifyLocator('message_search'));
    await TM.tap(CommonUtils.identifyLocator('message_search'));
    await TM.seeElement(CommonUtils.identifyLocator('search_text'));
    await TM.appendField(CommonUtils.identifyLocator('search_text'), sms);
    await TM.sendDeviceKeyEvent(66);
    await TM.waitForElement(CommonUtils.identifyLocator('message_title'), 30);
    await TM.tap(sms);
    await TM.waitForElement(CommonUtils.identifyLocator('message_text'), 30);
    const messages = await TM.grabTextFromAll(CommonUtils.identifyLocator('message_text'));
    const verifyMessage = CommonUtils.identifyDataData(message);
    if (messages[0].includes(verifyMessage)) {
      TM.report('Message ' + verifyMessage + ' is seen ');
      logger.info('Message ' + verifyMessage + ' is seen ');
    } else {
      TM.fail('Message ' + verifyMessage + ' is not seen ');
    }
  }

  //this method is used for waiting that message is received
  async _waitForMessage(seconds, sender) {
    const threshold = parseInt(seconds / 2); // Wait 2 seconds for each iteration
    let count = 0;
    while (count < threshold) {
      if (await this._getSender(sender)) {
        return true;
      }
      await TM.wait(2);
      count++;
    }
    return false;
  }

  //this method gets the senders list in Messages app and compares with user provided Sender
  async _getSender(sender) {
    /* Grab all Senders from the locator and compare with the User provided Sender
     */
    const resultMsg = await TM.grabTextFromAll(CommonUtils.identifyLocator('message_sender'));
    const match = resultMsg.toString().includes(sender);
    return match;
  }

  //this method is used for deleting the conversation in messages.
  async _deleteMessage() {
    await TM.tap(CommonUtils.identifyLocator('more_options'));
    await TM.tap('Delete conversation', CommonUtils.identifyLocator('text_view'));
    await TM.see('Delete');
    await TM.tap(CommonUtils.identifyLocator('delete_button'));
  }

  //this method is used to verify user data in the message
  async verifyItems(value, message) {
    const text = CommonUtils.identifyData(message);
    const verifyMessage = CommonUtils.identifyData(value);
    if (text.includes(verifyMessage)) {
      TM.report(verifyMessage + ' is found in message');
      logger.info(verifyMessage + ' is found in message');
    } else {
      TM.fail(verifyMessage + ' is not found in ' + text);
    }
  }
}
module.exports = new MobileComponent();
module.exports.MobileComponent = MobileComponent;
