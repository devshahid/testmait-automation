const { TM, TestData, LoggerFactory, CommonUtils } = inject();

const Helper = require('../testmait/lib/helper');

const mobilePlugins = require('../configs/mobile_plugins.json');

const logger = LoggerFactory.init();

class Mobile extends Helper {
  async setDevice(device) {
    if (typeof Helper.prototype.helpers['Appium'] === 'undefined') {
      logger.error('appium not present');
    } else {
      const udid = CommonUtils.identifyData(`${device}_udid`);
      let data = this.helpers['Appium'].config;
      //logger.info('Current Appium config', data);
      if (data.desiredCapabilities.udid !== udid) {
        data.desiredCapabilities.udid = udid;
        data.desiredCapabilities.deviceName = udid;
        // data.desiredCapabilities.autoGrantPermission = true;

        // data.desiredCapabilities.appPackage = 'com.google.android.dialer';
        // data.desiredCapabilities.appActivity = 'com.android.dialer.main.impl.MainActivity';
        // //data.desiredCapabilities.browserName = 'Chrome';
        //data.desiredCapabilities.systemPort = CommonUtils.identifyData(`${device}_systemPort`);

        //logger.info('The new Appium config is ', this.helpers['Appium'].config);
        await this.helpers['Appium']._startBrowser();
      }
    }
  }

  async startApp(appType, device) {
    if (typeof TestData.getData(`${device}_udid`) !== 'undefined') {
      await this.setDevice(device);
      const deviceType = TestData.getData(`${device}_udid`);
      if (typeof deviceType !== 'undefined') {
        await TM.startActivity(
          CommonUtils.identifyLocator(`${appType}_package`),
          CommonUtils.identifyLocator(`${appType}_activity`),
        );
      } else {
        logger.error(deviceType + ' not found');
      }
    } else {
      TM.fail('Device ' + device + ' not found in handset test data');
    }
  }

  async getMsgRegex(verifyMessage, messages) {
    let regex = new RegExp('(?<=' + verifyMessage + '\\:?\\s?)[\\d\\.]+');
    const matchString = messages[messages.length - 1].toString().match(regex);
    if (typeof matchString === 'undefined') {
      logger.error(verifyMessage + ' not found');
    } else {
      logger.info(verifyMessage + ' - ' + matchString);
      if (verifyMessage.includes('OTP')) {
        TestData.setField('Service_Portal_OTP', matchString);
        logger.info('The OTP is : ' + TestData.getField('Service_Portal_OTP'));
      }
    }
  }

  async setStkDevice(device) {
    if (typeof CommonUtils.identifyData(device) !== 'undefined') {
      if (typeof Helper.prototype.helpers['Appium'] === 'undefined') {
        logger.error('appium not present');
        TM.fail('Test case is aborted as Appium configs not present.');
      } else {
        const udid = CommonUtils.identifyData(device + '.DeviceName');
        let data = this.helpers['Appium'].config;
        logger.info('Current Appium config', data);
        if (data.desiredCapabilities.udid !== udid) {
          data.desiredCapabilities.udid = udid;
        }
        data.desiredCapabilities.appPackage = 'com.android.stk';
        data.desiredCapabilities.appActivity = 'com.android.stk.StkMain';
        logger.info('The new Appium config is ', this.helpers['Appium'].config);
        await this.helpers['Appium']._startBrowser();
      }
    } else {
      TM.fail('Device ' + device + ' not found in g2_handset_properties.json');
    }
  }

  async navigateMobileBack() {
    await this.helpers['Appium'].browser.back();
  }

  async navigateMultipleBack() {
    await this.helpers['Appium'].browser.back();
    await this.helpers['Appium'].browser.back();
    await this.helpers['Appium'].browser.back();
  }
}

module.exports = new Mobile();
