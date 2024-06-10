const { TM, LoggerFactory } = inject();
const handlers = require('./g2handlers.js');
const config = require('testmait').config.get();
const logger = LoggerFactory.init();

class IFrame extends Helper {
  helper = Object.keys(config.helpers)[0];

  /**
   * switch to first iframe
   */
  async switchToFrame(frame) {
    await handlers.waitForPageLoad();
    try {
      await TM.waitForVisible(frame);
      TM.switchTo(frame);
    } catch (err) {
      logger.error('Error in switching frame');
    }
  }

  /**
   * switch back to main page
   */
  async switchToMainPage() {
    await handlers.waitForPageLoad();
    await TM.switchTo();
  }

  async g2switchToFrame() {
    await handlers.waitForPageLoad();
    var helper = this.helpers[global.helper];
    var client = this.helpers[global.helper].browser;
    client.isInsideFrame = true;

    var res = await helper._locate('//iframe', true);
    logger.info('result length : ' + res.length);
    if (!res || res.length === 0) {
      logger.debug('SwitchToFrame -> No iFrame Found. Exiting');
      return true;
    }

    //const iframeids = await asyncLoop.forEachAsync(res, async (el) => client.getElementAttribute(client.getElementId));
    var iframeids = res.length;
    if (iframeids !== 0) {
      logger.debug('SwitchToFrame -> No iFrame Found. Exiting');
      return true;
    }

    logger.debug('Switching to frame ' + (iframeids - 1));
    client.switchToFrame(iframeids - 1);
    //let ele = res[res.length - 1];
  }
  async switchToLastFrame() {
    await handlers.waitForPageLoad();
    const helper = this.helpers[global.helper];

    const client = this.helpers[global.helper].browser;

    client.isInsideFrame = true;

    let res = await helper._locate('iframe', true);

    if (!res || res.length === 0) {
      return true;
    }

    if (res.length > 1) logger.debug(`[Elements] Using last element out of ${res.length}`);

    let ele = res[res.length - 1];
    await handlers.waitForPageLoad();
    return client.switchToFrame(ele);
  }

  async switchToNextFrame() {
    await handlers.waitForPageLoad();
    const client = this.helpers[global.helper].browser;

    client.isInsideFrame = true;

    let res = await client.$$('iframe');

    if (!res || res.length === 0) {
      return true;
    }

    if (res.length > 1) logger.debug(`[Elements] Using last element out of ${res.length}`);

    for (let el of res) {
      let idname = await el.getAttribute('id');

      logger.debug('iFrame id is ' + idname);

      if (idname && idname != 'home_iframe') {
        logger.debug('Switching to iFrame : ' + idname);
        await handlers.waitForPageLoad();
        return client.switchToFrame(el);
      }
    }
  }

  async fnSwitchToFrame() {
    //const helper = this.helpers[global.helper];
    await handlers.waitForPageLoad();

    const client = this.helpers[global.helper].browser;

    client.isInsideFrame = true;

    let res = await client.$$('iframe');

    if (!res || res.length === 0) {
      return true;
    }

    if (res.length > 1) logger.debug(`[Elements] Using last element out of ${res.length}`);

    for (let el of res) {
      let idname = await el.getAttribute('id');

      logger.debug('iFrame id is ' + idname);

      if (idname && idname != 'home_iframe') {
        logger.debug('Switching to iFrame : ' + idname);
        await handlers.waitForPageLoad();
        return client.switchToFrame(el);
      }
    }
  }

  async switchToPopUpWindow() {
    await handlers.waitForPageLoad();
    const windows = await TM.grabAllWindowHandles();
    await TM.switchToWindow(windows[windows.length - 1]);
    await TM.switchTo("//iframe[contains(@id,'popwin')]");
  }

  async switchToCurrentWindowHandle() {
    await handlers.waitForPageLoad();
    const window = await TM.grabCurrentWindowHandle();
    await TM.switchToWindow(window);
  }

  async switchToErrorPopUpWindow() {
    await handlers.waitForPageLoad();
    const windows = await TM.grabAllWindowHandles();
    await TM.switchToWindow(windows[windows.length - 1]);
    await TM.switchTo("(//iframe[contains(@id,'popwin')])[2]");
  }
}

module.exports = new IFrame();
module.exports.IFrame = IFrame;
