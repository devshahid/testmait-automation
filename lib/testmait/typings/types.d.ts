declare namespace TestMaiT {
  /**
   * Helper for managing remote data using REST API.
   * Uses data generators like [rosie](https://github.com/rosiejs/rosie) or factory girl to create new record.
   *
   * By defining a factory you set the rules of how data is generated.
   * This data will be saved on server via REST API and deleted in the end of a test.
   *
   * ## Use Case
   *
   * Acceptance tests interact with a websites using UI and real browser.
   * There is no way to create data for a specific test other than from user interface.
   * That makes tests slow and fragile. Instead of testing a single feature you need to follow all creation/removal process.
   *
   * This helper solves this problem.
   * Most of web application have API, and it can be used to create and delete test records.
   * By combining REST API with Factories you can easily create records for tests:
   *
   * ```js
   * I.have('user', { login: 'davert', email: 'davert@mail.com' });
   * let id = await I.have('post', { title: 'My first post'});
   * I.haveMultiple('comment', 3, {post_id: id});
   * ```
   *
   * To make this work you need
   *
   * 1. REST API endpoint which allows to perform create / delete requests and
   * 2. define data generation rules
   *
   * ### Setup
   *
   * Install [Rosie](https://github.com/rosiejs/rosie) and [Faker](https://www.npmjs.com/package/faker) libraries.
   *
   * ```sh
   * npm i rosie @faker-js/faker --save-dev
   * ```
   *
   * Create a factory file for a resource.
   *
   * See the example for Posts factories:
   *
   * ```js
   * // tests/factories/posts.js
   *
   * const { Factory } = require('rosie');
   * const { faker } = require('@faker-js/faker');
   *
   * module.exports = new Factory()
   *    // no need to set id, it will be set by REST API
   *    .attr('author', () => faker.name.findName())
   *    .attr('title', () => faker.lorem.sentence())
   *    .attr('body', () => faker.lorem.paragraph());
   * ```
   * For more options see [rosie documentation](https://github.com/rosiejs/rosie).
   *
   * Then configure ApiDataHelper to match factories and REST API:
   * ### Configuration
   *
   * ApiDataFactory has following config options:
   *
   * * `endpoint`: base URL for the API to send requests to.
   * * `cleanup` (default: true): should inserted records be deleted up after tests
   * * `factories`: list of defined factories
   * * `returnId` (default: false): return id instead of a complete response when creating items.
   * * `headers`: list of headers
   * * `REST`: configuration for REST requests
   *
   * See the example:
   *
   * ```js
   *  ApiDataFactory: {
   *    endpoint: "http://user.com/api",
   *    cleanup: true,
   *    headers: {
   *      'Content-Type': 'application/json',
   *      'Accept': 'application/json',
   *    },
   *    factories: {
   *      post: {
   *        uri: "/posts",
   *        factory: "./factories/post",
   *      },
   *      comment: {
   *        factory: "./factories/comment",
   *        create: { post: "/comments/create" },
   *        delete: { post: "/comments/delete/{id}" },
   *        fetchId: (data) => data.result.id
   *      }
   *    }
   * }
   * ```
   * It is required to set REST API `endpoint` which is the baseURL for all API requests.
   * Factory file is expected to be passed via `factory` option.
   *
   * This Helper uses [REST](http://testmait.io/helpers/REST/) helper and accepts its configuration in "REST" section.
   * For instance, to set timeout you should add:
   *
   * ```js
   * "ApiDataFactory": {
   *    "REST": {
   *      "timeout": "100000",
   *   }
   * }
   * ```
   *
   * ### Requests
   *
   * By default to create a record ApiDataFactory will use endpoint and plural factory name:
   *
   * * create: `POST {endpoint}/{resource} data`
   * * delete: `DELETE {endpoint}/{resource}/id`
   *
   * Example (`endpoint`: `http://app.com/api`):
   *
   * * create: POST request to `http://app.com/api/users`
   * * delete: DELETE request to `http://app.com/api/users/1`
   *
   * This behavior can be configured with following options:
   *
   * * `uri`: set different resource uri. Example: `uri: account` => `http://app.com/api/account`.
   * * `create`: override create options. Expected format: `{ method: uri }`. Example: `{ "post": "/users/create" }`
   * * `delete`: override delete options. Expected format: `{ method: uri }`. Example: `{ "post": "/users/delete/{id}" }`
   *
   * Requests can also be overridden with a function which returns [axois request config](https://github.com/axios/axios#request-config).
   *
   * ```js
   * create: (data) => ({ method: 'post', url: '/posts', data }),
   * delete: (id) => ({ method: 'delete', url: '/posts', data: { id } })
   *
   * ```
   *
   * Requests can be updated on the fly by using `onRequest` function. For instance, you can pass in current session from a cookie.
   *
   * ```js
   *  onRequest: async (request) => {
   *     // using global testmait instance
   *     let cookie = await testmait.container.helpers('WebDriver').grabCookie('session');
   *     request.headers = { Cookie: `session=${cookie.value}` };
   *   }
   * ```
   *
   * ### Responses
   *
   * By default `I.have()` returns a promise with a created data:
   *
   * ```js
   * let client = await I.have('client');
   * ```
   *
   * Ids of created records are collected and used in the end of a test for the cleanup.
   * If you need to receive `id` instead of full response enable `returnId` in a helper config:
   *
   * ```js
   * // returnId: false
   * let clientId = await I.have('client');
   * // clientId == 1
   *
   * // returnId: true
   * let clientId = await I.have('client');
   * // client == { name: 'John', email: 'john@snow.com' }
   * ```
   *
   * By default `id` property of response is taken. This behavior can be changed by setting `fetchId` function in a factory config.
   *
   *
   * ```js
   *    factories: {
   *      post: {
   *        uri: "/posts",
   *        factory: "./factories/post",
   *        fetchId: (data) => data.result.posts[0].id
   *      }
   *    }
   * ```
   *
   *
   * ## Methods
   */
  class ApiDataFactory {
    /**
     * Generates a new record using factory and saves API request to store it.
     *
     * ```js
     * // create a user
     * I.have('user');
     * // create user with defined email
     * // and receive it when inside async function
     * const user = await I.have('user', { email: 'user@user.com'});
     * // create a user with options that will not be included in the final request
     * I.have('user', { }, { age: 33, height: 55 })
     * ```
     * @param factory - factory to use
     * @param [params] - predefined parameters
     * @param [options] - options for programmatically generate the attributes
     */
    have(factory: any, params?: any, options?: any): Promise<any>;
    /**
     * Generates bunch of records and saves multiple API requests to store them.
     *
     * ```js
     * // create 3 posts
     * I.haveMultiple('post', 3);
     *
     * // create 3 posts by one author
     * I.haveMultiple('post', 3, { author: 'davert' });
     *
     * // create 3 posts by one author with options
     * I.haveMultiple('post', 3, { author: 'davert' }, { publish_date: '01.01.1997' });
     * ```
     */
    haveMultiple(factory: any, times: any, params?: any, options?: any): void;
    /**
     * Executes request to create a record in API.
     * Can be replaced from a in custom helper.
     */
    _requestCreate(factory: any, data: any): void;
    /**
     * Executes request to delete a record in API
     * Can be replaced from a custom helper.
     */
    _requestDelete(factory: any, id: any): void;
  }
  /**
   * Appium Special Methods for Mobile only
   */
  class Appium extends WebDriver {
    /**
     * Execute code only on iOS
     *
     * ```js
     * I.runOnIOS(() => {
     *    I.click('//UIAApplication[1]/UIAWindow[1]/UIAButton[1]');
     *    I.see('Hi, IOS', '~welcome');
     * });
     * ```
     *
     * Additional filter can be applied by checking for capabilities.
     * For instance, this code will be executed only on iPhone 5s:
     *
     *
     * ```js
     * I.runOnIOS({deviceName: 'iPhone 5s'},() => {
     *    // ...
     * });
     * ```
     *
     * Also capabilities can be checked by a function.
     *
     * ```js
     * I.runOnAndroid((caps) => {
     *    // caps is current config of desiredCapabiliites
     *    return caps.platformVersion >= 6
     * },() => {
     *    // ...
     * });
     * ```
     */
    runOnIOS(caps: any, fn: any): void;
    /**
     * Execute code only on Android
     *
     * ```js
     * I.runOnAndroid(() => {
     *    I.click('io.selendroid.testapp:id/buttonTest');
     * });
     * ```
     *
     * Additional filter can be applied by checking for capabilities.
     * For instance, this code will be executed only on Android 6.0:
     *
     *
     * ```js
     * I.runOnAndroid({platformVersion: '6.0'},() => {
     *    // ...
     * });
     * ```
     *
     * Also capabilities can be checked by a function.
     * In this case, code will be executed only on Android >= 6.
     *
     * ```js
     * I.runOnAndroid((caps) => {
     *    // caps is current config of desiredCapabiliites
     *    return caps.platformVersion >= 6
     * },() => {
     *    // ...
     * });
     * ```
     */
    runOnAndroid(caps: any, fn: any): void;
    /**
     * Returns app installation status.
     *
     * ```js
     * I.checkIfAppIsInstalled("com.example.android.apis");
     * ```
     * @param bundleId - String  ID of bundled app
     * @returns Appium: support only Android
     */
    checkIfAppIsInstalled(bundleId: string): Promise<boolean>;
    /**
     * Check if an app is installed.
     *
     * ```js
     * I.seeAppIsInstalled("com.example.android.apis");
     * ```
     * @param bundleId - String  ID of bundled app
     * @returns Appium: support only Android
     */
    seeAppIsInstalled(bundleId: string): Promise<void>;
    /**
     * Check if an app is not installed.
     *
     * ```js
     * I.seeAppIsNotInstalled("com.example.android.apis");
     * ```
     * @param bundleId - String  ID of bundled app
     * @returns Appium: support only Android
     */
    seeAppIsNotInstalled(bundleId: string): Promise<void>;
    /**
     * Install an app on device.
     *
     * ```js
     * I.installApp('/path/to/file.apk');
     * ```
     * @param path - path to apk file
     * @returns Appium: support only Android
     */
    installApp(path: string): Promise<void>;
    /**
     * Remove an app from the device.
     *
     * ```js
     * I.removeApp('appName', 'com.example.android.apis');
     * ```
     *
     * Appium: support only Android
     * @param [bundleId] - ID of bundle
     */
    removeApp(appId: string, bundleId?: string): void;
    /**
     * Reset the currently running app for current session.
     *
     * ```js
     * I.resetApp();
     * ```
     */
    resetApp(): void;
    /**
     * Check current activity on an Android device.
     *
     * ```js
     * I.seeCurrentActivityIs(".HomeScreenActivity")
     * ```
     * @returns Appium: support only Android
     */
    seeCurrentActivityIs(currentActivity: string): Promise<void>;
    /**
     * Check whether the device is locked.
     *
     * ```js
     * I.seeDeviceIsLocked();
     * ```
     * @returns Appium: support only Android
     */
    seeDeviceIsLocked(): Promise<void>;
    /**
     * Check whether the device is not locked.
     *
     * ```js
     * I.seeDeviceIsUnlocked();
     * ```
     * @returns Appium: support only Android
     */
    seeDeviceIsUnlocked(): Promise<void>;
    /**
     * Check the device orientation
     *
     * ```js
     * I.seeOrientationIs('PORTRAIT');
     * I.seeOrientationIs('LANDSCAPE')
     * ```
     * @param orientation - LANDSCAPE or PORTRAIT
     *
     * Appium: support Android and iOS
     */
    seeOrientationIs(orientation: 'LANDSCAPE' | 'PORTRAIT'): Promise<void>;
    /**
     * Set a device orientation. Will fail, if app will not set orientation
     *
     * ```js
     * I.setOrientation('PORTRAIT');
     * I.setOrientation('LANDSCAPE')
     * ```
     * @param orientation - LANDSCAPE or PORTRAIT
     *
     * Appium: support Android and iOS
     */
    setOrientation(orientation: 'LANDSCAPE' | 'PORTRAIT'): void;
    /**
     * Get list of all available contexts
     *
     * ```
     * let contexts = await I.grabAllContexts();
     * ```
     * @returns Appium: support Android and iOS
     */
    grabAllContexts(): Promise<string[]>;
    /**
     * Retrieve current context
     *
     * ```js
     * let context = await I.grabContext();
     * ```
     * @returns Appium: support Android and iOS
     */
    grabContext(): Promise<string | null>;
    /**
     * Get current device activity.
     *
     * ```js
     * let activity = await I.grabCurrentActivity();
     * ```
     * @returns Appium: support only Android
     */
    grabCurrentActivity(): Promise<string>;
    /**
     * Get information about the current network connection (Data/WIFI/Airplane).
     * The actual server value will be a number. However WebdriverIO additional
     * properties to the response object to allow easier assertions.
     *
     * ```js
     * let con = await I.grabNetworkConnection();
     * ```
     * @returns Appium: support only Android
     */
    grabNetworkConnection(): Promise<{}>;
    /**
     * Get current orientation.
     *
     * ```js
     * let orientation = await I.grabOrientation();
     * ```
     * @returns Appium: support Android and iOS
     */
    grabOrientation(): Promise<string>;
    /**
     * Get all the currently specified settings.
     *
     * ```js
     * let settings = await I.grabSettings();
     * ```
     * @returns Appium: support Android and iOS
     */
    grabSettings(): Promise<string>;
    /**
     * Switch to the specified context.
     * @param context - the context to switch to
     */
    _switchToContext(context: any): void;
    /**
     * Switches to web context.
     * If no context is provided switches to the first detected web context
     *
     * ```js
     * // switch to first web context
     * I.switchToWeb();
     *
     * // or set the context explicitly
     * I.switchToWeb('WEBVIEW_io.selendroid.testapp');
     * ```
     */
    switchToWeb(context?: string): Promise<void>;
    /**
     * Switches to native context.
     * By default switches to NATIVE_APP context unless other specified.
     *
     * ```js
     * I.switchToNative();
     *
     * // or set context explicitly
     * I.switchToNative('SOME_OTHER_CONTEXT');
     * ```
     */
    switchToNative(context?: any): Promise<void>;
    /**
     * Start an arbitrary Android activity during a session.
     *
     * ```js
     * I.startActivity('io.selendroid.testapp', '.RegisterUserActivity');
     * ```
     *
     * Appium: support only Android
     */
    startActivity(appPackage: string, appActivity: string): Promise<void>;
    /**
     * Set network connection mode.
     *
     * * airplane mode
     * * wifi mode
     * * data data
     *
     * ```js
     * I.setNetworkConnection(0) // airplane mode off, wifi off, data off
     * I.setNetworkConnection(1) // airplane mode on, wifi off, data off
     * I.setNetworkConnection(2) // airplane mode off, wifi on, data off
     * I.setNetworkConnection(4) // airplane mode off, wifi off, data on
     * I.setNetworkConnection(6) // airplane mode off, wifi on, data on
     * ```
     * See corresponding [webdriverio reference](https://webdriver.io/docs/api/chromium/#setnetworkconnection).
     *
     * Appium: support only Android
     * @param value - The network connection mode bitmask
     */
    setNetworkConnection(value: number): Promise<number>;
    /**
     * Update the current setting on the device
     *
     * ```js
     * I.setSettings({cyberdelia: 'open'});
     * ```
     * @param settings - object
     *
     * Appium: support Android and iOS
     */
    setSettings(settings: any): void;
    /**
     * Hide the keyboard.
     *
     * ```js
     * // taps outside to hide keyboard per default
     * I.hideDeviceKeyboard();
     * I.hideDeviceKeyboard('tapOutside');
     *
     * // or by pressing key
     * I.hideDeviceKeyboard('pressKey', 'Done');
     * ```
     *
     * Appium: support Android and iOS
     * @param [strategy] - Desired strategy to close keyboard (‘tapOutside’ or ‘pressKey’)
     * @param [key] - Optional key
     */
    hideDeviceKeyboard(strategy?: 'tapOutside' | 'pressKey', key?: string): void;
    /**
     * Send a key event to the device.
     * List of keys: https://developer.android.com/reference/android/view/KeyEvent.html
     *
     * ```js
     * I.sendDeviceKeyEvent(3);
     * ```
     * @param keyValue - Device specific key value
     * @returns Appium: support only Android
     */
    sendDeviceKeyEvent(keyValue: number): Promise<void>;
    /**
     * Open the notifications panel on the device.
     *
     * ```js
     * I.openNotifications();
     * ```
     * @returns Appium: support only Android
     */
    openNotifications(): Promise<void>;
    /**
     * The Touch Action API provides the basis of all gestures that can be
     * automated in Appium. At its core is the ability to chain together ad hoc
     * individual actions, which will then be applied to an element in the
     * application on the device.
     * [See complete documentation](http://webdriver.io/api/mobile/touchAction.html)
     *
     * ```js
     * I.makeTouchAction("~buttonStartWebviewCD", 'tap');
     * ```
     * @returns Appium: support Android and iOS
     */
    makeTouchAction(): Promise<void>;
    /**
     * Taps on element.
     *
     * ```js
     * I.tap("~buttonStartWebviewCD");
     * ```
     *
     * Shortcut for `makeTouchAction`
     */
    tap(locator: any): Promise<void>;
    /**
     * Perform a swipe on the screen.
     *
     * ```js
     * I.performSwipe({ x: 300, y: 100 }, { x: 200, y: 100 });
     * ```
     * @param to - Appium: support Android and iOS
     */
    performSwipe(from: any, to: any): void;
    /**
     * Perform a swipe down on an element.
     *
     * ```js
     * let locator = "#io.selendroid.testapp:id/LinearLayout1";
     * I.swipeDown(locator); // simple swipe
     * I.swipeDown(locator, 500); // set speed
     * I.swipeDown(locator, 1200, 1000); // set offset and speed
     * ```
     * @param [yoffset = 1000] - (optional)
     * @param [speed = 1000] - (optional), 1000 by default
     * @returns Appium: support Android and iOS
     */
    swipeDown(locator: TestMaiT.LocatorOrString, yoffset?: number, speed?: number): Promise<void>;
    /**
     * Perform a swipe left on an element.
     *
     * ```js
     * let locator = "#io.selendroid.testapp:id/LinearLayout1";
     * I.swipeLeft(locator); // simple swipe
     * I.swipeLeft(locator, 500); // set speed
     * I.swipeLeft(locator, 1200, 1000); // set offset and speed
     * ```
     * @param [xoffset = 1000] - (optional)
     * @param [speed = 1000] - (optional), 1000 by default
     * @returns Appium: support Android and iOS
     */
    swipeLeft(locator: TestMaiT.LocatorOrString, xoffset?: number, speed?: number): Promise<void>;
    /**
     * Perform a swipe right on an element.
     *
     * ```js
     * let locator = "#io.selendroid.testapp:id/LinearLayout1";
     * I.swipeRight(locator); // simple swipe
     * I.swipeRight(locator, 500); // set speed
     * I.swipeRight(locator, 1200, 1000); // set offset and speed
     * ```
     * @param [xoffset = 1000] - (optional)
     * @param [speed = 1000] - (optional), 1000 by default
     * @returns Appium: support Android and iOS
     */
    swipeRight(locator: TestMaiT.LocatorOrString, xoffset?: number, speed?: number): Promise<void>;
    /**
     * Perform a swipe up on an element.
     *
     * ```js
     * let locator = "#io.selendroid.testapp:id/LinearLayout1";
     * I.swipeUp(locator); // simple swipe
     * I.swipeUp(locator, 500); // set speed
     * I.swipeUp(locator, 1200, 1000); // set offset and speed
     * ```
     * @param [yoffset = 1000] - (optional)
     * @param [speed = 1000] - (optional), 1000 by default
     * @returns Appium: support Android and iOS
     */
    swipeUp(locator: TestMaiT.LocatorOrString, yoffset?: number, speed?: number): Promise<void>;
    /**
     * Perform a swipe in selected direction on an element to searchable element.
     *
     * ```js
     * I.swipeTo(
     *  "android.widget.CheckBox", // searchable element
     *  "//android.widget.ScrollView/android.widget.LinearLayout", // scroll element
     *   "up", // direction
     *    30,
     *    100,
     *    500);
     * ```
     * @returns Appium: support Android and iOS
     */
    swipeTo(
      searchableLocator: string,
      scrollLocator: string,
      direction: string,
      timeout: number,
      offset: number,
      speed: number,
    ): Promise<void>;
    /**
     * Performs a specific touch action.
     * The action object need to contain the action name, x/y coordinates
     *
     * ```js
     * I.touchPerform([{
     *     action: 'press',
     *     options: {
     *       x: 100,
     *       y: 200
     *     }
     * }, {action: 'release'}])
     *
     * I.touchPerform([{
     *    action: 'tap',
     *    options: {
     *        element: '1', // json web element was queried before
     *        x: 10,   // x offset
     *        y: 20,   // y offset
     *        count: 1 // number of touches
     *    }
     * }]);
     * ```
     *
     * Appium: support Android and iOS
     * @param actions - Array of touch actions
     */
    touchPerform(actions: any[]): void;
    /**
     * Pulls a file from the device.
     *
     * ```js
     * I.pullFile('/storage/emulated/0/DCIM/logo.png', 'my/path');
     * // save file to output dir
     * I.pullFile('/storage/emulated/0/DCIM/logo.png', output_dir);
     * ```
     * @returns Appium: support Android and iOS
     */
    pullFile(path: string, dest: string): Promise<string>;
    /**
     * Perform a shake action on the device.
     *
     * ```js
     * I.shakeDevice();
     * ```
     * @returns Appium: support only iOS
     */
    shakeDevice(): Promise<void>;
    /**
     * Perform a rotation gesture centered on the specified element.
     *
     * ```js
     * I.rotate(120, 120)
     * ```
     *
     * See corresponding [webdriverio reference](http://webdriver.io/api/mobile/rotate.html).
     * @returns Appium: support only iOS
     */
    rotate(): Promise<void>;
    /**
     * Set immediate value in app.
     *
     * See corresponding [webdriverio reference](http://webdriver.io/api/mobile/setImmediateValue.html).
     * @returns Appium: support only iOS
     */
    setImmediateValue(): Promise<void>;
    /**
     * Simulate Touch ID with either valid (match == true) or invalid (match == false) fingerprint.
     *
     * ```js
     * I.touchId(); // simulates valid fingerprint
     * I.touchId(true); // simulates valid fingerprint
     * I.touchId(false); // simulates invalid fingerprint
     * ```
     * @returns Appium: support only iOS
     * TODO: not tested
     */
    simulateTouchId(): Promise<void>;
    /**
     * Close the given application.
     *
     * ```js
     * I.closeApp();
     * ```
     * @returns Appium: support only iOS
     */
    closeApp(): Promise<void>;
    /**
     * Appends text to a input field or textarea.
     * Field is located by name, label, CSS or XPath
     *
     * ```js
     * I.appendField('#myTextField', 'appended');
     * // typing secret
     * I.appendField('password', secret('123456'));
     * ```
     * @param field - located by label|name|CSS|XPath|strict locator
     * @param value - text value to append.
     * @returns automatically synchronized promise through #recorder
     */
    appendField(field: TestMaiT.LocatorOrString, value: string): Promise<void>;
    /**
     * Selects a checkbox or radio button.
     * Element is located by label or name or CSS or XPath.
     *
     * The second parameter is a context (CSS or XPath locator) to narrow the search.
     *
     * ```js
     * I.checkOption('#agree');
     * I.checkOption('I Agree to Terms and Conditions');
     * I.checkOption('agree', '//form');
     * ```
     * @param field - checkbox located by label | name | CSS | XPath | strict locator.
     * @param [context = null] - (optional, `null` by default) element located by CSS | XPath | strict locator.
     * @returns automatically synchronized promise through #recorder
     */
    checkOption(field: TestMaiT.LocatorOrString, context?: TestMaiT.LocatorOrString): Promise<void>;
    /**
     * Perform a click on a link or a button, given by a locator.
     * If a fuzzy locator is given, the page will be searched for a button, link, or image matching the locator string.
     * For buttons, the "value" attribute, "name" attribute, and inner text are searched. For links, the link text is searched.
     * For images, the "alt" attribute and inner text of any parent links are searched.
     *
     * The second parameter is a context (CSS or XPath locator) to narrow the search.
     *
     * ```js
     * // simple link
     * I.click('Logout');
     * // button of form
     * I.click('Submit');
     * // CSS button
     * I.click('#form input[type=submit]');
     * // XPath
     * I.click('//form/*[@type=submit]');
     * // link in context
     * I.click('Logout', '#nav');
     * // using strict locator
     * I.click({css: 'nav a.login'});
     * ```
     * @param locator - clickable link or button located by text, or any element located by CSS|XPath|strict locator.
     * @param [context = null] - (optional, `null` by default) element to search in CSS|XPath|Strict locator.
     * @returns automatically synchronized promise through #recorder
     */
    click(
      locator: TestMaiT.LocatorOrString,
      context?: TestMaiT.LocatorOrString | null,
    ): Promise<void>;
    /**
     * Verifies that the specified checkbox is not checked.
     *
     * ```js
     * I.dontSeeCheckboxIsChecked('#agree'); // located by ID
     * I.dontSeeCheckboxIsChecked('I agree to terms'); // located by label
     * I.dontSeeCheckboxIsChecked('agree'); // located by name
     * ```
     * @param field - located by label|name|CSS|XPath|strict locator.
     * @returns automatically synchronized promise through #recorder
     */
    dontSeeCheckboxIsChecked(field: TestMaiT.LocatorOrString): Promise<void>;
    /**
     * Opposite to `seeElement`. Checks that element is not visible (or in DOM)
     *
     * ```js
     * I.dontSeeElement('.modal'); // modal is not shown
     * ```
     * @param locator - located by CSS|XPath|Strict locator.
     * @returns automatically synchronized promise through #recorder
     */
    dontSeeElement(locator: TestMaiT.LocatorOrString): Promise<void>;
    /**
     * Checks that value of input field or textarea doesn't equal to given value
     * Opposite to `seeInField`.
     *
     * ```js
     * I.dontSeeInField('email', 'user@user.com'); // field by name
     * I.dontSeeInField({ css: 'form input.email' }, 'user@user.com'); // field by CSS
     * ```
     * @param field - located by label|name|CSS|XPath|strict locator.
     * @param value - value to check.
     * @returns automatically synchronized promise through #recorder
     */
    dontSeeInField(field: TestMaiT.LocatorOrString, value: TestMaiT.StringOrSecret): Promise<void>;
    /**
     * Opposite to `see`. Checks that a text is not present on a page.
     * Use context parameter to narrow down the search.
     *
     * ```js
     * I.dontSee('Login'); // assume we are already logged in.
     * I.dontSee('Login', '.nav'); // no login inside .nav element
     * ```
     * @param text - which is not present.
     * @param [context = null] - (optional) element located by CSS|XPath|strict locator in which to perfrom search.
     * @returns automatically synchronized promise through #recorder
     */
    dontSee(text: string, context?: TestMaiT.LocatorOrString): Promise<void>;
    /**
     * Fills a text field or textarea, after clearing its value, with the given string.
     * Field is located by name, label, CSS, or XPath.
     *
     * ```js
     * // by label
     * I.fillField('Email', 'hello@world.com');
     * // by name
     * I.fillField('password', secret('123456'));
     * // by CSS
     * I.fillField('form#login input[name=username]', 'John');
     * // or by strict locator
     * I.fillField({css: 'form#login input[name=username]'}, 'John');
     * ```
     * @param field - located by label|name|CSS|XPath|strict locator.
     * @param value - text value to fill.
     * @returns automatically synchronized promise through #recorder
     */
    fillField(field: TestMaiT.LocatorOrString, value: TestMaiT.StringOrSecret): Promise<void>;
    /**
     * Retrieves all texts from an element located by CSS or XPath and returns it to test.
     * Resumes test execution, so **should be used inside async with `await`** operator.
     *
     * ```js
     * let pins = await I.grabTextFromAll('#pin li');
     * ```
     * @param locator - element located by CSS|XPath|strict locator.
     * @returns attribute value
     */
    grabTextFromAll(locator: TestMaiT.LocatorOrString): Promise<string[]>;
    /**
     * Retrieves a text from an element located by CSS or XPath and returns it to test.
     * Resumes test execution, so **should be used inside async with `await`** operator.
     *
     * ```js
     * let pin = await I.grabTextFrom('#pin');
     * ```
     * If multiple elements found returns first element.
     * @param locator - element located by CSS|XPath|strict locator.
     * @returns attribute value
     */
    grabTextFrom(locator: TestMaiT.LocatorOrString): Promise<string>;
    /**
     * Grab number of visible elements by locator.
     * Resumes test execution, so **should be used inside async function with `await`** operator.
     *
     * ```js
     * let numOfElements = await I.grabNumberOfVisibleElements('p');
     * ```
     * @param locator - located by CSS|XPath|strict locator.
     * @returns number of visible elements
     */
    grabNumberOfVisibleElements(locator: TestMaiT.LocatorOrString): Promise<number>;
    /**
     * Can be used for apps only with several values ("contentDescription", "text", "className", "resourceId")
     *
     * Retrieves an attribute from an element located by CSS or XPath and returns it to test.
     * Resumes test execution, so **should be used inside async with `await`** operator.
     * If more than one element is found - attribute of first element is returned.
     *
     * ```js
     * let hint = await I.grabAttributeFrom('#tooltip', 'title');
     * ```
     * @param locator - element located by CSS|XPath|strict locator.
     * @param attr - attribute name.
     * @returns attribute value
     */
    grabAttributeFrom(locator: TestMaiT.LocatorOrString, attr: string): Promise<string>;
    /**
     * Can be used for apps only with several values ("contentDescription", "text", "className", "resourceId")
     * Retrieves an array of attributes from elements located by CSS or XPath and returns it to test.
     * Resumes test execution, so **should be used inside async with `await`** operator.
     *
     * ```js
     * let hints = await I.grabAttributeFromAll('.tooltip', 'title');
     * ```
     * @param locator - element located by CSS|XPath|strict locator.
     * @param attr - attribute name.
     * @returns attribute value
     */
    grabAttributeFromAll(locator: TestMaiT.LocatorOrString, attr: string): Promise<string[]>;
    /**
     * Retrieves an array of value from a form located by CSS or XPath and returns it to test.
     * Resumes test execution, so **should be used inside async function with `await`** operator.
     *
     * ```js
     * let inputs = await I.grabValueFromAll('//form/input');
     * ```
     * @param locator - field located by label|name|CSS|XPath|strict locator.
     * @returns attribute value
     */
    grabValueFromAll(locator: TestMaiT.LocatorOrString): Promise<string[]>;
    /**
     * Retrieves a value from a form element located by CSS or XPath and returns it to test.
     * Resumes test execution, so **should be used inside async function with `await`** operator.
     * If more than one element is found - value of first element is returned.
     *
     * ```js
     * let email = await I.grabValueFrom('input[name=email]');
     * ```
     * @param locator - field located by label|name|CSS|XPath|strict locator.
     * @returns attribute value
     */
    grabValueFrom(locator: TestMaiT.LocatorOrString): Promise<string>;
    /**
     * Saves a screenshot to ouput folder (set in testmait.conf.ts or testmait.conf.js).
     * Filename is relative to output folder.
     *
     * ```js
     * I.saveScreenshot('debug.png');
     * ```
     * @param fileName - file name to save.
     */
    saveScreenshot(fileName: string): Promise<void>;
    /**
     * Scroll element into viewport.
     *
     * ```js
     * I.scrollIntoView('#submit');
     * I.scrollIntoView('#submit', true);
     * I.scrollIntoView('#submit', { behavior: "smooth", block: "center", inline: "center" });
     * ```
     * @param locator - located by CSS|XPath|strict locator.
     * @param scrollIntoViewOptions - see https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollIntoView.
     * @returns automatically synchronized promise through #recorder
     *
     *
     * Supported only for web testing
     */
    scrollIntoView(
      locator: LocatorOrString,
      scrollIntoViewOptions: ScrollIntoViewOptions,
    ): Promise<void>;
    /**
     * Verifies that the specified checkbox is checked.
     *
     * ```js
     * I.seeCheckboxIsChecked('Agree');
     * I.seeCheckboxIsChecked('#agree'); // I suppose user agreed to terms
     * I.seeCheckboxIsChecked({css: '#signup_form input[type=checkbox]'});
     * ```
     * @param field - located by label|name|CSS|XPath|strict locator.
     * @returns automatically synchronized promise through #recorder
     */
    seeCheckboxIsChecked(field: TestMaiT.LocatorOrString): Promise<void>;
    /**
     * Checks that a given Element is visible
     * Element is located by CSS or XPath.
     *
     * ```js
     * I.seeElement('#modal');
     * ```
     * @param locator - located by CSS|XPath|strict locator.
     * @returns automatically synchronized promise through #recorder
     */
    seeElement(locator: TestMaiT.LocatorOrString): Promise<void>;
    /**
     * Checks that the given input field or textarea equals to given value.
     * For fuzzy locators, fields are matched by label text, the "name" attribute, CSS, and XPath.
     *
     * ```js
     * I.seeInField('Username', 'davert');
     * I.seeInField({css: 'form textarea'},'Type your comment here');
     * I.seeInField('form input[type=hidden]','hidden_value');
     * I.seeInField('#searchform input','Search');
     * ```
     * @param field - located by label|name|CSS|XPath|strict locator.
     * @param value - value to check.
     * @returns automatically synchronized promise through #recorder
     */
    seeInField(field: TestMaiT.LocatorOrString, value: TestMaiT.StringOrSecret): Promise<void>;
    /**
     * Checks that a page contains a visible text.
     * Use context parameter to narrow down the search.
     *
     * ```js
     * I.see('Welcome'); // text welcome on a page
     * I.see('Welcome', '.content'); // text inside .content div
     * I.see('Register', {css: 'form.register'}); // use strict locator
     * ```
     * @param text - expected on page.
     * @param [context = null] - (optional, `null` by default) element located by CSS|Xpath|strict locator in which to search for text.
     * @returns automatically synchronized promise through #recorder
     */
    see(text: string, context?: TestMaiT.LocatorOrString): Promise<void>;
    /**
     * Selects an option in a drop-down select.
     * Field is searched by label | name | CSS | XPath.
     * Option is selected by visible text or by value.
     *
     * ```js
     * I.selectOption('Choose Plan', 'Monthly'); // select by label
     * I.selectOption('subscription', 'Monthly'); // match option by text
     * I.selectOption('subscription', '0'); // or by value
     * I.selectOption('//form/select[@name=account]','Premium');
     * I.selectOption('form select[name=account]', 'Premium');
     * I.selectOption({css: 'form select[name=account]'}, 'Premium');
     * ```
     *
     * Provide an array for the second argument to select multiple options.
     *
     * ```js
     * I.selectOption('Which OS do you use?', ['Android', 'iOS']);
     * ```
     * @param select - field located by label|name|CSS|XPath|strict locator.
     * @param option - visible text or value of option.
     * @returns automatically synchronized promise through #recorder
     *
     *
     * Supported only for web testing
     */
    selectOption(select: LocatorOrString, option: string | any[]): Promise<void>;
    /**
     * Waits for element to be present on page (by default waits for 1sec).
     * Element can be located by CSS or XPath.
     *
     * ```js
     * I.waitForElement('.btn.continue');
     * I.waitForElement('.btn.continue', 5); // wait for 5 secs
     * ```
     * @param locator - element located by CSS|XPath|strict locator.
     * @param [sec = null] - (optional, `1` by default) time in seconds to wait
     * @returns automatically synchronized promise through #recorder
     */
    waitForElement(locator: TestMaiT.LocatorOrString, sec?: number): Promise<void>;
    /**
     * Waits for an element to become visible on a page (by default waits for 1sec).
     * Element can be located by CSS or XPath.
     *
     * ```js
     * I.waitForVisible('#popup');
     * ```
     * @param locator - element located by CSS|XPath|strict locator.
     * @param [sec = 1] - (optional, `1` by default) time in seconds to wait
     * @returns automatically synchronized promise through #recorder
     */
    waitForVisible(locator: TestMaiT.LocatorOrString, sec?: number): Promise<void>;
    /**
     * Waits for an element to be removed or become invisible on a page (by default waits for 1sec).
     * Element can be located by CSS or XPath.
     *
     * ```js
     * I.waitForInvisible('#popup');
     * ```
     * @param locator - element located by CSS|XPath|strict locator.
     * @param [sec = 1] - (optional, `1` by default) time in seconds to wait
     * @returns automatically synchronized promise through #recorder
     */
    waitForInvisible(locator: TestMaiT.LocatorOrString, sec?: number): Promise<void>;
    /**
     * Waits for a text to appear (by default waits for 1sec).
     * Element can be located by CSS or XPath.
     * Narrow down search results by providing context.
     *
     * ```js
     * I.waitForText('Thank you, form has been submitted');
     * I.waitForText('Thank you, form has been submitted', 5, '#modal');
     * ```
     * @param text - to wait for.
     * @param [sec = 1] - (optional, `1` by default) time in seconds to wait
     * @param [context = null] - (optional) element located by CSS|XPath|strict locator.
     * @returns automatically synchronized promise through #recorder
     */
    waitForText(text: string, sec?: number, context?: TestMaiT.LocatorOrString): Promise<void>;
  }
  /**
   * This helper allows performing assertions based on Chai.
   *
   * ### Examples
   *
   * Zero-configuration when paired with other helpers like REST, Playwright:
   *
   * ```js
   * // inside testmait.conf.js
   * {
   *   helpers: {
   *     Playwright: {...},
   *     ExpectHelper: {},
   *   }
   * }
   * ```
   *
   * ## Methods
   */
  class ExpectHelper {
    expectEqual(actualValue: any, expectedValue: any, customErrorMsg: any): void;
    expectNotEqual(actualValue: any, expectedValue: any, customErrorMsg: any): void;
    expectDeepEqual(actualValue: any, expectedValue: any, customErrorMsg: any): void;
    expectNotDeepEqual(actualValue: any, expectedValue: any, customErrorMsg: any): void;
    expectContain(actualValue: any, expectedValueToContain: any, customErrorMsg: any): void;
    expectNotContain(actualValue: any, expectedValueToNotContain: any, customErrorMsg: any): void;
    expectStartsWith(actualValue: any, expectedValueToStartWith: any, customErrorMsg: any): void;
    expectNotStartsWith(
      actualValue: any,
      expectedValueToNotStartWith: any,
      customErrorMsg: any,
    ): void;
    expectEndsWith(actualValue: any, expectedValueToEndWith: any, customErrorMsg: any): void;
    expectNotEndsWith(actualValue: any, expectedValueToNotEndWith: any, customErrorMsg: any): void;
    expectJsonSchema(targetData: any, jsonSchema: any, customErrorMsg: any): void;
    /**
     * @param ajvOptions - Pass AJV options
     */
    expectJsonSchemaUsingAJV(
      targetData: any,
      jsonSchema: any,
      customErrorMsg: any,
      ajvOptions: any,
    ): void;
    expectHasProperty(targetData: any, propertyName: any, customErrorMsg: any): void;
    expectHasAProperty(targetData: any, propertyName: any, customErrorMsg: any): void;
    expectToBeA(targetData: any, type: any, customErrorMsg: any): void;
    expectToBeAn(targetData: any, type: any, customErrorMsg: any): void;
    expectMatchRegex(targetData: any, regex: any, customErrorMsg: any): void;
    expectLengthOf(targetData: any, length: any, customErrorMsg: any): void;
    expectEmpty(targetData: any, customErrorMsg: any): void;
    expectTrue(targetData: any, customErrorMsg: any): void;
    expectFalse(targetData: any, customErrorMsg: any): void;
    /**
     * @param aboveThan - number | Date
     */
    expectAbove(targetData: any, aboveThan: any, customErrorMsg: any): void;
    /**
     * @param belowThan - number | Date
     */
    expectBelow(targetData: any, belowThan: any, customErrorMsg: any): void;
    expectLengthAboveThan(targetData: any, lengthAboveThan: any, customErrorMsg: any): void;
    expectLengthBelowThan(targetData: any, lengthBelowThan: any, customErrorMsg: any): void;
    expectEqualIgnoreCase(actualValue: any, expectedValue: any, customErrorMsg: any): void;
    /**
     * expects members of two arrays are deeply equal
     */
    expectDeepMembers(actualValue: any, expectedValue: any, customErrorMsg: any): void;
    /**
     * expects an array to be a superset of another array
     */
    expectDeepIncludeMembers(superset: any, set: any, customErrorMsg: any): void;
    /**
     * expects members of two JSON objects are deeply equal excluding some properties
     */
    expectDeepEqualExcluding(
      actualValue: any,
      expectedValue: any,
      fieldsToExclude: any,
      customErrorMsg: any,
    ): void;
    /**
     * expects a JSON object matches a provided pattern
     */
    expectMatchesPattern(actualValue: any, expectedPattern: any, customErrorMsg: any): void;
  }
  /**
   * Helper for testing filesystem.
   * Can be easily used to check file structures:
   *
   * ```js
   * I.amInPath('test');
   * I.seeFile('testmait.js');
   * I.seeInThisFile('FileSystem');
   * I.dontSeeInThisFile("WebDriver");
   * ```
   *
   * ## Configuration
   *
   * Enable helper in config file:
   *
   * ```js
   * helpers: {
   *     FileSystem: {},
   * }
   * ```
   *
   * ## Methods
   */
  class FileSystem {
    /**
     * Enters a directory In local filesystem.
     * Starts from a current directory
     */
    amInPath(openPath: string): void;
    /**
     * Writes text to file
     */
    writeToFile(name: string, text: string): void;
    /**
     * Checks that file exists
     */
    seeFile(name: string): void;
    /**
     * Waits for the file to be present in the current directory.
     *
     * ```js
     * I.handleDownloads('downloads/largeFilesName.txt');
     * I.click('Download large File');
     * I.amInPath('output/downloads');
     * I.waitForFile('largeFilesName.txt', 10); // wait 10 seconds for file
     * ```
     * @param [sec = 1] - seconds to wait
     */
    waitForFile(name: string, sec?: number): void;
    /**
     * Checks that file with a name including given text exists in the current directory.
     *
     * ```js
     * I.handleDownloads();
     * I.click('Download as PDF');
     * I.amInPath('output/downloads');
     * I.seeFileNameMatching('.pdf');
     * ```
     */
    seeFileNameMatching(text: string): void;
    /**
     * Checks that file found by `seeFile` includes a text.
     */
    seeInThisFile(text: string, encoding?: string): void;
    /**
     * Checks that file found by `seeFile` doesn't include text.
     */
    dontSeeInThisFile(text: string, encoding?: string): void;
    /**
     * Checks that contents of file found by `seeFile` equal to text.
     */
    seeFileContentsEqual(text: string, encoding?: string): void;
    /**
     * Checks that contents of the file found by `seeFile` equal to contents of the file at `pathToReferenceFile`.
     */
    seeFileContentsEqualReferenceFile(
      pathToReferenceFile: string,
      encoding?: string,
      encodingReference?: string,
    ): void;
    /**
     * Checks that contents of file found by `seeFile` doesn't equal to text.
     */
    dontSeeFileContentsEqual(text: string, encoding?: string): void;
    /**
     * Returns file names in current directory.
     *
     * ```js
     * I.handleDownloads();
     * I.click('Download Files');
     * I.amInPath('output/downloads');
     * const downloadedFileNames = I.grabFileNames();
     * ```
     */
    grabFileNames(): void;
  }
  /**
   * GraphQL helper allows to send additional requests to a GraphQl endpoint during acceptance tests.
   * [Axios](https://github.com/axios/axios) library is used to perform requests.
   *
   * ## Configuration
   *
   * * endpoint: GraphQL base URL
   * * timeout: timeout for requests in milliseconds. 10000ms by default
   * * defaultHeaders: a list of default headers
   * * onRequest: a async function which can update request object.
   *
   * ## Example
   *
   * ```js
   * GraphQL: {
   *    endpoint: 'http://site.com/graphql/',
   *    onRequest: (request) => {
   *      request.headers.auth = '123';
   *    }
   * }
   * ```
   *
   * ## Access From Helpers
   *
   * Send GraphQL requests by accessing `_executeQuery` method:
   *
   * ```js
   * this.helpers['GraphQL']._executeQuery({
   *    url,
   *    data,
   * });
   * ```
   *
   * ## Methods
   */
  class GraphQL {
    /**
     * Executes query via axios call
     */
    _executeQuery(request: any): void;
    /**
     * Prepares request for axios call
     * @returns graphQLRequest
     */
    _prepareGraphQLRequest(operation: any, headers: any): any;
    /**
     * Send query to GraphQL endpoint over http.
     * Returns a response as a promise.
     *
     * ```js
     *
     * const response = await I.sendQuery('{ users { name email }}');
     * // with variables
     * const response = await I.sendQuery(
     *  'query getUser($id: ID) { user(id: $id) { name email }}',
     *  { id: 1 },
     * )
     * const user = response.data.data;
     * ```
     * @param [variables] - that may go along with the query
     * @param [options] - are additional query options
     * @returns Promise<any>
     */
    sendQuery(query: string, variables?: any, options?: any, headers?: any): any;
    /**
     * Send query to GraphQL endpoint over http
     *
     * ```js
     * I.sendMutation(`
     *       mutation createUser($user: UserInput!) {
     *          createUser(user: $user) {
     *            id
     *            name
     *            email
     *          }
     *        }
     *    `,
     *   { user: {
     *       name: 'John Doe',
     *       email: 'john@xmail.com'
     *     }
     *   },
     * });
     * ```
     * @param [variables] - that may go along with the mutation
     * @param [options] - are additional query options
     * @returns Promise<any>
     */
    sendMutation(mutation: string, variables?: any, options?: any, headers?: any): any;
    /**
     * Sets request headers for all requests of this test
     * @param headers - headers list
     */
    haveRequestHeaders(headers: any): void;
    /**
     * Adds a header for Bearer authentication
     *
     * ```js
     * // we use secret function to hide token from logs
     * I.amBearerAuthenticated(secret('heregoestoken'))
     * ```
     * @param accessToken - Bearer access token
     */
    amBearerAuthenticated(accessToken: string | TestMaiT.Secret): void;
  }
  /**
   * Helper for managing remote data using GraphQL queries.
   * Uses data generators like [rosie](https://github.com/rosiejs/rosie) or factory girl to create new record.
   *
   * By defining a factory you set the rules of how data is generated.
   * This data will be saved on server via GraphQL queries and deleted in the end of a test.
   *
   * ## Use Case
   *
   * Acceptance tests interact with a websites using UI and real browser.
   * There is no way to create data for a specific test other than from user interface.
   * That makes tests slow and fragile. Instead of testing a single feature you need to follow all creation/removal process.
   *
   * This helper solves this problem.
   * If a web application has GraphQL support, it can be used to create and delete test records.
   * By combining GraphQL with Factories you can easily create records for tests:
   *
   * ```js
   * I.mutateData('createUser', { name: 'davert', email: 'davert@mail.com' });
   * let user = await I.mutateData('createUser', { name: 'davert'});
   * I.mutateMultiple('createPost', 3, {post_id: user.id});
   * ```
   *
   * To make this work you need
   *
   * 1. GraphQL endpoint which allows to perform create / delete requests and
   * 2. define data generation rules
   *
   * ### Setup
   *
   * Install [Rosie](https://github.com/rosiejs/rosie) and [Faker](https://www.npmjs.com/package/faker) libraries.
   *
   * ```sh
   * npm i rosie @faker-js/faker --save-dev
   * ```
   *
   * Create a factory file for a resource.
   *
   * See the example for Users factories:
   *
   * ```js
   * // tests/factories/users.js
   *
   * const { Factory } = require('rosie').Factory;
   * const { faker } = require('@faker-js/faker');
   *
   * // Used with a constructor function passed to Factory, so that the final build
   * // object matches the necessary pattern to be sent as the variables object.
   * module.exports = new Factory((buildObj) => ({
   *    input: { ...buildObj },
   * }))
   *    // 'attr'-id can be left out depending on the GraphQl resolvers
   *    .attr('name', () => faker.name.findName())
   *    .attr('email', () => faker.interact.email())
   * ```
   * For more options see [rosie documentation](https://github.com/rosiejs/rosie).
   *
   * Then configure GraphQLDataHelper to match factories and GraphQL schema:
   * ### Configuration
   *
   * GraphQLDataFactory has following config options:
   *
   * * `endpoint`: URL for the GraphQL server.
   * * `cleanup` (default: true): should inserted records be deleted up after tests
   * * `factories`: list of defined factories
   * * `headers`: list of headers
   * * `GraphQL`: configuration for GraphQL requests.
   *
   *
   * See the example:
   *
   * ```js
   *  GraphQLDataFactory: {
   *    endpoint: "http://user.com/graphql",
   *    cleanup: true,
   *    headers: {
   *      'Content-Type': 'application/json',
   *      'Accept': 'application/json',
   *    },
   *    factories: {
   *      createUser: {
   *        query: 'mutation createUser($input: UserInput!) { createUser(input: $input) { id name }}',
   *        factory: './factories/users',
   *        revert: (data) => ({
   *          query: 'mutation deleteUser($id: ID!) { deleteUser(id: $id) }',
   *          variables: { id : data.id},
   *        }),
   *      },
   *    }
   * }
   * ```
   * It is required to set GraphQL `endpoint` which is the URL to which all the queries go to.
   * Factory file is expected to be passed via `factory` option.
   *
   * This Helper uses [GraphQL](http://testmait.io/helpers/GraphQL/) helper and accepts its configuration in "GraphQL" section.
   * For instance, to set timeout you should add:
   *
   * ```js
   * "GraphQLDataFactory": {
   *    "GraphQL": {
   *      "timeout": "100000",
   *   }
   * }
   * ```
   *
   * ### Factory
   *
   * Factory contains operations -
   *
   * * `operation`: The operation/mutation that needs to be performed for creating a record in the backend.
   *
   * Each operation must have the following:
   *
   * * `query`: The mutation(query) string. It is expected to use variables to send data with the query.
   * * `factory`: The path to factory file. The object built by the factory in this file will be passed
   *    as the 'variables' object to go along with the mutation.
   * * `revert`: A function called with the data returned when an item is created. The object returned by
   *    this function is will be used to later delete the items created. So, make sure RELEVANT DATA IS RETURNED
   *    when a record is created by a mutation.
   *
   * ### Requests
   *
   * Requests can be updated on the fly by using `onRequest` function. For instance, you can pass in current session from a cookie.
   *
   * ```js
   *  onRequest: async (request) => {
   *     // using global testmait instance
   *     let cookie = await testmait.container.helpers('WebDriver').grabCookie('session');
   *     request.headers = { Cookie: `session=${cookie.value}` };
   *   }
   * ```
   *
   * ### Responses
   *
   * By default `I.mutateData()` returns a promise with created data as specified in operation query string:
   *
   * ```js
   * let client = await I.mutateData('createClient');
   * ```
   *
   * Data of created records are collected and used in the end of a test for the cleanup.
   *
   * ## Methods
   */
  class GraphQLDataFactory {
    /**
     * Generates a new record using factory, sends a GraphQL mutation to store it.
     *
     * ```js
     * // create a user
     * I.mutateData('createUser');
     * // create user with defined email
     * // and receive it when inside async function
     * const user = await I.mutateData('createUser', { email: 'user@user.com'});
     * ```
     * @param operation - to be performed
     * @param params - predefined parameters
     */
    mutateData(operation: string, params: any): void;
    /**
     * Generates bunch of records and sends multiple GraphQL mutation requests to store them.
     *
     * ```js
     * // create 3 users
     * I.mutateMultiple('createUser', 3);
     *
     * // create 3 users of same age
     * I.mutateMultiple('createUser', 3, { age: 25 });
     * ```
     */
    mutateMultiple(operation: string, times: number, params: any): void;
    /**
     * Executes request to create a record to the GraphQL endpoint.
     * Can be replaced from a custom helper.
     * @param variables - to be sent along with the query
     */
    _requestCreate(operation: string, variables: any): void;
    /**
     * Executes request to delete a record to the GraphQL endpoint.
     * Can be replaced from a custom helper.
     * @param data - of the record to be deleted.
     */
    _requestDelete(operation: string, data: any): void;
  }
  /**
   * This helper allows performing assertions on JSON responses paired with following helpers:
   *
   * * REST
   * * GraphQL
   * * Playwright
   *
   * It can check status codes, response data, response structure.
   *
   *
   * ## Configuration
   *
   * * `requestHelper` - a helper which will perform requests. `REST` by default, also `Playwright` or `GraphQL` can be used. Custom helpers must have `onResponse` hook in their config, which will be executed when request is performed.
   *
   * ### Examples
   *
   * Zero-configuration when paired with REST:
   *
   * ```js
   * // inside testmait.conf.js
   * {
   *   helpers: {
   *     REST: {
   *       endpoint: 'http://site.com/api',
   *     },
   *     JSONResponse: {}
   *   }
   * }
   * ```
   * Explicitly setting request helper if you use `makeApiRequest` of Playwright to perform requests and not paired REST:
   *
   * ```js
   * // inside testmait.conf.js
   * // ...
   *   helpers: {
   *     Playwright: {
   *       url: 'https://localhost',
   *       browser: 'chromium',
   *     },
   *     JSONResponse: {
   *       requestHelper: 'Playwright',
   *     }
   *   }
   * ```
   * ## Access From Helpers
   *
   * If you plan to add custom assertions it is recommended to create a helper that will retrieve response object from JSONResponse:
   *
   *
   * ```js
   * // inside custom helper
   * const response = this.helpers.JSONResponse.response;
   * ```
   *
   * ## Methods
   */
  class JSONResponse {
    /**
     * Checks that response code is equal to the provided one
     *
     * ```js
     * I.seeResponseCodeIs(200);
     * ```
     */
    seeResponseCodeIs(code: number): void;
    /**
     * Checks that response code is not equal to the provided one
     *
     * ```js
     * I.dontSeeResponseCodeIs(500);
     * ```
     */
    dontSeeResponseCodeIs(code: number): void;
    /**
     * Checks that the response code is 4xx
     */
    seeResponseCodeIsClientError(): void;
    /**
     * Checks that the response code is 3xx
     */
    seeResponseCodeIsRedirection(): void;
    /**
     * Checks that the response code is 5xx
     */
    seeResponseCodeIsServerError(): void;
    /**
     * Checks that the response code is 2xx
     * Use it instead of seeResponseCodeIs(200) if server can return 204 instead.
     *
     * ```js
     * I.seeResponseCodeIsSuccessful();
     * ```
     */
    seeResponseCodeIsSuccessful(): void;
    /**
     * Checks for deep inclusion of a provided json in a response data.
     *
     * ```js
     * // response.data == { user: { name: 'jon', email: 'jon@doe.com' } }
     *
     * I.seeResponseContainsJson({ user: { email: 'jon@doe.com' } });
     * ```
     * If an array is received, checks that at least one element contains JSON
     * ```js
     * // response.data == [{ user: { name: 'jon', email: 'jon@doe.com' } }]
     *
     * I.seeResponseContainsJson({ user: { email: 'jon@doe.com' } });
     * ```
     */
    seeResponseContainsJson(json: any): void;
    /**
     * Checks for deep inclusion of a provided json in a response data.
     *
     * ```js
     * // response.data == { data: { user: 1 } }
     *
     * I.dontSeeResponseContainsJson({ user: 2 });
     * ```
     * If an array is received, checks that no element of array contains json:
     * ```js
     * // response.data == [{ user: 1 }, { user: 3 }]
     *
     * I.dontSeeResponseContainsJson({ user: 2 });
     * ```
     */
    dontSeeResponseContainsJson(json: any): void;
    /**
     * Checks for deep inclusion of a provided json in a response data.
     *
     * ```js
     * // response.data == { user: { name: 'jon', email: 'jon@doe.com' } }
     *
     * I.seeResponseContainsKeys(['user']);
     * ```
     *
     * If an array is received, check is performed for each element of array:
     *
     * ```js
     * // response.data == [{ user: 'jon' }, { user: 'matt'}]
     *
     * I.seeResponseContainsKeys(['user']);
     * ```
     */
    seeResponseContainsKeys(keys: any[]): void;
    /**
     * Executes a callback function passing in `response` object and chai assertions with `expect`
     * Use it to perform custom checks of response data
     *
     * ```js
     * I.seeResponseValidByCallback(({ data, status, expect }) => {
     *   expect(status).to.eql(200);
     *   expect(data).keys.to.include(['user', 'company']);
     * });
     * ```
     */
    seeResponseValidByCallback(fn: (...params: any[]) => any): void;
    /**
     * Checks that response data equals to expected:
     *
     * ```js
     * // response.data is { error: 'Not allowed' }
     *
     * I.seeResponseEquals({ error: 'Not allowed' })
     * ```
     */
    seeResponseEquals(resp: any): void;
    /**
     * Validates JSON structure of response using [joi library](https://joi.dev).
     * See [joi API](https://joi.dev/api/) for complete reference on usage.
     *
     * Use pre-initialized joi instance by passing function callback:
     *
     * ```js
     * // response.data is { name: 'jon', id: 1 }
     *
     * I.seeResponseMatchesJsonSchema(joi => {
     *   return joi.object({
     *     name: joi.string(),
     *     id: joi.number()
     *   })
     * });
     *
     * // or pass a valid schema
     * const joi = require('joi');
     *
     * I.seeResponseMatchesJsonSchema(joi.object({
     *   name: joi.string(),
     *   id: joi.number();
     * });
     * ```
     */
    seeResponseMatchesJsonSchema(fnOrSchema: any): void;
  }
  /**
   * Nightmare helper wraps [Nightmare](https://github.com/segmentio/nightmare) library to provide
   * fastest headless testing using Electron engine. Unlike Selenium-based drivers this uses
   * Chromium-based browser with Electron with lots of client side scripts, thus should be less stable and
   * less trusted.
   *
   * Requires `nightmare` package to be installed.
   *
   * ## Configuration
   *
   * This helper should be configured in testmait.conf.ts or testmait.conf.js
   *
   * * `url` - base url of website to be tested
   * * `restart` (optional, default: true) - restart browser between tests.
   * * `disableScreenshots` (optional, default: false)  - don't save screenshot on failure.
   * * `uniqueScreenshotNames` (optional, default: false)  - option to prevent screenshot override if you have scenarios with the same name in different suites.
   * * `fullPageScreenshots` (optional, default: false) - make full page screenshots on failure.
   * * `keepBrowserState` (optional, default: false)  - keep browser state between tests when `restart` set to false.
   * * `keepCookies` (optional, default: false)  - keep cookies between tests when `restart` set to false.
   * * `waitForAction`: (optional) how long to wait after click, doubleClick or PressKey actions in ms. Default: 500.
   * * `waitForTimeout`: (optional) default wait* timeout in ms. Default: 1000.
   * * `windowSize`: (optional) default window size. Set a dimension like `640x480`.
   *
   * + options from [Nightmare configuration](https://github.com/segmentio/nightmare#api)
   *
   * ## Methods
   */
  class Nightmare {
    /**
     * Get HAR
     *
     * ```js
     * let har = await I.grabHAR();
     * fs.writeFileSync('sample.har', JSON.stringify({log: har}));
     * ```
     */
    grabHAR(): void;
    /**
     * Locate elements by different locator types, including strict locator.
     * Should be used in custom helpers.
     *
     * This method return promise with array of IDs of found elements.
     * Actual elements can be accessed inside `evaluate` by using `testmait.fetchElement()`
     * client-side function:
     *
     * ```js
     * // get an inner text of an element
     *
     * let browser = this.helpers['Nightmare'].browser;
     * let value = this.helpers['Nightmare']._locate({name: 'password'}).then(function(els) {
     *   return browser.evaluate(function(el) {
     *     return testmait.fetchElement(el).value;
     *   }, els[0]);
     * });
     * ```
     */
    _locate(): void;
    /**
     * Add a header override for all HTTP requests. If header is undefined, the header overrides will be reset.
     *
     * ```js
     * I.haveHeader('x-my-custom-header', 'some value');
     * I.haveHeader(); // clear headers
     * ```
     */
    haveHeader(): void;
    /**
     * Opens a web page in a browser. Requires relative or absolute url.
     * If url starts with `/`, opens a web page of a site defined in `url` config parameter.
     *
     * ```js
     * I.amOnPage('/'); // opens main page of website
     * I.amOnPage('https://github.com'); // opens github
     * I.amOnPage('/login'); // opens a login page
     * ```
     * @param url - url path or global url.
     * @param headers - list of request headers can be passed
     * @returns automatically synchronized promise through #recorder
     */
    amOnPage(url: string, headers: any): Promise<void>;
    /**
     * Checks that title contains text.
     *
     * ```js
     * I.seeInTitle('Home Page');
     * ```
     * @param text - text value to check.
     * @returns automatically synchronized promise through #recorder
     */
    seeInTitle(text: string): Promise<void>;
    /**
     * Checks that title does not contain text.
     *
     * ```js
     * I.dontSeeInTitle('Error');
     * ```
     * @param text - value to check.
     * @returns automatically synchronized promise through #recorder
     */
    dontSeeInTitle(text: string): Promise<void>;
    /**
     * Retrieves a page title and returns it to test.
     * Resumes test execution, so **should be used inside async with `await`** operator.
     *
     * ```js
     * let title = await I.grabTitle();
     * ```
     * @returns title
     */
    grabTitle(): Promise<string>;
    /**
     * Get current URL from browser.
     * Resumes test execution, so should be used inside an async function.
     *
     * ```js
     * let url = await I.grabCurrentUrl();
     * console.log(`Current URL is [${url}]`);
     * ```
     * @returns current URL
     */
    grabCurrentUrl(): Promise<string>;
    /**
     * Checks that current url contains a provided fragment.
     *
     * ```js
     * I.seeInCurrentUrl('/register'); // we are on registration page
     * ```
     * @param url - a fragment to check
     * @returns automatically synchronized promise through #recorder
     */
    seeInCurrentUrl(url: string): Promise<void>;
    /**
     * Checks that current url does not contain a provided fragment.
     * @param url - value to check.
     * @returns automatically synchronized promise through #recorder
     */
    dontSeeInCurrentUrl(url: string): Promise<void>;
    /**
     * Checks that current url is equal to provided one.
     * If a relative url provided, a configured url will be prepended to it.
     * So both examples will work:
     *
     * ```js
     * I.seeCurrentUrlEquals('/register');
     * I.seeCurrentUrlEquals('http://my.site.com/register');
     * ```
     * @param url - value to check.
     * @returns automatically synchronized promise through #recorder
     */
    seeCurrentUrlEquals(url: string): Promise<void>;
    /**
     * Checks that current url is not equal to provided one.
     * If a relative url provided, a configured url will be prepended to it.
     *
     * ```js
     * I.dontSeeCurrentUrlEquals('/login'); // relative url are ok
     * I.dontSeeCurrentUrlEquals('http://mysite.com/login'); // absolute urls are also ok
     * ```
     * @param url - value to check.
     * @returns automatically synchronized promise through #recorder
     */
    dontSeeCurrentUrlEquals(url: string): Promise<void>;
    /**
     * Checks that a page contains a visible text.
     * Use context parameter to narrow down the search.
     *
     * ```js
     * I.see('Welcome'); // text welcome on a page
     * I.see('Welcome', '.content'); // text inside .content div
     * I.see('Register', {css: 'form.register'}); // use strict locator
     * ```
     * @param text - expected on page.
     * @param [context = null] - (optional, `null` by default) element located by CSS|Xpath|strict locator in which to search for text.
     * @returns automatically synchronized promise through #recorder
     */
    see(text: string, context?: TestMaiT.LocatorOrString): Promise<void>;
    /**
     * Opposite to `see`. Checks that a text is not present on a page.
     * Use context parameter to narrow down the search.
     *
     * ```js
     * I.dontSee('Login'); // assume we are already logged in.
     * I.dontSee('Login', '.nav'); // no login inside .nav element
     * ```
     * @param text - which is not present.
     * @param [context = null] - (optional) element located by CSS|XPath|strict locator in which to perfrom search.
     * @returns automatically synchronized promise through #recorder
     */
    dontSee(text: string, context?: TestMaiT.LocatorOrString): Promise<void>;
    /**
     * Checks that a given Element is visible
     * Element is located by CSS or XPath.
     *
     * ```js
     * I.seeElement('#modal');
     * ```
     * @param locator - located by CSS|XPath|strict locator.
     * @returns automatically synchronized promise through #recorder
     */
    seeElement(locator: TestMaiT.LocatorOrString): Promise<void>;
    /**
     * Opposite to `seeElement`. Checks that element is not visible (or in DOM)
     *
     * ```js
     * I.dontSeeElement('.modal'); // modal is not shown
     * ```
     * @param locator - located by CSS|XPath|Strict locator.
     * @returns automatically synchronized promise through #recorder
     */
    dontSeeElement(locator: TestMaiT.LocatorOrString): Promise<void>;
    /**
     * Checks that a given Element is present in the DOM
     * Element is located by CSS or XPath.
     *
     * ```js
     * I.seeElementInDOM('#modal');
     * ```
     * @param locator - element located by CSS|XPath|strict locator.
     * @returns automatically synchronized promise through #recorder
     */
    seeElementInDOM(locator: TestMaiT.LocatorOrString): Promise<void>;
    /**
     * Opposite to `seeElementInDOM`. Checks that element is not on page.
     *
     * ```js
     * I.dontSeeElementInDOM('.nav'); // checks that element is not on page visible or not
     * ```
     * @param locator - located by CSS|XPath|Strict locator.
     * @returns automatically synchronized promise through #recorder
     */
    dontSeeElementInDOM(locator: TestMaiT.LocatorOrString): Promise<void>;
    /**
     * Checks that the current page contains the given string in its raw source code.
     *
     * ```js
     * I.seeInSource('<h1>Green eggs &amp; ham</h1>');
     * ```
     * @param text - value to check.
     * @returns automatically synchronized promise through #recorder
     */
    seeInSource(text: string): Promise<void>;
    /**
     * Checks that the current page does not contains the given string in its raw source code.
     *
     * ```js
     * I.dontSeeInSource('<!--'); // no comments in source
     * ```
     * @param value - to check.
     * @returns automatically synchronized promise through #recorder
     */
    dontSeeInSource(value: string): Promise<void>;
    /**
     * Asserts that an element appears a given number of times in the DOM.
     * Element is located by label or name or CSS or XPath.
     *
     *
     * ```js
     * I.seeNumberOfElements('#submitBtn', 1);
     * ```
     * @param locator - element located by CSS|XPath|strict locator.
     * @param num - number of elements.
     * @returns automatically synchronized promise through #recorder
     */
    seeNumberOfElements(locator: TestMaiT.LocatorOrString, num: number): Promise<void>;
    /**
     * Asserts that an element is visible a given number of times.
     * Element is located by CSS or XPath.
     *
     * ```js
     * I.seeNumberOfVisibleElements('.buttons', 3);
     * ```
     * @param locator - element located by CSS|XPath|strict locator.
     * @param num - number of elements.
     * @returns automatically synchronized promise through #recorder
     */
    seeNumberOfVisibleElements(locator: TestMaiT.LocatorOrString, num: number): Promise<void>;
    /**
     * Grab number of visible elements by locator.
     * Resumes test execution, so **should be used inside async function with `await`** operator.
     *
     * ```js
     * let numOfElements = await I.grabNumberOfVisibleElements('p');
     * ```
     * @param locator - located by CSS|XPath|strict locator.
     * @returns number of visible elements
     */
    grabNumberOfVisibleElements(locator: TestMaiT.LocatorOrString): Promise<number>;
    /**
     * Perform a click on a link or a button, given by a locator.
     * If a fuzzy locator is given, the page will be searched for a button, link, or image matching the locator string.
     * For buttons, the "value" attribute, "name" attribute, and inner text are searched. For links, the link text is searched.
     * For images, the "alt" attribute and inner text of any parent links are searched.
     *
     * The second parameter is a context (CSS or XPath locator) to narrow the search.
     *
     * ```js
     * // simple link
     * I.click('Logout');
     * // button of form
     * I.click('Submit');
     * // CSS button
     * I.click('#form input[type=submit]');
     * // XPath
     * I.click('//form/*[@type=submit]');
     * // link in context
     * I.click('Logout', '#nav');
     * // using strict locator
     * I.click({css: 'nav a.login'});
     * ```
     * @param locator - clickable link or button located by text, or any element located by CSS|XPath|strict locator.
     * @param [context = null] - (optional, `null` by default) element to search in CSS|XPath|Strict locator.
     * @returns automatically synchronized promise through #recorder
     */
    click(
      locator: TestMaiT.LocatorOrString,
      context?: TestMaiT.LocatorOrString | null,
    ): Promise<void>;
    /**
     * Performs a double-click on an element matched by link|button|label|CSS or XPath.
     * Context can be specified as second parameter to narrow search.
     *
     * ```js
     * I.doubleClick('Edit');
     * I.doubleClick('Edit', '.actions');
     * I.doubleClick({css: 'button.accept'});
     * I.doubleClick('.btn.edit');
     * ```
     * @param locator - clickable link or button located by text, or any element located by CSS|XPath|strict locator.
     * @param [context = null] - (optional, `null` by default) element to search in CSS|XPath|Strict locator.
     * @returns automatically synchronized promise through #recorder
     */
    doubleClick(
      locator: TestMaiT.LocatorOrString,
      context?: TestMaiT.LocatorOrString,
    ): Promise<void>;
    /**
     * Performs right click on a clickable element matched by semantic locator, CSS or XPath.
     *
     * ```js
     * // right click element with id el
     * I.rightClick('#el');
     * // right click link or button with text "Click me"
     * I.rightClick('Click me');
     * // right click button with text "Click me" inside .context
     * I.rightClick('Click me', '.context');
     * ```
     * @param locator - clickable element located by CSS|XPath|strict locator.
     * @param [context = null] - (optional, `null` by default) element located by CSS|XPath|strict locator.
     * @returns automatically synchronized promise through #recorder
     */
    rightClick(
      locator: TestMaiT.LocatorOrString,
      context?: TestMaiT.LocatorOrString,
    ): Promise<void>;
    /**
     * Moves cursor to element matched by locator.
     * Extra shift can be set with offsetX and offsetY options.
     *
     * ```js
     * I.moveCursorTo('.tooltip');
     * I.moveCursorTo('#submit', 5,5);
     * ```
     * @param locator - located by CSS|XPath|strict locator.
     * @param [offsetX = 0] - (optional, `0` by default) X-axis offset.
     * @param [offsetY = 0] - (optional, `0` by default) Y-axis offset.
     * @returns automatically synchronized promise through #recorder
     */
    moveCursorTo(
      locator: TestMaiT.LocatorOrString,
      offsetX?: number,
      offsetY?: number,
    ): Promise<void>;
    /**
     * Executes sync script on a page.
     * Pass arguments to function as additional parameters.
     * Will return execution result to a test.
     * In this case you should use async function and await to receive results.
     *
     * Example with jQuery DatePicker:
     *
     * ```js
     * // change date of jQuery DatePicker
     * I.executeScript(function() {
     *   // now we are inside browser context
     *   $('date').datetimepicker('setDate', new Date());
     * });
     * ```
     * Can return values. Don't forget to use `await` to get them.
     *
     * ```js
     * let date = await I.executeScript(function(el) {
     *   // only basic types can be returned
     *   return $(el).datetimepicker('getDate').toString();
     * }, '#date'); // passing jquery selector
     * ```
     * @param fn - function to be executed in browser context.
     * @param args - to be passed to function.
     * @returns script return value
     *
     *
     * Wrapper for synchronous [evaluate](https://github.com/segmentio/nightmare#evaluatefn-arg1-arg2)
     */
    executeScript(fn: string | ((...params: any[]) => any), ...args: any[]): Promise<any>;
    /**
     * Executes async script on page.
     * Provided function should execute a passed callback (as first argument) to signal it is finished.
     *
     * Example: In Vue.js to make components completely rendered we are waiting for [nextTick](https://vuejs.org/v2/api/#Vue-nextTick).
     *
     * ```js
     * I.executeAsyncScript(function(done) {
     *   Vue.nextTick(done); // waiting for next tick
     * });
     * ```
     *
     * By passing value to `done()` function you can return values.
     * Additional arguments can be passed as well, while `done` function is always last parameter in arguments list.
     *
     * ```js
     * let val = await I.executeAsyncScript(function(url, done) {
     *   // in browser context
     *   $.ajax(url, { success: (data) => done(data); }
     * }, 'http://ajax.callback.url/');
     * ```
     * @param fn - function to be executed in browser context.
     * @param args - to be passed to function.
     * @returns script return value
     *
     *
     * Wrapper for asynchronous [evaluate](https://github.com/segmentio/nightmare#evaluatefn-arg1-arg2).
     * Unlike NightmareJS implementation calling `done` will return its first argument.
     */
    executeAsyncScript(fn: string | ((...params: any[]) => any), ...args: any[]): Promise<any>;
    /**
     * Resize the current window to provided width and height.
     * First parameter can be set to `maximize`.
     * @param width - width in pixels or `maximize`.
     * @param height - height in pixels.
     * @returns automatically synchronized promise through #recorder
     */
    resizeWindow(width: number, height: number): Promise<void>;
    /**
     * Selects a checkbox or radio button.
     * Element is located by label or name or CSS or XPath.
     *
     * The second parameter is a context (CSS or XPath locator) to narrow the search.
     *
     * ```js
     * I.checkOption('#agree');
     * I.checkOption('I Agree to Terms and Conditions');
     * I.checkOption('agree', '//form');
     * ```
     * @param field - checkbox located by label | name | CSS | XPath | strict locator.
     * @param [context = null] - (optional, `null` by default) element located by CSS | XPath | strict locator.
     * @returns automatically synchronized promise through #recorder
     */
    checkOption(field: TestMaiT.LocatorOrString, context?: TestMaiT.LocatorOrString): Promise<void>;
    /**
     * Unselects a checkbox or radio button.
     * Element is located by label or name or CSS or XPath.
     *
     * The second parameter is a context (CSS or XPath locator) to narrow the search.
     *
     * ```js
     * I.uncheckOption('#agree');
     * I.uncheckOption('I Agree to Terms and Conditions');
     * I.uncheckOption('agree', '//form');
     * ```
     * @param field - checkbox located by label | name | CSS | XPath | strict locator.
     * @param [context = null] - (optional, `null` by default) element located by CSS | XPath | strict locator.
     * @returns automatically synchronized promise through #recorder
     */
    uncheckOption(
      field: TestMaiT.LocatorOrString,
      context?: TestMaiT.LocatorOrString,
    ): Promise<void>;
    /**
     * Fills a text field or textarea, after clearing its value, with the given string.
     * Field is located by name, label, CSS, or XPath.
     *
     * ```js
     * // by label
     * I.fillField('Email', 'hello@world.com');
     * // by name
     * I.fillField('password', secret('123456'));
     * // by CSS
     * I.fillField('form#login input[name=username]', 'John');
     * // or by strict locator
     * I.fillField({css: 'form#login input[name=username]'}, 'John');
     * ```
     * @param field - located by label|name|CSS|XPath|strict locator.
     * @param value - text value to fill.
     * @returns automatically synchronized promise through #recorder
     */
    fillField(field: TestMaiT.LocatorOrString, value: TestMaiT.StringOrSecret): Promise<void>;
    /**
     * Clears a `<textarea>` or text `<input>` element's value.
     *
     * ```js
     * I.clearField('Email');
     * I.clearField('user[email]');
     * I.clearField('#email');
     * ```
     * @param editable - field located by label|name|CSS|XPath|strict locator.
     * @returns automatically synchronized promise through #recorder.
     */
    clearField(editable: LocatorOrString): Promise<void>;
    /**
     * Appends text to a input field or textarea.
     * Field is located by name, label, CSS or XPath
     *
     * ```js
     * I.appendField('#myTextField', 'appended');
     * // typing secret
     * I.appendField('password', secret('123456'));
     * ```
     * @param field - located by label|name|CSS|XPath|strict locator
     * @param value - text value to append.
     * @returns automatically synchronized promise through #recorder
     */
    appendField(field: TestMaiT.LocatorOrString, value: string): Promise<void>;
    /**
     * Checks that the given input field or textarea equals to given value.
     * For fuzzy locators, fields are matched by label text, the "name" attribute, CSS, and XPath.
     *
     * ```js
     * I.seeInField('Username', 'davert');
     * I.seeInField({css: 'form textarea'},'Type your comment here');
     * I.seeInField('form input[type=hidden]','hidden_value');
     * I.seeInField('#searchform input','Search');
     * ```
     * @param field - located by label|name|CSS|XPath|strict locator.
     * @param value - value to check.
     * @returns automatically synchronized promise through #recorder
     */
    seeInField(field: TestMaiT.LocatorOrString, value: TestMaiT.StringOrSecret): Promise<void>;
    /**
     * Checks that value of input field or textarea doesn't equal to given value
     * Opposite to `seeInField`.
     *
     * ```js
     * I.dontSeeInField('email', 'user@user.com'); // field by name
     * I.dontSeeInField({ css: 'form input.email' }, 'user@user.com'); // field by CSS
     * ```
     * @param field - located by label|name|CSS|XPath|strict locator.
     * @param value - value to check.
     * @returns automatically synchronized promise through #recorder
     */
    dontSeeInField(field: TestMaiT.LocatorOrString, value: TestMaiT.StringOrSecret): Promise<void>;
    /**
     * Sends [input event](http://electron.atom.io/docs/api/web-contents/#webcontentssendinputeventevent) on a page.
     * Can submit special keys like 'Enter', 'Backspace', etc
     */
    pressKey(): void;
    /**
     * Sends [input event](http://electron.atom.io/docs/api/web-contents/#contentssendinputeventevent) on a page.
     * Should be a mouse event like:
     *  {
     *         type: 'mouseDown',
     *         x: args.x,
     *         y: args.y,
     *         button: "left"
     *       }
     */
    triggerMouseEvent(): void;
    /**
     * Verifies that the specified checkbox is checked.
     *
     * ```js
     * I.seeCheckboxIsChecked('Agree');
     * I.seeCheckboxIsChecked('#agree'); // I suppose user agreed to terms
     * I.seeCheckboxIsChecked({css: '#signup_form input[type=checkbox]'});
     * ```
     * @param field - located by label|name|CSS|XPath|strict locator.
     * @returns automatically synchronized promise through #recorder
     */
    seeCheckboxIsChecked(field: TestMaiT.LocatorOrString): Promise<void>;
    /**
     * Verifies that the specified checkbox is not checked.
     *
     * ```js
     * I.dontSeeCheckboxIsChecked('#agree'); // located by ID
     * I.dontSeeCheckboxIsChecked('I agree to terms'); // located by label
     * I.dontSeeCheckboxIsChecked('agree'); // located by name
     * ```
     * @param field - located by label|name|CSS|XPath|strict locator.
     * @returns automatically synchronized promise through #recorder
     */
    dontSeeCheckboxIsChecked(field: TestMaiT.LocatorOrString): Promise<void>;
    /**
     * Attaches a file to element located by label, name, CSS or XPath
     * Path to file is relative current testmait directory (where testmait.conf.ts or testmait.conf.js is located).
     * File will be uploaded to remote system (if tests are running remotely).
     *
     * ```js
     * I.attachFile('Avatar', 'data/avatar.jpg');
     * I.attachFile('form input[name=avatar]', 'data/avatar.jpg');
     * ```
     * @param locator - field located by label|name|CSS|XPath|strict locator.
     * @param pathToFile - local file path relative to testmait.conf.ts or testmait.conf.js config file.
     * @returns automatically synchronized promise through #recorder
     *
     *
     * Doesn't work if the Chromium DevTools panel is open (as Chromium allows only one attachment to the debugger at a time. [See more](https://github.com/rosshinkley/nightmare-upload#important-note-about-setting-file-upload-inputs))
     */
    attachFile(locator: TestMaiT.LocatorOrString, pathToFile: string): Promise<void>;
    /**
     * Retrieves all texts from an element located by CSS or XPath and returns it to test.
     * Resumes test execution, so **should be used inside async with `await`** operator.
     *
     * ```js
     * let pins = await I.grabTextFromAll('#pin li');
     * ```
     * @param locator - element located by CSS|XPath|strict locator.
     * @returns attribute value
     */
    grabTextFromAll(locator: TestMaiT.LocatorOrString): Promise<string[]>;
    /**
     * Retrieves a text from an element located by CSS or XPath and returns it to test.
     * Resumes test execution, so **should be used inside async with `await`** operator.
     *
     * ```js
     * let pin = await I.grabTextFrom('#pin');
     * ```
     * If multiple elements found returns first element.
     * @param locator - element located by CSS|XPath|strict locator.
     * @returns attribute value
     */
    grabTextFrom(locator: TestMaiT.LocatorOrString): Promise<string>;
    /**
     * Retrieves an array of value from a form located by CSS or XPath and returns it to test.
     * Resumes test execution, so **should be used inside async function with `await`** operator.
     *
     * ```js
     * let inputs = await I.grabValueFromAll('//form/input');
     * ```
     * @param locator - field located by label|name|CSS|XPath|strict locator.
     * @returns attribute value
     */
    grabValueFromAll(locator: TestMaiT.LocatorOrString): Promise<string[]>;
    /**
     * Retrieves a value from a form element located by CSS or XPath and returns it to test.
     * Resumes test execution, so **should be used inside async function with `await`** operator.
     * If more than one element is found - value of first element is returned.
     *
     * ```js
     * let email = await I.grabValueFrom('input[name=email]');
     * ```
     * @param locator - field located by label|name|CSS|XPath|strict locator.
     * @returns attribute value
     */
    grabValueFrom(locator: TestMaiT.LocatorOrString): Promise<string>;
    /**
     * Retrieves an array of attributes from elements located by CSS or XPath and returns it to test.
     * Resumes test execution, so **should be used inside async with `await`** operator.
     *
     * ```js
     * let hints = await I.grabAttributeFromAll('.tooltip', 'title');
     * ```
     * @param locator - element located by CSS|XPath|strict locator.
     * @param attr - attribute name.
     * @returns attribute value
     */
    grabAttributeFromAll(locator: TestMaiT.LocatorOrString, attr: string): Promise<string[]>;
    /**
     * Retrieves an attribute from an element located by CSS or XPath and returns it to test.
     * Resumes test execution, so **should be used inside async with `await`** operator.
     * If more than one element is found - attribute of first element is returned.
     *
     * ```js
     * let hint = await I.grabAttributeFrom('#tooltip', 'title');
     * ```
     * @param locator - element located by CSS|XPath|strict locator.
     * @param attr - attribute name.
     * @returns attribute value
     */
    grabAttributeFrom(locator: TestMaiT.LocatorOrString, attr: string): Promise<string>;
    /**
     * Retrieves all the innerHTML from elements located by CSS or XPath and returns it to test.
     * Resumes test execution, so **should be used inside async function with `await`** operator.
     *
     * ```js
     * let postHTMLs = await I.grabHTMLFromAll('.post');
     * ```
     * @param element - located by CSS|XPath|strict locator.
     * @returns HTML code for an element
     */
    grabHTMLFromAll(element: TestMaiT.LocatorOrString): Promise<string[]>;
    /**
     * Retrieves the innerHTML from an element located by CSS or XPath and returns it to test.
     * Resumes test execution, so **should be used inside async function with `await`** operator.
     * If more than one element is found - HTML of first element is returned.
     *
     * ```js
     * let postHTML = await I.grabHTMLFrom('#post');
     * ```
     * @param element - located by CSS|XPath|strict locator.
     * @returns HTML code for an element
     */
    grabHTMLFrom(element: TestMaiT.LocatorOrString): Promise<string>;
    /**
     * Grab CSS property for given locator
     * Resumes test execution, so **should be used inside an async function with `await`** operator.
     * If more than one element is found - value of first element is returned.
     *
     * ```js
     * const value = await I.grabCssPropertyFrom('h3', 'font-weight');
     * ```
     * @param locator - element located by CSS|XPath|strict locator.
     * @param cssProperty - CSS property name.
     * @returns CSS value
     */
    grabCssPropertyFrom(locator: TestMaiT.LocatorOrString, cssProperty: string): Promise<string>;
    /**
     * Selects an option in a drop-down select.
     * Field is searched by label | name | CSS | XPath.
     * Option is selected by visible text or by value.
     *
     * ```js
     * I.selectOption('Choose Plan', 'Monthly'); // select by label
     * I.selectOption('subscription', 'Monthly'); // match option by text
     * I.selectOption('subscription', '0'); // or by value
     * I.selectOption('//form/select[@name=account]','Premium');
     * I.selectOption('form select[name=account]', 'Premium');
     * I.selectOption({css: 'form select[name=account]'}, 'Premium');
     * ```
     *
     * Provide an array for the second argument to select multiple options.
     *
     * ```js
     * I.selectOption('Which OS do you use?', ['Android', 'iOS']);
     * ```
     * @param select - field located by label|name|CSS|XPath|strict locator.
     * @param option - visible text or value of option.
     * @returns automatically synchronized promise through #recorder
     */
    selectOption(select: LocatorOrString, option: string | any[]): Promise<void>;
    /**
     * Sets cookie(s).
     *
     * Can be a single cookie object or an array of cookies:
     *
     * ```js
     * I.setCookie({name: 'auth', value: true});
     *
     * // as array
     * I.setCookie([
     *   {name: 'auth', value: true},
     *   {name: 'agree', value: true}
     * ]);
     * ```
     * @param cookie - a cookie object or array of cookie objects.
     * @returns automatically synchronized promise through #recorder
     *
     *
     * Wrapper for `.cookies.set(cookie)`.
     * [See more](https://github.com/segmentio/nightmare/blob/master/Readme.md#cookiessetcookie)
     */
    setCookie(cookie: Cookie | Cookie[]): Promise<void>;
    /**
     * Checks that cookie with given name exists.
     *
     * ```js
     * I.seeCookie('Auth');
     * ```
     * @param name - cookie name.
     * @returns automatically synchronized promise through #recorder
     */
    seeCookie(name: string): Promise<void>;
    /**
     * Checks that cookie with given name does not exist.
     *
     * ```js
     * I.dontSeeCookie('auth'); // no auth cookie
     * ```
     * @param name - cookie name.
     * @returns automatically synchronized promise through #recorder
     */
    dontSeeCookie(name: string): Promise<void>;
    /**
     * Gets a cookie object by name.
     * If none provided gets all cookies.
     * Resumes test execution, so **should be used inside async function with `await`** operator.
     *
     * ```js
     * let cookie = await I.grabCookie('auth');
     * assert(cookie.value, '123456');
     * ```
     * @param [name = null] - cookie name.
     * @returns attribute value
     *
     *
     * Cookie in JSON format. If name not passed returns all cookies for this domain.
     *
     * Multiple cookies can be received by passing query object `I.grabCookie({ secure: true});`. If you'd like get all cookies for all urls, use: `.grabCookie({ url: null }).`
     */
    grabCookie(name?: string): any;
    /**
     * Clears a cookie by name,
     * if none provided clears all cookies.
     *
     * ```js
     * I.clearCookie();
     * I.clearCookie('test');
     * ```
     * @param [cookie = null] - (optional, `null` by default) cookie name
     * @returns automatically synchronized promise through #recorder
     */
    clearCookie(cookie?: string): Promise<void>;
    /**
     * Waits for a function to return true (waits for 1 sec by default).
     * Running in browser context.
     *
     * ```js
     * I.waitForFunction(fn[, [args[, timeout]])
     * ```
     *
     * ```js
     * I.waitForFunction(() => window.requests == 0);
     * I.waitForFunction(() => window.requests == 0, 5); // waits for 5 sec
     * I.waitForFunction((count) => window.requests == count, [3], 5) // pass args and wait for 5 sec
     * ```
     * @param fn - to be executed in browser context.
     * @param [argsOrSec = null] - (optional, `1` by default) arguments for function or seconds.
     * @param [sec = null] - (optional, `1` by default) time in seconds to wait
     * @returns automatically synchronized promise through #recorder
     */
    waitForFunction(
      fn: string | ((...params: any[]) => any),
      argsOrSec?: any[] | number,
      sec?: number,
    ): Promise<void>;
    /**
     * Pauses execution for a number of seconds.
     *
     * ```js
     * I.wait(2); // wait 2 secs
     * ```
     * @param sec - number of second to wait.
     * @returns automatically synchronized promise through #recorder
     */
    wait(sec: number): Promise<void>;
    /**
     * Waits for a text to appear (by default waits for 1sec).
     * Element can be located by CSS or XPath.
     * Narrow down search results by providing context.
     *
     * ```js
     * I.waitForText('Thank you, form has been submitted');
     * I.waitForText('Thank you, form has been submitted', 5, '#modal');
     * ```
     * @param text - to wait for.
     * @param [sec = 1] - (optional, `1` by default) time in seconds to wait
     * @param [context = null] - (optional) element located by CSS|XPath|strict locator.
     * @returns automatically synchronized promise through #recorder
     */
    waitForText(text: string, sec?: number, context?: TestMaiT.LocatorOrString): Promise<void>;
    /**
     * Waits for an element to become visible on a page (by default waits for 1sec).
     * Element can be located by CSS or XPath.
     *
     * ```js
     * I.waitForVisible('#popup');
     * ```
     * @param locator - element located by CSS|XPath|strict locator.
     * @param [sec = 1] - (optional, `1` by default) time in seconds to wait
     * @returns automatically synchronized promise through #recorder
     */
    waitForVisible(locator: TestMaiT.LocatorOrString, sec?: number): Promise<void>;
    /**
     * Waits for an element to hide (by default waits for 1sec).
     * Element can be located by CSS or XPath.
     *
     * ```js
     * I.waitToHide('#popup');
     * ```
     * @param locator - element located by CSS|XPath|strict locator.
     * @param [sec = 1] - (optional, `1` by default) time in seconds to wait
     * @returns automatically synchronized promise through #recorder
     */
    waitToHide(locator: TestMaiT.LocatorOrString, sec?: number): Promise<void>;
    /**
     * Waits for an element to be removed or become invisible on a page (by default waits for 1sec).
     * Element can be located by CSS or XPath.
     *
     * ```js
     * I.waitForInvisible('#popup');
     * ```
     * @param locator - element located by CSS|XPath|strict locator.
     * @param [sec = 1] - (optional, `1` by default) time in seconds to wait
     * @returns automatically synchronized promise through #recorder
     */
    waitForInvisible(locator: TestMaiT.LocatorOrString, sec?: number): Promise<void>;
    /**
     * Waits for element to be present on page (by default waits for 1sec).
     * Element can be located by CSS or XPath.
     *
     * ```js
     * I.waitForElement('.btn.continue');
     * I.waitForElement('.btn.continue', 5); // wait for 5 secs
     * ```
     * @param locator - element located by CSS|XPath|strict locator.
     * @param [sec] - (optional, `1` by default) time in seconds to wait
     * @returns automatically synchronized promise through #recorder
     */
    waitForElement(locator: TestMaiT.LocatorOrString, sec?: number): Promise<void>;
    /**
     * Waits for an element to become not attached to the DOM on a page (by default waits for 1sec).
     * Element can be located by CSS or XPath.
     *
     * ```js
     * I.waitForDetached('#popup');
     * ```
     * @param locator - element located by CSS|XPath|strict locator.
     * @param [sec = 1] - (optional, `1` by default) time in seconds to wait
     * @returns automatically synchronized promise through #recorder
     */
    waitForDetached(locator: TestMaiT.LocatorOrString, sec?: number): Promise<void>;
    /**
     * Reload the current page.
     *
     * ```js
     * I.refreshPage();
     * ```
     * @returns automatically synchronized promise through #recorder
     */
    refreshPage(): Promise<void>;
    /**
     * Reload the page
     */
    refresh(): void;
    /**
     * Saves screenshot of the specified locator to ouput folder (set in testmait.conf.ts or testmait.conf.js).
     * Filename is relative to output folder.
     *
     * ```js
     * I.saveElementScreenshot(`#submit`,'debug.png');
     * ```
     * @param locator - element located by CSS|XPath|strict locator.
     * @param fileName - file name to save.
     * @returns automatically synchronized promise through #recorder
     */
    saveElementScreenshot(locator: TestMaiT.LocatorOrString, fileName: string): Promise<void>;
    /**
     * Grab the width, height, location of given locator.
     * Provide `width` or `height`as second param to get your desired prop.
     * Resumes test execution, so **should be used inside an async function with `await`** operator.
     *
     * Returns an object with `x`, `y`, `width`, `height` keys.
     *
     * ```js
     * const value = await I.grabElementBoundingRect('h3');
     * // value is like { x: 226.5, y: 89, width: 527, height: 220 }
     * ```
     *
     * To get only one metric use second parameter:
     *
     * ```js
     * const width = await I.grabElementBoundingRect('h3', 'width');
     * // width == 527
     * ```
     * @param locator - element located by CSS|XPath|strict locator.
     * @param [elementSize] - x, y, width or height of the given element.
     * @returns Element bounding rectangle
     */
    grabElementBoundingRect(
      locator: LocatorOrString,
      elementSize?: string,
    ): Promise<DOMRect> | Promise<number>;
    /**
     * Saves a screenshot to ouput folder (set in testmait.conf.ts or testmait.conf.js).
     * Filename is relative to output folder.
     * Optionally resize the window to the full available page `scrollHeight` and `scrollWidth` to capture the entire page by passing `true` in as the second argument.
     *
     * ```js
     * I.saveScreenshot('debug.png');
     * I.saveScreenshot('debug.png', true) //resizes to available scrollHeight and scrollWidth before taking screenshot
     * ```
     * @param fileName - file name to save.
     * @param [fullPage = false] - (optional, `false` by default) flag to enable fullscreen screenshot mode.
     * @returns automatically synchronized promise through #recorder
     */
    saveScreenshot(fileName: string, fullPage?: boolean): Promise<void>;
    /**
     * Scrolls to element matched by locator.
     * Extra shift can be set with offsetX and offsetY options.
     *
     * ```js
     * I.scrollTo('footer');
     * I.scrollTo('#submit', 5, 5);
     * ```
     * @param locator - located by CSS|XPath|strict locator.
     * @param [offsetX = 0] - (optional, `0` by default) X-axis offset.
     * @param [offsetY = 0] - (optional, `0` by default) Y-axis offset.
     * @returns automatically synchronized promise through #recorder
     */
    scrollTo(locator: TestMaiT.LocatorOrString, offsetX?: number, offsetY?: number): Promise<void>;
    /**
     * Scroll page to the top.
     *
     * ```js
     * I.scrollPageToTop();
     * ```
     * @returns automatically synchronized promise through #recorder
     */
    scrollPageToTop(): Promise<void>;
    /**
     * Scroll page to the bottom.
     *
     * ```js
     * I.scrollPageToBottom();
     * ```
     * @returns automatically synchronized promise through #recorder
     */
    scrollPageToBottom(): Promise<void>;
    /**
     * Retrieves a page scroll position and returns it to test.
     * Resumes test execution, so **should be used inside an async function with `await`** operator.
     *
     * ```js
     * let { x, y } = await I.grabPageScrollPosition();
     * ```
     * @returns scroll position
     */
    grabPageScrollPosition(): Promise<PageScrollPosition>;
  }
  /**
   * OpenAI Helper for TestMaiT.
   *
   * This helper class provides integration with the OpenAI GPT-3.5 or 4 language model for generating responses to questions or prompts within the context of web pages. It allows you to interact with the GPT-3.5 model to obtain intelligent responses based on HTML fragments or general prompts.
   * This helper should be enabled with any web helpers like Playwright or Puppeteer or WebDrvier to ensure the HTML context is available.
   *
   * ## Configuration
   *
   * This helper should be configured in testmait.json or testmait.conf.js
   *
   * * `chunkSize`: (optional, default: 80000) - The maximum number of characters to send to the OpenAI API at once. We split HTML fragments by 8000 chars to not exceed token limit. Increase this value if you use GPT-4.
   */
  class OpenAI {
    /**
     * Asks the OpenAI GPT language model a question based on the provided prompt within the context of the current page's HTML.
     *
     * ```js
     * I.askGptOnPage('what does this page do?');
     * ```
     * @param prompt - The question or prompt to ask the GPT model.
     * @returns - A Promise that resolves to the generated responses from the GPT model, joined by newlines.
     */
    askGptOnPage(prompt: string): Promise<string>;
    /**
     * Asks the OpenAI GPT-3.5 language model a question based on the provided prompt within the context of a specific HTML fragment on the current page.
     *
     * ```js
     * I.askGptOnPageFragment('describe features of this screen', '.screen');
     * ```
     * @param prompt - The question or prompt to ask the GPT-3.5 model.
     * @param locator - The locator or selector used to identify the HTML fragment on the page.
     * @returns - A Promise that resolves to the generated response from the GPT model.
     */
    askGptOnPageFragment(prompt: string, locator: string): Promise<string>;
    /**
     * Send a general request to ChatGPT and return response.
     * @returns - A Promise that resolves to the generated response from the GPT model.
     */
    askGptGeneralPrompt(prompt: string): Promise<string>;
  }
  /**
   * ## Configuration
   *
   * This helper should be configured in testmait.conf.(js|ts)
   * @property [url] - base url of website to be tested
   * @property [browser = 'chromium'] - a browser to test on, either: `chromium`, `firefox`, `webkit`, `electron`. Default: chromium.
   * @property [show = true] - show browser window.
   * @property [restart = false] - restart strategy between tests. Possible values:
   *   * 'context' or **false** - restarts [browser context](https://playwright.dev/docs/api/class-browsercontext) but keeps running browser. Recommended by Playwright team to keep tests isolated.
   *   * 'browser' or **true** - closes browser and opens it again between tests.
   *   * 'session' or 'keep' - keeps browser context and session, but cleans up cookies and localStorage between tests. The fastest option when running tests in windowed mode. Works with `keepCookies` and `keepBrowserState` options. This behavior was default before TestMaiT 3.1
   * @property [timeout = 1000] - -  [timeout](https://playwright.dev/docs/api/class-page#page-set-default-timeout) in ms of all Playwright actions .
   * @property [disableScreenshots = false] - don't save screenshot on failure.
   * @property [emulate] - browser in device emulation mode.
   * @property [video = false] - enables video recording for failed tests; videos are saved into `output/videos` folder
   * @property [keepVideoForPassedTests = false] - save videos for passed tests; videos are saved into `output/videos` folder
   * @property [trace = false] - record [tracing information](https://playwright.dev/docs/trace-viewer) with screenshots and snapshots.
   * @property [keepTraceForPassedTests = false] - save trace for passed tests.
   * @property [fullPageScreenshots = false] - make full page screenshots on failure.
   * @property [uniqueScreenshotNames = false] - option to prevent screenshot override if you have scenarios with the same name in different suites.
   * @property [keepBrowserState = false] - keep browser state between tests when `restart` is set to 'session'.
   * @property [keepCookies = false] - keep cookies between tests when `restart` is set to 'session'.
   * @property [waitForAction] - how long to wait after click, doubleClick or PressKey actions in ms. Default: 100.
   * @property [waitForNavigation] - When to consider navigation succeeded. Possible options: `load`, `domcontentloaded`, `commit`. Choose one of those options is possible. See [Playwright API](https://playwright.dev/docs/api/class-page#page-wait-for-url).
   * @property [pressKeyDelay = 10] - Delay between key presses in ms. Used when calling Playwrights page.type(...) in fillField/appendField
   * @property [getPageTimeout] - config option to set maximum navigation time in milliseconds.
   * @property [waitForTimeout] - default wait* timeout in ms. Default: 1000.
   * @property [basicAuth] - the basic authentication to pass to base url. Example: {username: 'username', password: 'password'}
   * @property [windowSize] - default window size. Set a dimension like `640x480`.
   * @property [colorScheme] - default color scheme. Possible values: `dark` | `light` | `no-preference`.
   * @property [userAgent] - user-agent string.
   * @property [locale] - locale string. Example: 'en-GB', 'de-DE', 'fr-FR', ...
   * @property [manualStart] - do not start browser before a test, start it manually inside a helper with `this.helpers["Playwright"]._startBrowser()`.
   * @property [chromium] - pass additional chromium options
   * @property [firefox] - pass additional firefox options
   * @property [electron] - (pass additional electron options
   * @property [channel] - (While Playwright can operate against the stock Google Chrome and Microsoft Edge browsers available on the machine. In particular, current Playwright version will support Stable and Beta channels of these browsers. See [Google Chrome & Microsoft Edge](https://playwright.dev/docs/browsers/#google-chrome--microsoft-edge).
   * @property [ignoreLog] - An array with console message types that are not logged to debug log. Default value is `['warning', 'log']`. E.g. you can set `[]` to log all messages. See all possible [values](https://playwright.dev/docs/api/class-consolemessage#console-message-type).
   * @property [ignoreHTTPSErrors] - Allows access to untrustworthy pages, e.g. to a page with an expired certificate. Default value is `false`
   * @property [bypassCSP] - bypass Content Security Policy or CSP
   * @property [highlightElement] - highlight the interacting elements. Default: false. Note: only activate under verbose mode (--verbose).
   */
  type PlaywrightConfig = {
    url?: string;
    browser?: 'chromium' | 'firefox' | 'webkit' | 'electron';
    show?: boolean;
    restart?: string | boolean;
    timeout?: number;
    disableScreenshots?: boolean;
    emulate?: any;
    video?: boolean;
    keepVideoForPassedTests?: boolean;
    trace?: boolean;
    keepTraceForPassedTests?: boolean;
    fullPageScreenshots?: boolean;
    uniqueScreenshotNames?: boolean;
    keepBrowserState?: boolean;
    keepCookies?: boolean;
    waitForAction?: number;
    waitForNavigation?: 'load' | 'domcontentloaded' | 'commit';
    pressKeyDelay?: number;
    getPageTimeout?: number;
    waitForTimeout?: number;
    basicAuth?: any;
    windowSize?: string;
    colorScheme?: 'dark' | 'light' | 'no-preference';
    userAgent?: string;
    locale?: string;
    manualStart?: boolean;
    chromium?: any;
    firefox?: any;
    electron?: any;
    channel?: any;
    ignoreLog?: string[];
    ignoreHTTPSErrors?: boolean;
    bypassCSP?: boolean;
    highlightElement?: boolean;
  };
  /**
   * Uses [Playwright](https://github.com/microsoft/playwright) library to run tests inside:
   *
   * * Chromium
   * * Firefox
   * * Webkit (Safari)
   *
   * This helper works with a browser out of the box with no additional tools required to install.
   *
   * Requires `playwright` or `playwright-core` package version ^1 to be installed:
   *
   * ```
   * npm i playwright@^1.18 --save
   * ```
   * or
   * ```
   * npm i playwright-core@^1.18 --save
   * ```
   *
   * Breaking Changes: if you use Playwright v1.38 and later, it will no longer download browsers automatically.
   *
   * Run `npx playwright install` to download browsers after `npm install`.
   *
   * Using playwright-core package, will prevent the download of browser binaries and allow connecting to an existing browser installation or for connecting to a remote one.
   *
   *
   * <!-- configuration -->
   *
   * #### Video Recording Customization
   *
   * By default, video is saved to `output/video` dir. You can customize this path by passing `dir` option to `recordVideo` option.
   *
   * `video`: enables video recording for failed tests; videos are saved into `output/videos` folder
   * * `keepVideoForPassedTests`: - save videos for passed tests
   * * `recordVideo`: [additional options for videos customization](https://playwright.dev/docs/next/api/class-browser#browser-new-context)
   *
   * #### Trace Recording Customization
   *
   * Trace recording provides complete information on test execution and includes DOM snapshots, screenshots, and network requests logged during run.
   * Traces will be saved to `output/trace`
   *
   * * `trace`: enables trace recording for failed tests; trace are saved into `output/trace` folder
   * * `keepTraceForPassedTests`: - save trace for passed tests
   *
   * #### Example #1: Wait for 0 network connections.
   *
   * ```js
   * {
   *    helpers: {
   *      Playwright : {
   *        url: "http://localhost",
   *        restart: false,
   *        waitForNavigation: "networkidle0",
   *        waitForAction: 500
   *      }
   *    }
   * }
   * ```
   *
   * #### Example #2: Wait for DOMContentLoaded event
   *
   * ```js
   * {
   *    helpers: {
   *      Playwright : {
   *        url: "http://localhost",
   *        restart: false,
   *        waitForNavigation: "domcontentloaded",
   *        waitForAction: 500
   *      }
   *    }
   * }
   * ```
   *
   * #### Example #3: Debug in window mode
   *
   * ```js
   * {
   *    helpers: {
   *      Playwright : {
   *        url: "http://localhost",
   *        show: true
   *      }
   *    }
   * }
   * ```
   *
   * #### Example #4: Connect to remote browser by specifying [websocket endpoint](https://playwright.dev/docs/api/class-browsertype#browsertypeconnectparams)
   *
   * ```js
   * {
   *    helpers: {
   *      Playwright: {
   *        url: "http://localhost",
   *        chromium: {
   *          browserWSEndpoint: 'ws://localhost:9222/devtools/browser/c5aa6160-b5bc-4d53-bb49-6ecb36cd2e0a',
   *          cdpConnection: false // default is false
   *        }
   *      }
   *    }
   * }
   * ```
   *
   * #### Example #5: Testing with Chromium extensions
   *
   * [official docs](https://github.com/microsoft/playwright/blob/v0.11.0/docs/api.md#working-with-chrome-extensions)
   *
   * ```js
   * {
   *  helpers: {
   *    Playwright: {
   *      url: "http://localhost",
   *      show: true // headless mode not supported for extensions
   *      chromium: {
   *        // Note: due to this would launch persistent context, so to avoid the error when running tests with run-workers a timestamp would be appended to the defined folder name. For instance: playwright-tmp_1692715649511
   *        userDataDir: '/tmp/playwright-tmp', // necessary to launch the browser in normal mode instead of incognito,
   *        args: [
   *           `--disable-extensions-except=${pathToExtension}`,
   *           `--load-extension=${pathToExtension}`
   *        ]
   *      }
   *    }
   *  }
   * }
   * ```
   *
   * #### Example #6: Launch tests emulating iPhone 6
   *
   *
   *
   * ```js
   * const { devices } = require('playwright');
   *
   * {
   *  helpers: {
   *    Playwright: {
   *      url: "http://localhost",
   *      emulate: devices['iPhone 6'],
   *    }
   *  }
   * }
   * ```
   *
   * #### Example #7: Launch test with a specific user locale
   *
   * ```js
   * {
   *  helpers: {
   *   Playwright : {
   *     url: "http://localhost",
   *     locale: "fr-FR",
   *   }
   *  }
   * }
   * ```
   *
   * * #### Example #8: Launch test with a specific color scheme
   *
   * ```js
   * {
   *  helpers: {
   *   Playwright : {
   *     url: "http://localhost",
   *     colorScheme: "dark",
   *   }
   *  }
   * }
   * ```
   *
   * * #### Example #9: Launch electron test
   *
   * ```js
   * {
   *  helpers: {
   *     Playwright: {
   *       browser: 'electron',
   *       electron: {
   *         executablePath: require("electron"),
   *         args: [path.join('../', "main.js")],
   *       },
   *     }
   *   },
   * }
   * ```
   *
   * Note: When connecting to remote browser `show` and specific `chrome` options (e.g. `headless` or `devtools`) are ignored.
   *
   * ## Access From Helpers
   *
   * Receive Playwright client from a custom helper by accessing `browser` for the Browser object or `page` for the current Page object:
   *
   * ```js
   * const { browser } = this.helpers.Playwright;
   * await browser.pages(); // List of pages in the browser
   *
   * // get current page
   * const { page } = this.helpers.Playwright;
   * await page.url(); // Get the url of the current page
   *
   * const { browserContext } = this.helpers.Playwright;
   * await browserContext.cookies(); // get current browser context
   * ```
   */
  class Playwright {
    /**
     * Use Playwright API inside a test.
     *
     * First argument is a description of an action.
     * Second argument is async function that gets this helper as parameter.
     *
     * { [`page`](https://github.com/microsoft/playwright/blob/main/docs/src/api/class-page.md), [`browserContext`](https://github.com/microsoft/playwright/blob/main/docs/src/api/class-browsercontext.md) [`browser`](https://github.com/microsoft/playwright/blob/main/docs/src/api/class-browser.md) } objects from Playwright API are available.
     *
     * ```js
     * I.usePlaywrightTo('emulate offline mode', async ({ browserContext }) => {
     *   await browserContext.setOffline(true);
     * });
     * ```
     * @param description - used to show in logs.
     * @param fn - async function that executed with Playwright helper as argumen
     */
    usePlaywrightTo(description: string, fn: (...params: any[]) => any): void;
    /**
     * Set the automatic popup response to Accept.
     * This must be set before a popup is triggered.
     *
     * ```js
     * I.amAcceptingPopups();
     * I.click('#triggerPopup');
     * I.acceptPopup();
     * ```
     */
    amAcceptingPopups(): void;
    /**
     * Accepts the active JavaScript native popup window, as created by window.alert|window.confirm|window.prompt.
     * Don't confuse popups with modal windows, as created by [various
     * libraries](http://jster.net/category/windows-modals-popups).
     */
    acceptPopup(): void;
    /**
     * Set the automatic popup response to Cancel/Dismiss.
     * This must be set before a popup is triggered.
     *
     * ```js
     * I.amCancellingPopups();
     * I.click('#triggerPopup');
     * I.cancelPopup();
     * ```
     */
    amCancellingPopups(): void;
    /**
     * Dismisses the active JavaScript popup, as created by window.alert|window.confirm|window.prompt.
     */
    cancelPopup(): void;
    /**
     * Checks that the active JavaScript popup, as created by `window.alert|window.confirm|window.prompt`, contains the
     * given string.
     *
     * ```js
     * I.seeInPopup('Popup text');
     * ```
     * @param text - value to check.
     * @returns automatically synchronized promise through #recorder
     */
    seeInPopup(text: string): Promise<void>;
    /**
     * Set current page
     * @param page - page to set
     */
    _setPage(page: any): void;
    /**
     * Add the 'dialog' event listener to a page
     */
    _addPopupListener(): void;
    /**
     * Gets page URL including hash.
     */
    _getPageUrl(): void;
    /**
     * Grab the text within the popup. If no popup is visible then it will return null
     *
     * ```js
     * await I.grabPopupText();
     * ```
     */
    grabPopupText(): Promise<string | null>;
    /**
     * Create a new browser context with a page. \
     * Usually it should be run from a custom helper after call of `_startBrowser()`
     * @param [contextOptions] - See https://playwright.dev/docs/api/class-browser#browser-new-context
     */
    _createContextPage(contextOptions?: any): void;
    /**
     * Opens a web page in a browser. Requires relative or absolute url.
     * If url starts with `/`, opens a web page of a site defined in `url` config parameter.
     *
     * ```js
     * I.amOnPage('/'); // opens main page of website
     * I.amOnPage('https://github.com'); // opens github
     * I.amOnPage('/login'); // opens a login page
     * ```
     * @param url - url path or global url.
     * @returns automatically synchronized promise through #recorder
     */
    amOnPage(url: string): Promise<void>;
    /**
     * Resize the current window to provided width and height.
     * First parameter can be set to `maximize`.
     * @param width - width in pixels or `maximize`.
     * @param height - height in pixels.
     * @returns automatically synchronized promise through #recorder
     *
     *
     * Unlike other drivers Playwright changes the size of a viewport, not the window!
     * Playwright does not control the window of a browser so it can't adjust its real size.
     * It also can't maximize a window.
     *
     * Update configuration to change real window size on start:
     *
     * ```js
     * // inside testmait.conf.js
     * // @testmait/configure package must be installed
     * { setWindowSize } = require('@testmait/configure');
     * ````
     */
    resizeWindow(width: number, height: number): Promise<void>;
    /**
     * Set headers for all next requests
     *
     * ```js
     * I.setPlaywrightRequestHeaders({
     *    'X-Sent-By': 'TestMaiT',
     * });
     * ```
     * @param customHeaders - headers to set
     */
    setPlaywrightRequestHeaders(customHeaders: any): void;
    /**
     * Moves cursor to element matched by locator.
     * Extra shift can be set with offsetX and offsetY options.
     *
     * ```js
     * I.moveCursorTo('.tooltip');
     * I.moveCursorTo('#submit', 5,5);
     * ```
     * @param locator - located by CSS|XPath|strict locator.
     * @param [offsetX = 0] - (optional, `0` by default) X-axis offset.
     * @param [offsetY = 0] - (optional, `0` by default) Y-axis offset.
     * @returns automatically synchronized promise through #recorder
     */
    moveCursorTo(
      locator: TestMaiT.LocatorOrString,
      offsetX?: number,
      offsetY?: number,
    ): Promise<void>;
    /**
     * Calls [focus](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/focus) on the matching element.
     *
     * Examples:
     *
     * ```js
     * I.dontSee('#add-to-cart-btn');
     * I.focus('#product-tile')
     * I.see('#add-to-cart-bnt');
     * ```
     * @param locator - field located by label|name|CSS|XPath|strict locator.
     * @param [options] - Playwright only: [Additional options](https://playwright.dev/docs/api/class-locator#locator-focus) for available options object as 2nd argument.
     * @returns automatically synchronized promise through #recorder
     */
    focus(locator: TestMaiT.LocatorOrString, options?: any): Promise<void>;
    /**
     * Remove focus from a text input, button, etc.
     * Calls [blur](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/focus) on the element.
     *
     * Examples:
     *
     * ```js
     * I.blur('.text-area')
     * ```
     * ```js
     * //element `#product-tile` is focused
     * I.see('#add-to-cart-btn');
     * I.blur('#product-tile')
     * I.dontSee('#add-to-cart-btn');
     * ```
     * @param locator - field located by label|name|CSS|XPath|strict locator.
     * @param [options] - Playwright only: [Additional options](https://playwright.dev/docs/api/class-locator#locator-blur) for available options object as 2nd argument.
     * @returns automatically synchronized promise through #recorder
     */
    blur(locator: TestMaiT.LocatorOrString, options?: any): Promise<void>;
    /**
     * Return the checked status of given element.
     * @param locator - element located by CSS|XPath|strict locator.
     * @param [options] - See https://playwright.dev/docs/api/class-locator#locator-is-checked
     */
    grabCheckedElementStatus(locator: TestMaiT.LocatorOrString, options?: any): Promise<boolean>;
    /**
     * Return the disabled status of given element.
     * @param locator - element located by CSS|XPath|strict locator.
     * @param [options] - See https://playwright.dev/docs/api/class-locator#locator-is-disabled
     */
    grabDisabledElementStatus(locator: TestMaiT.LocatorOrString, options?: any): Promise<boolean>;
    /**
     * Drag an item to a destination element.
     *
     * ```js
     * I.dragAndDrop('#dragHandle', '#container');
     * ```
     * @param srcElement - located by CSS|XPath|strict locator.
     * @param destElement - located by CSS|XPath|strict locator.
     * @param [options] - [Additional options](https://playwright.dev/docs/api/class-page#page-drag-and-drop) can be passed as 3rd argument.
     *
     * ```js
     * // specify coordinates for source position
     * I.dragAndDrop('img.src', 'img.dst', { sourcePosition: {x: 10, y: 10} })
     * ```
     *
     * > When no option is set, custom drag and drop would be used, to use the dragAndDrop API from Playwright, please set options, for example `force: true`
     * @returns automatically synchronized promise through #recorder
     */
    dragAndDrop(
      srcElement: LocatorOrString,
      destElement: LocatorOrString,
      options?: any,
    ): Promise<void>;
    /**
     * Restart browser with a new context and a new page
     *
     * ```js
     * // Restart browser and use a new timezone
     * I.restartBrowser({ timezoneId: 'America/Phoenix' });
     * // Open URL in a new page in changed timezone
     * I.amOnPage('/');
     * // Restart browser, allow reading/copying of text from/into clipboard in Chrome
     * I.restartBrowser({ permissions: ['clipboard-read', 'clipboard-write'] });
     * ```
     * @param [contextOptions] - [Options for browser context](https://playwright.dev/docs/api/class-browser#browser-new-context) when starting new browser
     */
    restartBrowser(contextOptions?: any): void;
    /**
     * Reload the current page.
     *
     * ```js
     * I.refreshPage();
     * ```
     * @returns automatically synchronized promise through #recorder
     */
    refreshPage(): Promise<void>;
    /**
     * Scroll page to the top.
     *
     * ```js
     * I.scrollPageToTop();
     * ```
     * @returns automatically synchronized promise through #recorder
     */
    scrollPageToTop(): Promise<void>;
    /**
     * Scroll page to the bottom.
     *
     * ```js
     * I.scrollPageToBottom();
     * ```
     * @returns automatically synchronized promise through #recorder
     */
    scrollPageToBottom(): Promise<void>;
    /**
     * Scrolls to element matched by locator.
     * Extra shift can be set with offsetX and offsetY options.
     *
     * ```js
     * I.scrollTo('footer');
     * I.scrollTo('#submit', 5, 5);
     * ```
     * @param locator - located by CSS|XPath|strict locator.
     * @param [offsetX = 0] - (optional, `0` by default) X-axis offset.
     * @param [offsetY = 0] - (optional, `0` by default) Y-axis offset.
     * @returns automatically synchronized promise through #recorder
     */
    scrollTo(locator: TestMaiT.LocatorOrString, offsetX?: number, offsetY?: number): Promise<void>;
    /**
     * Checks that title contains text.
     *
     * ```js
     * I.seeInTitle('Home Page');
     * ```
     * @param text - text value to check.
     * @returns automatically synchronized promise through #recorder
     */
    seeInTitle(text: string): Promise<void>;
    /**
     * Retrieves a page scroll position and returns it to test.
     * Resumes test execution, so **should be used inside an async function with `await`** operator.
     *
     * ```js
     * let { x, y } = await I.grabPageScrollPosition();
     * ```
     * @returns scroll position
     */
    grabPageScrollPosition(): Promise<PageScrollPosition>;
    /**
     * Checks that title is equal to provided one.
     *
     * ```js
     * I.seeTitleEquals('Test title.');
     * ```
     * @param text - value to check.
     * @returns automatically synchronized promise through #recorder
     */
    seeTitleEquals(text: string): Promise<void>;
    /**
     * Checks that title does not contain text.
     *
     * ```js
     * I.dontSeeInTitle('Error');
     * ```
     * @param text - value to check.
     * @returns automatically synchronized promise through #recorder
     */
    dontSeeInTitle(text: string): Promise<void>;
    /**
     * Retrieves a page title and returns it to test.
     * Resumes test execution, so **should be used inside async with `await`** operator.
     *
     * ```js
     * let title = await I.grabTitle();
     * ```
     * @returns title
     */
    grabTitle(): Promise<string>;
    /**
     * Get elements by different locator types, including strict locator
     * Should be used in custom helpers:
     *
     * ```js
     * const elements = await this.helpers['Playwright']._locate({name: 'password'});
     * ```
     */
    _locate(): void;
    /**
     * Get the first element by different locator types, including strict locator
     * Should be used in custom helpers:
     *
     * ```js
     * const element = await this.helpers['Playwright']._locateElement({name: 'password'});
     * ```
     */
    _locateElement(): void;
    /**
     * Find a checkbox by providing human-readable text:
     * NOTE: Assumes the checkable element exists
     *
     * ```js
     * this.helpers['Playwright']._locateCheckable('I agree with terms and conditions').then // ...
     * ```
     */
    _locateCheckable(): void;
    /**
     * Find a clickable element by providing human-readable text:
     *
     * ```js
     * this.helpers['Playwright']._locateClickable('Next page').then // ...
     * ```
     */
    _locateClickable(): void;
    /**
     * Find field elements by providing human-readable text:
     *
     * ```js
     * this.helpers['Playwright']._locateFields('Your email').then // ...
     * ```
     */
    _locateFields(): void;
    /**
     * Switch focus to a particular tab by its number. It waits tabs loading and then switch tab
     *
     * ```js
     * I.switchToNextTab();
     * I.switchToNextTab(2);
     * ```
     */
    switchToNextTab(num?: number): void;
    /**
     * Switch focus to a particular tab by its number. It waits tabs loading and then switch tab
     *
     * ```js
     * I.switchToPreviousTab();
     * I.switchToPreviousTab(2);
     * ```
     */
    switchToPreviousTab(num?: number): void;
    /**
     * Close current tab and switches to previous.
     *
     * ```js
     * I.closeCurrentTab();
     * ```
     */
    closeCurrentTab(): void;
    /**
     * Close all tabs except for the current one.
     *
     * ```js
     * I.closeOtherTabs();
     * ```
     */
    closeOtherTabs(): void;
    /**
     * Open new tab and automatically switched to new tab
     *
     * ```js
     * I.openNewTab();
     * ```
     *
     * You can pass in [page options](https://github.com/microsoft/playwright/blob/main/docs/api.md#browsernewpageoptions) to emulate device on this page
     *
     * ```js
     * // enable mobile
     * I.openNewTab({ isMobile: true });
     * ```
     */
    openNewTab(): void;
    /**
     * Grab number of open tabs.
     * Resumes test execution, so **should be used inside async function with `await`** operator.
     *
     * ```js
     * let tabs = await I.grabNumberOfOpenTabs();
     * ```
     * @returns number of open tabs
     */
    grabNumberOfOpenTabs(): Promise<number>;
    /**
     * Checks that a given Element is visible
     * Element is located by CSS or XPath.
     *
     * ```js
     * I.seeElement('#modal');
     * ```
     * @param locator - located by CSS|XPath|strict locator.
     * @returns automatically synchronized promise through #recorder
     */
    seeElement(locator: TestMaiT.LocatorOrString): Promise<void>;
    /**
     * Opposite to `seeElement`. Checks that element is not visible (or in DOM)
     *
     * ```js
     * I.dontSeeElement('.modal'); // modal is not shown
     * ```
     * @param locator - located by CSS|XPath|Strict locator.
     * @returns automatically synchronized promise through #recorder
     */
    dontSeeElement(locator: TestMaiT.LocatorOrString): Promise<void>;
    /**
     * Checks that a given Element is present in the DOM
     * Element is located by CSS or XPath.
     *
     * ```js
     * I.seeElementInDOM('#modal');
     * ```
     * @param locator - element located by CSS|XPath|strict locator.
     * @returns automatically synchronized promise through #recorder
     */
    seeElementInDOM(locator: TestMaiT.LocatorOrString): Promise<void>;
    /**
     * Opposite to `seeElementInDOM`. Checks that element is not on page.
     *
     * ```js
     * I.dontSeeElementInDOM('.nav'); // checks that element is not on page visible or not
     * ```
     * @param locator - located by CSS|XPath|Strict locator.
     * @returns automatically synchronized promise through #recorder
     */
    dontSeeElementInDOM(locator: TestMaiT.LocatorOrString): Promise<void>;
    /**
     * Handles a file download. A file name is required to save the file on disk.
     * Files are saved to "output" directory.
     *
     * Should be used with [FileSystem helper](https://testmait.io/helpers/FileSystem) to check that file were downloaded correctly.
     *
     * ```js
     * I.handleDownloads('downloads/avatar.jpg');
     * I.click('Download Avatar');
     * I.amInPath('output/downloads');
     * I.waitForFile('avatar.jpg', 5);
     *
     * ```
     * @param fileName - set filename for downloaded file
     */
    handleDownloads(fileName: string): Promise<void>;
    /**
     * Perform a click on a link or a button, given by a locator.
     * If a fuzzy locator is given, the page will be searched for a button, link, or image matching the locator string.
     * For buttons, the "value" attribute, "name" attribute, and inner text are searched. For links, the link text is searched.
     * For images, the "alt" attribute and inner text of any parent links are searched.
     *
     * The second parameter is a context (CSS or XPath locator) to narrow the search.
     *
     * ```js
     * // simple link
     * I.click('Logout');
     * // button of form
     * I.click('Submit');
     * // CSS button
     * I.click('#form input[type=submit]');
     * // XPath
     * I.click('//form/*[@type=submit]');
     * // link in context
     * I.click('Logout', '#nav');
     * // using strict locator
     * I.click({css: 'nav a.login'});
     * ```
     * @param locator - clickable link or button located by text, or any element located by CSS|XPath|strict locator.
     * @param [context = null] - (optional, `null` by default) element to search in CSS|XPath|Strict locator.
     * @param [options] - [Additional options](https://playwright.dev/docs/api/class-page#page-click) for click available as 3rd argument.
     *
     * Examples:
     *
     * ```js
     * // click on element at position
     * I.click('canvas', '.model', { position: { x: 20, y: 40 } })
     *
     * // make ctrl-click
     * I.click('.edit', null, { modifiers: ['Ctrl'] } )
     * ```
     * @returns automatically synchronized promise through #recorder
     */
    click(
      locator: TestMaiT.LocatorOrString,
      context?: TestMaiT.LocatorOrString | null,
      options?: any,
    ): Promise<void>;
    /**
     * Clicks link and waits for navigation (deprecated)
     */
    clickLink(): void;
    /**
     * Perform an emulated click on a link or a button, given by a locator.
     * Unlike normal click instead of sending native event, emulates a click with JavaScript.
     * This works on hidden, animated or inactive elements as well.
     *
     * If a fuzzy locator is given, the page will be searched for a button, link, or image matching the locator string.
     * For buttons, the "value" attribute, "name" attribute, and inner text are searched. For links, the link text is searched.
     * For images, the "alt" attribute and inner text of any parent links are searched.
     *
     * The second parameter is a context (CSS or XPath locator) to narrow the search.
     *
     * ```js
     * // simple link
     * I.forceClick('Logout');
     * // button of form
     * I.forceClick('Submit');
     * // CSS button
     * I.forceClick('#form input[type=submit]');
     * // XPath
     * I.forceClick('//form/*[@type=submit]');
     * // link in context
     * I.forceClick('Logout', '#nav');
     * // using strict locator
     * I.forceClick({css: 'nav a.login'});
     * ```
     * @param locator - clickable link or button located by text, or any element located by CSS|XPath|strict locator.
     * @param [context = null] - (optional, `null` by default) element to search in CSS|XPath|Strict locator.
     * @returns automatically synchronized promise through #recorder
     */
    forceClick(
      locator: TestMaiT.LocatorOrString,
      context?: TestMaiT.LocatorOrString,
    ): Promise<void>;
    /**
     * Performs a double-click on an element matched by link|button|label|CSS or XPath.
     * Context can be specified as second parameter to narrow search.
     *
     * ```js
     * I.doubleClick('Edit');
     * I.doubleClick('Edit', '.actions');
     * I.doubleClick({css: 'button.accept'});
     * I.doubleClick('.btn.edit');
     * ```
     * @param locator - clickable link or button located by text, or any element located by CSS|XPath|strict locator.
     * @param [context = null] - (optional, `null` by default) element to search in CSS|XPath|Strict locator.
     * @returns automatically synchronized promise through #recorder
     */
    doubleClick(
      locator: TestMaiT.LocatorOrString,
      context?: TestMaiT.LocatorOrString,
    ): Promise<void>;
    /**
     * Performs right click on a clickable element matched by semantic locator, CSS or XPath.
     *
     * ```js
     * // right click element with id el
     * I.rightClick('#el');
     * // right click link or button with text "Click me"
     * I.rightClick('Click me');
     * // right click button with text "Click me" inside .context
     * I.rightClick('Click me', '.context');
     * ```
     * @param locator - clickable element located by CSS|XPath|strict locator.
     * @param [context = null] - (optional, `null` by default) element located by CSS|XPath|strict locator.
     * @returns automatically synchronized promise through #recorder
     */
    rightClick(
      locator: TestMaiT.LocatorOrString,
      context?: TestMaiT.LocatorOrString,
    ): Promise<void>;
    /**
     * Selects a checkbox or radio button.
     * Element is located by label or name or CSS or XPath.
     *
     * The second parameter is a context (CSS or XPath locator) to narrow the search.
     *
     * ```js
     * I.checkOption('#agree');
     * I.checkOption('I Agree to Terms and Conditions');
     * I.checkOption('agree', '//form');
     * ```
     * @param field - checkbox located by label | name | CSS | XPath | strict locator.
     * @param [context = null] - (optional, `null` by default) element located by CSS | XPath | strict locator.
     * @returns automatically synchronized promise through #recorder
     *
     *
     * [Additional options](https://playwright.dev/docs/api/class-elementhandle#element-handle-check) for check available as 3rd argument.
     *
     * Examples:
     *
     * ```js
     * // click on element at position
     * I.checkOption('Agree', '.signup', { position: { x: 5, y: 5 } })
     * ```
     * > ⚠️ To avoid flakiness, option `force: true` is set by default
     */
    checkOption(field: TestMaiT.LocatorOrString, context?: TestMaiT.LocatorOrString): Promise<void>;
    /**
     * Unselects a checkbox or radio button.
     * Element is located by label or name or CSS or XPath.
     *
     * The second parameter is a context (CSS or XPath locator) to narrow the search.
     *
     * ```js
     * I.uncheckOption('#agree');
     * I.uncheckOption('I Agree to Terms and Conditions');
     * I.uncheckOption('agree', '//form');
     * ```
     * @param field - checkbox located by label | name | CSS | XPath | strict locator.
     * @param [context = null] - (optional, `null` by default) element located by CSS | XPath | strict locator.
     * @returns automatically synchronized promise through #recorder
     *
     *
     * [Additional options](https://playwright.dev/docs/api/class-elementhandle#element-handle-uncheck) for uncheck available as 3rd argument.
     *
     * Examples:
     *
     * ```js
     * // click on element at position
     * I.uncheckOption('Agree', '.signup', { position: { x: 5, y: 5 } })
     * ```
     * > ⚠️ To avoid flakiness, option `force: true` is set by default
     */
    uncheckOption(
      field: TestMaiT.LocatorOrString,
      context?: TestMaiT.LocatorOrString,
    ): Promise<void>;
    /**
     * Verifies that the specified checkbox is checked.
     *
     * ```js
     * I.seeCheckboxIsChecked('Agree');
     * I.seeCheckboxIsChecked('#agree'); // I suppose user agreed to terms
     * I.seeCheckboxIsChecked({css: '#signup_form input[type=checkbox]'});
     * ```
     * @param field - located by label|name|CSS|XPath|strict locator.
     * @returns automatically synchronized promise through #recorder
     */
    seeCheckboxIsChecked(field: TestMaiT.LocatorOrString): Promise<void>;
    /**
     * Verifies that the specified checkbox is not checked.
     *
     * ```js
     * I.dontSeeCheckboxIsChecked('#agree'); // located by ID
     * I.dontSeeCheckboxIsChecked('I agree to terms'); // located by label
     * I.dontSeeCheckboxIsChecked('agree'); // located by name
     * ```
     * @param field - located by label|name|CSS|XPath|strict locator.
     * @returns automatically synchronized promise through #recorder
     */
    dontSeeCheckboxIsChecked(field: TestMaiT.LocatorOrString): Promise<void>;
    /**
     * Presses a key in the browser and leaves it in a down state.
     *
     * To make combinations with modifier key and user operation (e.g. `'Control'` + [`click`](#click)).
     *
     * ```js
     * I.pressKeyDown('Control');
     * I.click('#element');
     * I.pressKeyUp('Control');
     * ```
     * @param key - name of key to press down.
     * @returns automatically synchronized promise through #recorder
     */
    pressKeyDown(key: string): Promise<void>;
    /**
     * Releases a key in the browser which was previously set to a down state.
     *
     * To make combinations with modifier key and user operation (e.g. `'Control'` + [`click`](#click)).
     *
     * ```js
     * I.pressKeyDown('Control');
     * I.click('#element');
     * I.pressKeyUp('Control');
     * ```
     * @param key - name of key to release.
     * @returns automatically synchronized promise through #recorder
     */
    pressKeyUp(key: string): Promise<void>;
    /**
     * Presses a key in the browser (on a focused element).
     *
     * _Hint:_ For populating text field or textarea, it is recommended to use [`fillField`](#fillfield).
     *
     * ```js
     * I.pressKey('Backspace');
     * ```
     *
     * To press a key in combination with modifier keys, pass the sequence as an array. All modifier keys (`'Alt'`, `'Control'`, `'Meta'`, `'Shift'`) will be released afterwards.
     *
     * ```js
     * I.pressKey(['Control', 'Z']);
     * ```
     *
     * For specifying operation modifier key based on operating system it is suggested to use `'CommandOrControl'`.
     * This will press `'Command'` (also known as `'Meta'`) on macOS machines and `'Control'` on non-macOS machines.
     *
     * ```js
     * I.pressKey(['CommandOrControl', 'Z']);
     * ```
     *
     * Some of the supported key names are:
     * - `'AltLeft'` or `'Alt'`
     * - `'AltRight'`
     * - `'ArrowDown'`
     * - `'ArrowLeft'`
     * - `'ArrowRight'`
     * - `'ArrowUp'`
     * - `'Backspace'`
     * - `'Clear'`
     * - `'ControlLeft'` or `'Control'`
     * - `'ControlRight'`
     * - `'Command'`
     * - `'CommandOrControl'`
     * - `'Delete'`
     * - `'End'`
     * - `'Enter'`
     * - `'Escape'`
     * - `'F1'` to `'F12'`
     * - `'Home'`
     * - `'Insert'`
     * - `'MetaLeft'` or `'Meta'`
     * - `'MetaRight'`
     * - `'Numpad0'` to `'Numpad9'`
     * - `'NumpadAdd'`
     * - `'NumpadDecimal'`
     * - `'NumpadDivide'`
     * - `'NumpadMultiply'`
     * - `'NumpadSubtract'`
     * - `'PageDown'`
     * - `'PageUp'`
     * - `'Pause'`
     * - `'Return'`
     * - `'ShiftLeft'` or `'Shift'`
     * - `'ShiftRight'`
     * - `'Space'`
     * - `'Tab'`
     * @param key - key or array of keys to press.
     * @returns automatically synchronized promise through #recorder
     *
     *
     * _Note:_ Shortcuts like `'Meta'` + `'A'` do not work on macOS ([GoogleChrome/Puppeteer#1313](https://github.com/GoogleChrome/puppeteer/issues/1313)).
     */
    pressKey(key: string | string[]): Promise<void>;
    /**
     * Types out the given text into an active field.
     * To slow down typing use a second parameter, to set interval between key presses.
     * _Note:_ Should be used when [`fillField`](#fillfield) is not an option.
     *
     * ```js
     * // passing in a string
     * I.type('Type this out.');
     *
     * // typing values with a 100ms interval
     * I.type('4141555311111111', 100);
     *
     * // passing in an array
     * I.type(['T', 'E', 'X', 'T']);
     *
     * // passing a secret
     * I.type(secret('123456'));
     * ```
     * @param key - or array of keys to type.
     * @param [delay = null] - (optional) delay in ms between key presses
     * @returns automatically synchronized promise through #recorder
     */
    type(key: string | string[], delay?: number): Promise<void>;
    /**
     * Fills a text field or textarea, after clearing its value, with the given string.
     * Field is located by name, label, CSS, or XPath.
     *
     * ```js
     * // by label
     * I.fillField('Email', 'hello@world.com');
     * // by name
     * I.fillField('password', secret('123456'));
     * // by CSS
     * I.fillField('form#login input[name=username]', 'John');
     * // or by strict locator
     * I.fillField({css: 'form#login input[name=username]'}, 'John');
     * ```
     * @param field - located by label|name|CSS|XPath|strict locator.
     * @param value - text value to fill.
     * @returns automatically synchronized promise through #recorder
     */
    fillField(field: TestMaiT.LocatorOrString, value: TestMaiT.StringOrSecret): Promise<void>;
    /**
     * Clears the text input element: `<input>`, `<textarea>` or `[contenteditable]` .
     *
     *
     * Examples:
     *
     * ```js
     * I.clearField('.text-area')
     *
     * // if this doesn't work use force option
     * I.clearField('#submit', { force: true })
     * ```
     * Use `force` to bypass the [actionability](https://playwright.dev/docs/actionability) checks.
     * @param locator - field located by label|name|CSS|XPath|strict locator.
     * @param [options] - [Additional options](https://playwright.dev/docs/api/class-locator#locator-clear) for available options object as 2nd argument.
     */
    clearField(locator: TestMaiT.LocatorOrString, options?: any): void;
    /**
     * Appends text to a input field or textarea.
     * Field is located by name, label, CSS or XPath
     *
     * ```js
     * I.appendField('#myTextField', 'appended');
     * // typing secret
     * I.appendField('password', secret('123456'));
     * ```
     * @param field - located by label|name|CSS|XPath|strict locator
     * @param value - text value to append.
     * @returns automatically synchronized promise through #recorder
     */
    appendField(field: TestMaiT.LocatorOrString, value: string): Promise<void>;
    /**
     * Checks that the given input field or textarea equals to given value.
     * For fuzzy locators, fields are matched by label text, the "name" attribute, CSS, and XPath.
     *
     * ```js
     * I.seeInField('Username', 'davert');
     * I.seeInField({css: 'form textarea'},'Type your comment here');
     * I.seeInField('form input[type=hidden]','hidden_value');
     * I.seeInField('#searchform input','Search');
     * ```
     * @param field - located by label|name|CSS|XPath|strict locator.
     * @param value - value to check.
     * @returns automatically synchronized promise through #recorder
     */
    seeInField(field: TestMaiT.LocatorOrString, value: TestMaiT.StringOrSecret): Promise<void>;
    /**
     * Checks that value of input field or textarea doesn't equal to given value
     * Opposite to `seeInField`.
     *
     * ```js
     * I.dontSeeInField('email', 'user@user.com'); // field by name
     * I.dontSeeInField({ css: 'form input.email' }, 'user@user.com'); // field by CSS
     * ```
     * @param field - located by label|name|CSS|XPath|strict locator.
     * @param value - value to check.
     * @returns automatically synchronized promise through #recorder
     */
    dontSeeInField(field: TestMaiT.LocatorOrString, value: TestMaiT.StringOrSecret): Promise<void>;
    /**
     * Attaches a file to element located by label, name, CSS or XPath
     * Path to file is relative current testmait directory (where testmait.conf.ts or testmait.conf.js is located).
     * File will be uploaded to remote system (if tests are running remotely).
     *
     * ```js
     * I.attachFile('Avatar', 'data/avatar.jpg');
     * I.attachFile('form input[name=avatar]', 'data/avatar.jpg');
     * ```
     * @param locator - field located by label|name|CSS|XPath|strict locator.
     * @param pathToFile - local file path relative to testmait.conf.ts or testmait.conf.js config file.
     * @returns automatically synchronized promise through #recorder
     */
    attachFile(locator: TestMaiT.LocatorOrString, pathToFile: string): Promise<void>;
    /**
     * Selects an option in a drop-down select.
     * Field is searched by label | name | CSS | XPath.
     * Option is selected by visible text or by value.
     *
     * ```js
     * I.selectOption('Choose Plan', 'Monthly'); // select by label
     * I.selectOption('subscription', 'Monthly'); // match option by text
     * I.selectOption('subscription', '0'); // or by value
     * I.selectOption('//form/select[@name=account]','Premium');
     * I.selectOption('form select[name=account]', 'Premium');
     * I.selectOption({css: 'form select[name=account]'}, 'Premium');
     * ```
     *
     * Provide an array for the second argument to select multiple options.
     *
     * ```js
     * I.selectOption('Which OS do you use?', ['Android', 'iOS']);
     * ```
     * @param select - field located by label|name|CSS|XPath|strict locator.
     * @param option - visible text or value of option.
     * @returns automatically synchronized promise through #recorder
     */
    selectOption(select: LocatorOrString, option: string | any[]): Promise<void>;
    /**
     * Grab number of visible elements by locator.
     * Resumes test execution, so **should be used inside async function with `await`** operator.
     *
     * ```js
     * let numOfElements = await I.grabNumberOfVisibleElements('p');
     * ```
     * @param locator - located by CSS|XPath|strict locator.
     * @returns number of visible elements
     */
    grabNumberOfVisibleElements(locator: TestMaiT.LocatorOrString): Promise<number>;
    /**
     * Checks that current url contains a provided fragment.
     *
     * ```js
     * I.seeInCurrentUrl('/register'); // we are on registration page
     * ```
     * @param url - a fragment to check
     * @returns automatically synchronized promise through #recorder
     */
    seeInCurrentUrl(url: string): Promise<void>;
    /**
     * Checks that current url does not contain a provided fragment.
     * @param url - value to check.
     * @returns automatically synchronized promise through #recorder
     */
    dontSeeInCurrentUrl(url: string): Promise<void>;
    /**
     * Checks that current url is equal to provided one.
     * If a relative url provided, a configured url will be prepended to it.
     * So both examples will work:
     *
     * ```js
     * I.seeCurrentUrlEquals('/register');
     * I.seeCurrentUrlEquals('http://my.site.com/register');
     * ```
     * @param url - value to check.
     * @returns automatically synchronized promise through #recorder
     */
    seeCurrentUrlEquals(url: string): Promise<void>;
    /**
     * Checks that current url is not equal to provided one.
     * If a relative url provided, a configured url will be prepended to it.
     *
     * ```js
     * I.dontSeeCurrentUrlEquals('/login'); // relative url are ok
     * I.dontSeeCurrentUrlEquals('http://mysite.com/login'); // absolute urls are also ok
     * ```
     * @param url - value to check.
     * @returns automatically synchronized promise through #recorder
     */
    dontSeeCurrentUrlEquals(url: string): Promise<void>;
    /**
     * Checks that a page contains a visible text.
     * Use context parameter to narrow down the search.
     *
     * ```js
     * I.see('Welcome'); // text welcome on a page
     * I.see('Welcome', '.content'); // text inside .content div
     * I.see('Register', {css: 'form.register'}); // use strict locator
     * ```
     * @param text - expected on page.
     * @param [context = null] - (optional, `null` by default) element located by CSS|Xpath|strict locator in which to search for text.
     * @returns automatically synchronized promise through #recorder
     */
    see(text: string, context?: TestMaiT.LocatorOrString): Promise<void>;
    /**
     * Checks that text is equal to provided one.
     *
     * ```js
     * I.seeTextEquals('text', 'h1');
     * ```
     * @param text - element value to check.
     * @param [context = null] - element located by CSS|XPath|strict locator.
     * @returns automatically synchronized promise through #recorder
     */
    seeTextEquals(text: string, context?: TestMaiT.LocatorOrString): Promise<void>;
    /**
     * Opposite to `see`. Checks that a text is not present on a page.
     * Use context parameter to narrow down the search.
     *
     * ```js
     * I.dontSee('Login'); // assume we are already logged in.
     * I.dontSee('Login', '.nav'); // no login inside .nav element
     * ```
     * @param text - which is not present.
     * @param [context = null] - (optional) element located by CSS|XPath|strict locator in which to perfrom search.
     * @returns automatically synchronized promise through #recorder
     */
    dontSee(text: string, context?: TestMaiT.LocatorOrString): Promise<void>;
    /**
     * Retrieves page source and returns it to test.
     * Resumes test execution, so **should be used inside async function with `await`** operator.
     *
     * ```js
     * let pageSource = await I.grabSource();
     * ```
     * @returns source code
     */
    grabSource(): Promise<string>;
    /**
     * Get JS log from browser.
     *
     * ```js
     * const logs = await I.grabBrowserLogs();
     * const errors = logs.map(l => ({ type: l.type(), text: l.text() })).filter(l => l.type === 'error');
     * console.log(JSON.stringify(errors));
     * ```
     * [Learn more about console messages](https://playwright.dev/docs/api/class-consolemessage)
     */
    grabBrowserLogs(): Promise<any[]>;
    /**
     * Get current URL from browser.
     * Resumes test execution, so should be used inside an async function.
     *
     * ```js
     * let url = await I.grabCurrentUrl();
     * console.log(`Current URL is [${url}]`);
     * ```
     * @returns current URL
     */
    grabCurrentUrl(): Promise<string>;
    /**
     * Checks that the current page contains the given string in its raw source code.
     *
     * ```js
     * I.seeInSource('<h1>Green eggs &amp; ham</h1>');
     * ```
     * @param text - value to check.
     * @returns automatically synchronized promise through #recorder
     */
    seeInSource(text: string): Promise<void>;
    /**
     * Checks that the current page does not contains the given string in its raw source code.
     *
     * ```js
     * I.dontSeeInSource('<!--'); // no comments in source
     * ```
     * @param value - to check.
     * @returns automatically synchronized promise through #recorder
     */
    dontSeeInSource(value: string): Promise<void>;
    /**
     * Asserts that an element appears a given number of times in the DOM.
     * Element is located by label or name or CSS or XPath.
     *
     *
     * ```js
     * I.seeNumberOfElements('#submitBtn', 1);
     * ```
     * @param locator - element located by CSS|XPath|strict locator.
     * @param num - number of elements.
     * @returns automatically synchronized promise through #recorder
     */
    seeNumberOfElements(locator: TestMaiT.LocatorOrString, num: number): Promise<void>;
    /**
     * Asserts that an element is visible a given number of times.
     * Element is located by CSS or XPath.
     *
     * ```js
     * I.seeNumberOfVisibleElements('.buttons', 3);
     * ```
     * @param locator - element located by CSS|XPath|strict locator.
     * @param num - number of elements.
     * @returns automatically synchronized promise through #recorder
     */
    seeNumberOfVisibleElements(locator: TestMaiT.LocatorOrString, num: number): Promise<void>;
    /**
     * Sets cookie(s).
     *
     * Can be a single cookie object or an array of cookies:
     *
     * ```js
     * I.setCookie({name: 'auth', value: true});
     *
     * // as array
     * I.setCookie([
     *   {name: 'auth', value: true},
     *   {name: 'agree', value: true}
     * ]);
     * ```
     * @param cookie - a cookie object or array of cookie objects.
     * @returns automatically synchronized promise through #recorder
     */
    setCookie(cookie: Cookie | Cookie[]): Promise<void>;
    /**
     * Checks that cookie with given name exists.
     *
     * ```js
     * I.seeCookie('Auth');
     * ```
     * @param name - cookie name.
     * @returns automatically synchronized promise through #recorder
     */
    seeCookie(name: string): Promise<void>;
    /**
     * Checks that cookie with given name does not exist.
     *
     * ```js
     * I.dontSeeCookie('auth'); // no auth cookie
     * ```
     * @param name - cookie name.
     * @returns automatically synchronized promise through #recorder
     */
    dontSeeCookie(name: string): Promise<void>;
    /**
     * Gets a cookie object by name.
     * If none provided gets all cookies.
     * Resumes test execution, so **should be used inside async function with `await`** operator.
     *
     * ```js
     * let cookie = await I.grabCookie('auth');
     * assert(cookie.value, '123456');
     * ```
     * @param [name = null] - cookie name.
     * @returns attribute value
     *
     *
     * Returns cookie in JSON format. If name not passed returns all cookies for this domain.
     */
    grabCookie(name?: string): any;
    /**
     * Clears a cookie by name,
     * if none provided clears all cookies.
     *
     * ```js
     * I.clearCookie();
     * I.clearCookie('test');
     * ```
     * @param [cookie = null] - (optional, `null` by default) cookie name
     * @returns automatically synchronized promise through #recorder
     */
    clearCookie(cookie?: string): Promise<void>;
    /**
     * Executes a script on the page:
     *
     * ```js
     * I.executeScript(() => window.alert('Hello world'));
     * ```
     *
     * Additional parameters of the function can be passed as an object argument:
     *
     * ```js
     * I.executeScript(({x, y}) => x + y, {x, y});
     * ```
     * You can pass only one parameter into a function
     * but you can pass in array or object.
     *
     * ```js
     * I.executeScript(([x, y]) => x + y, [x, y]);
     * ```
     * If a function returns a Promise it will wait for its resolution.
     * @param fn - function to be executed in browser context.
     * @param [arg] - optional argument to pass to the function
     */
    executeScript(fn: string | ((...params: any[]) => any), arg?: any): Promise<any>;
    /**
     * Grab Locator if called within Context
     */
    _contextLocator(locator: any): void;
    /**
     * Retrieves a text from an element located by CSS or XPath and returns it to test.
     * Resumes test execution, so **should be used inside async with `await`** operator.
     *
     * ```js
     * let pin = await I.grabTextFrom('#pin');
     * ```
     * If multiple elements found returns first element.
     * @param locator - element located by CSS|XPath|strict locator.
     * @returns attribute value
     */
    grabTextFrom(locator: TestMaiT.LocatorOrString): Promise<string>;
    /**
     * Retrieves all texts from an element located by CSS or XPath and returns it to test.
     * Resumes test execution, so **should be used inside async with `await`** operator.
     *
     * ```js
     * let pins = await I.grabTextFromAll('#pin li');
     * ```
     * @param locator - element located by CSS|XPath|strict locator.
     * @returns attribute value
     */
    grabTextFromAll(locator: TestMaiT.LocatorOrString): Promise<string[]>;
    /**
     * Retrieves a value from a form element located by CSS or XPath and returns it to test.
     * Resumes test execution, so **should be used inside async function with `await`** operator.
     * If more than one element is found - value of first element is returned.
     *
     * ```js
     * let email = await I.grabValueFrom('input[name=email]');
     * ```
     * @param locator - field located by label|name|CSS|XPath|strict locator.
     * @returns attribute value
     */
    grabValueFrom(locator: TestMaiT.LocatorOrString): Promise<string>;
    /**
     * Retrieves an array of value from a form located by CSS or XPath and returns it to test.
     * Resumes test execution, so **should be used inside async function with `await`** operator.
     *
     * ```js
     * let inputs = await I.grabValueFromAll('//form/input');
     * ```
     * @param locator - field located by label|name|CSS|XPath|strict locator.
     * @returns attribute value
     */
    grabValueFromAll(locator: TestMaiT.LocatorOrString): Promise<string[]>;
    /**
     * Retrieves the innerHTML from an element located by CSS or XPath and returns it to test.
     * Resumes test execution, so **should be used inside async function with `await`** operator.
     * If more than one element is found - HTML of first element is returned.
     *
     * ```js
     * let postHTML = await I.grabHTMLFrom('#post');
     * ```
     * @param element - located by CSS|XPath|strict locator.
     * @returns HTML code for an element
     */
    grabHTMLFrom(element: TestMaiT.LocatorOrString): Promise<string>;
    /**
     * Retrieves all the innerHTML from elements located by CSS or XPath and returns it to test.
     * Resumes test execution, so **should be used inside async function with `await`** operator.
     *
     * ```js
     * let postHTMLs = await I.grabHTMLFromAll('.post');
     * ```
     * @param element - located by CSS|XPath|strict locator.
     * @returns HTML code for an element
     */
    grabHTMLFromAll(element: TestMaiT.LocatorOrString): Promise<string[]>;
    /**
     * Grab CSS property for given locator
     * Resumes test execution, so **should be used inside an async function with `await`** operator.
     * If more than one element is found - value of first element is returned.
     *
     * ```js
     * const value = await I.grabCssPropertyFrom('h3', 'font-weight');
     * ```
     * @param locator - element located by CSS|XPath|strict locator.
     * @param cssProperty - CSS property name.
     * @returns CSS value
     */
    grabCssPropertyFrom(locator: TestMaiT.LocatorOrString, cssProperty: string): Promise<string>;
    /**
     * Grab array of CSS properties for given locator
     * Resumes test execution, so **should be used inside an async function with `await`** operator.
     *
     * ```js
     * const values = await I.grabCssPropertyFromAll('h3', 'font-weight');
     * ```
     * @param locator - element located by CSS|XPath|strict locator.
     * @param cssProperty - CSS property name.
     * @returns CSS value
     */
    grabCssPropertyFromAll(
      locator: TestMaiT.LocatorOrString,
      cssProperty: string,
    ): Promise<string[]>;
    /**
     * Checks that all elements with given locator have given CSS properties.
     *
     * ```js
     * I.seeCssPropertiesOnElements('h3', { 'font-weight': "bold"});
     * ```
     * @param locator - located by CSS|XPath|strict locator.
     * @param cssProperties - object with CSS properties and their values to check.
     * @returns automatically synchronized promise through #recorder
     */
    seeCssPropertiesOnElements(
      locator: TestMaiT.LocatorOrString,
      cssProperties: any,
    ): Promise<void>;
    /**
     * Checks that all elements with given locator have given attributes.
     *
     * ```js
     * I.seeAttributesOnElements('//form', { method: "post"});
     * ```
     * @param locator - located by CSS|XPath|strict locator.
     * @param attributes - attributes and their values to check.
     * @returns automatically synchronized promise through #recorder
     */
    seeAttributesOnElements(locator: TestMaiT.LocatorOrString, attributes: any): Promise<void>;
    /**
     * Drag the scrubber of a slider to a given position
     * For fuzzy locators, fields are matched by label text, the "name" attribute, CSS, and XPath.
     *
     * ```js
     * I.dragSlider('#slider', 30);
     * I.dragSlider('#slider', -70);
     * ```
     * @param locator - located by label|name|CSS|XPath|strict locator.
     * @param offsetX - position to drag.
     * @returns automatically synchronized promise through #recorder
     */
    dragSlider(locator: TestMaiT.LocatorOrString, offsetX: number): Promise<void>;
    /**
     * Retrieves an attribute from an element located by CSS or XPath and returns it to test.
     * Resumes test execution, so **should be used inside async with `await`** operator.
     * If more than one element is found - attribute of first element is returned.
     *
     * ```js
     * let hint = await I.grabAttributeFrom('#tooltip', 'title');
     * ```
     * @param locator - element located by CSS|XPath|strict locator.
     * @param attr - attribute name.
     * @returns attribute value
     */
    grabAttributeFrom(locator: TestMaiT.LocatorOrString, attr: string): Promise<string>;
    /**
     * Retrieves an array of attributes from elements located by CSS or XPath and returns it to test.
     * Resumes test execution, so **should be used inside async with `await`** operator.
     *
     * ```js
     * let hints = await I.grabAttributeFromAll('.tooltip', 'title');
     * ```
     * @param locator - element located by CSS|XPath|strict locator.
     * @param attr - attribute name.
     * @returns attribute value
     */
    grabAttributeFromAll(locator: TestMaiT.LocatorOrString, attr: string): Promise<string[]>;
    /**
     * Saves screenshot of the specified locator to ouput folder (set in testmait.conf.ts or testmait.conf.js).
     * Filename is relative to output folder.
     *
     * ```js
     * I.saveElementScreenshot(`#submit`,'debug.png');
     * ```
     * @param locator - element located by CSS|XPath|strict locator.
     * @param fileName - file name to save.
     * @returns automatically synchronized promise through #recorder
     */
    saveElementScreenshot(locator: TestMaiT.LocatorOrString, fileName: string): Promise<void>;
    /**
     * Saves a screenshot to ouput folder (set in testmait.conf.ts or testmait.conf.js).
     * Filename is relative to output folder.
     * Optionally resize the window to the full available page `scrollHeight` and `scrollWidth` to capture the entire page by passing `true` in as the second argument.
     *
     * ```js
     * I.saveScreenshot('debug.png');
     * I.saveScreenshot('debug.png', true) //resizes to available scrollHeight and scrollWidth before taking screenshot
     * ```
     * @param fileName - file name to save.
     * @param [fullPage = false] - (optional, `false` by default) flag to enable fullscreen screenshot mode.
     * @returns automatically synchronized promise through #recorder
     */
    saveScreenshot(fileName: string, fullPage?: boolean): Promise<void>;
    /**
     * Performs [api request](https://playwright.dev/docs/api/class-apirequestcontext#api-request-context-get) using
     * the cookies from the current browser session.
     *
     * ```js
     * const users = await I.makeApiRequest('GET', '/api/users', { params: { page: 1 }});
     * users[0]
     * I.makeApiRequest('PATCH', )
     * ```
     *
     * > This is Playwright's built-in alternative to using REST helper's sendGet, sendPost, etc methods.
     * @param method - HTTP method
     * @param url - endpoint
     * @param options - request options depending on method used
     * @returns response
     */
    makeApiRequest(method: string, url: string, options: any): Promise<object>;
    /**
     * Pauses execution for a number of seconds.
     *
     * ```js
     * I.wait(2); // wait 2 secs
     * ```
     * @param sec - number of second to wait.
     * @returns automatically synchronized promise through #recorder
     */
    wait(sec: number): Promise<void>;
    /**
     * Waits for element to become enabled (by default waits for 1sec).
     * Element can be located by CSS or XPath.
     * @param locator - element located by CSS|XPath|strict locator.
     * @param [sec = 1] - (optional) time in seconds to wait, 1 by default.
     * @returns automatically synchronized promise through #recorder
     */
    waitForEnabled(locator: TestMaiT.LocatorOrString, sec?: number): Promise<void>;
    /**
     * Waits for the specified value to be in value attribute.
     *
     * ```js
     * I.waitForValue('//input', "GoodValue");
     * ```
     * @param field - input field.
     * @param value - expected value.
     * @param [sec = 1] - (optional, `1` by default) time in seconds to wait
     * @returns automatically synchronized promise through #recorder
     */
    waitForValue(field: LocatorOrString, value: string, sec?: number): Promise<void>;
    /**
     * Waits for a specified number of elements on the page.
     *
     * ```js
     * I.waitNumberOfVisibleElements('a', 3);
     * ```
     * @param locator - element located by CSS|XPath|strict locator.
     * @param num - number of elements.
     * @param [sec = 1] - (optional, `1` by default) time in seconds to wait
     * @returns automatically synchronized promise through #recorder
     */
    waitNumberOfVisibleElements(
      locator: TestMaiT.LocatorOrString,
      num: number,
      sec?: number,
    ): Promise<void>;
    /**
     * Waits for element to be clickable (by default waits for 1sec).
     * Element can be located by CSS or XPath.
     *
     * ```js
     * I.waitForClickable('.btn.continue');
     * I.waitForClickable('.btn.continue', 5); // wait for 5 secs
     * ```
     * @param locator - element located by CSS|XPath|strict locator.
     * @param [sec] - (optional, `1` by default) time in seconds to wait
     * @returns automatically synchronized promise through #recorder
     */
    waitForClickable(locator: TestMaiT.LocatorOrString, sec?: number): Promise<void>;
    /**
     * Waits for element to be present on page (by default waits for 1sec).
     * Element can be located by CSS or XPath.
     *
     * ```js
     * I.waitForElement('.btn.continue');
     * I.waitForElement('.btn.continue', 5); // wait for 5 secs
     * ```
     * @param locator - element located by CSS|XPath|strict locator.
     * @param [sec] - (optional, `1` by default) time in seconds to wait
     * @returns automatically synchronized promise through #recorder
     */
    waitForElement(locator: TestMaiT.LocatorOrString, sec?: number): Promise<void>;
    /**
     * Waits for an element to become visible on a page (by default waits for 1sec).
     * Element can be located by CSS or XPath.
     *
     * ```js
     * I.waitForVisible('#popup');
     * ```
     * @param locator - element located by CSS|XPath|strict locator.
     * @param [sec = 1] - (optional, `1` by default) time in seconds to wait
     * @returns automatically synchronized promise through #recorder
     *
     *
     * This method accepts [React selectors](https://testmait.io/react).
     */
    waitForVisible(locator: TestMaiT.LocatorOrString, sec?: number): Promise<void>;
    /**
     * Waits for an element to be removed or become invisible on a page (by default waits for 1sec).
     * Element can be located by CSS or XPath.
     *
     * ```js
     * I.waitForInvisible('#popup');
     * ```
     * @param locator - element located by CSS|XPath|strict locator.
     * @param [sec = 1] - (optional, `1` by default) time in seconds to wait
     * @returns automatically synchronized promise through #recorder
     */
    waitForInvisible(locator: TestMaiT.LocatorOrString, sec?: number): Promise<void>;
    /**
     * Waits for an element to hide (by default waits for 1sec).
     * Element can be located by CSS or XPath.
     *
     * ```js
     * I.waitToHide('#popup');
     * ```
     * @param locator - element located by CSS|XPath|strict locator.
     * @param [sec = 1] - (optional, `1` by default) time in seconds to wait
     * @returns automatically synchronized promise through #recorder
     */
    waitToHide(locator: TestMaiT.LocatorOrString, sec?: number): Promise<void>;
    /**
     * Waiting for the part of the URL to match the expected. Useful for SPA to understand that page was changed.
     *
     * ```js
     * I.waitInUrl('/info', 2);
     * ```
     * @param urlPart - value to check.
     * @param [sec = 1] - (optional, `1` by default) time in seconds to wait
     * @returns automatically synchronized promise through #recorder
     */
    waitInUrl(urlPart: string, sec?: number): Promise<void>;
    /**
     * Waits for the entire URL to match the expected
     *
     * ```js
     * I.waitUrlEquals('/info', 2);
     * I.waitUrlEquals('http://127.0.0.1:8000/info');
     * ```
     * @param urlPart - value to check.
     * @param [sec = 1] - (optional, `1` by default) time in seconds to wait
     * @returns automatically synchronized promise through #recorder
     */
    waitUrlEquals(urlPart: string, sec?: number): Promise<void>;
    /**
     * Waits for a text to appear (by default waits for 1sec).
     * Element can be located by CSS or XPath.
     * Narrow down search results by providing context.
     *
     * ```js
     * I.waitForText('Thank you, form has been submitted');
     * I.waitForText('Thank you, form has been submitted', 5, '#modal');
     * ```
     * @param text - to wait for.
     * @param [sec = 1] - (optional, `1` by default) time in seconds to wait
     * @param [context = null] - (optional) element located by CSS|XPath|strict locator.
     * @returns automatically synchronized promise through #recorder
     */
    waitForText(text: string, sec?: number, context?: TestMaiT.LocatorOrString): Promise<void>;
    /**
     * Waits for a network request.
     *
     * ```js
     * I.waitForRequest('http://example.com/resource');
     * I.waitForRequest(request => request.url() === 'http://example.com' && request.method() === 'GET');
     * ```
     * @param [sec = null] - seconds to wait
     */
    waitForRequest(urlOrPredicate: string | ((...params: any[]) => any), sec?: number): void;
    /**
     * Waits for a network response.
     *
     * ```js
     * I.waitForResponse('http://example.com/resource');
     * I.waitForResponse(response => response.url() === 'https://example.com' && response.status() === 200);
     * ```
     * @param [sec = null] - number of seconds to wait
     */
    waitForResponse(urlOrPredicate: string | ((...params: any[]) => any), sec?: number): void;
    /**
     * Switches frame or in case of null locator reverts to parent.
     *
     * ```js
     * I.switchTo('iframe'); // switch to first iframe
     * I.switchTo(); // switch back to main page
     * ```
     * @param [locator = null] - (optional, `null` by default) element located by CSS|XPath|strict locator.
     * @returns automatically synchronized promise through #recorder
     */
    switchTo(locator?: TestMaiT.LocatorOrString): Promise<void>;
    /**
     * Waits for a function to return true (waits for 1 sec by default).
     * Running in browser context.
     *
     * ```js
     * I.waitForFunction(fn[, [args[, timeout]])
     * ```
     *
     * ```js
     * I.waitForFunction(() => window.requests == 0);
     * I.waitForFunction(() => window.requests == 0, 5); // waits for 5 sec
     * I.waitForFunction((count) => window.requests == count, [3], 5) // pass args and wait for 5 sec
     * ```
     * @param fn - to be executed in browser context.
     * @param [argsOrSec = null] - (optional, `1` by default) arguments for function or seconds.
     * @param [sec = null] - (optional, `1` by default) time in seconds to wait
     * @returns automatically synchronized promise through #recorder
     */
    waitForFunction(
      fn: string | ((...params: any[]) => any),
      argsOrSec?: any[] | number,
      sec?: number,
    ): Promise<void>;
    /**
     * Waits for navigation to finish. By default, it takes configured `waitForNavigation` option.
     *
     * See [Playwright's reference](https://playwright.dev/docs/api/class-page?_highlight=waitfornavi#pagewaitfornavigationoptions)
     */
    waitForNavigation(options: any): void;
    /**
     * Waits for page navigates to a new URL or reloads. By default, it takes configured `waitForNavigation` option.
     *
     * See [Playwright's reference](https://playwright.dev/docs/api/class-page#page-wait-for-url)
     * @param url - A glob pattern, regex pattern or predicate receiving URL to match while waiting for the navigation. Note that if the parameter is a string without wildcard characters, the method will wait for navigation to URL that is exactly equal to the string.
     */
    waitForURL(url: string | RegExp, options: any): void;
    /**
     * Waits for an element to become not attached to the DOM on a page (by default waits for 1sec).
     * Element can be located by CSS or XPath.
     *
     * ```js
     * I.waitForDetached('#popup');
     * ```
     * @param locator - element located by CSS|XPath|strict locator.
     * @param [sec = 1] - (optional, `1` by default) time in seconds to wait
     * @returns automatically synchronized promise through #recorder
     */
    waitForDetached(locator: TestMaiT.LocatorOrString, sec?: number): Promise<void>;
    /**
     * Grab the data from performance timing using Navigation Timing API.
     * The returned data will contain following things in ms:
     * - responseEnd,
     * - domInteractive,
     * - domContentLoadedEventEnd,
     * - loadEventEnd
     * Resumes test execution, so **should be used inside an async function with `await`** operator.
     *
     * ```js
     * await I.amOnPage('https://example.com');
     * let data = await I.grabDataFromPerformanceTiming();
     * //Returned data
     * { // all results are in [ms]
     *   responseEnd: 23,
     *   domInteractive: 44,
     *   domContentLoadedEventEnd: 196,
     *   loadEventEnd: 241
     * }
     * ```
     * @returns automatically synchronized promise through #recorder
     */
    grabDataFromPerformanceTiming(): Promise<void>;
    /**
     * Grab the width, height, location of given locator.
     * Provide `width` or `height`as second param to get your desired prop.
     * Resumes test execution, so **should be used inside an async function with `await`** operator.
     *
     * Returns an object with `x`, `y`, `width`, `height` keys.
     *
     * ```js
     * const value = await I.grabElementBoundingRect('h3');
     * // value is like { x: 226.5, y: 89, width: 527, height: 220 }
     * ```
     *
     * To get only one metric use second parameter:
     *
     * ```js
     * const width = await I.grabElementBoundingRect('h3', 'width');
     * // width == 527
     * ```
     * @param locator - element located by CSS|XPath|strict locator.
     * @param [elementSize] - x, y, width or height of the given element.
     * @returns Element bounding rectangle
     */
    grabElementBoundingRect(
      locator: LocatorOrString,
      elementSize?: string,
    ): Promise<DOMRect> | Promise<number>;
    /**
     * Mocks network request using [`browserContext.route`](https://playwright.dev/docs/api/class-browsercontext#browser-context-route) of Playwright
     *
     * ```js
     * I.mockRoute(/(\.png$)|(\.jpg$)/, route => route.abort());
     * ```
     * This method allows intercepting and mocking requests & responses. [Learn more about it](https://playwright.dev/docs/network#handle-requests)
     * @param [url] - URL, regex or pattern for to match URL
     * @param [handler] - a function to process reques
     */
    mockRoute(url?: string | RegExp, handler?: (...params: any[]) => any): void;
    /**
     * Stops network mocking created by `mockRoute`.
     *
     * ```js
     * I.stopMockingRoute(/(\.png$)|(\.jpg$)/);
     * I.stopMockingRoute(/(\.png$)|(\.jpg$)/, previouslySetHandler);
     * ```
     * If no handler is passed, all mock requests for the rote are disabled.
     * @param [url] - URL, regex or pattern for to match URL
     * @param [handler] - a function to process reques
     */
    stopMockingRoute(url?: string | RegExp, handler?: (...params: any[]) => any): void;
    /**
     * Starts recording the network traffics.
     * This also resets recorded network requests.
     *
     * ```js
     * I.startRecordingTraffic();
     * ```
     */
    startRecordingTraffic(): void;
    /**
     * Grab the recording network traffics
     *
     * ```js
     * const traffics = await I.grabRecordedNetworkTraffics();
     * expect(traffics[0].url).to.equal('https://reqres.in/api/comments/1');
     * expect(traffics[0].response.status).to.equal(200);
     * expect(traffics[0].response.body).to.contain({ name: 'this was mocked' });
     * ```
     */
    grabRecordedNetworkTraffics(): Promise<any[]>;
    /**
     * Blocks traffic of a given URL or a list of URLs.
     *
     * Examples:
     *
     * ```js
     * I.blockTraffic('http://example.com/css/style.css');
     * I.blockTraffic('http://example.com/css/*.css');
     * I.blockTraffic('http://example.com/**');
     * I.blockTraffic(/\.css$/);
     * ```
     *
     * ```js
     * I.blockTraffic(['http://example.com/css/style.css', 'http://example.com/css/*.css']);
     * ```
     * @param urls - URL or a list of URLs to block . URL can contain * for wildcards. Example: https://www.example.com** to block all traffic for that domain. Regexp are also supported.
     */
    blockTraffic(urls: string | any[] | RegExp): void;
    /**
     * Mocks traffic for URL(s).
     * This is a powerful feature to manipulate network traffic. Can be used e.g. to stabilize your tests, speed up your tests or as a last resort to make some test scenarios even possible.
     *
     * Examples:
     *
     * ```js
     * I.mockTraffic('/api/users/1', '{ id: 1, name: 'John Doe' }');
     * I.mockTraffic('/api/users/*', JSON.stringify({ id: 1, name: 'John Doe' }));
     * I.mockTraffic([/^https://api.example.com/v1/, 'https://api.example.com/v2/**'], 'Internal Server Error', 'text/html');
     * ```
     * @param urls - string|Array These are the URL(s) to mock, e.g. "/fooapi/*" or "['/fooapi_1/*', '/barapi_2/*']". Regular expressions are also supported.
     * @param responseString - string The string to return in fake response's body.
     * @param contentType - Content type of fake response. If not specified default value 'application/json' is used.
     */
    mockTraffic(urls: any, responseString: any, contentType?: any): void;
    /**
     * Resets all recorded network requests.
     */
    flushNetworkTraffics(): void;
    /**
     * Stops recording of network traffic. Recorded traffic is not flashed.
     *
     * ```js
     * I.stopRecordingTraffic();
     * ```
     */
    stopRecordingTraffic(): void;
    /**
     * Verifies that a certain request is part of network traffic.
     *
     * ```js
     * // checking the request url contains certain query strings
     * I.amOnPage('https://openai.com/blog/chatgpt');
     * I.startRecordingTraffic();
     * await I.seeTraffic({
     *    name: 'sentry event',
     *    url: 'https://images.openai.com/blob/cf717bdb-0c8c-428a-b82b-3c3add87a600',
     *    parameters: {
     *       width: '1919',
     *       height: '1138',
     *     },
     * });
     * ```
     *
     * ```js
     * // checking the request url contains certain post data
     * I.amOnPage('https://openai.com/blog/chatgpt');
     * I.startRecordingTraffic();
     * await I.seeTraffic({
     *    name: 'event',
     *    url: 'https://cloudflareinsights.com/cdn-cgi/rum',
     *    requestPostData: {
     *       st: 2,
     *     },
     * });
     * ```
     * @param opts - options when checking the traffic network.
     * @param opts.name - A name of that request. Can be any value. Only relevant to have a more meaningful error message in case of fail.
     * @param opts.url - Expected URL of request in network traffic
     * @param [opts.parameters] - Expected parameters of that request in network traffic
     * @param [opts.requestPostData] - Expected that request contains post data in network traffic
     * @param [opts.timeout] - Timeout to wait for request in seconds. Default is 10 seconds.
     */
    seeTraffic(opts: {
      name: string;
      url: string;
      parameters?: any;
      requestPostData?: any;
      timeout?: number;
    }): Promise<any>;
    /**
     * Returns full URL of request matching parameter "urlMatch".
     * @param urlMatch - Expected URL of request in network traffic. Can be a string or a regular expression.
     *
     * Examples:
     *
     * ```js
     * I.grabTrafficUrl('https://api.example.com/session');
     * I.grabTrafficUrl(/session.*start/);
     * ```
     */
    grabTrafficUrl(urlMatch: string | RegExp): Promise<any>;
    /**
     * Verifies that a certain request is not part of network traffic.
     *
     * Examples:
     *
     * ```js
     * I.dontSeeTraffic({ name: 'Unexpected API Call', url: 'https://api.example.com' });
     * I.dontSeeTraffic({ name: 'Unexpected API Call of "user" endpoint', url: /api.example.com.*user/ });
     * ```
     * @param opts - options when checking the traffic network.
     * @param opts.name - A name of that request. Can be any value. Only relevant to have a more meaningful error message in case of fail.
     * @param opts.url - Expected URL of request in network traffic. Can be a string or a regular expression.
     */
    dontSeeTraffic(opts: { name: string; url: string | RegExp }): void;
    /**
     * Starts recording of websocket messages.
     * This also resets recorded websocket messages.
     *
     * ```js
     * await I.startRecordingWebSocketMessages();
     * ```
     */
    startRecordingWebSocketMessages(): void;
    /**
     * Stops recording WS messages. Recorded WS messages is not flashed.
     *
     * ```js
     * await I.stopRecordingWebSocketMessages();
     * ```
     */
    stopRecordingWebSocketMessages(): void;
    /**
     * Grab the recording WS messages
     */
    grabWebSocketMessages(): any[];
    /**
     * Resets all recorded WS messages.
     */
    flushWebSocketMessages(): void;
    /**
     * Return a performance metric from the chrome cdp session.
     * Note: Chrome-only
     *
     * Examples:
     *
     * ```js
     * const metrics = await I.grabMetrics();
     *
     * // returned metrics
     *
     * [
     *   { name: 'Timestamp', value: 1584904.203473 },
     *   { name: 'AudioHandlers', value: 0 },
     *   { name: 'AudioWorkletProcessors', value: 0 },
     *   { name: 'Documents', value: 22 },
     *   { name: 'Frames', value: 10 },
     *   { name: 'JSEventListeners', value: 366 },
     *   { name: 'LayoutObjects', value: 1240 },
     *   { name: 'MediaKeySessions', value: 0 },
     *   { name: 'MediaKeys', value: 0 },
     *   { name: 'Nodes', value: 4505 },
     *   { name: 'Resources', value: 141 },
     *   { name: 'ContextLifecycleStateObservers', value: 34 },
     *   { name: 'V8PerContextDatas', value: 4 },
     *   { name: 'WorkerGlobalScopes', value: 0 },
     *   { name: 'UACSSResources', value: 0 },
     *   { name: 'RTCPeerConnections', value: 0 },
     *   { name: 'ResourceFetchers', value: 22 },
     *   { name: 'AdSubframes', value: 0 },
     *   { name: 'DetachedScriptStates', value: 2 },
     *   { name: 'ArrayBufferContents', value: 1 },
     *   { name: 'LayoutCount', value: 0 },
     *   { name: 'RecalcStyleCount', value: 0 },
     *   { name: 'LayoutDuration', value: 0 },
     *   { name: 'RecalcStyleDuration', value: 0 },
     *   { name: 'DevToolsCommandDuration', value: 0.000013 },
     *   { name: 'ScriptDuration', value: 0 },
     *   { name: 'V8CompileDuration', value: 0 },
     *   { name: 'TaskDuration', value: 0.000014 },
     *   { name: 'TaskOtherDuration', value: 0.000001 },
     *   { name: 'ThreadTime', value: 0.000046 },
     *   { name: 'ProcessTime', value: 0.616852 },
     *   { name: 'JSHeapUsedSize', value: 19004908 },
     *   { name: 'JSHeapTotalSize', value: 26820608 },
     *   { name: 'FirstMeaningfulPaint', value: 0 },
     *   { name: 'DomContentLoaded', value: 1584903.690491 },
     *   { name: 'NavigationStart', value: 1584902.841845 }
     * ]
     *
     * ```
     */
    grabMetrics(): Promise<object[]>;
  }
  /**
   * Protractor helper is based on [Protractor library](http://www.protractortest.org) and used for testing web applications.
   *
   * Protractor requires [Selenium Server and ChromeDriver/GeckoDriver to be installed](http://testmait.io/quickstart/#prepare-selenium-server).
   * To test non-Angular applications please make sure you have `angular: false` in configuration file.
   *
   * ### Configuration
   *
   * This helper should be configured in testmait.conf.ts or testmait.conf.js
   *
   * * `url` - base url of website to be tested
   * * `browser` - browser in which perform testing
   * * `angular` (optional, default: true): disable this option to run tests for non-Angular applications.
   * * `driver` - which protractor driver to use (local, direct, session, hosted, sauce, browserstack). By default set to 'hosted' which requires selenium server to be started.
   * * `restart` (optional, default: true) - restart browser between tests.
   * * `smartWait`: (optional) **enables [SmartWait](http://testmait.io/acceptance/#smartwait)**; wait for additional milliseconds for element to appear. Enable for 5 secs: "smartWait": 5000
   * * `disableScreenshots` (optional, default: false)  - don't save screenshot on failure
   * * `fullPageScreenshots` (optional, default: false) - make full page screenshots on failure.
   * * `uniqueScreenshotNames` (optional, default: false)  - option to prevent screenshot override if you have scenarios with the same name in different suites
   * * `keepBrowserState` (optional, default: false)  - keep browser state between tests when `restart` set to false.
   * * `seleniumAddress` - Selenium address to connect (default: http://localhost:4444/wd/hub)
   * * `rootElement` - Root element of AngularJS application (default: body)
   * * `getPageTimeout` (optional) sets default timeout for a page to be loaded. 10000 by default.
   * * `waitForTimeout`: (optional) sets default wait time in _ms_ for all `wait*` functions. 1000 by default.
   * * `scriptsTimeout`: (optional) timeout in milliseconds for each script run on the browser, 10000 by default.
   * * `windowSize`: (optional) default window size. Set to `maximize` or a dimension in the format `640x480`.
   * * `manualStart` (optional, default: false) - do not start browser before a test, start it manually inside a helper with `this.helpers.WebDriver._startBrowser()`
   * * `capabilities`: {} - list of [Desired Capabilities](https://github.com/SeleniumHQ/selenium/wiki/DesiredCapabilities)
   * * `proxy`: set proxy settings
   *
   * other options are the same as in [Protractor config](https://github.com/angular/protractor/blob/master/docs/referenceConf.js).
   *
   * #### Sample Config
   *
   * ```json
   * {
   *    "helpers": {
   *      "Protractor" : {
   *        "url": "http://localhost",
   *        "browser": "chrome",
   *        "smartWait": 5000,
   *        "restart": false
   *      }
   *    }
   * }
   * ```
   *
   * #### Config for Non-Angular application:
   *
   * ```json
   * {
   *    "helpers": {
   *      "Protractor" : {
   *        "url": "http://localhost",
   *        "browser": "chrome",
   *        "angular": false
   *      }
   *    }
   * }
   * ```
   *
   * #### Config for Headless Chrome
   *
   * ```json
   * {
   *    "helpers": {
   *      "Protractor" : {
   *        "url": "http://localhost",
   *        "browser": "chrome",
   *        "capabilities": {
   *          "chromeOptions": {
   *            "args": [ "--headless", "--disable-gpu", "--no-sandbox" ]
   *          }
   *        }
   *      }
   *    }
   * }
   * ```
   *
   * ## Access From Helpers
   *
   * Receive a WebDriverIO client from a custom helper by accessing `browser` property:
   *
   * ```js
   * this.helpers['Protractor'].browser
   * ```
   *
   * ## Methods
   */
  class Protractor {
    /**
     * Use [Protractor](https://www.protractortest.org/#/api) API inside a test.
     *
     * First argument is a description of an action.
     * Second argument is async function that gets this helper as parameter.
     *
     * { [`browser`](https://www.protractortest.org/#/api?view=ProtractorBrowser)) } object from Protractor API is available.
     *
     * ```js
     * I.useProtractorTo('change url via in-page navigation', async ({ browser }) {
     *    await browser.setLocation('api');
     * });
     * ```
     * @param description - used to show in logs.
     * @param fn - async functuion that executed with Protractor helper as argument
     */
    useProtractorTo(description: string, fn: (...params: any[]) => any): void;
    /**
     * Switch to non-Angular mode,
     * start using WebDriver instead of Protractor in this session
     */
    amOutsideAngularApp(): void;
    /**
     * Enters Angular mode (switched on by default)
     * Should be used after "amOutsideAngularApp"
     */
    amInsideAngularApp(): void;
    /**
     * Get elements by different locator types, including strict locator
     * Should be used in custom helpers:
     *
     * ```js
     * this.helpers['Protractor']._locate({name: 'password'}).then //...
     * ```
     * To use SmartWait and wait for element to appear on a page, add `true` as second arg:
     *
     * ```js
     * this.helpers['Protractor']._locate({name: 'password'}, true).then //...
     * ```
     */
    _locate(): void;
    /**
     * Find a checkbox by providing human readable text:
     *
     * ```js
     * this.helpers['Protractor']._locateCheckable('I agree with terms and conditions').then // ...
     * ```
     */
    _locateCheckable(): void;
    /**
     * Find a clickable element by providing human readable text:
     *
     * ```js
     * this.helpers['Protractor']._locateClickable('Next page').then // ...
     * ```
     */
    _locateClickable(): void;
    /**
     * Find field elements by providing human readable text:
     *
     * ```js
     * this.helpers['Protractor']._locateFields('Your email').then // ...
     * ```
     */
    _locateFields(): void;
    /**
     * Opens a web page in a browser. Requires relative or absolute url.
     * If url starts with `/`, opens a web page of a site defined in `url` config parameter.
     *
     * ```js
     * I.amOnPage('/'); // opens main page of website
     * I.amOnPage('https://github.com'); // opens github
     * I.amOnPage('/login'); // opens a login page
     * ```
     * @param url - url path or global url.
     * @returns automatically synchronized promise through #recorder
     */
    amOnPage(url: string): Promise<void>;
    /**
     * Perform a click on a link or a button, given by a locator.
     * If a fuzzy locator is given, the page will be searched for a button, link, or image matching the locator string.
     * For buttons, the "value" attribute, "name" attribute, and inner text are searched. For links, the link text is searched.
     * For images, the "alt" attribute and inner text of any parent links are searched.
     *
     * The second parameter is a context (CSS or XPath locator) to narrow the search.
     *
     * ```js
     * // simple link
     * I.click('Logout');
     * // button of form
     * I.click('Submit');
     * // CSS button
     * I.click('#form input[type=submit]');
     * // XPath
     * I.click('//form/*[@type=submit]');
     * // link in context
     * I.click('Logout', '#nav');
     * // using strict locator
     * I.click({css: 'nav a.login'});
     * ```
     * @param locator - clickable link or button located by text, or any element located by CSS|XPath|strict locator.
     * @param [context = null] - (optional, `null` by default) element to search in CSS|XPath|Strict locator.
     * @returns automatically synchronized promise through #recorder
     */
    click(
      locator: TestMaiT.LocatorOrString,
      context?: TestMaiT.LocatorOrString | null,
    ): Promise<void>;
    /**
     * Performs a double-click on an element matched by link|button|label|CSS or XPath.
     * Context can be specified as second parameter to narrow search.
     *
     * ```js
     * I.doubleClick('Edit');
     * I.doubleClick('Edit', '.actions');
     * I.doubleClick({css: 'button.accept'});
     * I.doubleClick('.btn.edit');
     * ```
     * @param locator - clickable link or button located by text, or any element located by CSS|XPath|strict locator.
     * @param [context = null] - (optional, `null` by default) element to search in CSS|XPath|Strict locator.
     * @returns automatically synchronized promise through #recorder
     */
    doubleClick(
      locator: TestMaiT.LocatorOrString,
      context?: TestMaiT.LocatorOrString,
    ): Promise<void>;
    /**
     * Performs right click on a clickable element matched by semantic locator, CSS or XPath.
     *
     * ```js
     * // right click element with id el
     * I.rightClick('#el');
     * // right click link or button with text "Click me"
     * I.rightClick('Click me');
     * // right click button with text "Click me" inside .context
     * I.rightClick('Click me', '.context');
     * ```
     * @param locator - clickable element located by CSS|XPath|strict locator.
     * @param [context = null] - (optional, `null` by default) element located by CSS|XPath|strict locator.
     * @returns automatically synchronized promise through #recorder
     */
    rightClick(
      locator: TestMaiT.LocatorOrString,
      context?: TestMaiT.LocatorOrString,
    ): Promise<void>;
    /**
     * Moves cursor to element matched by locator.
     * Extra shift can be set with offsetX and offsetY options.
     *
     * ```js
     * I.moveCursorTo('.tooltip');
     * I.moveCursorTo('#submit', 5,5);
     * ```
     * @param locator - located by CSS|XPath|strict locator.
     * @param [offsetX = 0] - (optional, `0` by default) X-axis offset.
     * @param [offsetY = 0] - (optional, `0` by default) Y-axis offset.
     * @returns automatically synchronized promise through #recorder
     */
    moveCursorTo(
      locator: TestMaiT.LocatorOrString,
      offsetX?: number,
      offsetY?: number,
    ): Promise<void>;
    /**
     * Checks that a page contains a visible text.
     * Use context parameter to narrow down the search.
     *
     * ```js
     * I.see('Welcome'); // text welcome on a page
     * I.see('Welcome', '.content'); // text inside .content div
     * I.see('Register', {css: 'form.register'}); // use strict locator
     * ```
     * @param text - expected on page.
     * @param [context = null] - (optional, `null` by default) element located by CSS|Xpath|strict locator in which to search for text.
     * @returns automatically synchronized promise through #recorder
     */
    see(text: string, context?: TestMaiT.LocatorOrString): Promise<void>;
    /**
     * Checks that text is equal to provided one.
     *
     * ```js
     * I.seeTextEquals('text', 'h1');
     * ```
     * @param text - element value to check.
     * @param [context = null] - element located by CSS|XPath|strict locator.
     * @returns automatically synchronized promise through #recorder
     */
    seeTextEquals(text: string, context?: TestMaiT.LocatorOrString): Promise<void>;
    /**
     * Opposite to `see`. Checks that a text is not present on a page.
     * Use context parameter to narrow down the search.
     *
     * ```js
     * I.dontSee('Login'); // assume we are already logged in.
     * I.dontSee('Login', '.nav'); // no login inside .nav element
     * ```
     * @param text - which is not present.
     * @param [context = null] - (optional) element located by CSS|XPath|strict locator in which to perfrom search.
     * @returns automatically synchronized promise through #recorder
     */
    dontSee(text: string, context?: TestMaiT.LocatorOrString): Promise<void>;
    /**
     * Get JS log from browser. Log buffer is reset after each request.
     * Resumes test execution, so **should be used inside an async function with `await`** operator.
     *
     * ```js
     * let logs = await I.grabBrowserLogs();
     * console.log(JSON.stringify(logs))
     * ```
     * @returns all browser logs
     */
    grabBrowserLogs(): Promise<object[]> | undefined;
    /**
     * Get current URL from browser.
     * Resumes test execution, so should be used inside an async function.
     *
     * ```js
     * let url = await I.grabCurrentUrl();
     * console.log(`Current URL is [${url}]`);
     * ```
     * @returns current URL
     */
    grabCurrentUrl(): Promise<string>;
    /**
     * Selects an option in a drop-down select.
     * Field is searched by label | name | CSS | XPath.
     * Option is selected by visible text or by value.
     *
     * ```js
     * I.selectOption('Choose Plan', 'Monthly'); // select by label
     * I.selectOption('subscription', 'Monthly'); // match option by text
     * I.selectOption('subscription', '0'); // or by value
     * I.selectOption('//form/select[@name=account]','Premium');
     * I.selectOption('form select[name=account]', 'Premium');
     * I.selectOption({css: 'form select[name=account]'}, 'Premium');
     * ```
     *
     * Provide an array for the second argument to select multiple options.
     *
     * ```js
     * I.selectOption('Which OS do you use?', ['Android', 'iOS']);
     * ```
     * @param select - field located by label|name|CSS|XPath|strict locator.
     * @param option - visible text or value of option.
     * @returns automatically synchronized promise through #recorder
     */
    selectOption(select: LocatorOrString, option: string | any[]): Promise<void>;
    /**
     * Fills a text field or textarea, after clearing its value, with the given string.
     * Field is located by name, label, CSS, or XPath.
     *
     * ```js
     * // by label
     * I.fillField('Email', 'hello@world.com');
     * // by name
     * I.fillField('password', secret('123456'));
     * // by CSS
     * I.fillField('form#login input[name=username]', 'John');
     * // or by strict locator
     * I.fillField({css: 'form#login input[name=username]'}, 'John');
     * ```
     * @param field - located by label|name|CSS|XPath|strict locator.
     * @param value - text value to fill.
     * @returns automatically synchronized promise through #recorder
     */
    fillField(field: TestMaiT.LocatorOrString, value: TestMaiT.StringOrSecret): Promise<void>;
    /**
     * Presses a key on a focused element.
     * Special keys like 'Enter', 'Control', [etc](https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/element/:id/value)
     * will be replaced with corresponding unicode.
     * If modifier key is used (Control, Command, Alt, Shift) in array, it will be released afterwards.
     *
     * ```js
     * I.pressKey('Enter');
     * I.pressKey(['Control','a']);
     * ```
     * @param key - key or array of keys to press.
     * @returns automatically synchronized promise through #recorder
     *
     * {{ keys }}
     */
    pressKey(key: string | string[]): Promise<void>;
    /**
     * Attaches a file to element located by label, name, CSS or XPath
     * Path to file is relative current testmait directory (where testmait.conf.ts or testmait.conf.js is located).
     * File will be uploaded to remote system (if tests are running remotely).
     *
     * ```js
     * I.attachFile('Avatar', 'data/avatar.jpg');
     * I.attachFile('form input[name=avatar]', 'data/avatar.jpg');
     * ```
     * @param locator - field located by label|name|CSS|XPath|strict locator.
     * @param pathToFile - local file path relative to testmait.conf.ts or testmait.conf.js config file.
     * @returns automatically synchronized promise through #recorder
     */
    attachFile(locator: TestMaiT.LocatorOrString, pathToFile: string): Promise<void>;
    /**
     * Checks that the given input field or textarea equals to given value.
     * For fuzzy locators, fields are matched by label text, the "name" attribute, CSS, and XPath.
     *
     * ```js
     * I.seeInField('Username', 'davert');
     * I.seeInField({css: 'form textarea'},'Type your comment here');
     * I.seeInField('form input[type=hidden]','hidden_value');
     * I.seeInField('#searchform input','Search');
     * ```
     * @param field - located by label|name|CSS|XPath|strict locator.
     * @param value - value to check.
     * @returns automatically synchronized promise through #recorder
     */
    seeInField(field: TestMaiT.LocatorOrString, value: TestMaiT.StringOrSecret): Promise<void>;
    /**
     * Checks that value of input field or textarea doesn't equal to given value
     * Opposite to `seeInField`.
     *
     * ```js
     * I.dontSeeInField('email', 'user@user.com'); // field by name
     * I.dontSeeInField({ css: 'form input.email' }, 'user@user.com'); // field by CSS
     * ```
     * @param field - located by label|name|CSS|XPath|strict locator.
     * @param value - value to check.
     * @returns automatically synchronized promise through #recorder
     */
    dontSeeInField(field: TestMaiT.LocatorOrString, value: TestMaiT.StringOrSecret): Promise<void>;
    /**
     * Appends text to a input field or textarea.
     * Field is located by name, label, CSS or XPath
     *
     * ```js
     * I.appendField('#myTextField', 'appended');
     * // typing secret
     * I.appendField('password', secret('123456'));
     * ```
     * @param field - located by label|name|CSS|XPath|strict locator
     * @param value - text value to append.
     * @returns automatically synchronized promise through #recorder
     */
    appendField(field: TestMaiT.LocatorOrString, value: string): Promise<void>;
    /**
     * Clears a `<textarea>` or text `<input>` element's value.
     *
     * ```js
     * I.clearField('Email');
     * I.clearField('user[email]');
     * I.clearField('#email');
     * ```
     * @param editable - field located by label|name|CSS|XPath|strict locator.
     * @returns automatically synchronized promise through #recorder.
     */
    clearField(editable: LocatorOrString): Promise<void>;
    /**
     * Selects a checkbox or radio button.
     * Element is located by label or name or CSS or XPath.
     *
     * The second parameter is a context (CSS or XPath locator) to narrow the search.
     *
     * ```js
     * I.checkOption('#agree');
     * I.checkOption('I Agree to Terms and Conditions');
     * I.checkOption('agree', '//form');
     * ```
     * @param field - checkbox located by label | name | CSS | XPath | strict locator.
     * @param [context = null] - (optional, `null` by default) element located by CSS | XPath | strict locator.
     * @returns automatically synchronized promise through #recorder
     */
    checkOption(field: TestMaiT.LocatorOrString, context?: TestMaiT.LocatorOrString): Promise<void>;
    /**
     * Unselects a checkbox or radio button.
     * Element is located by label or name or CSS or XPath.
     *
     * The second parameter is a context (CSS or XPath locator) to narrow the search.
     *
     * ```js
     * I.uncheckOption('#agree');
     * I.uncheckOption('I Agree to Terms and Conditions');
     * I.uncheckOption('agree', '//form');
     * ```
     * @param field - checkbox located by label | name | CSS | XPath | strict locator.
     * @param [context = null] - (optional, `null` by default) element located by CSS | XPath | strict locator.
     * @returns automatically synchronized promise through #recorder
     */
    uncheckOption(
      field: TestMaiT.LocatorOrString,
      context?: TestMaiT.LocatorOrString,
    ): Promise<void>;
    /**
     * Verifies that the specified checkbox is checked.
     *
     * ```js
     * I.seeCheckboxIsChecked('Agree');
     * I.seeCheckboxIsChecked('#agree'); // I suppose user agreed to terms
     * I.seeCheckboxIsChecked({css: '#signup_form input[type=checkbox]'});
     * ```
     * @param field - located by label|name|CSS|XPath|strict locator.
     * @returns automatically synchronized promise through #recorder
     */
    seeCheckboxIsChecked(field: TestMaiT.LocatorOrString): Promise<void>;
    /**
     * Verifies that the specified checkbox is not checked.
     *
     * ```js
     * I.dontSeeCheckboxIsChecked('#agree'); // located by ID
     * I.dontSeeCheckboxIsChecked('I agree to terms'); // located by label
     * I.dontSeeCheckboxIsChecked('agree'); // located by name
     * ```
     * @param field - located by label|name|CSS|XPath|strict locator.
     * @returns automatically synchronized promise through #recorder
     */
    dontSeeCheckboxIsChecked(field: TestMaiT.LocatorOrString): Promise<void>;
    /**
     * Retrieves all texts from an element located by CSS or XPath and returns it to test.
     * Resumes test execution, so **should be used inside async with `await`** operator.
     *
     * ```js
     * let pins = await I.grabTextFromAll('#pin li');
     * ```
     * @param locator - element located by CSS|XPath|strict locator.
     * @returns attribute value
     */
    grabTextFromAll(locator: TestMaiT.LocatorOrString): Promise<string[]>;
    /**
     * Retrieves a text from an element located by CSS or XPath and returns it to test.
     * Resumes test execution, so **should be used inside async with `await`** operator.
     *
     * ```js
     * let pin = await I.grabTextFrom('#pin');
     * ```
     * If multiple elements found returns first element.
     * @param locator - element located by CSS|XPath|strict locator.
     * @returns attribute value
     */
    grabTextFrom(locator: TestMaiT.LocatorOrString): Promise<string>;
    /**
     * Retrieves all the innerHTML from elements located by CSS or XPath and returns it to test.
     * Resumes test execution, so **should be used inside async function with `await`** operator.
     *
     * ```js
     * let postHTMLs = await I.grabHTMLFromAll('.post');
     * ```
     * @param element - located by CSS|XPath|strict locator.
     * @returns HTML code for an element
     */
    grabHTMLFromAll(element: TestMaiT.LocatorOrString): Promise<string[]>;
    /**
     * Retrieves the innerHTML from an element located by CSS or XPath and returns it to test.
     * Resumes test execution, so **should be used inside async function with `await`** operator.
     * If more than one element is found - HTML of first element is returned.
     *
     * ```js
     * let postHTML = await I.grabHTMLFrom('#post');
     * ```
     * @param element - located by CSS|XPath|strict locator.
     * @returns HTML code for an element
     */
    grabHTMLFrom(element: TestMaiT.LocatorOrString): Promise<string>;
    /**
     * Retrieves an array of value from a form located by CSS or XPath and returns it to test.
     * Resumes test execution, so **should be used inside async function with `await`** operator.
     *
     * ```js
     * let inputs = await I.grabValueFromAll('//form/input');
     * ```
     * @param locator - field located by label|name|CSS|XPath|strict locator.
     * @returns attribute value
     */
    grabValueFromAll(locator: TestMaiT.LocatorOrString): Promise<string[]>;
    /**
     * Retrieves a value from a form element located by CSS or XPath and returns it to test.
     * Resumes test execution, so **should be used inside async function with `await`** operator.
     * If more than one element is found - value of first element is returned.
     *
     * ```js
     * let email = await I.grabValueFrom('input[name=email]');
     * ```
     * @param locator - field located by label|name|CSS|XPath|strict locator.
     * @returns attribute value
     */
    grabValueFrom(locator: TestMaiT.LocatorOrString): Promise<string>;
    /**
     * Grab array of CSS properties for given locator
     * Resumes test execution, so **should be used inside an async function with `await`** operator.
     *
     * ```js
     * const values = await I.grabCssPropertyFromAll('h3', 'font-weight');
     * ```
     * @param locator - element located by CSS|XPath|strict locator.
     * @param cssProperty - CSS property name.
     * @returns CSS value
     */
    grabCssPropertyFromAll(
      locator: TestMaiT.LocatorOrString,
      cssProperty: string,
    ): Promise<string[]>;
    /**
     * Grab CSS property for given locator
     * Resumes test execution, so **should be used inside an async function with `await`** operator.
     * If more than one element is found - value of first element is returned.
     *
     * ```js
     * const value = await I.grabCssPropertyFrom('h3', 'font-weight');
     * ```
     * @param locator - element located by CSS|XPath|strict locator.
     * @param cssProperty - CSS property name.
     * @returns CSS value
     */
    grabCssPropertyFrom(locator: TestMaiT.LocatorOrString, cssProperty: string): Promise<string>;
    /**
     * Retrieves an array of attributes from elements located by CSS or XPath and returns it to test.
     * Resumes test execution, so **should be used inside async with `await`** operator.
     *
     * ```js
     * let hints = await I.grabAttributeFromAll('.tooltip', 'title');
     * ```
     * @param locator - element located by CSS|XPath|strict locator.
     * @param attr - attribute name.
     * @returns attribute value
     */
    grabAttributeFromAll(locator: TestMaiT.LocatorOrString, attr: string): Promise<string[]>;
    /**
     * Retrieves an attribute from an element located by CSS or XPath and returns it to test.
     * Resumes test execution, so **should be used inside async with `await`** operator.
     * If more than one element is found - attribute of first element is returned.
     *
     * ```js
     * let hint = await I.grabAttributeFrom('#tooltip', 'title');
     * ```
     * @param locator - element located by CSS|XPath|strict locator.
     * @param attr - attribute name.
     * @returns attribute value
     */
    grabAttributeFrom(locator: TestMaiT.LocatorOrString, attr: string): Promise<string>;
    /**
     * Checks that title contains text.
     *
     * ```js
     * I.seeInTitle('Home Page');
     * ```
     * @param text - text value to check.
     * @returns automatically synchronized promise through #recorder
     */
    seeInTitle(text: string): Promise<void>;
    /**
     * Checks that title is equal to provided one.
     *
     * ```js
     * I.seeTitleEquals('Test title.');
     * ```
     * @param text - value to check.
     * @returns automatically synchronized promise through #recorder
     */
    seeTitleEquals(text: string): Promise<void>;
    /**
     * Checks that title does not contain text.
     *
     * ```js
     * I.dontSeeInTitle('Error');
     * ```
     * @param text - value to check.
     * @returns automatically synchronized promise through #recorder
     */
    dontSeeInTitle(text: string): Promise<void>;
    /**
     * Retrieves a page title and returns it to test.
     * Resumes test execution, so **should be used inside async with `await`** operator.
     *
     * ```js
     * let title = await I.grabTitle();
     * ```
     * @returns title
     */
    grabTitle(): Promise<string>;
    /**
     * Checks that a given Element is visible
     * Element is located by CSS or XPath.
     *
     * ```js
     * I.seeElement('#modal');
     * ```
     * @param locator - located by CSS|XPath|strict locator.
     * @returns automatically synchronized promise through #recorder
     */
    seeElement(locator: TestMaiT.LocatorOrString): Promise<void>;
    /**
     * Opposite to `seeElement`. Checks that element is not visible (or in DOM)
     *
     * ```js
     * I.dontSeeElement('.modal'); // modal is not shown
     * ```
     * @param locator - located by CSS|XPath|Strict locator.
     * @returns automatically synchronized promise through #recorder
     */
    dontSeeElement(locator: TestMaiT.LocatorOrString): Promise<void>;
    /**
     * Checks that a given Element is present in the DOM
     * Element is located by CSS or XPath.
     *
     * ```js
     * I.seeElementInDOM('#modal');
     * ```
     * @param locator - element located by CSS|XPath|strict locator.
     * @returns automatically synchronized promise through #recorder
     */
    seeElementInDOM(locator: TestMaiT.LocatorOrString): Promise<void>;
    /**
     * Opposite to `seeElementInDOM`. Checks that element is not on page.
     *
     * ```js
     * I.dontSeeElementInDOM('.nav'); // checks that element is not on page visible or not
     * ```
     * @param locator - located by CSS|XPath|Strict locator.
     * @returns automatically synchronized promise through #recorder
     */
    dontSeeElementInDOM(locator: TestMaiT.LocatorOrString): Promise<void>;
    /**
     * Checks that the current page contains the given string in its raw source code.
     *
     * ```js
     * I.seeInSource('<h1>Green eggs &amp; ham</h1>');
     * ```
     * @param text - value to check.
     * @returns automatically synchronized promise through #recorder
     */
    seeInSource(text: string): Promise<void>;
    /**
     * Retrieves page source and returns it to test.
     * Resumes test execution, so **should be used inside async function with `await`** operator.
     *
     * ```js
     * let pageSource = await I.grabSource();
     * ```
     * @returns source code
     */
    grabSource(): Promise<string>;
    /**
     * Checks that the current page does not contains the given string in its raw source code.
     *
     * ```js
     * I.dontSeeInSource('<!--'); // no comments in source
     * ```
     * @param value - to check.
     * @returns automatically synchronized promise through #recorder
     */
    dontSeeInSource(value: string): Promise<void>;
    /**
     * Asserts that an element appears a given number of times in the DOM.
     * Element is located by label or name or CSS or XPath.
     *
     *
     * ```js
     * I.seeNumberOfElements('#submitBtn', 1);
     * ```
     * @param locator - element located by CSS|XPath|strict locator.
     * @param num - number of elements.
     * @returns automatically synchronized promise through #recorder
     */
    seeNumberOfElements(locator: TestMaiT.LocatorOrString, num: number): Promise<void>;
    /**
     * Asserts that an element is visible a given number of times.
     * Element is located by CSS or XPath.
     *
     * ```js
     * I.seeNumberOfVisibleElements('.buttons', 3);
     * ```
     * @param locator - element located by CSS|XPath|strict locator.
     * @param num - number of elements.
     * @returns automatically synchronized promise through #recorder
     */
    seeNumberOfVisibleElements(locator: TestMaiT.LocatorOrString, num: number): Promise<void>;
    /**
     * Grab number of visible elements by locator.
     * Resumes test execution, so **should be used inside async function with `await`** operator.
     *
     * ```js
     * let numOfElements = await I.grabNumberOfVisibleElements('p');
     * ```
     * @param locator - located by CSS|XPath|strict locator.
     * @returns number of visible elements
     */
    grabNumberOfVisibleElements(locator: TestMaiT.LocatorOrString): Promise<number>;
    /**
     * Checks that all elements with given locator have given CSS properties.
     *
     * ```js
     * I.seeCssPropertiesOnElements('h3', { 'font-weight': "bold"});
     * ```
     * @param locator - located by CSS|XPath|strict locator.
     * @param cssProperties - object with CSS properties and their values to check.
     * @returns automatically synchronized promise through #recorder
     */
    seeCssPropertiesOnElements(
      locator: TestMaiT.LocatorOrString,
      cssProperties: any,
    ): Promise<void>;
    /**
     * Checks that all elements with given locator have given attributes.
     *
     * ```js
     * I.seeAttributesOnElements('//form', { method: "post"});
     * ```
     * @param locator - located by CSS|XPath|strict locator.
     * @param attributes - attributes and their values to check.
     * @returns automatically synchronized promise through #recorder
     */
    seeAttributesOnElements(locator: TestMaiT.LocatorOrString, attributes: any): Promise<void>;
    /**
     * Executes sync script on a page.
     * Pass arguments to function as additional parameters.
     * Will return execution result to a test.
     * In this case you should use async function and await to receive results.
     *
     * Example with jQuery DatePicker:
     *
     * ```js
     * // change date of jQuery DatePicker
     * I.executeScript(function() {
     *   // now we are inside browser context
     *   $('date').datetimepicker('setDate', new Date());
     * });
     * ```
     * Can return values. Don't forget to use `await` to get them.
     *
     * ```js
     * let date = await I.executeScript(function(el) {
     *   // only basic types can be returned
     *   return $(el).datetimepicker('getDate').toString();
     * }, '#date'); // passing jquery selector
     * ```
     * @param fn - function to be executed in browser context.
     * @param args - to be passed to function.
     * @returns script return value
     */
    executeScript(fn: string | ((...params: any[]) => any), ...args: any[]): Promise<any>;
    /**
     * Executes async script on page.
     * Provided function should execute a passed callback (as first argument) to signal it is finished.
     *
     * Example: In Vue.js to make components completely rendered we are waiting for [nextTick](https://vuejs.org/v2/api/#Vue-nextTick).
     *
     * ```js
     * I.executeAsyncScript(function(done) {
     *   Vue.nextTick(done); // waiting for next tick
     * });
     * ```
     *
     * By passing value to `done()` function you can return values.
     * Additional arguments can be passed as well, while `done` function is always last parameter in arguments list.
     *
     * ```js
     * let val = await I.executeAsyncScript(function(url, done) {
     *   // in browser context
     *   $.ajax(url, { success: (data) => done(data); }
     * }, 'http://ajax.callback.url/');
     * ```
     * @param fn - function to be executed in browser context.
     * @param args - to be passed to function.
     * @returns script return value
     */
    executeAsyncScript(fn: string | ((...params: any[]) => any), ...args: any[]): Promise<any>;
    /**
     * Checks that current url contains a provided fragment.
     *
     * ```js
     * I.seeInCurrentUrl('/register'); // we are on registration page
     * ```
     * @param url - a fragment to check
     * @returns automatically synchronized promise through #recorder
     */
    seeInCurrentUrl(url: string): Promise<void>;
    /**
     * Checks that current url does not contain a provided fragment.
     * @param url - value to check.
     * @returns automatically synchronized promise through #recorder
     */
    dontSeeInCurrentUrl(url: string): Promise<void>;
    /**
     * Checks that current url is equal to provided one.
     * If a relative url provided, a configured url will be prepended to it.
     * So both examples will work:
     *
     * ```js
     * I.seeCurrentUrlEquals('/register');
     * I.seeCurrentUrlEquals('http://my.site.com/register');
     * ```
     * @param url - value to check.
     * @returns automatically synchronized promise through #recorder
     */
    seeCurrentUrlEquals(url: string): Promise<void>;
    /**
     * Checks that current url is not equal to provided one.
     * If a relative url provided, a configured url will be prepended to it.
     *
     * ```js
     * I.dontSeeCurrentUrlEquals('/login'); // relative url are ok
     * I.dontSeeCurrentUrlEquals('http://mysite.com/login'); // absolute urls are also ok
     * ```
     * @param url - value to check.
     * @returns automatically synchronized promise through #recorder
     */
    dontSeeCurrentUrlEquals(url: string): Promise<void>;
    /**
     * Saves screenshot of the specified locator to ouput folder (set in testmait.conf.ts or testmait.conf.js).
     * Filename is relative to output folder.
     *
     * ```js
     * I.saveElementScreenshot(`#submit`,'debug.png');
     * ```
     * @param locator - element located by CSS|XPath|strict locator.
     * @param fileName - file name to save.
     * @returns automatically synchronized promise through #recorder
     */
    saveElementScreenshot(locator: TestMaiT.LocatorOrString, fileName: string): Promise<void>;
    /**
     * Saves a screenshot to ouput folder (set in testmait.conf.ts or testmait.conf.js).
     * Filename is relative to output folder.
     * Optionally resize the window to the full available page `scrollHeight` and `scrollWidth` to capture the entire page by passing `true` in as the second argument.
     *
     * ```js
     * I.saveScreenshot('debug.png');
     * I.saveScreenshot('debug.png', true) //resizes to available scrollHeight and scrollWidth before taking screenshot
     * ```
     * @param fileName - file name to save.
     * @param [fullPage = false] - (optional, `false` by default) flag to enable fullscreen screenshot mode.
     * @returns automatically synchronized promise through #recorder
     */
    saveScreenshot(fileName: string, fullPage?: boolean): Promise<void>;
    /**
     * Clears a cookie by name,
     * if none provided clears all cookies.
     *
     * ```js
     * I.clearCookie();
     * I.clearCookie('test');
     * ```
     * @param [cookie = null] - (optional, `null` by default) cookie name
     * @returns automatically synchronized promise through #recorder
     */
    clearCookie(cookie?: string): Promise<void>;
    /**
     * Checks that cookie with given name exists.
     *
     * ```js
     * I.seeCookie('Auth');
     * ```
     * @param name - cookie name.
     * @returns automatically synchronized promise through #recorder
     */
    seeCookie(name: string): Promise<void>;
    /**
     * Checks that cookie with given name does not exist.
     *
     * ```js
     * I.dontSeeCookie('auth'); // no auth cookie
     * ```
     * @param name - cookie name.
     * @returns automatically synchronized promise through #recorder
     */
    dontSeeCookie(name: string): Promise<void>;
    /**
     * Gets a cookie object by name.
     * If none provided gets all cookies.
     * Resumes test execution, so **should be used inside async function with `await`** operator.
     *
     * ```js
     * let cookie = await I.grabCookie('auth');
     * assert(cookie.value, '123456');
     * ```
     * @param [name = null] - cookie name.
     * @returns attribute value
     *
     *
     * Returns cookie in JSON [format](https://code.google.com/p/selenium/wiki/JsonWireProtocol#Cookie_JSON_Object).
     */
    grabCookie(name?: string): any;
    /**
     * Accepts the active JavaScript native popup window, as created by window.alert|window.confirm|window.prompt.
     * Don't confuse popups with modal windows, as created by [various
     * libraries](http://jster.net/category/windows-modals-popups). Appium: support only web testing
     */
    acceptPopup(): void;
    /**
     * Dismisses the active JavaScript popup, as created by window.alert|window.confirm|window.prompt.
     */
    cancelPopup(): void;
    /**
     * Checks that the active JavaScript popup, as created by `window.alert|window.confirm|window.prompt`, contains the
     * given string.
     *
     * ```js
     * I.seeInPopup('Popup text');
     * ```
     * @param text - value to check.
     * @returns automatically synchronized promise through #recorder
     */
    seeInPopup(text: string): Promise<void>;
    /**
     * Grab the text within the popup. If no popup is visible then it will return null
     *
     * ```js
     * await I.grabPopupText();
     * ```
     */
    grabPopupText(): void;
    /**
     * Resize the current window to provided width and height.
     * First parameter can be set to `maximize`.
     * @param width - width in pixels or `maximize`.
     * @param height - height in pixels.
     * @returns automatically synchronized promise through #recorder
     */
    resizeWindow(width: number, height: number): Promise<void>;
    /**
     * Drag an item to a destination element.
     *
     * ```js
     * I.dragAndDrop('#dragHandle', '#container');
     * ```
     * @param srcElement - located by CSS|XPath|strict locator.
     * @param destElement - located by CSS|XPath|strict locator.
     * @returns automatically synchronized promise through #recorder
     */
    dragAndDrop(srcElement: LocatorOrString, destElement: LocatorOrString): Promise<void>;
    /**
     * Close all tabs except for the current one.
     *
     * ```js
     * I.closeOtherTabs();
     * ```
     */
    closeOtherTabs(): void;
    /**
     * Close current tab
     *
     * ```js
     * I.closeCurrentTab();
     * ```
     */
    closeCurrentTab(): void;
    /**
     * Get the window handle relative to the current handle. i.e. the next handle or the previous.
     * @param offset - Offset from current handle index. i.e. offset < 0 will go to the previous handle and positive number will go to the next window handle in sequence.
     */
    _getWindowHandle(offset: number): void;
    /**
     * Open new tab and switch to it
     *
     * ```js
     * I.openNewTab();
     * ```
     */
    openNewTab(): void;
    /**
     * Switch focus to a particular tab by its number. It waits tabs loading and then switch tab
     *
     * ```js
     * I.switchToNextTab();
     * I.switchToNextTab(2);
     * ```
     */
    switchToNextTab(): void;
    /**
     * Switch focus to a particular tab by its number. It waits tabs loading and then switch tab
     *
     * ```js
     * I.switchToPreviousTab();
     * I.switchToPreviousTab(2);
     * ```
     */
    switchToPreviousTab(): void;
    /**
     * Grab number of open tabs.
     * Resumes test execution, so **should be used inside async function with `await`** operator.
     *
     * ```js
     * let tabs = await I.grabNumberOfOpenTabs();
     * ```
     * @returns number of open tabs
     */
    grabNumberOfOpenTabs(): Promise<number>;
    /**
     * Switches frame or in case of null locator reverts to parent.
     *
     * ```js
     * I.switchTo('iframe'); // switch to first iframe
     * I.switchTo(); // switch back to main page
     * ```
     * @param [locator = null] - (optional, `null` by default) element located by CSS|XPath|strict locator.
     * @returns automatically synchronized promise through #recorder
     */
    switchTo(locator?: TestMaiT.LocatorOrString): Promise<void>;
    /**
     * Pauses execution for a number of seconds.
     *
     * ```js
     * I.wait(2); // wait 2 secs
     * ```
     * @param sec - number of second to wait.
     * @returns automatically synchronized promise through #recorder
     */
    wait(sec: number): Promise<void>;
    /**
     * Waits for element to be present on page (by default waits for 1sec).
     * Element can be located by CSS or XPath.
     *
     * ```js
     * I.waitForElement('.btn.continue');
     * I.waitForElement('.btn.continue', 5); // wait for 5 secs
     * ```
     * @param locator - element located by CSS|XPath|strict locator.
     * @param [sec = null] - (optional, `1` by default) time in seconds to wait
     * @returns automatically synchronized promise through #recorder
     */
    waitForElement(locator: TestMaiT.LocatorOrString, sec?: number): Promise<void>;
    /**
     * Waits for an element to become not attached to the DOM on a page (by default waits for 1sec).
     * Element can be located by CSS or XPath.
     *
     * ```js
     * I.waitForDetached('#popup');
     * ```
     * @param locator - element located by CSS|XPath|strict locator.
     * @param [sec = 1] - (optional, `1` by default) time in seconds to wait
     * @returns automatically synchronized promise through #recorder
     */
    waitForDetached(locator: TestMaiT.LocatorOrString, sec?: number): Promise<void>;
    /**
     * Waits for element to become clickable for number of seconds.
     *
     * ```js
     * I.waitForClickable('#link');
     * ```
     */
    waitForClickable(): void;
    /**
     * Waits for an element to become visible on a page (by default waits for 1sec).
     * Element can be located by CSS or XPath.
     *
     * ```js
     * I.waitForVisible('#popup');
     * ```
     * @param locator - element located by CSS|XPath|strict locator.
     * @param [sec = 1] - (optional, `1` by default) time in seconds to wait
     * @returns automatically synchronized promise through #recorder
     */
    waitForVisible(locator: TestMaiT.LocatorOrString, sec?: number): Promise<void>;
    /**
     * Waits for an element to hide (by default waits for 1sec).
     * Element can be located by CSS or XPath.
     *
     * ```js
     * I.waitToHide('#popup');
     * ```
     * @param locator - element located by CSS|XPath|strict locator.
     * @param [sec = 1] - (optional, `1` by default) time in seconds to wait
     * @returns automatically synchronized promise through #recorder
     */
    waitToHide(locator: TestMaiT.LocatorOrString, sec?: number): Promise<void>;
    /**
     * Waits for an element to be removed or become invisible on a page (by default waits for 1sec).
     * Element can be located by CSS or XPath.
     *
     * ```js
     * I.waitForInvisible('#popup');
     * ```
     * @param locator - element located by CSS|XPath|strict locator.
     * @param [sec = 1] - (optional, `1` by default) time in seconds to wait
     * @returns automatically synchronized promise through #recorder
     */
    waitForInvisible(locator: TestMaiT.LocatorOrString, sec?: number): Promise<void>;
    /**
     * Waits for a specified number of elements on the page.
     *
     * ```js
     * I.waitNumberOfVisibleElements('a', 3);
     * ```
     * @param locator - element located by CSS|XPath|strict locator.
     * @param num - number of elements.
     * @param [sec = 1] - (optional, `1` by default) time in seconds to wait
     * @returns automatically synchronized promise through #recorder
     */
    waitNumberOfVisibleElements(
      locator: TestMaiT.LocatorOrString,
      num: number,
      sec?: number,
    ): Promise<void>;
    /**
     * Waits for element to become enabled (by default waits for 1sec).
     * Element can be located by CSS or XPath.
     * @param locator - element located by CSS|XPath|strict locator.
     * @param [sec = 1] - (optional) time in seconds to wait, 1 by default.
     * @returns automatically synchronized promise through #recorder
     */
    waitForEnabled(locator: TestMaiT.LocatorOrString, sec?: number): Promise<void>;
    /**
     * Waits for the specified value to be in value attribute.
     *
     * ```js
     * I.waitForValue('//input', "GoodValue");
     * ```
     * @param field - input field.
     * @param value - expected value.
     * @param [sec = 1] - (optional, `1` by default) time in seconds to wait
     * @returns automatically synchronized promise through #recorder
     */
    waitForValue(field: LocatorOrString, value: string, sec?: number): Promise<void>;
    /**
     * Waits for a function to return true (waits for 1 sec by default).
     * Running in browser context.
     *
     * ```js
     * I.waitForFunction(fn[, [args[, timeout]])
     * ```
     *
     * ```js
     * I.waitForFunction(() => window.requests == 0);
     * I.waitForFunction(() => window.requests == 0, 5); // waits for 5 sec
     * I.waitForFunction((count) => window.requests == count, [3], 5) // pass args and wait for 5 sec
     * ```
     * @param fn - to be executed in browser context.
     * @param [argsOrSec = null] - (optional, `1` by default) arguments for function or seconds.
     * @param [sec = null] - (optional, `1` by default) time in seconds to wait
     * @returns automatically synchronized promise through #recorder
     */
    waitForFunction(
      fn: string | ((...params: any[]) => any),
      argsOrSec?: any[] | number,
      sec?: number,
    ): Promise<void>;
    /**
     * Waiting for the part of the URL to match the expected. Useful for SPA to understand that page was changed.
     *
     * ```js
     * I.waitInUrl('/info', 2);
     * ```
     * @param urlPart - value to check.
     * @param [sec = 1] - (optional, `1` by default) time in seconds to wait
     * @returns automatically synchronized promise through #recorder
     */
    waitInUrl(urlPart: string, sec?: number): Promise<void>;
    /**
     * Waits for the entire URL to match the expected
     *
     * ```js
     * I.waitUrlEquals('/info', 2);
     * I.waitUrlEquals('http://127.0.0.1:8000/info');
     * ```
     * @param urlPart - value to check.
     * @param [sec = 1] - (optional, `1` by default) time in seconds to wait
     * @returns automatically synchronized promise through #recorder
     */
    waitUrlEquals(urlPart: string, sec?: number): Promise<void>;
    /**
     * Waits for a text to appear (by default waits for 1sec).
     * Element can be located by CSS or XPath.
     * Narrow down search results by providing context.
     *
     * ```js
     * I.waitForText('Thank you, form has been submitted');
     * I.waitForText('Thank you, form has been submitted', 5, '#modal');
     * ```
     * @param text - to wait for.
     * @param [sec = 1] - (optional, `1` by default) time in seconds to wait
     * @param [context = null] - (optional) element located by CSS|XPath|strict locator.
     * @returns automatically synchronized promise through #recorder
     */
    waitForText(text: string, sec?: number, context?: TestMaiT.LocatorOrString): Promise<void>;
    /**
     * Moves to url
     */
    moveTo(): void;
    /**
     * Reload the current page.
     *
     * ```js
     * I.refreshPage();
     * ```
     * @returns automatically synchronized promise through #recorder
     */
    refreshPage(): Promise<void>;
    /**
     * Reloads page
     */
    refresh(): void;
    /**
     * Scrolls to element matched by locator.
     * Extra shift can be set with offsetX and offsetY options.
     *
     * ```js
     * I.scrollTo('footer');
     * I.scrollTo('#submit', 5, 5);
     * ```
     * @param locator - located by CSS|XPath|strict locator.
     * @param [offsetX = 0] - (optional, `0` by default) X-axis offset.
     * @param [offsetY = 0] - (optional, `0` by default) Y-axis offset.
     * @returns automatically synchronized promise through #recorder
     */
    scrollTo(locator: TestMaiT.LocatorOrString, offsetX?: number, offsetY?: number): Promise<void>;
    /**
     * Scroll page to the top.
     *
     * ```js
     * I.scrollPageToTop();
     * ```
     * @returns automatically synchronized promise through #recorder
     */
    scrollPageToTop(): Promise<void>;
    /**
     * Scroll page to the bottom.
     *
     * ```js
     * I.scrollPageToBottom();
     * ```
     * @returns automatically synchronized promise through #recorder
     */
    scrollPageToBottom(): Promise<void>;
    /**
     * Retrieves a page scroll position and returns it to test.
     * Resumes test execution, so **should be used inside an async function with `await`** operator.
     *
     * ```js
     * let { x, y } = await I.grabPageScrollPosition();
     * ```
     * @returns scroll position
     */
    grabPageScrollPosition(): Promise<PageScrollPosition>;
    /**
     * Injects Angular module.
     *
     * ```js
     * I.haveModule('modName', function() {
     *   angular.module('modName', []).value('foo', 'bar');
     * });
     * ```
     */
    haveModule(): void;
    /**
     * Removes mocked Angular module. If modName not specified - clears all mock modules.
     *
     * ```js
     * I.resetModule(); // clears all
     * I.resetModule('modName');
     * ```
     */
    resetModule(): void;
    /**
     * Sets cookie(s).
     *
     * Can be a single cookie object or an array of cookies:
     *
     * ```js
     * I.setCookie({name: 'auth', value: true});
     *
     * // as array
     * I.setCookie([
     *   {name: 'auth', value: true},
     *   {name: 'agree', value: true}
     * ]);
     * ```
     * @param cookie - a cookie object or array of cookie objects.
     * @returns automatically synchronized promise through #recorder
     */
    setCookie(cookie: Cookie | Cookie[]): Promise<void>;
  }
  /**
   * ## Configuration
   *
   * This helper should be configured in testmait.conf.js
   * @property url - base url of website to be tested
   * @property [basicAuth] - (optional) the basic authentication to pass to base url. Example: {username: 'username', password: 'password'}
   * @property [show] - show Google Chrome window for debug.
   * @property [restart = true] - restart browser between tests.
   * @property [disableScreenshots = false] - don't save screenshot on failure.
   * @property [fullPageScreenshots = false] - make full page screenshots on failure.
   * @property [uniqueScreenshotNames = false] - option to prevent screenshot override if you have scenarios with the same name in different suites.
   * @property [trace = false] - record [tracing information](https://pptr.dev/api/puppeteer.tracing) with screenshots.
   * @property [keepTraceForPassedTests = false] - save trace for passed tests.
   * @property [keepBrowserState = false] - keep browser state between tests when `restart` is set to false.
   * @property [keepCookies = false] - keep cookies between tests when `restart` is set to false.
   * @property [waitForAction = 100] - how long to wait after click, doubleClick or PressKey actions in ms. Default: 100.
   * @property [waitForNavigation = load] - when to consider navigation succeeded. Possible options: `load`, `domcontentloaded`, `networkidle0`, `networkidle2`. See [Puppeteer API](https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#pagewaitfornavigationoptions). Array values are accepted as well.
   * @property [pressKeyDelay = 10] - delay between key presses in ms. Used when calling Puppeteers page.type(...) in fillField/appendField
   * @property [getPageTimeout = 30000] - config option to set maximum navigation time in milliseconds. If the timeout is set to 0, then timeout will be disabled.
   * @property [waitForTimeout = 1000] - default wait* timeout in ms.
   * @property [windowSize] - default window size. Set a dimension in format WIDTHxHEIGHT like `640x480`.
   * @property [userAgent] - user-agent string.
   * @property [manualStart = false] - do not start browser before a test, start it manually inside a helper with `this.helpers["Puppeteer"]._startBrowser()`.
   * @property [browser = chrome] - can be changed to `firefox` when using [puppeteer-firefox](https://testmait.io/helpers/Puppeteer-firefox).
   * @property [chrome] - pass additional [Puppeteer run options](https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#puppeteerlaunchoptions).
   * @property [highlightElement] - highlight the interacting elements. Default: false. Note: only activate under verbose mode (--verbose).
   */
  type PuppeteerConfig = {
    url: string;
    basicAuth?: any;
    show?: boolean;
    restart?: boolean;
    disableScreenshots?: boolean;
    fullPageScreenshots?: boolean;
    uniqueScreenshotNames?: boolean;
    trace?: boolean;
    keepTraceForPassedTests?: boolean;
    keepBrowserState?: boolean;
    keepCookies?: boolean;
    waitForAction?: number;
    waitForNavigation?: string;
    pressKeyDelay?: number;
    getPageTimeout?: number;
    waitForTimeout?: number;
    windowSize?: string;
    userAgent?: string;
    manualStart?: boolean;
    browser?: string;
    chrome?: any;
    highlightElement?: boolean;
  };
  /**
   * Uses [Google Chrome's Puppeteer](https://github.com/GoogleChrome/puppeteer) library to run tests inside headless Chrome.
   * Browser control is executed via DevTools Protocol (instead of Selenium).
   * This helper works with a browser out of the box with no additional tools required to install.
   *
   * Requires `puppeteer` or `puppeteer-core` package to be installed.
   * ```
   * npm i puppeteer --save
   * ```
   * or
   * ```
   * npm i puppeteer-core --save
   * ```
   * Using `puppeteer-core` package, will prevent the download of browser binaries and allow connecting to an existing browser installation or for connecting to a remote one.
   *
   * > Experimental Firefox support [can be activated](https://testmait.io/helpers/Puppeteer-firefox).
   *
   * <!-- configuration -->
   *
   * #### Trace Recording Customization
   *
   * Trace recording provides complete information on test execution and includes screenshots, and network requests logged during run.
   * Traces will be saved to `output/trace`
   *
   * * `trace`: enables trace recording for failed tests; trace are saved into `output/trace` folder
   * * `keepTraceForPassedTests`: - save trace for passed tests
   *
   * #### Example #1: Wait for 0 network connections.
   *
   * ```js
   * {
   *    helpers: {
   *      Puppeteer : {
   *        url: "http://localhost",
   *        restart: false,
   *        waitForNavigation: "networkidle0",
   *        waitForAction: 500
   *      }
   *    }
   * }
   * ```
   *
   * #### Example #2: Wait for DOMContentLoaded event and 0 network connections
   *
   * ```js
   * {
   *    helpers: {
   *      Puppeteer : {
   *        url: "http://localhost",
   *        restart: false,
   *        waitForNavigation: [ "domcontentloaded", "networkidle0" ],
   *        waitForAction: 500
   *      }
   *    }
   * }
   * ```
   *
   * #### Example #3: Debug in window mode
   *
   * ```js
   * {
   *    helpers: {
   *      Puppeteer : {
   *        url: "http://localhost",
   *        show: true
   *      }
   *    }
   * }
   * ```
   *
   * #### Example #4: Connect to remote browser by specifying [websocket endpoint](https://chromedevtools.github.io/devtools-protocol/#how-do-i-access-the-browser-target)
   *
   * ```js
   * {
   *    helpers: {
   *      Puppeteer: {
   *        url: "http://localhost",
   *        chrome: {
   *          browserWSEndpoint: "ws://localhost:9222/devtools/browser/c5aa6160-b5bc-4d53-bb49-6ecb36cd2e0a"
   *        }
   *      }
   *    }
   * }
   * ```
   * > Note: When connecting to remote browser `show` and specific `chrome` options (e.g. `headless` or `devtools`) are ignored.
   *
   * #### Example #5: Target URL with provided basic authentication
   *
   * ```js
   * {
   *    helpers: {
   *      Puppeteer : {
   *        url: 'http://localhost',
   *        basicAuth: {username: 'username', password: 'password'},
   *        show: true
   *      }
   *    }
   * }
   * ```
   * #### Troubleshooting
   *
   * Error Message:  `No usable sandbox!`
   *
   * When running Puppeteer on CI try to disable sandbox if you see that message
   *
   * ```
   * helpers: {
   *  Puppeteer: {
   *     url: 'http://localhost',
   *     show: false,
   *     chrome: {
   *       args: ['--no-sandbox', '--disable-setuid-sandbox']
   *     }
   *   },
   * }
   * ```
   *
   *
   *
   * ## Access From Helpers
   *
   * Receive Puppeteer client from a custom helper by accessing `browser` for the Browser object or `page` for the current Page object:
   *
   * ```js
   * const { browser } = this.helpers.Puppeteer;
   * await browser.pages(); // List of pages in the browser
   *
   * const { page } = this.helpers.Puppeteer;
   * await page.url(); // Get the url of the current page
   * ```
   *
   * ## Methods
   */
  class Puppeteer {
    /**
     * Use Puppeteer API inside a test.
     *
     * First argument is a description of an action.
     * Second argument is async function that gets this helper as parameter.
     *
     * { [`page`](https://github.com/puppeteer/puppeteer/blob/master/docs/api.md#class-page), [`browser`](https://github.com/puppeteer/puppeteer/blob/master/docs/api.md#class-browser) } from Puppeteer API are available.
     *
     * ```js
     * I.usePuppeteerTo('emulate offline mode', async ({ page }) {
     *   await page.setOfflineMode(true);
     * });
     * ```
     * @param description - used to show in logs.
     * @param fn - async function that is executed with Puppeteer as argument
     */
    usePuppeteerTo(description: string, fn: (...params: any[]) => any): void;
    /**
     * Set the automatic popup response to Accept.
     * This must be set before a popup is triggered.
     *
     * ```js
     * I.amAcceptingPopups();
     * I.click('#triggerPopup');
     * I.acceptPopup();
     * ```
     */
    amAcceptingPopups(): void;
    /**
     * Accepts the active JavaScript native popup window, as created by window.alert|window.confirm|window.prompt.
     * Don't confuse popups with modal windows, as created by [various
     * libraries](http://jster.net/category/windows-modals-popups).
     */
    acceptPopup(): void;
    /**
     * Set the automatic popup response to Cancel/Dismiss.
     * This must be set before a popup is triggered.
     *
     * ```js
     * I.amCancellingPopups();
     * I.click('#triggerPopup');
     * I.cancelPopup();
     * ```
     */
    amCancellingPopups(): void;
    /**
     * Dismisses the active JavaScript popup, as created by window.alert|window.confirm|window.prompt.
     */
    cancelPopup(): void;
    /**
     * Checks that the active JavaScript popup, as created by `window.alert|window.confirm|window.prompt`, contains the
     * given string.
     *
     * ```js
     * I.seeInPopup('Popup text');
     * ```
     * @param text - value to check.
     * @returns automatically synchronized promise through #recorder
     */
    seeInPopup(text: string): Promise<void>;
    /**
     * Set current page
     * @param page - page to set
     */
    _setPage(page: any): void;
    /**
     * Add the 'dialog' event listener to a page
     */
    _addPopupListener(): void;
    /**
     * Gets page URL including hash.
     */
    _getPageUrl(): void;
    /**
     * Grab the text within the popup. If no popup is visible then it will return null
     *
     * ```js
     * await I.grabPopupText();
     * ```
     */
    grabPopupText(): Promise<string | null>;
    /**
     * Opens a web page in a browser. Requires relative or absolute url.
     * If url starts with `/`, opens a web page of a site defined in `url` config parameter.
     *
     * ```js
     * I.amOnPage('/'); // opens main page of website
     * I.amOnPage('https://github.com'); // opens github
     * I.amOnPage('/login'); // opens a login page
     * ```
     * @param url - url path or global url.
     * @returns automatically synchronized promise through #recorder
     */
    amOnPage(url: string): Promise<void>;
    /**
     * Resize the current window to provided width and height.
     * First parameter can be set to `maximize`.
     * @param width - width in pixels or `maximize`.
     * @param height - height in pixels.
     * @returns automatically synchronized promise through #recorder
     *
     *
     * Unlike other drivers Puppeteer changes the size of a viewport, not the window!
     * Puppeteer does not control the window of a browser so it can't adjust its real size.
     * It also can't maximize a window.
     */
    resizeWindow(width: number, height: number): Promise<void>;
    /**
     * Set headers for all next requests
     *
     * ```js
     * I.setPuppeteerRequestHeaders({
     *    'X-Sent-By': 'TestMaiT',
     * });
     * ```
     * @param customHeaders - headers to set
     */
    setPuppeteerRequestHeaders(customHeaders: any): void;
    /**
     * Moves cursor to element matched by locator.
     * Extra shift can be set with offsetX and offsetY options.
     *
     * ```js
     * I.moveCursorTo('.tooltip');
     * I.moveCursorTo('#submit', 5,5);
     * ```
     * @param locator - located by CSS|XPath|strict locator.
     * @param [offsetX = 0] - (optional, `0` by default) X-axis offset.
     * @param [offsetY = 0] - (optional, `0` by default) Y-axis offset.
     * @returns automatically synchronized promise through #recorder
     *
     * {{ react }}
     */
    moveCursorTo(
      locator: TestMaiT.LocatorOrString,
      offsetX?: number,
      offsetY?: number,
    ): Promise<void>;
    /**
     * Calls [focus](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/focus) on the matching element.
     *
     * Examples:
     *
     * ```js
     * I.dontSee('#add-to-cart-btn');
     * I.focus('#product-tile')
     * I.see('#add-to-cart-bnt');
     * ```
     * @param locator - field located by label|name|CSS|XPath|strict locator.
     * @param [options] - Playwright only: [Additional options](https://playwright.dev/docs/api/class-locator#locator-focus) for available options object as 2nd argument.
     * @returns automatically synchronized promise through #recorder
     */
    focus(locator: TestMaiT.LocatorOrString, options?: any): Promise<void>;
    /**
     * Remove focus from a text input, button, etc.
     * Calls [blur](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/focus) on the element.
     *
     * Examples:
     *
     * ```js
     * I.blur('.text-area')
     * ```
     * ```js
     * //element `#product-tile` is focused
     * I.see('#add-to-cart-btn');
     * I.blur('#product-tile')
     * I.dontSee('#add-to-cart-btn');
     * ```
     * @param locator - field located by label|name|CSS|XPath|strict locator.
     * @param [options] - Playwright only: [Additional options](https://playwright.dev/docs/api/class-locator#locator-blur) for available options object as 2nd argument.
     * @returns automatically synchronized promise through #recorder
     */
    blur(locator: TestMaiT.LocatorOrString, options?: any): Promise<void>;
    /**
     * Drag an item to a destination element.
     *
     * ```js
     * I.dragAndDrop('#dragHandle', '#container');
     * ```
     * @param srcElement - located by CSS|XPath|strict locator.
     * @param destElement - located by CSS|XPath|strict locator.
     * @returns automatically synchronized promise through #recorder
     */
    dragAndDrop(srcElement: LocatorOrString, destElement: LocatorOrString): Promise<void>;
    /**
     * Reload the current page.
     *
     * ```js
     * I.refreshPage();
     * ```
     * @returns automatically synchronized promise through #recorder
     */
    refreshPage(): Promise<void>;
    /**
     * Scroll page to the top.
     *
     * ```js
     * I.scrollPageToTop();
     * ```
     * @returns automatically synchronized promise through #recorder
     */
    scrollPageToTop(): Promise<void>;
    /**
     * Scroll page to the bottom.
     *
     * ```js
     * I.scrollPageToBottom();
     * ```
     * @returns automatically synchronized promise through #recorder
     */
    scrollPageToBottom(): Promise<void>;
    /**
     * Scrolls to element matched by locator.
     * Extra shift can be set with offsetX and offsetY options.
     *
     * ```js
     * I.scrollTo('footer');
     * I.scrollTo('#submit', 5, 5);
     * ```
     * @param locator - located by CSS|XPath|strict locator.
     * @param [offsetX = 0] - (optional, `0` by default) X-axis offset.
     * @param [offsetY = 0] - (optional, `0` by default) Y-axis offset.
     * @returns automatically synchronized promise through #recorder
     */
    scrollTo(locator: TestMaiT.LocatorOrString, offsetX?: number, offsetY?: number): Promise<void>;
    /**
     * Checks that title contains text.
     *
     * ```js
     * I.seeInTitle('Home Page');
     * ```
     * @param text - text value to check.
     * @returns automatically synchronized promise through #recorder
     */
    seeInTitle(text: string): Promise<void>;
    /**
     * Retrieves a page scroll position and returns it to test.
     * Resumes test execution, so **should be used inside an async function with `await`** operator.
     *
     * ```js
     * let { x, y } = await I.grabPageScrollPosition();
     * ```
     * @returns scroll position
     */
    grabPageScrollPosition(): Promise<PageScrollPosition>;
    /**
     * Checks that title is equal to provided one.
     *
     * ```js
     * I.seeTitleEquals('Test title.');
     * ```
     * @param text - value to check.
     * @returns automatically synchronized promise through #recorder
     */
    seeTitleEquals(text: string): Promise<void>;
    /**
     * Checks that title does not contain text.
     *
     * ```js
     * I.dontSeeInTitle('Error');
     * ```
     * @param text - value to check.
     * @returns automatically synchronized promise through #recorder
     */
    dontSeeInTitle(text: string): Promise<void>;
    /**
     * Retrieves a page title and returns it to test.
     * Resumes test execution, so **should be used inside async with `await`** operator.
     *
     * ```js
     * let title = await I.grabTitle();
     * ```
     * @returns title
     */
    grabTitle(): Promise<string>;
    /**
     * Get elements by different locator types, including strict locator
     * Should be used in custom helpers:
     *
     * ```js
     * const elements = await this.helpers['Puppeteer']._locate({name: 'password'});
     * ```
     *
     * {{ react }}
     */
    _locate(): void;
    /**
     * Find a checkbox by providing human readable text:
     * NOTE: Assumes the checkable element exists
     *
     * ```js
     * this.helpers['Puppeteer']._locateCheckable('I agree with terms and conditions').then // ...
     * ```
     */
    _locateCheckable(): void;
    /**
     * Find a clickable element by providing human readable text:
     *
     * ```js
     * this.helpers['Puppeteer']._locateClickable('Next page').then // ...
     * ```
     */
    _locateClickable(): void;
    /**
     * Find field elements by providing human readable text:
     *
     * ```js
     * this.helpers['Puppeteer']._locateFields('Your email').then // ...
     * ```
     */
    _locateFields(): void;
    /**
     * Switch focus to a particular tab by its number. It waits tabs loading and then switch tab
     *
     * ```js
     * I.switchToNextTab();
     * I.switchToNextTab(2);
     * ```
     */
    switchToNextTab(num?: number): void;
    /**
     * Switch focus to a particular tab by its number. It waits tabs loading and then switch tab
     *
     * ```js
     * I.switchToPreviousTab();
     * I.switchToPreviousTab(2);
     * ```
     */
    switchToPreviousTab(num?: number): void;
    /**
     * Close current tab and switches to previous.
     *
     * ```js
     * I.closeCurrentTab();
     * ```
     */
    closeCurrentTab(): void;
    /**
     * Close all tabs except for the current one.
     *
     * ```js
     * I.closeOtherTabs();
     * ```
     */
    closeOtherTabs(): void;
    /**
     * Open new tab and switch to it
     *
     * ```js
     * I.openNewTab();
     * ```
     */
    openNewTab(): void;
    /**
     * Grab number of open tabs.
     * Resumes test execution, so **should be used inside async function with `await`** operator.
     *
     * ```js
     * let tabs = await I.grabNumberOfOpenTabs();
     * ```
     * @returns number of open tabs
     */
    grabNumberOfOpenTabs(): Promise<number>;
    /**
     * Checks that a given Element is visible
     * Element is located by CSS or XPath.
     *
     * ```js
     * I.seeElement('#modal');
     * ```
     * @param locator - located by CSS|XPath|strict locator.
     * @returns automatically synchronized promise through #recorder
     *
     * {{ react }}
     */
    seeElement(locator: TestMaiT.LocatorOrString): Promise<void>;
    /**
     * Opposite to `seeElement`. Checks that element is not visible (or in DOM)
     *
     * ```js
     * I.dontSeeElement('.modal'); // modal is not shown
     * ```
     * @param locator - located by CSS|XPath|Strict locator.
     * @returns automatically synchronized promise through #recorder
     *
     * {{ react }}
     */
    dontSeeElement(locator: TestMaiT.LocatorOrString): Promise<void>;
    /**
     * Checks that a given Element is present in the DOM
     * Element is located by CSS or XPath.
     *
     * ```js
     * I.seeElementInDOM('#modal');
     * ```
     * @param locator - element located by CSS|XPath|strict locator.
     * @returns automatically synchronized promise through #recorder
     */
    seeElementInDOM(locator: TestMaiT.LocatorOrString): Promise<void>;
    /**
     * Opposite to `seeElementInDOM`. Checks that element is not on page.
     *
     * ```js
     * I.dontSeeElementInDOM('.nav'); // checks that element is not on page visible or not
     * ```
     * @param locator - located by CSS|XPath|Strict locator.
     * @returns automatically synchronized promise through #recorder
     */
    dontSeeElementInDOM(locator: TestMaiT.LocatorOrString): Promise<void>;
    /**
     * Perform a click on a link or a button, given by a locator.
     * If a fuzzy locator is given, the page will be searched for a button, link, or image matching the locator string.
     * For buttons, the "value" attribute, "name" attribute, and inner text are searched. For links, the link text is searched.
     * For images, the "alt" attribute and inner text of any parent links are searched.
     *
     * The second parameter is a context (CSS or XPath locator) to narrow the search.
     *
     * ```js
     * // simple link
     * I.click('Logout');
     * // button of form
     * I.click('Submit');
     * // CSS button
     * I.click('#form input[type=submit]');
     * // XPath
     * I.click('//form/*[@type=submit]');
     * // link in context
     * I.click('Logout', '#nav');
     * // using strict locator
     * I.click({css: 'nav a.login'});
     * ```
     * @param locator - clickable link or button located by text, or any element located by CSS|XPath|strict locator.
     * @param [context = null] - (optional, `null` by default) element to search in CSS|XPath|Strict locator.
     * @returns automatically synchronized promise through #recorder
     *
     *
     * {{ react }}
     */
    click(
      locator: TestMaiT.LocatorOrString,
      context?: TestMaiT.LocatorOrString | null,
    ): Promise<void>;
    /**
     * Perform an emulated click on a link or a button, given by a locator.
     * Unlike normal click instead of sending native event, emulates a click with JavaScript.
     * This works on hidden, animated or inactive elements as well.
     *
     * If a fuzzy locator is given, the page will be searched for a button, link, or image matching the locator string.
     * For buttons, the "value" attribute, "name" attribute, and inner text are searched. For links, the link text is searched.
     * For images, the "alt" attribute and inner text of any parent links are searched.
     *
     * The second parameter is a context (CSS or XPath locator) to narrow the search.
     *
     * ```js
     * // simple link
     * I.forceClick('Logout');
     * // button of form
     * I.forceClick('Submit');
     * // CSS button
     * I.forceClick('#form input[type=submit]');
     * // XPath
     * I.forceClick('//form/*[@type=submit]');
     * // link in context
     * I.forceClick('Logout', '#nav');
     * // using strict locator
     * I.forceClick({css: 'nav a.login'});
     * ```
     * @param locator - clickable link or button located by text, or any element located by CSS|XPath|strict locator.
     * @param [context = null] - (optional, `null` by default) element to search in CSS|XPath|Strict locator.
     * @returns automatically synchronized promise through #recorder
     *
     *
     * {{ react }}
     */
    forceClick(
      locator: TestMaiT.LocatorOrString,
      context?: TestMaiT.LocatorOrString,
    ): Promise<void>;
    /**
     * Performs a click on a link and waits for navigation before moving on.
     *
     * ```js
     * I.clickLink('Logout', '#nav');
     * ```
     * @param locator - clickable link or button located by text, or any element located by CSS|XPath|strict locator
     * @param [context = null] - (optional, `null` by default) element to search in CSS|XPath|Strict locator
     * @returns automatically synchronized promise through #recorder
     *
     *
     * {{ react }}
     */
    clickLink(locator: TestMaiT.LocatorOrString, context?: TestMaiT.LocatorOrString): Promise<void>;
    /**
     * Sets a directory to where save files. Allows to test file downloads.
     * Should be used with [FileSystem helper](https://testmait.io/helpers/FileSystem) to check that file were downloaded correctly.
     *
     * By default files are saved to `output/downloads`.
     * This directory is cleaned on every `handleDownloads` call, to ensure no old files are kept.
     *
     * ```js
     * I.handleDownloads();
     * I.click('Download Avatar');
     * I.amInPath('output/downloads');
     * I.seeFile('avatar.jpg');
     *
     * ```
     * @param [downloadPath = 'downloads'] - change this parameter to set another directory for saving
     */
    handleDownloads(downloadPath?: string): void;
    /**
     * This method is **deprecated**.
     *
     * Please use `handleDownloads()` instead.
     */
    downloadFile(): void;
    /**
     * Performs a double-click on an element matched by link|button|label|CSS or XPath.
     * Context can be specified as second parameter to narrow search.
     *
     * ```js
     * I.doubleClick('Edit');
     * I.doubleClick('Edit', '.actions');
     * I.doubleClick({css: 'button.accept'});
     * I.doubleClick('.btn.edit');
     * ```
     * @param locator - clickable link or button located by text, or any element located by CSS|XPath|strict locator.
     * @param [context = null] - (optional, `null` by default) element to search in CSS|XPath|Strict locator.
     * @returns automatically synchronized promise through #recorder
     *
     *
     * {{ react }}
     */
    doubleClick(
      locator: TestMaiT.LocatorOrString,
      context?: TestMaiT.LocatorOrString,
    ): Promise<void>;
    /**
     * Performs right click on a clickable element matched by semantic locator, CSS or XPath.
     *
     * ```js
     * // right click element with id el
     * I.rightClick('#el');
     * // right click link or button with text "Click me"
     * I.rightClick('Click me');
     * // right click button with text "Click me" inside .context
     * I.rightClick('Click me', '.context');
     * ```
     * @param locator - clickable element located by CSS|XPath|strict locator.
     * @param [context = null] - (optional, `null` by default) element located by CSS|XPath|strict locator.
     * @returns automatically synchronized promise through #recorder
     *
     *
     * {{ react }}
     */
    rightClick(
      locator: TestMaiT.LocatorOrString,
      context?: TestMaiT.LocatorOrString,
    ): Promise<void>;
    /**
     * Selects a checkbox or radio button.
     * Element is located by label or name or CSS or XPath.
     *
     * The second parameter is a context (CSS or XPath locator) to narrow the search.
     *
     * ```js
     * I.checkOption('#agree');
     * I.checkOption('I Agree to Terms and Conditions');
     * I.checkOption('agree', '//form');
     * ```
     * @param field - checkbox located by label | name | CSS | XPath | strict locator.
     * @param [context = null] - (optional, `null` by default) element located by CSS | XPath | strict locator.
     * @returns automatically synchronized promise through #recorder
     */
    checkOption(field: TestMaiT.LocatorOrString, context?: TestMaiT.LocatorOrString): Promise<void>;
    /**
     * Unselects a checkbox or radio button.
     * Element is located by label or name or CSS or XPath.
     *
     * The second parameter is a context (CSS or XPath locator) to narrow the search.
     *
     * ```js
     * I.uncheckOption('#agree');
     * I.uncheckOption('I Agree to Terms and Conditions');
     * I.uncheckOption('agree', '//form');
     * ```
     * @param field - checkbox located by label | name | CSS | XPath | strict locator.
     * @param [context = null] - (optional, `null` by default) element located by CSS | XPath | strict locator.
     * @returns automatically synchronized promise through #recorder
     */
    uncheckOption(
      field: TestMaiT.LocatorOrString,
      context?: TestMaiT.LocatorOrString,
    ): Promise<void>;
    /**
     * Verifies that the specified checkbox is checked.
     *
     * ```js
     * I.seeCheckboxIsChecked('Agree');
     * I.seeCheckboxIsChecked('#agree'); // I suppose user agreed to terms
     * I.seeCheckboxIsChecked({css: '#signup_form input[type=checkbox]'});
     * ```
     * @param field - located by label|name|CSS|XPath|strict locator.
     * @returns automatically synchronized promise through #recorder
     */
    seeCheckboxIsChecked(field: TestMaiT.LocatorOrString): Promise<void>;
    /**
     * Verifies that the specified checkbox is not checked.
     *
     * ```js
     * I.dontSeeCheckboxIsChecked('#agree'); // located by ID
     * I.dontSeeCheckboxIsChecked('I agree to terms'); // located by label
     * I.dontSeeCheckboxIsChecked('agree'); // located by name
     * ```
     * @param field - located by label|name|CSS|XPath|strict locator.
     * @returns automatically synchronized promise through #recorder
     */
    dontSeeCheckboxIsChecked(field: TestMaiT.LocatorOrString): Promise<void>;
    /**
     * Presses a key in the browser and leaves it in a down state.
     *
     * To make combinations with modifier key and user operation (e.g. `'Control'` + [`click`](#click)).
     *
     * ```js
     * I.pressKeyDown('Control');
     * I.click('#element');
     * I.pressKeyUp('Control');
     * ```
     * @param key - name of key to press down.
     * @returns automatically synchronized promise through #recorder
     */
    pressKeyDown(key: string): Promise<void>;
    /**
     * Releases a key in the browser which was previously set to a down state.
     *
     * To make combinations with modifier key and user operation (e.g. `'Control'` + [`click`](#click)).
     *
     * ```js
     * I.pressKeyDown('Control');
     * I.click('#element');
     * I.pressKeyUp('Control');
     * ```
     * @param key - name of key to release.
     * @returns automatically synchronized promise through #recorder
     */
    pressKeyUp(key: string): Promise<void>;
    /**
     * Presses a key in the browser (on a focused element).
     *
     * _Hint:_ For populating text field or textarea, it is recommended to use [`fillField`](#fillfield).
     *
     * ```js
     * I.pressKey('Backspace');
     * ```
     *
     * To press a key in combination with modifier keys, pass the sequence as an array. All modifier keys (`'Alt'`, `'Control'`, `'Meta'`, `'Shift'`) will be released afterwards.
     *
     * ```js
     * I.pressKey(['Control', 'Z']);
     * ```
     *
     * For specifying operation modifier key based on operating system it is suggested to use `'CommandOrControl'`.
     * This will press `'Command'` (also known as `'Meta'`) on macOS machines and `'Control'` on non-macOS machines.
     *
     * ```js
     * I.pressKey(['CommandOrControl', 'Z']);
     * ```
     *
     * Some of the supported key names are:
     * - `'AltLeft'` or `'Alt'`
     * - `'AltRight'`
     * - `'ArrowDown'`
     * - `'ArrowLeft'`
     * - `'ArrowRight'`
     * - `'ArrowUp'`
     * - `'Backspace'`
     * - `'Clear'`
     * - `'ControlLeft'` or `'Control'`
     * - `'ControlRight'`
     * - `'Command'`
     * - `'CommandOrControl'`
     * - `'Delete'`
     * - `'End'`
     * - `'Enter'`
     * - `'Escape'`
     * - `'F1'` to `'F12'`
     * - `'Home'`
     * - `'Insert'`
     * - `'MetaLeft'` or `'Meta'`
     * - `'MetaRight'`
     * - `'Numpad0'` to `'Numpad9'`
     * - `'NumpadAdd'`
     * - `'NumpadDecimal'`
     * - `'NumpadDivide'`
     * - `'NumpadMultiply'`
     * - `'NumpadSubtract'`
     * - `'PageDown'`
     * - `'PageUp'`
     * - `'Pause'`
     * - `'Return'`
     * - `'ShiftLeft'` or `'Shift'`
     * - `'ShiftRight'`
     * - `'Space'`
     * - `'Tab'`
     * @param key - key or array of keys to press.
     * @returns automatically synchronized promise through #recorder
     *
     *
     * _Note:_ Shortcuts like `'Meta'` + `'A'` do not work on macOS ([GoogleChrome/puppeteer#1313](https://github.com/GoogleChrome/puppeteer/issues/1313)).
     */
    pressKey(key: string | string[]): Promise<void>;
    /**
     * Types out the given text into an active field.
     * To slow down typing use a second parameter, to set interval between key presses.
     * _Note:_ Should be used when [`fillField`](#fillfield) is not an option.
     *
     * ```js
     * // passing in a string
     * I.type('Type this out.');
     *
     * // typing values with a 100ms interval
     * I.type('4141555311111111', 100);
     *
     * // passing in an array
     * I.type(['T', 'E', 'X', 'T']);
     *
     * // passing a secret
     * I.type(secret('123456'));
     * ```
     * @param key - or array of keys to type.
     * @param [delay = null] - (optional) delay in ms between key presses
     * @returns automatically synchronized promise through #recorder
     */
    type(key: string | string[], delay?: number): Promise<void>;
    /**
     * Fills a text field or textarea, after clearing its value, with the given string.
     * Field is located by name, label, CSS, or XPath.
     *
     * ```js
     * // by label
     * I.fillField('Email', 'hello@world.com');
     * // by name
     * I.fillField('password', secret('123456'));
     * // by CSS
     * I.fillField('form#login input[name=username]', 'John');
     * // or by strict locator
     * I.fillField({css: 'form#login input[name=username]'}, 'John');
     * ```
     * @param field - located by label|name|CSS|XPath|strict locator.
     * @param value - text value to fill.
     * @returns automatically synchronized promise through #recorder
     *
     * {{ react }}
     */
    fillField(field: TestMaiT.LocatorOrString, value: TestMaiT.StringOrSecret): Promise<void>;
    /**
     * Clears a `<textarea>` or text `<input>` element's value.
     *
     * ```js
     * I.clearField('Email');
     * I.clearField('user[email]');
     * I.clearField('#email');
     * ```
     * @param editable - field located by label|name|CSS|XPath|strict locator.
     * @returns automatically synchronized promise through #recorder.
     */
    clearField(editable: LocatorOrString): Promise<void>;
    /**
     * Appends text to a input field or textarea.
     * Field is located by name, label, CSS or XPath
     *
     * ```js
     * I.appendField('#myTextField', 'appended');
     * // typing secret
     * I.appendField('password', secret('123456'));
     * ```
     * @param field - located by label|name|CSS|XPath|strict locator
     * @param value - text value to append.
     * @returns automatically synchronized promise through #recorder
     *
     *
     * {{ react }}
     */
    appendField(field: TestMaiT.LocatorOrString, value: string): Promise<void>;
    /**
     * Checks that the given input field or textarea equals to given value.
     * For fuzzy locators, fields are matched by label text, the "name" attribute, CSS, and XPath.
     *
     * ```js
     * I.seeInField('Username', 'davert');
     * I.seeInField({css: 'form textarea'},'Type your comment here');
     * I.seeInField('form input[type=hidden]','hidden_value');
     * I.seeInField('#searchform input','Search');
     * ```
     * @param field - located by label|name|CSS|XPath|strict locator.
     * @param value - value to check.
     * @returns automatically synchronized promise through #recorder
     */
    seeInField(field: TestMaiT.LocatorOrString, value: TestMaiT.StringOrSecret): Promise<void>;
    /**
     * Checks that value of input field or textarea doesn't equal to given value
     * Opposite to `seeInField`.
     *
     * ```js
     * I.dontSeeInField('email', 'user@user.com'); // field by name
     * I.dontSeeInField({ css: 'form input.email' }, 'user@user.com'); // field by CSS
     * ```
     * @param field - located by label|name|CSS|XPath|strict locator.
     * @param value - value to check.
     * @returns automatically synchronized promise through #recorder
     */
    dontSeeInField(field: TestMaiT.LocatorOrString, value: TestMaiT.StringOrSecret): Promise<void>;
    /**
     * Attaches a file to element located by label, name, CSS or XPath
     * Path to file is relative current testmait directory (where testmait.conf.ts or testmait.conf.js is located).
     * File will be uploaded to remote system (if tests are running remotely).
     *
     * ```js
     * I.attachFile('Avatar', 'data/avatar.jpg');
     * I.attachFile('form input[name=avatar]', 'data/avatar.jpg');
     * ```
     * @param locator - field located by label|name|CSS|XPath|strict locator.
     * @param pathToFile - local file path relative to testmait.conf.ts or testmait.conf.js config file.
     * @returns automatically synchronized promise through #recorder
     *
     *
     * > ⚠ There is an [issue with file upload in Puppeteer 2.1.0 & 2.1.1](https://github.com/puppeteer/puppeteer/issues/5420), downgrade to 2.0.0 if you face it.
     */
    attachFile(locator: TestMaiT.LocatorOrString, pathToFile: string): Promise<void>;
    /**
     * Selects an option in a drop-down select.
     * Field is searched by label | name | CSS | XPath.
     * Option is selected by visible text or by value.
     *
     * ```js
     * I.selectOption('Choose Plan', 'Monthly'); // select by label
     * I.selectOption('subscription', 'Monthly'); // match option by text
     * I.selectOption('subscription', '0'); // or by value
     * I.selectOption('//form/select[@name=account]','Premium');
     * I.selectOption('form select[name=account]', 'Premium');
     * I.selectOption({css: 'form select[name=account]'}, 'Premium');
     * ```
     *
     * Provide an array for the second argument to select multiple options.
     *
     * ```js
     * I.selectOption('Which OS do you use?', ['Android', 'iOS']);
     * ```
     * @param select - field located by label|name|CSS|XPath|strict locator.
     * @param option - visible text or value of option.
     * @returns automatically synchronized promise through #recorder
     */
    selectOption(select: LocatorOrString, option: string | any[]): Promise<void>;
    /**
     * Grab number of visible elements by locator.
     * Resumes test execution, so **should be used inside async function with `await`** operator.
     *
     * ```js
     * let numOfElements = await I.grabNumberOfVisibleElements('p');
     * ```
     * @param locator - located by CSS|XPath|strict locator.
     * @returns number of visible elements
     * {{ react }}
     */
    grabNumberOfVisibleElements(locator: TestMaiT.LocatorOrString): Promise<number>;
    /**
     * Checks that current url contains a provided fragment.
     *
     * ```js
     * I.seeInCurrentUrl('/register'); // we are on registration page
     * ```
     * @param url - a fragment to check
     * @returns automatically synchronized promise through #recorder
     */
    seeInCurrentUrl(url: string): Promise<void>;
    /**
     * Checks that current url does not contain a provided fragment.
     * @param url - value to check.
     * @returns automatically synchronized promise through #recorder
     */
    dontSeeInCurrentUrl(url: string): Promise<void>;
    /**
     * Checks that current url is equal to provided one.
     * If a relative url provided, a configured url will be prepended to it.
     * So both examples will work:
     *
     * ```js
     * I.seeCurrentUrlEquals('/register');
     * I.seeCurrentUrlEquals('http://my.site.com/register');
     * ```
     * @param url - value to check.
     * @returns automatically synchronized promise through #recorder
     */
    seeCurrentUrlEquals(url: string): Promise<void>;
    /**
     * Checks that current url is not equal to provided one.
     * If a relative url provided, a configured url will be prepended to it.
     *
     * ```js
     * I.dontSeeCurrentUrlEquals('/login'); // relative url are ok
     * I.dontSeeCurrentUrlEquals('http://mysite.com/login'); // absolute urls are also ok
     * ```
     * @param url - value to check.
     * @returns automatically synchronized promise through #recorder
     */
    dontSeeCurrentUrlEquals(url: string): Promise<void>;
    /**
     * Checks that a page contains a visible text.
     * Use context parameter to narrow down the search.
     *
     * ```js
     * I.see('Welcome'); // text welcome on a page
     * I.see('Welcome', '.content'); // text inside .content div
     * I.see('Register', {css: 'form.register'}); // use strict locator
     * ```
     * @param text - expected on page.
     * @param [context = null] - (optional, `null` by default) element located by CSS|Xpath|strict locator in which to search for text.
     * @returns automatically synchronized promise through #recorder
     *
     *
     * {{ react }}
     */
    see(text: string, context?: TestMaiT.LocatorOrString): Promise<void>;
    /**
     * Checks that text is equal to provided one.
     *
     * ```js
     * I.seeTextEquals('text', 'h1');
     * ```
     * @param text - element value to check.
     * @param [context = null] - element located by CSS|XPath|strict locator.
     * @returns automatically synchronized promise through #recorder
     */
    seeTextEquals(text: string, context?: TestMaiT.LocatorOrString): Promise<void>;
    /**
     * Opposite to `see`. Checks that a text is not present on a page.
     * Use context parameter to narrow down the search.
     *
     * ```js
     * I.dontSee('Login'); // assume we are already logged in.
     * I.dontSee('Login', '.nav'); // no login inside .nav element
     * ```
     * @param text - which is not present.
     * @param [context = null] - (optional) element located by CSS|XPath|strict locator in which to perfrom search.
     * @returns automatically synchronized promise through #recorder
     *
     *
     * {{ react }}
     */
    dontSee(text: string, context?: TestMaiT.LocatorOrString): Promise<void>;
    /**
     * Retrieves page source and returns it to test.
     * Resumes test execution, so **should be used inside async function with `await`** operator.
     *
     * ```js
     * let pageSource = await I.grabSource();
     * ```
     * @returns source code
     */
    grabSource(): Promise<string>;
    /**
     * Get JS log from browser.
     *
     * ```js
     * let logs = await I.grabBrowserLogs();
     * console.log(JSON.stringify(logs))
     * ```
     */
    grabBrowserLogs(): Promise<any[]>;
    /**
     * Get current URL from browser.
     * Resumes test execution, so should be used inside an async function.
     *
     * ```js
     * let url = await I.grabCurrentUrl();
     * console.log(`Current URL is [${url}]`);
     * ```
     * @returns current URL
     */
    grabCurrentUrl(): Promise<string>;
    /**
     * Checks that the current page contains the given string in its raw source code.
     *
     * ```js
     * I.seeInSource('<h1>Green eggs &amp; ham</h1>');
     * ```
     * @param text - value to check.
     * @returns automatically synchronized promise through #recorder
     */
    seeInSource(text: string): Promise<void>;
    /**
     * Checks that the current page does not contains the given string in its raw source code.
     *
     * ```js
     * I.dontSeeInSource('<!--'); // no comments in source
     * ```
     * @param value - to check.
     * @returns automatically synchronized promise through #recorder
     */
    dontSeeInSource(value: string): Promise<void>;
    /**
     * Asserts that an element appears a given number of times in the DOM.
     * Element is located by label or name or CSS or XPath.
     *
     *
     * ```js
     * I.seeNumberOfElements('#submitBtn', 1);
     * ```
     * @param locator - element located by CSS|XPath|strict locator.
     * @param num - number of elements.
     * @returns automatically synchronized promise through #recorder
     *
     *
     * {{ react }}
     */
    seeNumberOfElements(locator: TestMaiT.LocatorOrString, num: number): Promise<void>;
    /**
     * Asserts that an element is visible a given number of times.
     * Element is located by CSS or XPath.
     *
     * ```js
     * I.seeNumberOfVisibleElements('.buttons', 3);
     * ```
     * @param locator - element located by CSS|XPath|strict locator.
     * @param num - number of elements.
     * @returns automatically synchronized promise through #recorder
     *
     *
     * {{ react }}
     */
    seeNumberOfVisibleElements(locator: TestMaiT.LocatorOrString, num: number): Promise<void>;
    /**
     * Sets cookie(s).
     *
     * Can be a single cookie object or an array of cookies:
     *
     * ```js
     * I.setCookie({name: 'auth', value: true});
     *
     * // as array
     * I.setCookie([
     *   {name: 'auth', value: true},
     *   {name: 'agree', value: true}
     * ]);
     * ```
     * @param cookie - a cookie object or array of cookie objects.
     * @returns automatically synchronized promise through #recorder
     */
    setCookie(cookie: Cookie | Cookie[]): Promise<void>;
    /**
     * Checks that cookie with given name exists.
     *
     * ```js
     * I.seeCookie('Auth');
     * ```
     * @param name - cookie name.
     * @returns automatically synchronized promise through #recorder
     */
    seeCookie(name: string): Promise<void>;
    /**
     * Checks that cookie with given name does not exist.
     *
     * ```js
     * I.dontSeeCookie('auth'); // no auth cookie
     * ```
     * @param name - cookie name.
     * @returns automatically synchronized promise through #recorder
     */
    dontSeeCookie(name: string): Promise<void>;
    /**
     * Gets a cookie object by name.
     * If none provided gets all cookies.
     * Resumes test execution, so **should be used inside async function with `await`** operator.
     *
     * ```js
     * let cookie = await I.grabCookie('auth');
     * assert(cookie.value, '123456');
     * ```
     * @param [name = null] - cookie name.
     * @returns attribute value
     *
     *
     * Returns cookie in JSON format. If name not passed returns all cookies for this domain.
     */
    grabCookie(name?: string): any;
    /**
     * Clears a cookie by name,
     * if none provided clears all cookies.
     *
     * ```js
     * I.clearCookie();
     * I.clearCookie('test');
     * ```
     * @param [cookie = null] - (optional, `null` by default) cookie name
     * @returns automatically synchronized promise through #recorder
     */
    clearCookie(cookie?: string): Promise<void>;
    /**
     * Executes sync script on a page.
     * Pass arguments to function as additional parameters.
     * Will return execution result to a test.
     * In this case you should use async function and await to receive results.
     *
     * Example with jQuery DatePicker:
     *
     * ```js
     * // change date of jQuery DatePicker
     * I.executeScript(function() {
     *   // now we are inside browser context
     *   $('date').datetimepicker('setDate', new Date());
     * });
     * ```
     * Can return values. Don't forget to use `await` to get them.
     *
     * ```js
     * let date = await I.executeScript(function(el) {
     *   // only basic types can be returned
     *   return $(el).datetimepicker('getDate').toString();
     * }, '#date'); // passing jquery selector
     * ```
     * @param fn - function to be executed in browser context.
     * @param args - to be passed to function.
     * @returns script return value
     *
     *
     * If a function returns a Promise It will wait for it resolution.
     */
    executeScript(fn: string | ((...params: any[]) => any), ...args: any[]): Promise<any>;
    /**
     * Executes async script on page.
     * Provided function should execute a passed callback (as first argument) to signal it is finished.
     *
     * Example: In Vue.js to make components completely rendered we are waiting for [nextTick](https://vuejs.org/v2/api/#Vue-nextTick).
     *
     * ```js
     * I.executeAsyncScript(function(done) {
     *   Vue.nextTick(done); // waiting for next tick
     * });
     * ```
     *
     * By passing value to `done()` function you can return values.
     * Additional arguments can be passed as well, while `done` function is always last parameter in arguments list.
     *
     * ```js
     * let val = await I.executeAsyncScript(function(url, done) {
     *   // in browser context
     *   $.ajax(url, { success: (data) => done(data); }
     * }, 'http://ajax.callback.url/');
     * ```
     * @param fn - function to be executed in browser context.
     * @param args - to be passed to function.
     * @returns script return value
     *
     *
     * Asynchronous scripts can also be executed with `executeScript` if a function returns a Promise.
     */
    executeAsyncScript(fn: string | ((...params: any[]) => any), ...args: any[]): Promise<any>;
    /**
     * Retrieves all texts from an element located by CSS or XPath and returns it to test.
     * Resumes test execution, so **should be used inside async with `await`** operator.
     *
     * ```js
     * let pins = await I.grabTextFromAll('#pin li');
     * ```
     * @param locator - element located by CSS|XPath|strict locator.
     * @returns attribute value
     *
     * {{ react }}
     */
    grabTextFromAll(locator: TestMaiT.LocatorOrString): Promise<string[]>;
    /**
     * Retrieves a text from an element located by CSS or XPath and returns it to test.
     * Resumes test execution, so **should be used inside async with `await`** operator.
     *
     * ```js
     * let pin = await I.grabTextFrom('#pin');
     * ```
     * If multiple elements found returns first element.
     * @param locator - element located by CSS|XPath|strict locator.
     * @returns attribute value
     *
     * {{ react }}
     */
    grabTextFrom(locator: TestMaiT.LocatorOrString): Promise<string>;
    /**
     * Retrieves an array of value from a form located by CSS or XPath and returns it to test.
     * Resumes test execution, so **should be used inside async function with `await`** operator.
     *
     * ```js
     * let inputs = await I.grabValueFromAll('//form/input');
     * ```
     * @param locator - field located by label|name|CSS|XPath|strict locator.
     * @returns attribute value
     */
    grabValueFromAll(locator: TestMaiT.LocatorOrString): Promise<string[]>;
    /**
     * Retrieves a value from a form element located by CSS or XPath and returns it to test.
     * Resumes test execution, so **should be used inside async function with `await`** operator.
     * If more than one element is found - value of first element is returned.
     *
     * ```js
     * let email = await I.grabValueFrom('input[name=email]');
     * ```
     * @param locator - field located by label|name|CSS|XPath|strict locator.
     * @returns attribute value
     */
    grabValueFrom(locator: TestMaiT.LocatorOrString): Promise<string>;
    /**
     * Retrieves all the innerHTML from elements located by CSS or XPath and returns it to test.
     * Resumes test execution, so **should be used inside async function with `await`** operator.
     *
     * ```js
     * let postHTMLs = await I.grabHTMLFromAll('.post');
     * ```
     * @param element - located by CSS|XPath|strict locator.
     * @returns HTML code for an element
     */
    grabHTMLFromAll(element: TestMaiT.LocatorOrString): Promise<string[]>;
    /**
     * Retrieves the innerHTML from an element located by CSS or XPath and returns it to test.
     * Resumes test execution, so **should be used inside async function with `await`** operator.
     * If more than one element is found - HTML of first element is returned.
     *
     * ```js
     * let postHTML = await I.grabHTMLFrom('#post');
     * ```
     * @param element - located by CSS|XPath|strict locator.
     * @returns HTML code for an element
     */
    grabHTMLFrom(element: TestMaiT.LocatorOrString): Promise<string>;
    /**
     * Grab array of CSS properties for given locator
     * Resumes test execution, so **should be used inside an async function with `await`** operator.
     *
     * ```js
     * const values = await I.grabCssPropertyFromAll('h3', 'font-weight');
     * ```
     * @param locator - element located by CSS|XPath|strict locator.
     * @param cssProperty - CSS property name.
     * @returns CSS value
     *
     * {{ react }}
     */
    grabCssPropertyFromAll(
      locator: TestMaiT.LocatorOrString,
      cssProperty: string,
    ): Promise<string[]>;
    /**
     * Grab CSS property for given locator
     * Resumes test execution, so **should be used inside an async function with `await`** operator.
     * If more than one element is found - value of first element is returned.
     *
     * ```js
     * const value = await I.grabCssPropertyFrom('h3', 'font-weight');
     * ```
     * @param locator - element located by CSS|XPath|strict locator.
     * @param cssProperty - CSS property name.
     * @returns CSS value
     *
     * {{ react }}
     */
    grabCssPropertyFrom(locator: TestMaiT.LocatorOrString, cssProperty: string): Promise<string>;
    /**
     * Checks that all elements with given locator have given CSS properties.
     *
     * ```js
     * I.seeCssPropertiesOnElements('h3', { 'font-weight': "bold"});
     * ```
     * @param locator - located by CSS|XPath|strict locator.
     * @param cssProperties - object with CSS properties and their values to check.
     * @returns automatically synchronized promise through #recorder
     *
     * {{ react }}
     */
    seeCssPropertiesOnElements(
      locator: TestMaiT.LocatorOrString,
      cssProperties: any,
    ): Promise<void>;
    /**
     * Checks that all elements with given locator have given attributes.
     *
     * ```js
     * I.seeAttributesOnElements('//form', { method: "post"});
     * ```
     * @param locator - located by CSS|XPath|strict locator.
     * @param attributes - attributes and their values to check.
     * @returns automatically synchronized promise through #recorder
     *
     * {{ react }}
     */
    seeAttributesOnElements(locator: TestMaiT.LocatorOrString, attributes: any): Promise<void>;
    /**
     * Drag the scrubber of a slider to a given position
     * For fuzzy locators, fields are matched by label text, the "name" attribute, CSS, and XPath.
     *
     * ```js
     * I.dragSlider('#slider', 30);
     * I.dragSlider('#slider', -70);
     * ```
     * @param locator - located by label|name|CSS|XPath|strict locator.
     * @param offsetX - position to drag.
     * @returns automatically synchronized promise through #recorder
     *
     * {{ react }}
     */
    dragSlider(locator: TestMaiT.LocatorOrString, offsetX: number): Promise<void>;
    /**
     * Retrieves an array of attributes from elements located by CSS or XPath and returns it to test.
     * Resumes test execution, so **should be used inside async with `await`** operator.
     *
     * ```js
     * let hints = await I.grabAttributeFromAll('.tooltip', 'title');
     * ```
     * @param locator - element located by CSS|XPath|strict locator.
     * @param attr - attribute name.
     * @returns attribute value
     *
     * {{ react }}
     */
    grabAttributeFromAll(locator: TestMaiT.LocatorOrString, attr: string): Promise<string[]>;
    /**
     * Retrieves an attribute from an element located by CSS or XPath and returns it to test.
     * Resumes test execution, so **should be used inside async with `await`** operator.
     * If more than one element is found - attribute of first element is returned.
     *
     * ```js
     * let hint = await I.grabAttributeFrom('#tooltip', 'title');
     * ```
     * @param locator - element located by CSS|XPath|strict locator.
     * @param attr - attribute name.
     * @returns attribute value
     *
     * {{ react }}
     */
    grabAttributeFrom(locator: TestMaiT.LocatorOrString, attr: string): Promise<string>;
    /**
     * Saves screenshot of the specified locator to ouput folder (set in testmait.conf.ts or testmait.conf.js).
     * Filename is relative to output folder.
     *
     * ```js
     * I.saveElementScreenshot(`#submit`,'debug.png');
     * ```
     * @param locator - element located by CSS|XPath|strict locator.
     * @param fileName - file name to save.
     * @returns automatically synchronized promise through #recorder
     */
    saveElementScreenshot(locator: TestMaiT.LocatorOrString, fileName: string): Promise<void>;
    /**
     * Saves a screenshot to ouput folder (set in testmait.conf.ts or testmait.conf.js).
     * Filename is relative to output folder.
     * Optionally resize the window to the full available page `scrollHeight` and `scrollWidth` to capture the entire page by passing `true` in as the second argument.
     *
     * ```js
     * I.saveScreenshot('debug.png');
     * I.saveScreenshot('debug.png', true) //resizes to available scrollHeight and scrollWidth before taking screenshot
     * ```
     * @param fileName - file name to save.
     * @param [fullPage = false] - (optional, `false` by default) flag to enable fullscreen screenshot mode.
     * @returns automatically synchronized promise through #recorder
     */
    saveScreenshot(fileName: string, fullPage?: boolean): Promise<void>;
    /**
     * Pauses execution for a number of seconds.
     *
     * ```js
     * I.wait(2); // wait 2 secs
     * ```
     * @param sec - number of second to wait.
     * @returns automatically synchronized promise through #recorder
     */
    wait(sec: number): Promise<void>;
    /**
     * Waits for element to become enabled (by default waits for 1sec).
     * Element can be located by CSS or XPath.
     * @param locator - element located by CSS|XPath|strict locator.
     * @param [sec = 1] - (optional) time in seconds to wait, 1 by default.
     * @returns automatically synchronized promise through #recorder
     */
    waitForEnabled(locator: TestMaiT.LocatorOrString, sec?: number): Promise<void>;
    /**
     * Waits for the specified value to be in value attribute.
     *
     * ```js
     * I.waitForValue('//input', "GoodValue");
     * ```
     * @param field - input field.
     * @param value - expected value.
     * @param [sec = 1] - (optional, `1` by default) time in seconds to wait
     * @returns automatically synchronized promise through #recorder
     */
    waitForValue(field: LocatorOrString, value: string, sec?: number): Promise<void>;
    /**
     * Waits for a specified number of elements on the page.
     *
     * ```js
     * I.waitNumberOfVisibleElements('a', 3);
     * ```
     * @param locator - element located by CSS|XPath|strict locator.
     * @param num - number of elements.
     * @param [sec = 1] - (optional, `1` by default) time in seconds to wait
     * @returns automatically synchronized promise through #recorder
     *
     * {{ react }}
     */
    waitNumberOfVisibleElements(
      locator: TestMaiT.LocatorOrString,
      num: number,
      sec?: number,
    ): Promise<void>;
    /**
     * Waits for element to be clickable (by default waits for 1sec).
     * Element can be located by CSS or XPath.
     *
     * ```js
     * I.waitForClickable('.btn.continue');
     * I.waitForClickable('.btn.continue', 5); // wait for 5 secs
     * ```
     * @param locator - element located by CSS|XPath|strict locator.
     * @param [sec] - (optional, `1` by default) time in seconds to wait
     * @returns automatically synchronized promise through #recorder
     */
    waitForClickable(locator: TestMaiT.LocatorOrString, sec?: number): Promise<void>;
    /**
     * Waits for element to be present on page (by default waits for 1sec).
     * Element can be located by CSS or XPath.
     *
     * ```js
     * I.waitForElement('.btn.continue');
     * I.waitForElement('.btn.continue', 5); // wait for 5 secs
     * ```
     * @param locator - element located by CSS|XPath|strict locator.
     * @param [sec] - (optional, `1` by default) time in seconds to wait
     * @returns automatically synchronized promise through #recorder
     *
     * {{ react }}
     */
    waitForElement(locator: TestMaiT.LocatorOrString, sec?: number): Promise<void>;
    /**
     * Waits for an element to become visible on a page (by default waits for 1sec).
     * Element can be located by CSS or XPath.
     *
     * ```js
     * I.waitForVisible('#popup');
     * ```
     * @param locator - element located by CSS|XPath|strict locator.
     * @param [sec = 1] - (optional, `1` by default) time in seconds to wait
     * @returns automatically synchronized promise through #recorder
     *
     *
     * This method accepts [React selectors](https://testmait.io/react).
     */
    waitForVisible(locator: TestMaiT.LocatorOrString, sec?: number): Promise<void>;
    /**
     * Waits for an element to be removed or become invisible on a page (by default waits for 1sec).
     * Element can be located by CSS or XPath.
     *
     * ```js
     * I.waitForInvisible('#popup');
     * ```
     * @param locator - element located by CSS|XPath|strict locator.
     * @param [sec = 1] - (optional, `1` by default) time in seconds to wait
     * @returns automatically synchronized promise through #recorder
     */
    waitForInvisible(locator: TestMaiT.LocatorOrString, sec?: number): Promise<void>;
    /**
     * Waits for an element to hide (by default waits for 1sec).
     * Element can be located by CSS or XPath.
     *
     * ```js
     * I.waitToHide('#popup');
     * ```
     * @param locator - element located by CSS|XPath|strict locator.
     * @param [sec = 1] - (optional, `1` by default) time in seconds to wait
     * @returns automatically synchronized promise through #recorder
     */
    waitToHide(locator: TestMaiT.LocatorOrString, sec?: number): Promise<void>;
    /**
     * Waiting for the part of the URL to match the expected. Useful for SPA to understand that page was changed.
     *
     * ```js
     * I.waitInUrl('/info', 2);
     * ```
     * @param urlPart - value to check.
     * @param [sec = 1] - (optional, `1` by default) time in seconds to wait
     * @returns automatically synchronized promise through #recorder
     */
    waitInUrl(urlPart: string, sec?: number): Promise<void>;
    /**
     * Waits for the entire URL to match the expected
     *
     * ```js
     * I.waitUrlEquals('/info', 2);
     * I.waitUrlEquals('http://127.0.0.1:8000/info');
     * ```
     * @param urlPart - value to check.
     * @param [sec = 1] - (optional, `1` by default) time in seconds to wait
     * @returns automatically synchronized promise through #recorder
     */
    waitUrlEquals(urlPart: string, sec?: number): Promise<void>;
    /**
     * Waits for a text to appear (by default waits for 1sec).
     * Element can be located by CSS or XPath.
     * Narrow down search results by providing context.
     *
     * ```js
     * I.waitForText('Thank you, form has been submitted');
     * I.waitForText('Thank you, form has been submitted', 5, '#modal');
     * ```
     * @param text - to wait for.
     * @param [sec = 1] - (optional, `1` by default) time in seconds to wait
     * @param [context = null] - (optional) element located by CSS|XPath|strict locator.
     * @returns automatically synchronized promise through #recorder
     */
    waitForText(text: string, sec?: number, context?: TestMaiT.LocatorOrString): Promise<void>;
    /**
     * Waits for a network request.
     *
     * ```js
     * I.waitForRequest('http://example.com/resource');
     * I.waitForRequest(request => request.url() === 'http://example.com' && request.method() === 'GET');
     * ```
     * @param [sec = null] - seconds to wait
     */
    waitForRequest(urlOrPredicate: string | ((...params: any[]) => any), sec?: number): void;
    /**
     * Waits for a network response.
     *
     * ```js
     * I.waitForResponse('http://example.com/resource');
     * I.waitForResponse(response => response.url() === 'http://example.com' && response.request().method() === 'GET');
     * ```
     * @param [sec = null] - number of seconds to wait
     */
    waitForResponse(urlOrPredicate: string | ((...params: any[]) => any), sec?: number): void;
    /**
     * Switches frame or in case of null locator reverts to parent.
     *
     * ```js
     * I.switchTo('iframe'); // switch to first iframe
     * I.switchTo(); // switch back to main page
     * ```
     * @param [locator = null] - (optional, `null` by default) element located by CSS|XPath|strict locator.
     * @returns automatically synchronized promise through #recorder
     */
    switchTo(locator?: TestMaiT.LocatorOrString): Promise<void>;
    /**
     * Waits for a function to return true (waits for 1 sec by default).
     * Running in browser context.
     *
     * ```js
     * I.waitForFunction(fn[, [args[, timeout]])
     * ```
     *
     * ```js
     * I.waitForFunction(() => window.requests == 0);
     * I.waitForFunction(() => window.requests == 0, 5); // waits for 5 sec
     * I.waitForFunction((count) => window.requests == count, [3], 5) // pass args and wait for 5 sec
     * ```
     * @param fn - to be executed in browser context.
     * @param [argsOrSec = null] - (optional, `1` by default) arguments for function or seconds.
     * @param [sec = null] - (optional, `1` by default) time in seconds to wait
     * @returns automatically synchronized promise through #recorder
     */
    waitForFunction(
      fn: string | ((...params: any[]) => any),
      argsOrSec?: any[] | number,
      sec?: number,
    ): Promise<void>;
    /**
     * Waits for navigation to finish. By default takes configured `waitForNavigation` option.
     *
     * See [Pupeteer's reference](https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#pagewaitfornavigationoptions)
     */
    waitForNavigation(opts: any): void;
    /**
     * Waits for an element to become not attached to the DOM on a page (by default waits for 1sec).
     * Element can be located by CSS or XPath.
     *
     * ```js
     * I.waitForDetached('#popup');
     * ```
     * @param locator - element located by CSS|XPath|strict locator.
     * @param [sec = 1] - (optional, `1` by default) time in seconds to wait
     * @returns automatically synchronized promise through #recorder
     */
    waitForDetached(locator: TestMaiT.LocatorOrString, sec?: number): Promise<void>;
    /**
     * Grab the data from performance timing using Navigation Timing API.
     * The returned data will contain following things in ms:
     * - responseEnd,
     * - domInteractive,
     * - domContentLoadedEventEnd,
     * - loadEventEnd
     * Resumes test execution, so **should be used inside an async function with `await`** operator.
     *
     * ```js
     * await I.amOnPage('https://example.com');
     * let data = await I.grabDataFromPerformanceTiming();
     * //Returned data
     * { // all results are in [ms]
     *   responseEnd: 23,
     *   domInteractive: 44,
     *   domContentLoadedEventEnd: 196,
     *   loadEventEnd: 241
     * }
     * ```
     * @returns automatically synchronized promise through #recorder
     */
    grabDataFromPerformanceTiming(): Promise<void>;
    /**
     * Grab the width, height, location of given locator.
     * Provide `width` or `height`as second param to get your desired prop.
     * Resumes test execution, so **should be used inside an async function with `await`** operator.
     *
     * Returns an object with `x`, `y`, `width`, `height` keys.
     *
     * ```js
     * const value = await I.grabElementBoundingRect('h3');
     * // value is like { x: 226.5, y: 89, width: 527, height: 220 }
     * ```
     *
     * To get only one metric use second parameter:
     *
     * ```js
     * const width = await I.grabElementBoundingRect('h3', 'width');
     * // width == 527
     * ```
     * @param locator - element located by CSS|XPath|strict locator.
     * @param [elementSize] - x, y, width or height of the given element.
     * @returns Element bounding rectangle
     */
    grabElementBoundingRect(
      locator: LocatorOrString,
      elementSize?: string,
    ): Promise<DOMRect> | Promise<number>;
  }
  /**
   * ## Configuration
   * @property [endpoint] - API base URL
   * @property [prettyPrintJson = false] - pretty print json for response/request on console logs
   * @property [timeout = 1000] - timeout for requests in milliseconds. 10000ms by default
   * @property [defaultHeaders] - a list of default headers
   * @property [onRequest] - a async function which can update request object.
   * @property [onResponse] - a async function which can update response object.
   * @property [maxUploadFileSize] - set the max content file size in MB when performing api calls.
   */
  type RESTConfig = {
    endpoint?: string;
    prettyPrintJson?: boolean;
    timeout?: number;
    defaultHeaders?: any;
    onRequest?: (...params: any[]) => any;
    onResponse?: (...params: any[]) => any;
    maxUploadFileSize?: number;
  };
  /**
   * REST helper allows to send additional requests to the REST API during acceptance tests.
   * [Axios](https://github.com/axios/axios) library is used to perform requests.
   *
   * <!-- configuration -->
   *
   * ## Example
   *
   * ```js
   * {
   *   helpers: {
   *     REST: {
   *       endpoint: 'http://site.com/api',
   *       prettyPrintJson: true,
   *       onRequest: (request) => {
   *         request.headers.auth = '123';
   *       }
   *     }
   *   }
   * }
   * ```
   *
   * ## Access From Helpers
   *
   * Send REST requests by accessing `_executeRequest` method:
   *
   * ```js
   * this.helpers['REST']._executeRequest({
   *    url,
   *    data,
   * });
   * ```
   *
   * ## Methods
   */
  class REST {
    /**
     * Sets request headers for all requests of this test
     * @param headers - headers list
     */
    haveRequestHeaders(headers: any): void;
    /**
     * Adds a header for Bearer authentication
     *
     * ```js
     * // we use secret function to hide token from logs
     * I.amBearerAuthenticated(secret('heregoestoken'))
     * ```
     * @param accessToken - Bearer access token
     */
    amBearerAuthenticated(accessToken: string | TestMaiT.Secret): void;
    /**
     * Executes axios request
     * @returns response
     */
    _executeRequest(request: any): Promise<any>;
    /**
     * Generates url based on format sent (takes endpoint + url if latter lacks 'http')
     */
    _url(url: any): void;
    /**
     * Set timeout for the request
     *
     * ```js
     * I.setRequestTimeout(10000); // In milliseconds
     * ```
     * @param newTimeout - timeout in milliseconds
     */
    setRequestTimeout(newTimeout: number): void;
    /**
     * Send GET request to REST API
     *
     * ```js
     * I.sendGetRequest('/api/users.json');
     * ```
     * @param [headers = {}] - the headers object to be sent. By default, it is sent as an empty object
     * @returns response
     */
    sendGetRequest(url: any, headers?: any): Promise<any>;
    /**
     * Sends POST request to API.
     *
     * ```js
     * I.sendPostRequest('/api/users.json', { "email": "user@user.com" });
     *
     * // To mask the payload in logs
     * I.sendPostRequest('/api/users.json', secret({ "email": "user@user.com" }));
     *
     * ```
     * @param [payload = {}] - the payload to be sent. By default, it is sent as an empty object
     * @param [headers = {}] - the headers object to be sent. By default, it is sent as an empty object
     * @returns response
     */
    sendPostRequest(url: any, payload?: any, headers?: any): Promise<any>;
    /**
     * Sends PATCH request to API.
     *
     * ```js
     * I.sendPatchRequest('/api/users.json', { "email": "user@user.com" });
     *
     * // To mask the payload in logs
     * I.sendPatchRequest('/api/users.json', secret({ "email": "user@user.com" }));
     *
     * ```
     * @param [payload = {}] - the payload to be sent. By default it is sent as an empty object
     * @param [headers = {}] - the headers object to be sent. By default it is sent as an empty object
     * @returns response
     */
    sendPatchRequest(url: string, payload?: any, headers?: any): Promise<any>;
    /**
     * Sends PUT request to API.
     *
     * ```js
     * I.sendPutRequest('/api/users.json', { "email": "user@user.com" });
     *
     * // To mask the payload in logs
     * I.sendPutRequest('/api/users.json', secret({ "email": "user@user.com" }));
     *
     * ```
     * @param [payload = {}] - the payload to be sent. By default it is sent as an empty object
     * @param [headers = {}] - the headers object to be sent. By default it is sent as an empty object
     * @returns response
     */
    sendPutRequest(url: string, payload?: any, headers?: any): Promise<any>;
    /**
     * Sends DELETE request to API.
     *
     * ```js
     * I.sendDeleteRequest('/api/users/1');
     * ```
     * @param [headers = {}] - the headers object to be sent. By default, it is sent as an empty object
     * @returns response
     */
    sendDeleteRequest(url: any, headers?: any): Promise<any>;
  }
  /**
   * Client Functions
   */
  function getPageUrl(): void;
  /**
   * Uses [TestCafe](https://github.com/DevExpress/testcafe) library to run cross-browser tests.
   * The browser version you want to use in tests must be installed on your system.
   *
   * Requires `testcafe` package to be installed.
   *
   * ```
   * npm i testcafe --save-dev
   * ```
   *
   * ## Configuration
   *
   * This helper should be configured in testmait.conf.ts or testmait.conf.js
   *
   * * `url`: base url of website to be tested
   * * `show`: (optional, default: false) - show browser window.
   * * `windowSize`: (optional) - set browser window width and height
   * * `getPageTimeout` (optional, default: '30000') config option to set maximum navigation time in milliseconds.
   * * `waitForTimeout`: (optional) default wait* timeout in ms. Default: 5000.
   * * `browser`: (optional, default: chrome)  - See https://devexpress.github.io/testcafe/documentation/using-testcafe/common-concepts/browsers/browser-support.html
   *
   *
   * #### Example #1: Show chrome browser window
   *
   * ```js
   * {
   *    helpers: {
   *      TestCafe : {
   *        url: "http://localhost",
   *        waitForTimeout: 15000,
   *        show: true,
   *        browser: "chrome"
   *      }
   *    }
   * }
   * ```
   *
   *  To use remote device you can provide 'remote' as browser parameter this will display a link with QR Code
   *  See https://devexpress.github.io/testcafe/documentation/recipes/test-on-remote-computers-and-mobile-devices.html
   *  #### Example #2: Remote browser connection
   *
   * ```js
   * {
   *    helpers: {
   *      TestCafe : {
   *        url: "http://localhost",
   *        waitForTimeout: 15000,
   *        browser: "remote"
   *      }
   *    }
   * }
   * ```
   *
   * ## Access From Helpers
   *
   * Call Testcafe methods directly using the testcafe controller.
   *
   * ```js
   * const testcafeTestController = this.helpers['TestCafe'].t;
   * const comboBox = Selector('.combo-box');
   * await testcafeTestController
   *   .hover(comboBox) // hover over combo box
   *   .click('#i-prefer-both') // click some other element
   * ```
   *
   * ## Methods
   */
  class TestCafe {
    /**
     * Use [TestCafe](https://devexpress.github.io/testcafe/documentation/test-api/) API inside a test.
     *
     * First argument is a description of an action.
     * Second argument is async function that gets this helper as parameter.
     *
     * { [`t`](https://devexpress.github.io/testcafe/documentation/test-api/test-code-structure.html#test-controller)) } object from TestCafe API is available.
     *
     * ```js
     * I.useTestCafeTo('handle browser dialog', async ({ t }) {
     *   await t.setNativeDialogHandler(() => true);
     * });
     * ```
     * @param description - used to show in logs.
     * @param fn - async functuion that executed with TestCafe helper as argument
     */
    useTestCafeTo(description: string, fn: (...params: any[]) => any): void;
    /**
     * Get elements by different locator types, including strict locator
     * Should be used in custom helpers:
     *
     * ```js
     * const elements = await this.helpers['TestCafe']._locate('.item');
     * ```
     */
    _locate(): void;
    /**
     * Opens a web page in a browser. Requires relative or absolute url.
     * If url starts with `/`, opens a web page of a site defined in `url` config parameter.
     *
     * ```js
     * I.amOnPage('/'); // opens main page of website
     * I.amOnPage('https://github.com'); // opens github
     * I.amOnPage('/login'); // opens a login page
     * ```
     * @param url - url path or global url.
     * @returns automatically synchronized promise through #recorder
     */
    amOnPage(url: string): Promise<void>;
    /**
     * Resize the current window to provided width and height.
     * First parameter can be set to `maximize`.
     * @param width - width in pixels or `maximize`.
     * @param height - height in pixels.
     * @returns automatically synchronized promise through #recorder
     */
    resizeWindow(width: number, height: number): Promise<void>;
    /**
     * Calls [focus](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/focus) on the matching element.
     *
     * Examples:
     *
     * ```js
     * I.dontSee('#add-to-cart-btn');
     * I.focus('#product-tile')
     * I.see('#add-to-cart-bnt');
     * ```
     * @param locator - field located by label|name|CSS|XPath|strict locator.
     * @param [options] - Playwright only: [Additional options](https://playwright.dev/docs/api/class-locator#locator-focus) for available options object as 2nd argument.
     * @returns automatically synchronized promise through #recorder
     */
    focus(locator: TestMaiT.LocatorOrString, options?: any): Promise<void>;
    /**
     * Remove focus from a text input, button, etc.
     * Calls [blur](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/focus) on the element.
     *
     * Examples:
     *
     * ```js
     * I.blur('.text-area')
     * ```
     * ```js
     * //element `#product-tile` is focused
     * I.see('#add-to-cart-btn');
     * I.blur('#product-tile')
     * I.dontSee('#add-to-cart-btn');
     * ```
     * @param locator - field located by label|name|CSS|XPath|strict locator.
     * @param [options] - Playwright only: [Additional options](https://playwright.dev/docs/api/class-locator#locator-blur) for available options object as 2nd argument.
     * @returns automatically synchronized promise through #recorder
     */
    blur(locator: TestMaiT.LocatorOrString, options?: any): Promise<void>;
    /**
     * Perform a click on a link or a button, given by a locator.
     * If a fuzzy locator is given, the page will be searched for a button, link, or image matching the locator string.
     * For buttons, the "value" attribute, "name" attribute, and inner text are searched. For links, the link text is searched.
     * For images, the "alt" attribute and inner text of any parent links are searched.
     *
     * The second parameter is a context (CSS or XPath locator) to narrow the search.
     *
     * ```js
     * // simple link
     * I.click('Logout');
     * // button of form
     * I.click('Submit');
     * // CSS button
     * I.click('#form input[type=submit]');
     * // XPath
     * I.click('//form/*[@type=submit]');
     * // link in context
     * I.click('Logout', '#nav');
     * // using strict locator
     * I.click({css: 'nav a.login'});
     * ```
     * @param locator - clickable link or button located by text, or any element located by CSS|XPath|strict locator.
     * @param [context = null] - (optional, `null` by default) element to search in CSS|XPath|Strict locator.
     * @returns automatically synchronized promise through #recorder
     */
    click(
      locator: TestMaiT.LocatorOrString,
      context?: TestMaiT.LocatorOrString | null,
    ): Promise<void>;
    /**
     * Reload the current page.
     *
     * ```js
     * I.refreshPage();
     * ```
     * @returns automatically synchronized promise through #recorder
     */
    refreshPage(): Promise<void>;
    /**
     * Waits for an element to become visible on a page (by default waits for 1sec).
     * Element can be located by CSS or XPath.
     *
     * ```js
     * I.waitForVisible('#popup');
     * ```
     * @param locator - element located by CSS|XPath|strict locator.
     * @param [sec = 1] - (optional, `1` by default) time in seconds to wait
     * @returns automatically synchronized promise through #recorder
     */
    waitForVisible(locator: TestMaiT.LocatorOrString, sec?: number): Promise<void>;
    /**
     * Fills a text field or textarea, after clearing its value, with the given string.
     * Field is located by name, label, CSS, or XPath.
     *
     * ```js
     * // by label
     * I.fillField('Email', 'hello@world.com');
     * // by name
     * I.fillField('password', secret('123456'));
     * // by CSS
     * I.fillField('form#login input[name=username]', 'John');
     * // or by strict locator
     * I.fillField({css: 'form#login input[name=username]'}, 'John');
     * ```
     * @param field - located by label|name|CSS|XPath|strict locator.
     * @param value - text value to fill.
     * @returns automatically synchronized promise through #recorder
     */
    fillField(field: TestMaiT.LocatorOrString, value: TestMaiT.StringOrSecret): Promise<void>;
    /**
     * Clears a `<textarea>` or text `<input>` element's value.
     *
     * ```js
     * I.clearField('Email');
     * I.clearField('user[email]');
     * I.clearField('#email');
     * ```
     * @param editable - field located by label|name|CSS|XPath|strict locator.
     * @returns automatically synchronized promise through #recorder.
     */
    clearField(editable: LocatorOrString): Promise<void>;
    /**
     * Appends text to a input field or textarea.
     * Field is located by name, label, CSS or XPath
     *
     * ```js
     * I.appendField('#myTextField', 'appended');
     * // typing secret
     * I.appendField('password', secret('123456'));
     * ```
     * @param field - located by label|name|CSS|XPath|strict locator
     * @param value - text value to append.
     * @returns automatically synchronized promise through #recorder
     */
    appendField(field: TestMaiT.LocatorOrString, value: string): Promise<void>;
    /**
     * Attaches a file to element located by label, name, CSS or XPath
     * Path to file is relative current testmait directory (where testmait.conf.ts or testmait.conf.js is located).
     * File will be uploaded to remote system (if tests are running remotely).
     *
     * ```js
     * I.attachFile('Avatar', 'data/avatar.jpg');
     * I.attachFile('form input[name=avatar]', 'data/avatar.jpg');
     * ```
     * @param locator - field located by label|name|CSS|XPath|strict locator.
     * @param pathToFile - local file path relative to testmait.conf.ts or testmait.conf.js config file.
     * @returns automatically synchronized promise through #recorder
     */
    attachFile(locator: TestMaiT.LocatorOrString, pathToFile: string): Promise<void>;
    /**
     * Presses a key on a focused element.
     * Special keys like 'Enter', 'Control', [etc](https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/element/:id/value)
     * will be replaced with corresponding unicode.
     * If modifier key is used (Control, Command, Alt, Shift) in array, it will be released afterwards.
     *
     * ```js
     * I.pressKey('Enter');
     * I.pressKey(['Control','a']);
     * ```
     * @param key - key or array of keys to press.
     * @returns automatically synchronized promise through #recorder
     *
     *
     * {{ keys }}
     */
    pressKey(key: string | string[]): Promise<void>;
    /**
     * Moves cursor to element matched by locator.
     * Extra shift can be set with offsetX and offsetY options.
     *
     * ```js
     * I.moveCursorTo('.tooltip');
     * I.moveCursorTo('#submit', 5,5);
     * ```
     * @param locator - located by CSS|XPath|strict locator.
     * @param [offsetX = 0] - (optional, `0` by default) X-axis offset.
     * @param [offsetY = 0] - (optional, `0` by default) Y-axis offset.
     * @returns automatically synchronized promise through #recorder
     */
    moveCursorTo(
      locator: TestMaiT.LocatorOrString,
      offsetX?: number,
      offsetY?: number,
    ): Promise<void>;
    /**
     * Performs a double-click on an element matched by link|button|label|CSS or XPath.
     * Context can be specified as second parameter to narrow search.
     *
     * ```js
     * I.doubleClick('Edit');
     * I.doubleClick('Edit', '.actions');
     * I.doubleClick({css: 'button.accept'});
     * I.doubleClick('.btn.edit');
     * ```
     * @param locator - clickable link or button located by text, or any element located by CSS|XPath|strict locator.
     * @param [context = null] - (optional, `null` by default) element to search in CSS|XPath|Strict locator.
     * @returns automatically synchronized promise through #recorder
     */
    doubleClick(
      locator: TestMaiT.LocatorOrString,
      context?: TestMaiT.LocatorOrString,
    ): Promise<void>;
    /**
     * Performs right click on a clickable element matched by semantic locator, CSS or XPath.
     *
     * ```js
     * // right click element with id el
     * I.rightClick('#el');
     * // right click link or button with text "Click me"
     * I.rightClick('Click me');
     * // right click button with text "Click me" inside .context
     * I.rightClick('Click me', '.context');
     * ```
     * @param locator - clickable element located by CSS|XPath|strict locator.
     * @param [context = null] - (optional, `null` by default) element located by CSS|XPath|strict locator.
     * @returns automatically synchronized promise through #recorder
     */
    rightClick(
      locator: TestMaiT.LocatorOrString,
      context?: TestMaiT.LocatorOrString,
    ): Promise<void>;
    /**
     * Selects a checkbox or radio button.
     * Element is located by label or name or CSS or XPath.
     *
     * The second parameter is a context (CSS or XPath locator) to narrow the search.
     *
     * ```js
     * I.checkOption('#agree');
     * I.checkOption('I Agree to Terms and Conditions');
     * I.checkOption('agree', '//form');
     * ```
     * @param field - checkbox located by label | name | CSS | XPath | strict locator.
     * @param [context = null] - (optional, `null` by default) element located by CSS | XPath | strict locator.
     * @returns automatically synchronized promise through #recorder
     */
    checkOption(field: TestMaiT.LocatorOrString, context?: TestMaiT.LocatorOrString): Promise<void>;
    /**
     * Unselects a checkbox or radio button.
     * Element is located by label or name or CSS or XPath.
     *
     * The second parameter is a context (CSS or XPath locator) to narrow the search.
     *
     * ```js
     * I.uncheckOption('#agree');
     * I.uncheckOption('I Agree to Terms and Conditions');
     * I.uncheckOption('agree', '//form');
     * ```
     * @param field - checkbox located by label | name | CSS | XPath | strict locator.
     * @param [context = null] - (optional, `null` by default) element located by CSS | XPath | strict locator.
     * @returns automatically synchronized promise through #recorder
     */
    uncheckOption(
      field: TestMaiT.LocatorOrString,
      context?: TestMaiT.LocatorOrString,
    ): Promise<void>;
    /**
     * Verifies that the specified checkbox is checked.
     *
     * ```js
     * I.seeCheckboxIsChecked('Agree');
     * I.seeCheckboxIsChecked('#agree'); // I suppose user agreed to terms
     * I.seeCheckboxIsChecked({css: '#signup_form input[type=checkbox]'});
     * ```
     * @param field - located by label|name|CSS|XPath|strict locator.
     * @returns automatically synchronized promise through #recorder
     */
    seeCheckboxIsChecked(field: TestMaiT.LocatorOrString): Promise<void>;
    /**
     * Verifies that the specified checkbox is not checked.
     *
     * ```js
     * I.dontSeeCheckboxIsChecked('#agree'); // located by ID
     * I.dontSeeCheckboxIsChecked('I agree to terms'); // located by label
     * I.dontSeeCheckboxIsChecked('agree'); // located by name
     * ```
     * @param field - located by label|name|CSS|XPath|strict locator.
     * @returns automatically synchronized promise through #recorder
     */
    dontSeeCheckboxIsChecked(field: TestMaiT.LocatorOrString): Promise<void>;
    /**
     * Selects an option in a drop-down select.
     * Field is searched by label | name | CSS | XPath.
     * Option is selected by visible text or by value.
     *
     * ```js
     * I.selectOption('Choose Plan', 'Monthly'); // select by label
     * I.selectOption('subscription', 'Monthly'); // match option by text
     * I.selectOption('subscription', '0'); // or by value
     * I.selectOption('//form/select[@name=account]','Premium');
     * I.selectOption('form select[name=account]', 'Premium');
     * I.selectOption({css: 'form select[name=account]'}, 'Premium');
     * ```
     *
     * Provide an array for the second argument to select multiple options.
     *
     * ```js
     * I.selectOption('Which OS do you use?', ['Android', 'iOS']);
     * ```
     * @param select - field located by label|name|CSS|XPath|strict locator.
     * @param option - visible text or value of option.
     * @returns automatically synchronized promise through #recorder
     */
    selectOption(select: LocatorOrString, option: string | any[]): Promise<void>;
    /**
     * Checks that current url contains a provided fragment.
     *
     * ```js
     * I.seeInCurrentUrl('/register'); // we are on registration page
     * ```
     * @param url - a fragment to check
     * @returns automatically synchronized promise through #recorder
     */
    seeInCurrentUrl(url: string): Promise<void>;
    /**
     * Checks that current url does not contain a provided fragment.
     * @param url - value to check.
     * @returns automatically synchronized promise through #recorder
     */
    dontSeeInCurrentUrl(url: string): Promise<void>;
    /**
     * Checks that current url is equal to provided one.
     * If a relative url provided, a configured url will be prepended to it.
     * So both examples will work:
     *
     * ```js
     * I.seeCurrentUrlEquals('/register');
     * I.seeCurrentUrlEquals('http://my.site.com/register');
     * ```
     * @param url - value to check.
     * @returns automatically synchronized promise through #recorder
     */
    seeCurrentUrlEquals(url: string): Promise<void>;
    /**
     * Checks that current url is not equal to provided one.
     * If a relative url provided, a configured url will be prepended to it.
     *
     * ```js
     * I.dontSeeCurrentUrlEquals('/login'); // relative url are ok
     * I.dontSeeCurrentUrlEquals('http://mysite.com/login'); // absolute urls are also ok
     * ```
     * @param url - value to check.
     * @returns automatically synchronized promise through #recorder
     */
    dontSeeCurrentUrlEquals(url: string): Promise<void>;
    /**
     * Checks that a page contains a visible text.
     * Use context parameter to narrow down the search.
     *
     * ```js
     * I.see('Welcome'); // text welcome on a page
     * I.see('Welcome', '.content'); // text inside .content div
     * I.see('Register', {css: 'form.register'}); // use strict locator
     * ```
     * @param text - expected on page.
     * @param [context = null] - (optional, `null` by default) element located by CSS|Xpath|strict locator in which to search for text.
     * @returns automatically synchronized promise through #recorder
     */
    see(text: string, context?: TestMaiT.LocatorOrString): Promise<void>;
    /**
     * Opposite to `see`. Checks that a text is not present on a page.
     * Use context parameter to narrow down the search.
     *
     * ```js
     * I.dontSee('Login'); // assume we are already logged in.
     * I.dontSee('Login', '.nav'); // no login inside .nav element
     * ```
     * @param text - which is not present.
     * @param [context = null] - (optional) element located by CSS|XPath|strict locator in which to perfrom search.
     * @returns automatically synchronized promise through #recorder
     */
    dontSee(text: string, context?: TestMaiT.LocatorOrString): Promise<void>;
    /**
     * Checks that a given Element is visible
     * Element is located by CSS or XPath.
     *
     * ```js
     * I.seeElement('#modal');
     * ```
     * @param locator - located by CSS|XPath|strict locator.
     * @returns automatically synchronized promise through #recorder
     */
    seeElement(locator: TestMaiT.LocatorOrString): Promise<void>;
    /**
     * Opposite to `seeElement`. Checks that element is not visible (or in DOM)
     *
     * ```js
     * I.dontSeeElement('.modal'); // modal is not shown
     * ```
     * @param locator - located by CSS|XPath|Strict locator.
     * @returns automatically synchronized promise through #recorder
     */
    dontSeeElement(locator: TestMaiT.LocatorOrString): Promise<void>;
    /**
     * Checks that a given Element is present in the DOM
     * Element is located by CSS or XPath.
     *
     * ```js
     * I.seeElementInDOM('#modal');
     * ```
     * @param locator - element located by CSS|XPath|strict locator.
     * @returns automatically synchronized promise through #recorder
     */
    seeElementInDOM(locator: TestMaiT.LocatorOrString): Promise<void>;
    /**
     * Opposite to `seeElementInDOM`. Checks that element is not on page.
     *
     * ```js
     * I.dontSeeElementInDOM('.nav'); // checks that element is not on page visible or not
     * ```
     * @param locator - located by CSS|XPath|Strict locator.
     * @returns automatically synchronized promise through #recorder
     */
    dontSeeElementInDOM(locator: TestMaiT.LocatorOrString): Promise<void>;
    /**
     * Asserts that an element is visible a given number of times.
     * Element is located by CSS or XPath.
     *
     * ```js
     * I.seeNumberOfVisibleElements('.buttons', 3);
     * ```
     * @param locator - element located by CSS|XPath|strict locator.
     * @param num - number of elements.
     * @returns automatically synchronized promise through #recorder
     */
    seeNumberOfVisibleElements(locator: TestMaiT.LocatorOrString, num: number): Promise<void>;
    /**
     * Grab number of visible elements by locator.
     * Resumes test execution, so **should be used inside async function with `await`** operator.
     *
     * ```js
     * let numOfElements = await I.grabNumberOfVisibleElements('p');
     * ```
     * @param locator - located by CSS|XPath|strict locator.
     * @returns number of visible elements
     */
    grabNumberOfVisibleElements(locator: TestMaiT.LocatorOrString): Promise<number>;
    /**
     * Checks that the given input field or textarea equals to given value.
     * For fuzzy locators, fields are matched by label text, the "name" attribute, CSS, and XPath.
     *
     * ```js
     * I.seeInField('Username', 'davert');
     * I.seeInField({css: 'form textarea'},'Type your comment here');
     * I.seeInField('form input[type=hidden]','hidden_value');
     * I.seeInField('#searchform input','Search');
     * ```
     * @param field - located by label|name|CSS|XPath|strict locator.
     * @param value - value to check.
     * @returns automatically synchronized promise through #recorder
     */
    seeInField(field: TestMaiT.LocatorOrString, value: TestMaiT.StringOrSecret): Promise<void>;
    /**
     * Checks that value of input field or textarea doesn't equal to given value
     * Opposite to `seeInField`.
     *
     * ```js
     * I.dontSeeInField('email', 'user@user.com'); // field by name
     * I.dontSeeInField({ css: 'form input.email' }, 'user@user.com'); // field by CSS
     * ```
     * @param field - located by label|name|CSS|XPath|strict locator.
     * @param value - value to check.
     * @returns automatically synchronized promise through #recorder
     */
    dontSeeInField(field: TestMaiT.LocatorOrString, value: TestMaiT.StringOrSecret): Promise<void>;
    /**
     * Checks that text is equal to provided one.
     *
     * ```js
     * I.seeTextEquals('text', 'h1');
     * ```
     */
    seeTextEquals(): void;
    /**
     * Checks that the current page contains the given string in its raw source code.
     *
     * ```js
     * I.seeInSource('<h1>Green eggs &amp; ham</h1>');
     * ```
     * @param text - value to check.
     * @returns automatically synchronized promise through #recorder
     */
    seeInSource(text: string): Promise<void>;
    /**
     * Checks that the current page does not contains the given string in its raw source code.
     *
     * ```js
     * I.dontSeeInSource('<!--'); // no comments in source
     * ```
     * @param value - to check.
     * @returns automatically synchronized promise through #recorder
     */
    dontSeeInSource(value: string): Promise<void>;
    /**
     * Saves screenshot of the specified locator to ouput folder (set in testmait.conf.ts or testmait.conf.js).
     * Filename is relative to output folder.
     *
     * ```js
     * I.saveElementScreenshot(`#submit`,'debug.png');
     * ```
     * @param locator - element located by CSS|XPath|strict locator.
     * @param fileName - file name to save.
     * @returns automatically synchronized promise through #recorder
     */
    saveElementScreenshot(locator: TestMaiT.LocatorOrString, fileName: string): Promise<void>;
    /**
     * Saves a screenshot to ouput folder (set in testmait.conf.ts or testmait.conf.js).
     * Filename is relative to output folder.
     * Optionally resize the window to the full available page `scrollHeight` and `scrollWidth` to capture the entire page by passing `true` in as the second argument.
     *
     * ```js
     * I.saveScreenshot('debug.png');
     * I.saveScreenshot('debug.png', true) //resizes to available scrollHeight and scrollWidth before taking screenshot
     * ```
     * @param fileName - file name to save.
     * @param [fullPage = false] - (optional, `false` by default) flag to enable fullscreen screenshot mode.
     * @returns automatically synchronized promise through #recorder
     */
    saveScreenshot(fileName: string, fullPage?: boolean): Promise<void>;
    /**
     * Pauses execution for a number of seconds.
     *
     * ```js
     * I.wait(2); // wait 2 secs
     * ```
     * @param sec - number of second to wait.
     * @returns automatically synchronized promise through #recorder
     */
    wait(sec: number): Promise<void>;
    /**
     * Executes sync script on a page.
     * Pass arguments to function as additional parameters.
     * Will return execution result to a test.
     * In this case you should use async function and await to receive results.
     *
     * Example with jQuery DatePicker:
     *
     * ```js
     * // change date of jQuery DatePicker
     * I.executeScript(function() {
     *   // now we are inside browser context
     *   $('date').datetimepicker('setDate', new Date());
     * });
     * ```
     * Can return values. Don't forget to use `await` to get them.
     *
     * ```js
     * let date = await I.executeScript(function(el) {
     *   // only basic types can be returned
     *   return $(el).datetimepicker('getDate').toString();
     * }, '#date'); // passing jquery selector
     * ```
     * @param fn - function to be executed in browser context.
     * @param args - to be passed to function.
     * @returns script return value
     *
     *
     * If a function returns a Promise It will wait for its resolution.
     */
    executeScript(fn: string | ((...params: any[]) => any), ...args: any[]): Promise<any>;
    /**
     * Retrieves all texts from an element located by CSS or XPath and returns it to test.
     * Resumes test execution, so **should be used inside async with `await`** operator.
     *
     * ```js
     * let pins = await I.grabTextFromAll('#pin li');
     * ```
     * @param locator - element located by CSS|XPath|strict locator.
     * @returns attribute value
     */
    grabTextFromAll(locator: TestMaiT.LocatorOrString): Promise<string[]>;
    /**
     * Retrieves a text from an element located by CSS or XPath and returns it to test.
     * Resumes test execution, so **should be used inside async with `await`** operator.
     *
     * ```js
     * let pin = await I.grabTextFrom('#pin');
     * ```
     * If multiple elements found returns first element.
     * @param locator - element located by CSS|XPath|strict locator.
     * @returns attribute value
     */
    grabTextFrom(locator: TestMaiT.LocatorOrString): Promise<string>;
    /**
     * Retrieves an attribute from an element located by CSS or XPath and returns it to test.
     * Resumes test execution, so **should be used inside async with `await`** operator.
     * If more than one element is found - attribute of first element is returned.
     *
     * ```js
     * let hint = await I.grabAttributeFrom('#tooltip', 'title');
     * ```
     * @param locator - element located by CSS|XPath|strict locator.
     * @param attr - attribute name.
     * @returns attribute value
     */
    grabAttributeFromAll(locator: TestMaiT.LocatorOrString, attr: string): Promise<string>;
    /**
     * Retrieves an attribute from an element located by CSS or XPath and returns it to test.
     * Resumes test execution, so **should be used inside async with `await`** operator.
     * If more than one element is found - attribute of first element is returned.
     *
     * ```js
     * let hint = await I.grabAttributeFrom('#tooltip', 'title');
     * ```
     * @param locator - element located by CSS|XPath|strict locator.
     * @param attr - attribute name.
     * @returns attribute value
     */
    grabAttributeFrom(locator: TestMaiT.LocatorOrString, attr: string): Promise<string>;
    /**
     * Retrieves an array of value from a form located by CSS or XPath and returns it to test.
     * Resumes test execution, so **should be used inside async function with `await`** operator.
     *
     * ```js
     * let inputs = await I.grabValueFromAll('//form/input');
     * ```
     * @param locator - field located by label|name|CSS|XPath|strict locator.
     * @returns attribute value
     */
    grabValueFromAll(locator: TestMaiT.LocatorOrString): Promise<string[]>;
    /**
     * Retrieves a value from a form element located by CSS or XPath and returns it to test.
     * Resumes test execution, so **should be used inside async function with `await`** operator.
     * If more than one element is found - value of first element is returned.
     *
     * ```js
     * let email = await I.grabValueFrom('input[name=email]');
     * ```
     * @param locator - field located by label|name|CSS|XPath|strict locator.
     * @returns attribute value
     */
    grabValueFrom(locator: TestMaiT.LocatorOrString): Promise<string>;
    /**
     * Retrieves page source and returns it to test.
     * Resumes test execution, so **should be used inside async function with `await`** operator.
     *
     * ```js
     * let pageSource = await I.grabSource();
     * ```
     * @returns source code
     */
    grabSource(): Promise<string>;
    /**
     * Get JS log from browser.
     *
     * ```js
     * let logs = await I.grabBrowserLogs();
     * console.log(JSON.stringify(logs))
     * ```
     */
    grabBrowserLogs(): void;
    /**
     * Get current URL from browser.
     * Resumes test execution, so should be used inside an async function.
     *
     * ```js
     * let url = await I.grabCurrentUrl();
     * console.log(`Current URL is [${url}]`);
     * ```
     * @returns current URL
     */
    grabCurrentUrl(): Promise<string>;
    /**
     * Retrieves a page scroll position and returns it to test.
     * Resumes test execution, so **should be used inside an async function with `await`** operator.
     *
     * ```js
     * let { x, y } = await I.grabPageScrollPosition();
     * ```
     * @returns scroll position
     */
    grabPageScrollPosition(): Promise<PageScrollPosition>;
    /**
     * Scroll page to the top.
     *
     * ```js
     * I.scrollPageToTop();
     * ```
     * @returns automatically synchronized promise through #recorder
     */
    scrollPageToTop(): Promise<void>;
    /**
     * Scroll page to the bottom.
     *
     * ```js
     * I.scrollPageToBottom();
     * ```
     * @returns automatically synchronized promise through #recorder
     */
    scrollPageToBottom(): Promise<void>;
    /**
     * Scrolls to element matched by locator.
     * Extra shift can be set with offsetX and offsetY options.
     *
     * ```js
     * I.scrollTo('footer');
     * I.scrollTo('#submit', 5, 5);
     * ```
     * @param locator - located by CSS|XPath|strict locator.
     * @param [offsetX = 0] - (optional, `0` by default) X-axis offset.
     * @param [offsetY = 0] - (optional, `0` by default) Y-axis offset.
     * @returns automatically synchronized promise through #recorder
     */
    scrollTo(locator: TestMaiT.LocatorOrString, offsetX?: number, offsetY?: number): Promise<void>;
    /**
     * Switches frame or in case of null locator reverts to parent.
     *
     * ```js
     * I.switchTo('iframe'); // switch to first iframe
     * I.switchTo(); // switch back to main page
     * ```
     * @param [locator = null] - (optional, `null` by default) element located by CSS|XPath|strict locator.
     * @returns automatically synchronized promise through #recorder
     */
    switchTo(locator?: TestMaiT.LocatorOrString): Promise<void>;
    /**
     * Sets cookie(s).
     *
     * Can be a single cookie object or an array of cookies:
     *
     * ```js
     * I.setCookie({name: 'auth', value: true});
     *
     * // as array
     * I.setCookie([
     *   {name: 'auth', value: true},
     *   {name: 'agree', value: true}
     * ]);
     * ```
     * @param cookie - a cookie object or array of cookie objects.
     * @returns automatically synchronized promise through #recorder
     */
    setCookie(cookie: Cookie | Cookie[]): Promise<void>;
    /**
     * Checks that cookie with given name exists.
     *
     * ```js
     * I.seeCookie('Auth');
     * ```
     * @param name - cookie name.
     * @returns automatically synchronized promise through #recorder
     */
    seeCookie(name: string): Promise<void>;
    /**
     * Checks that cookie with given name does not exist.
     *
     * ```js
     * I.dontSeeCookie('auth'); // no auth cookie
     * ```
     * @param name - cookie name.
     * @returns automatically synchronized promise through #recorder
     */
    dontSeeCookie(name: string): Promise<void>;
    /**
     * Gets a cookie object by name.
     * If none provided gets all cookies.
     * Resumes test execution, so **should be used inside async function with `await`** operator.
     *
     * ```js
     * let cookie = await I.grabCookie('auth');
     * assert(cookie.value, '123456');
     * ```
     * @param [name = null] - cookie name.
     * @returns attribute value
     *
     *
     * Returns cookie in JSON format. If name not passed returns all cookies for this domain.
     */
    grabCookie(name?: string): any;
    /**
     * Clears a cookie by name,
     * if none provided clears all cookies.
     *
     * ```js
     * I.clearCookie();
     * I.clearCookie('test');
     * ```
     * @param [cookie = null] - (optional, `null` by default) cookie name
     * @returns automatically synchronized promise through #recorder
     */
    clearCookie(cookie?: string): Promise<void>;
    /**
     * Waiting for the part of the URL to match the expected. Useful for SPA to understand that page was changed.
     *
     * ```js
     * I.waitInUrl('/info', 2);
     * ```
     * @param urlPart - value to check.
     * @param [sec = 1] - (optional, `1` by default) time in seconds to wait
     * @returns automatically synchronized promise through #recorder
     */
    waitInUrl(urlPart: string, sec?: number): Promise<void>;
    /**
     * Waits for the entire URL to match the expected
     *
     * ```js
     * I.waitUrlEquals('/info', 2);
     * I.waitUrlEquals('http://127.0.0.1:8000/info');
     * ```
     * @param urlPart - value to check.
     * @param [sec = 1] - (optional, `1` by default) time in seconds to wait
     * @returns automatically synchronized promise through #recorder
     */
    waitUrlEquals(urlPart: string, sec?: number): Promise<void>;
    /**
     * Waits for a function to return true (waits for 1 sec by default).
     * Running in browser context.
     *
     * ```js
     * I.waitForFunction(fn[, [args[, timeout]])
     * ```
     *
     * ```js
     * I.waitForFunction(() => window.requests == 0);
     * I.waitForFunction(() => window.requests == 0, 5); // waits for 5 sec
     * I.waitForFunction((count) => window.requests == count, [3], 5) // pass args and wait for 5 sec
     * ```
     * @param fn - to be executed in browser context.
     * @param [argsOrSec = null] - (optional, `1` by default) arguments for function or seconds.
     * @param [sec = null] - (optional, `1` by default) time in seconds to wait
     * @returns automatically synchronized promise through #recorder
     */
    waitForFunction(
      fn: string | ((...params: any[]) => any),
      argsOrSec?: any[] | number,
      sec?: number,
    ): Promise<void>;
    /**
     * Waits for a specified number of elements on the page.
     *
     * ```js
     * I.waitNumberOfVisibleElements('a', 3);
     * ```
     * @param locator - element located by CSS|XPath|strict locator.
     * @param num - number of elements.
     * @param [sec = 1] - (optional, `1` by default) time in seconds to wait
     * @returns automatically synchronized promise through #recorder
     */
    waitNumberOfVisibleElements(
      locator: TestMaiT.LocatorOrString,
      num: number,
      sec?: number,
    ): Promise<void>;
    /**
     * Waits for element to be present on page (by default waits for 1sec).
     * Element can be located by CSS or XPath.
     *
     * ```js
     * I.waitForElement('.btn.continue');
     * I.waitForElement('.btn.continue', 5); // wait for 5 secs
     * ```
     * @param locator - element located by CSS|XPath|strict locator.
     * @param [sec] - (optional, `1` by default) time in seconds to wait
     * @returns automatically synchronized promise through #recorder
     */
    waitForElement(locator: TestMaiT.LocatorOrString, sec?: number): Promise<void>;
    /**
     * Waits for an element to hide (by default waits for 1sec).
     * Element can be located by CSS or XPath.
     *
     * ```js
     * I.waitToHide('#popup');
     * ```
     * @param locator - element located by CSS|XPath|strict locator.
     * @param [sec = 1] - (optional, `1` by default) time in seconds to wait
     * @returns automatically synchronized promise through #recorder
     */
    waitToHide(locator: TestMaiT.LocatorOrString, sec?: number): Promise<void>;
    /**
     * Waits for an element to be removed or become invisible on a page (by default waits for 1sec).
     * Element can be located by CSS or XPath.
     *
     * ```js
     * I.waitForInvisible('#popup');
     * ```
     * @param locator - element located by CSS|XPath|strict locator.
     * @param [sec = 1] - (optional, `1` by default) time in seconds to wait
     * @returns automatically synchronized promise through #recorder
     */
    waitForInvisible(locator: TestMaiT.LocatorOrString, sec?: number): Promise<void>;
    /**
     * Waits for a text to appear (by default waits for 1sec).
     * Element can be located by CSS or XPath.
     * Narrow down search results by providing context.
     *
     * ```js
     * I.waitForText('Thank you, form has been submitted');
     * I.waitForText('Thank you, form has been submitted', 5, '#modal');
     * ```
     * @param text - to wait for.
     * @param [sec = 1] - (optional, `1` by default) time in seconds to wait
     * @param [context = null] - (optional) element located by CSS|XPath|strict locator.
     * @returns automatically synchronized promise through #recorder
     */
    waitForText(text: string, sec?: number, context?: TestMaiT.LocatorOrString): Promise<void>;
  }
  /**
   * ## Configuration
   *
   * This helper should be configured in testmait.conf.js
   * @property url - base url of website to be tested.
   * @property browser - Browser in which to perform testing.
   * @property [basicAuth] - (optional) the basic authentication to pass to base url. Example: {username: 'username', password: 'password'}
   * @property [host = localhost] - WebDriver host to connect.
   * @property [port = 4444] - WebDriver port to connect.
   * @property [protocol = http] - protocol for WebDriver server.
   * @property [path = /wd/hub] - path to WebDriver server.
   * @property [restart = true] - restart browser between tests.
   * @property [smartWait = false] - **enables [SmartWait](http://testmait.io/acceptance/#smartwait)**; wait for additional milliseconds for element to appear. Enable for 5 secs: "smartWait": 5000.
   * @property [disableScreenshots = false] - don't save screenshots on failure.
   * @property [fullPageScreenshots = false] - (optional - make full page screenshots on failure.
   * @property [uniqueScreenshotNames = false] - option to prevent screenshot override if you have scenarios with the same name in different suites.
   * @property [keepBrowserState = false] - keep browser state between tests when `restart` is set to false.
   * @property [keepCookies = false] - keep cookies between tests when `restart` set to false.
   * @property [windowSize = window] - default window size. Set to `maximize` or a dimension in the format `640x480`.
   * @property [waitForTimeout = 1000] - sets default wait time in *ms* for all `wait*` functions.
   * @property [desiredCapabilities] - Selenium's [desired capabilities](https://github.com/SeleniumHQ/selenium/wiki/DesiredCapabilities).
   * @property [manualStart = false] - do not start browser before a test, start it manually inside a helper with `this.helpers["WebDriver"]._startBrowser()`.
   * @property [timeouts] - [WebDriver timeouts](http://webdriver.io/docs/timeouts.html) defined as hash.
   * @property [highlightElement] - highlight the interacting elements. Default: false. Note: only activate under verbose mode (--verbose).
   */
  type WebDriverConfig = {
    url: string;
    browser: string;
    basicAuth?: string;
    host?: string;
    port?: number;
    protocol?: string;
    path?: string;
    restart?: boolean;
    smartWait?: boolean | number;
    disableScreenshots?: boolean;
    fullPageScreenshots?: boolean;
    uniqueScreenshotNames?: boolean;
    keepBrowserState?: boolean;
    keepCookies?: boolean;
    windowSize?: string;
    waitForTimeout?: number;
    desiredCapabilities?: any;
    manualStart?: boolean;
    timeouts?: any;
    highlightElement?: boolean;
  };
  /**
   * WebDriver helper which wraps [webdriverio](http://webdriver.io/) library to
   * manipulate browser using Selenium WebDriver or PhantomJS.
   *
   * WebDriver requires Selenium Server and ChromeDriver/GeckoDriver to be installed. Those tools can be easily installed via NPM. Please check [Testing with WebDriver](https://testmait.io/webdriver/#testing-with-webdriver) for more details.
   *
   * <!-- configuration -->
   *
   * Example:
   *
   * ```js
   * {
   *    helpers: {
   *      WebDriver : {
   *        smartWait: 5000,
   *        browser: "chrome",
   *        restart: false,
   *        windowSize: "maximize",
   *        timeouts: {
   *          "script": 60000,
   *          "page load": 10000
   *        }
   *      }
   *    }
   * }
   * ```
   *
   * Example with basic authentication
   * ```js
   * {
   *    helpers: {
   *      WebDriver : {
   *        smartWait: 5000,
   *        browser: "chrome",
   *        basicAuth: {username: 'username', password: 'password'},
   *        restart: false,
   *        windowSize: "maximize",
   *        timeouts: {
   *          "script": 60000,
   *          "page load": 10000
   *        }
   *      }
   *    }
   * }
   * ```
   *
   * Additional configuration params can be used from [webdriverio
   * website](http://webdriver.io/guide/getstarted/configuration.html).
   *
   * ### Headless Chrome
   *
   * ```js
   * {
   *    helpers: {
   *      WebDriver : {
   *        url: "http://localhost",
   *        browser: "chrome",
   *        desiredCapabilities: {
   *          chromeOptions: {
   *            args: [ "--headless", "--disable-gpu", "--no-sandbox" ]
   *          }
   *        }
   *      }
   *    }
   * }
   * ```
   *
   * ### Internet Explorer
   *
   * Additional configuration params can be used from [IE options](https://seleniumhq.github.io/selenium/docs/api/rb/Selenium/WebDriver/IE/Options.html)
   *
   * ```js
   * {
   *    helpers: {
   *      WebDriver : {
   *        url: "http://localhost",
   *        browser: "internet explorer",
   *        desiredCapabilities: {
   *          ieOptions: {
   *            "ie.browserCommandLineSwitches": "-private",
   *            "ie.usePerProcessProxy": true,
   *            "ie.ensureCleanSession": true,
   *          }
   *        }
   *      }
   *    }
   * }
   * ```
   *
   * ### Selenoid Options
   *
   * [Selenoid](https://aerokube.com/selenoid/latest/) is a modern way to run Selenium inside Docker containers.
   * Selenoid is easy to set up and provides more features than original Selenium Server. Use `selenoidOptions` to set Selenoid capabilities
   *
   * ```js
   * {
   *    helpers: {
   *      WebDriver : {
   *        url: "http://localhost",
   *        browser: "chrome",
   *        desiredCapabilities: {
   *          selenoidOptions: {
   *            enableVNC: true,
   *          }
   *        }
   *      }
   *    }
   * }
   * ```
   *
   * ### Connect Through proxy
   *
   * TestMaiT also provides flexible options when you want to execute tests to Selenium servers through proxy. You will
   * need to update the `helpers.WebDriver.capabilities.proxy` key.
   *
   * ```js
   * {
   *     helpers: {
   *         WebDriver: {
   *             capabilities: {
   *                 proxy: {
   *                     "proxyType": "manual|pac",
   *                     "proxyAutoconfigUrl": "URL TO PAC FILE",
   *                     "httpProxy": "PROXY SERVER",
   *                     "sslProxy": "PROXY SERVER",
   *                     "ftpProxy": "PROXY SERVER",
   *                     "socksProxy": "PROXY SERVER",
   *                     "socksUsername": "USERNAME",
   *                     "socksPassword": "PASSWORD",
   *                     "noProxy": "BYPASS ADDRESSES"
   *                 }
   *             }
   *         }
   *     }
   * }
   * ```
   * For example,
   *
   * ```js
   * {
   *     helpers: {
   *         WebDriver: {
   *             capabilities: {
   *                 proxy: {
   *                     "proxyType": "manual",
   *                     "httpProxy": "http://corporate.proxy:8080",
   *                     "socksUsername": "testmait",
   *                     "socksPassword": "secret",
   *                     "noProxy": "127.0.0.1,localhost"
   *                 }
   *             }
   *         }
   *     }
   * }
   * ```
   *
   * Please refer to [Selenium - Proxy Object](https://github.com/SeleniumHQ/selenium/wiki/DesiredCapabilities) for more
   * information.
   *
   * ### Cloud Providers
   *
   * WebDriver makes it possible to execute tests against services like `Sauce Labs` `BrowserStack` `TestingBot`
   * Check out their documentation on [available parameters](http://webdriver.io/guide/usage/cloudservices.html)
   *
   * Connecting to `BrowserStack` and `Sauce Labs` is simple. All you need to do
   * is set the `user` and `key` parameters. WebDriver automatically know which
   * service provider to connect to.
   *
   * ```js
   * {
   *     helpers:{
   *         WebDriver: {
   *             url: "YOUR_DESIRED_HOST",
   *             user: "YOUR_BROWSERSTACK_USER",
   *             key: "YOUR_BROWSERSTACK_KEY",
   *             capabilities: {
   *                 "browserName": "chrome",
   *
   *                 // only set this if you're using BrowserStackLocal to test a local domain
   *                 // "browserstack.local": true,
   *
   *                 // set this option to tell browserstack to provide addition debugging info
   *                 // "browserstack.debug": true,
   *             }
   *         }
   *     }
   * }
   * ```
   *
   * #### SauceLabs
   *
   * SauceLabs can be configured via wdio service, which should be installed additionally:
   *
   * ```
   * npm i @wdio/sauce-service --save
   * ```
   *
   * It is important to make sure it is compatible with current webdriverio version.
   *
   * Enable `wdio` plugin in plugins list and add `sauce` service:
   *
   * ```js
   * plugins: {
   *    wdio: {
   *       enabled: true,
   *        services: ['sauce'],
   *        user: ... ,// saucelabs username
   *        key: ... // saucelabs api key
   *        // additional config, from sauce service
   *    }
   * }
   * ```
   *
   * See [complete reference on webdriver.io](https://webdriver.io/docs/sauce-service.html).
   *
   * > Alternatively, use [testmait-saucehelper](https://github.com/puneet0191/testmait-saucehelper/) for better reporting.
   *
   * #### BrowserStack
   *
   * BrowserStack can be configured via wdio service, which should be installed additionally:
   *
   * ```
   * npm i @wdio/browserstack-service --save
   * ```
   *
   * It is important to make sure it is compatible with current webdriverio version.
   *
   * Enable `wdio` plugin in plugins list and add `browserstack` service:
   *
   * ```js
   * plugins: {
   *    wdio: {
   *       enabled: true,
   *        services: ['browserstack'],
   *        user: ... ,// browserstack username
   *        key: ... // browserstack api key
   *        // additional config, from browserstack service
   *    }
   * }
   * ```
   *
   * See [complete reference on webdriver.io](https://webdriver.io/docs/browserstack-service.html).
   *
   * > Alternatively, use [testmait-bshelper](https://github.com/PeterNgTr/testmait-bshelper) for better reporting.
   *
   * #### TestingBot
   *
   * > **Recommended**: use official [TestingBot Helper](https://github.com/testingbot/testmait-tbhelper).
   *
   * Alternatively, TestingBot can be configured via wdio service, which should be installed additionally:
   *
   * ```
   * npm i @wdio/testingbot-service --save
   * ```
   *
   * It is important to make sure it is compatible with current webdriverio version.
   *
   * Enable `wdio` plugin in plugins list and add `testingbot` service:
   *
   * ```js
   * plugins: {
   *   wdio: {
   *       enabled: true,
   *       services: ['testingbot'],
   *       user: ... ,// testingbot key
   *       key: ... // testingbot secret
   *       // additional config, from testingbot service
   *   }
   * }
   * ```
   *
   * See [complete reference on webdriver.io](https://webdriver.io/docs/testingbot-service.html).
   *
   * #### Applitools
   *
   * Visual testing via Applitools service
   *
   * > Use [TestMaiT Applitools Helper](https://github.com/PeterNgTr/testmait-applitoolshelper) with Applitools wdio service.
   *
   *
   * ### Multiremote Capabilities
   *
   * This is a work in progress but you can control two browsers at a time right out of the box.
   * Individual control is something that is planned for a later version.
   *
   * Here is the [webdriverio docs](http://webdriver.io/guide/usage/multiremote.html) on the subject
   *
   * ```js
   * {
   *     helpers: {
   *         WebDriver: {
   *             "multiremote": {
   *                 "MyChrome": {
   *                     "desiredCapabilities": {
   *                         "browserName": "chrome"
   *                      }
   *                 },
   *                 "MyFirefox": {
   *                    "desiredCapabilities": {
   *                        "browserName": "firefox"
   *                    }
   *                 }
   *             }
   *         }
   *     }
   * }
   * ```
   *
   * ## Access From Helpers
   *
   * Receive a WebDriver client from a custom helper by accessing `browser` property:
   *
   * ```js
   * const { WebDriver } = this.helpers;
   * const browser = WebDriver.browser
   * ```
   *
   * ## Methods
   */
  class WebDriver {
    /**
     * Use [webdriverio](https://webdriver.io/docs/api.html) API inside a test.
     *
     * First argument is a description of an action.
     * Second argument is async function that gets this helper as parameter.
     *
     * { [`browser`](https://webdriver.io/docs/api.html)) } object from WebDriver API is available.
     *
     * ```js
     * I.useWebDriverTo('open multiple windows', async ({ browser }) {
     *    // create new window
     *    await browser.newWindow('https://webdriver.io');
     * });
     * ```
     * @param description - used to show in logs.
     * @param fn - async functuion that executed with WebDriver helper as argument
     */
    useWebDriverTo(description: string, fn: (...params: any[]) => any): void;
    /**
     * Check if locator is type of "Shadow"
     */
    _isShadowLocator(locator: any): void;
    /**
     * Locate Element within the Shadow Dom
     */
    _locateShadow(locator: any): void;
    /**
     * Smart Wait to locate an element
     */
    _smartWait(locator: any): void;
    /**
     * Get elements by different locator types, including strict locator.
     * Should be used in custom helpers:
     *
     * ```js
     * this.helpers['WebDriver']._locate({name: 'password'}).then //...
     * ```
     * @param locator - element located by CSS|XPath|strict locator.
     */
    _locate(locator: TestMaiT.LocatorOrString): void;
    /**
     * Find a checkbox by providing human-readable text:
     *
     * ```js
     * this.helpers['WebDriver']._locateCheckable('I agree with terms and conditions').then // ...
     * ```
     * @param locator - element located by CSS|XPath|strict locator.
     */
    _locateCheckable(locator: TestMaiT.LocatorOrString): void;
    /**
     * Find a clickable element by providing human-readable text:
     *
     * ```js
     * const els = await this.helpers.WebDriver._locateClickable('Next page');
     * const els = await this.helpers.WebDriver._locateClickable('Next page', '.pages');
     * ```
     * @param locator - element located by CSS|XPath|strict locator.
     */
    _locateClickable(locator: TestMaiT.LocatorOrString): void;
    /**
     * Find field elements by providing human-readable text:
     *
     * ```js
     * this.helpers['WebDriver']._locateFields('Your email').then // ...
     * ```
     * @param locator - element located by CSS|XPath|strict locator.
     */
    _locateFields(locator: TestMaiT.LocatorOrString): void;
    /**
     * Set [WebDriver timeouts](https://webdriver.io/docs/timeouts.html) in realtime.
     *
     * Timeouts are expected to be passed as object:
     *
     * ```js
     * I.defineTimeout({ script: 5000 });
     * I.defineTimeout({ implicit: 10000, pageLoad: 10000, script: 5000 });
     * ```
     * @param timeouts - WebDriver timeouts object.
     */
    defineTimeout(timeouts: any): void;
    /**
     * Opens a web page in a browser. Requires relative or absolute url.
     * If url starts with `/`, opens a web page of a site defined in `url` config parameter.
     *
     * ```js
     * I.amOnPage('/'); // opens main page of website
     * I.amOnPage('https://github.com'); // opens github
     * I.amOnPage('/login'); // opens a login page
     * ```
     * @param url - url path or global url.
     * @returns automatically synchronized promise through #recorder
     */
    amOnPage(url: string): Promise<void>;
    /**
     * Perform a click on a link or a button, given by a locator.
     * If a fuzzy locator is given, the page will be searched for a button, link, or image matching the locator string.
     * For buttons, the "value" attribute, "name" attribute, and inner text are searched. For links, the link text is searched.
     * For images, the "alt" attribute and inner text of any parent links are searched.
     *
     * The second parameter is a context (CSS or XPath locator) to narrow the search.
     *
     * ```js
     * // simple link
     * I.click('Logout');
     * // button of form
     * I.click('Submit');
     * // CSS button
     * I.click('#form input[type=submit]');
     * // XPath
     * I.click('//form/*[@type=submit]');
     * // link in context
     * I.click('Logout', '#nav');
     * // using strict locator
     * I.click({css: 'nav a.login'});
     * ```
     * @param locator - clickable link or button located by text, or any element located by CSS|XPath|strict locator.
     * @param [context = null] - (optional, `null` by default) element to search in CSS|XPath|Strict locator.
     * @returns automatically synchronized promise through #recorder
     *
     *
     * {{ react }}
     */
    click(
      locator: TestMaiT.LocatorOrString,
      context?: TestMaiT.LocatorOrString | null,
    ): Promise<void>;
    /**
     * Perform an emulated click on a link or a button, given by a locator.
     * Unlike normal click instead of sending native event, emulates a click with JavaScript.
     * This works on hidden, animated or inactive elements as well.
     *
     * If a fuzzy locator is given, the page will be searched for a button, link, or image matching the locator string.
     * For buttons, the "value" attribute, "name" attribute, and inner text are searched. For links, the link text is searched.
     * For images, the "alt" attribute and inner text of any parent links are searched.
     *
     * The second parameter is a context (CSS or XPath locator) to narrow the search.
     *
     * ```js
     * // simple link
     * I.forceClick('Logout');
     * // button of form
     * I.forceClick('Submit');
     * // CSS button
     * I.forceClick('#form input[type=submit]');
     * // XPath
     * I.forceClick('//form/*[@type=submit]');
     * // link in context
     * I.forceClick('Logout', '#nav');
     * // using strict locator
     * I.forceClick({css: 'nav a.login'});
     * ```
     * @param locator - clickable link or button located by text, or any element located by CSS|XPath|strict locator.
     * @param [context = null] - (optional, `null` by default) element to search in CSS|XPath|Strict locator.
     * @returns automatically synchronized promise through #recorder
     *
     *
     * {{ react }}
     */
    forceClick(
      locator: TestMaiT.LocatorOrString,
      context?: TestMaiT.LocatorOrString,
    ): Promise<void>;
    /**
     * Performs a double-click on an element matched by link|button|label|CSS or XPath.
     * Context can be specified as second parameter to narrow search.
     *
     * ```js
     * I.doubleClick('Edit');
     * I.doubleClick('Edit', '.actions');
     * I.doubleClick({css: 'button.accept'});
     * I.doubleClick('.btn.edit');
     * ```
     * @param locator - clickable link or button located by text, or any element located by CSS|XPath|strict locator.
     * @param [context = null] - (optional, `null` by default) element to search in CSS|XPath|Strict locator.
     * @returns automatically synchronized promise through #recorder
     *
     *
     * {{ react }}
     */
    doubleClick(
      locator: TestMaiT.LocatorOrString,
      context?: TestMaiT.LocatorOrString,
    ): Promise<void>;
    /**
     * Performs right click on a clickable element matched by semantic locator, CSS or XPath.
     *
     * ```js
     * // right click element with id el
     * I.rightClick('#el');
     * // right click link or button with text "Click me"
     * I.rightClick('Click me');
     * // right click button with text "Click me" inside .context
     * I.rightClick('Click me', '.context');
     * ```
     * @param locator - clickable element located by CSS|XPath|strict locator.
     * @param [context = null] - (optional, `null` by default) element located by CSS|XPath|strict locator.
     * @returns automatically synchronized promise through #recorder
     *
     *
     * {{ react }}
     */
    rightClick(
      locator: TestMaiT.LocatorOrString,
      context?: TestMaiT.LocatorOrString,
    ): Promise<void>;
    /**
     * Emulates right click on an element.
     * Unlike normal click instead of sending native event, emulates a click with JavaScript.
     * This works on hidden, animated or inactive elements as well.
     *
     * If a fuzzy locator is given, the page will be searched for a button, link, or image matching the locator string.
     * For buttons, the "value" attribute, "name" attribute, and inner text are searched. For links, the link text is searched.
     * For images, the "alt" attribute and inner text of any parent links are searched.
     *
     * The second parameter is a context (CSS or XPath locator) to narrow the search.
     *
     * ```js
     * // simple link
     * I.forceRightClick('Menu');
     * ```
     * @param locator - clickable link or button located by text, or any element located by CSS|XPath|strict locator.
     * @param [context = null] - (optional, `null` by default) element to search in CSS|XPath|Strict locator.
     * @returns automatically synchronized promise through #recorder
     *
     *
     * {{ react }}
     */
    forceRightClick(
      locator: TestMaiT.LocatorOrString,
      context?: TestMaiT.LocatorOrString,
    ): Promise<void>;
    /**
     * Fills a text field or textarea, after clearing its value, with the given string.
     * Field is located by name, label, CSS, or XPath.
     *
     * ```js
     * // by label
     * I.fillField('Email', 'hello@world.com');
     * // by name
     * I.fillField('password', secret('123456'));
     * // by CSS
     * I.fillField('form#login input[name=username]', 'John');
     * // or by strict locator
     * I.fillField({css: 'form#login input[name=username]'}, 'John');
     * ```
     * @param field - located by label|name|CSS|XPath|strict locator.
     * @param value - text value to fill.
     * @returns automatically synchronized promise through #recorder
     *
     * {{ react }}
     * {{ custom }}
     */
    fillField(field: TestMaiT.LocatorOrString, value: TestMaiT.StringOrSecret): Promise<void>;
    /**
     * Appends text to a input field or textarea.
     * Field is located by name, label, CSS or XPath
     *
     * ```js
     * I.appendField('#myTextField', 'appended');
     * // typing secret
     * I.appendField('password', secret('123456'));
     * ```
     * @param field - located by label|name|CSS|XPath|strict locator
     * @param value - text value to append.
     * @returns automatically synchronized promise through #recorder
     *
     * {{ react }}
     */
    appendField(field: TestMaiT.LocatorOrString, value: string): Promise<void>;
    /**
     * Clears a `<textarea>` or text `<input>` element's value.
     *
     * ```js
     * I.clearField('Email');
     * I.clearField('user[email]');
     * I.clearField('#email');
     * ```
     * @param editable - field located by label|name|CSS|XPath|strict locator.
     * @returns automatically synchronized promise through #recorder.
     */
    clearField(editable: LocatorOrString): Promise<void>;
    /**
     * Selects an option in a drop-down select.
     * Field is searched by label | name | CSS | XPath.
     * Option is selected by visible text or by value.
     *
     * ```js
     * I.selectOption('Choose Plan', 'Monthly'); // select by label
     * I.selectOption('subscription', 'Monthly'); // match option by text
     * I.selectOption('subscription', '0'); // or by value
     * I.selectOption('//form/select[@name=account]','Premium');
     * I.selectOption('form select[name=account]', 'Premium');
     * I.selectOption({css: 'form select[name=account]'}, 'Premium');
     * ```
     *
     * Provide an array for the second argument to select multiple options.
     *
     * ```js
     * I.selectOption('Which OS do you use?', ['Android', 'iOS']);
     * ```
     * @param select - field located by label|name|CSS|XPath|strict locator.
     * @param option - visible text or value of option.
     * @returns automatically synchronized promise through #recorder
     */
    selectOption(select: LocatorOrString, option: string | any[]): Promise<void>;
    /**
     * Attaches a file to element located by label, name, CSS or XPath
     * Path to file is relative current testmait directory (where testmait.conf.ts or testmait.conf.js is located).
     * File will be uploaded to remote system (if tests are running remotely).
     *
     * ```js
     * I.attachFile('Avatar', 'data/avatar.jpg');
     * I.attachFile('form input[name=avatar]', 'data/avatar.jpg');
     * ```
     * @param locator - field located by label|name|CSS|XPath|strict locator.
     * @param pathToFile - local file path relative to testmait.conf.ts or testmait.conf.js config file.
     * @returns automatically synchronized promise through #recorder
     *
     * Appium: not tested
     */
    attachFile(locator: TestMaiT.LocatorOrString, pathToFile: string): Promise<void>;
    /**
     * Selects a checkbox or radio button.
     * Element is located by label or name or CSS or XPath.
     *
     * The second parameter is a context (CSS or XPath locator) to narrow the search.
     *
     * ```js
     * I.checkOption('#agree');
     * I.checkOption('I Agree to Terms and Conditions');
     * I.checkOption('agree', '//form');
     * ```
     * @param field - checkbox located by label | name | CSS | XPath | strict locator.
     * @param [context = null] - (optional, `null` by default) element located by CSS | XPath | strict locator.
     * @returns automatically synchronized promise through #recorder
     *
     * Appium: not tested
     */
    checkOption(field: TestMaiT.LocatorOrString, context?: TestMaiT.LocatorOrString): Promise<void>;
    /**
     * Unselects a checkbox or radio button.
     * Element is located by label or name or CSS or XPath.
     *
     * The second parameter is a context (CSS or XPath locator) to narrow the search.
     *
     * ```js
     * I.uncheckOption('#agree');
     * I.uncheckOption('I Agree to Terms and Conditions');
     * I.uncheckOption('agree', '//form');
     * ```
     * @param field - checkbox located by label | name | CSS | XPath | strict locator.
     * @param [context = null] - (optional, `null` by default) element located by CSS | XPath | strict locator.
     * @returns automatically synchronized promise through #recorder
     *
     * Appium: not tested
     */
    uncheckOption(
      field: TestMaiT.LocatorOrString,
      context?: TestMaiT.LocatorOrString,
    ): Promise<void>;
    /**
     * Retrieves all texts from an element located by CSS or XPath and returns it to test.
     * Resumes test execution, so **should be used inside async with `await`** operator.
     *
     * ```js
     * let pins = await I.grabTextFromAll('#pin li');
     * ```
     * @param locator - element located by CSS|XPath|strict locator.
     * @returns attribute value
     */
    grabTextFromAll(locator: TestMaiT.LocatorOrString): Promise<string[]>;
    /**
     * Retrieves a text from an element located by CSS or XPath and returns it to test.
     * Resumes test execution, so **should be used inside async with `await`** operator.
     *
     * ```js
     * let pin = await I.grabTextFrom('#pin');
     * ```
     * If multiple elements found returns first element.
     * @param locator - element located by CSS|XPath|strict locator.
     * @returns attribute value
     */
    grabTextFrom(locator: TestMaiT.LocatorOrString): Promise<string>;
    /**
     * Retrieves all the innerHTML from elements located by CSS or XPath and returns it to test.
     * Resumes test execution, so **should be used inside async function with `await`** operator.
     *
     * ```js
     * let postHTMLs = await I.grabHTMLFromAll('.post');
     * ```
     * @param element - located by CSS|XPath|strict locator.
     * @returns HTML code for an element
     */
    grabHTMLFromAll(element: TestMaiT.LocatorOrString): Promise<string[]>;
    /**
     * Retrieves the innerHTML from an element located by CSS or XPath and returns it to test.
     * Resumes test execution, so **should be used inside async function with `await`** operator.
     * If more than one element is found - HTML of first element is returned.
     *
     * ```js
     * let postHTML = await I.grabHTMLFrom('#post');
     * ```
     * @param element - located by CSS|XPath|strict locator.
     * @returns HTML code for an element
     */
    grabHTMLFrom(element: TestMaiT.LocatorOrString): Promise<string>;
    /**
     * Retrieves an array of value from a form located by CSS or XPath and returns it to test.
     * Resumes test execution, so **should be used inside async function with `await`** operator.
     *
     * ```js
     * let inputs = await I.grabValueFromAll('//form/input');
     * ```
     * @param locator - field located by label|name|CSS|XPath|strict locator.
     * @returns attribute value
     */
    grabValueFromAll(locator: TestMaiT.LocatorOrString): Promise<string[]>;
    /**
     * Retrieves a value from a form element located by CSS or XPath and returns it to test.
     * Resumes test execution, so **should be used inside async function with `await`** operator.
     * If more than one element is found - value of first element is returned.
     *
     * ```js
     * let email = await I.grabValueFrom('input[name=email]');
     * ```
     * @param locator - field located by label|name|CSS|XPath|strict locator.
     * @returns attribute value
     */
    grabValueFrom(locator: TestMaiT.LocatorOrString): Promise<string>;
    /**
     * Grab array of CSS properties for given locator
     * Resumes test execution, so **should be used inside an async function with `await`** operator.
     *
     * ```js
     * const values = await I.grabCssPropertyFromAll('h3', 'font-weight');
     * ```
     * @param locator - element located by CSS|XPath|strict locator.
     * @param cssProperty - CSS property name.
     * @returns CSS value
     */
    grabCssPropertyFromAll(
      locator: TestMaiT.LocatorOrString,
      cssProperty: string,
    ): Promise<string[]>;
    /**
     * Grab CSS property for given locator
     * Resumes test execution, so **should be used inside an async function with `await`** operator.
     * If more than one element is found - value of first element is returned.
     *
     * ```js
     * const value = await I.grabCssPropertyFrom('h3', 'font-weight');
     * ```
     * @param locator - element located by CSS|XPath|strict locator.
     * @param cssProperty - CSS property name.
     * @returns CSS value
     */
    grabCssPropertyFrom(locator: TestMaiT.LocatorOrString, cssProperty: string): Promise<string>;
    /**
     * Retrieves an array of attributes from elements located by CSS or XPath and returns it to test.
     * Resumes test execution, so **should be used inside async with `await`** operator.
     *
     * ```js
     * let hints = await I.grabAttributeFromAll('.tooltip', 'title');
     * ```
     * @param locator - element located by CSS|XPath|strict locator.
     * @param attr - attribute name.
     * @returns attribute value
     */
    grabAttributeFromAll(locator: TestMaiT.LocatorOrString, attr: string): Promise<string[]>;
    /**
     * Retrieves an attribute from an element located by CSS or XPath and returns it to test.
     * Resumes test execution, so **should be used inside async with `await`** operator.
     * If more than one element is found - attribute of first element is returned.
     *
     * ```js
     * let hint = await I.grabAttributeFrom('#tooltip', 'title');
     * ```
     * @param locator - element located by CSS|XPath|strict locator.
     * @param attr - attribute name.
     * @returns attribute value
     */
    grabAttributeFrom(locator: TestMaiT.LocatorOrString, attr: string): Promise<string>;
    /**
     * Checks that title contains text.
     *
     * ```js
     * I.seeInTitle('Home Page');
     * ```
     * @param text - text value to check.
     * @returns automatically synchronized promise through #recorder
     */
    seeInTitle(text: string): Promise<void>;
    /**
     * Checks that title is equal to provided one.
     *
     * ```js
     * I.seeTitleEquals('Test title.');
     * ```
     * @param text - value to check.
     * @returns automatically synchronized promise through #recorder
     */
    seeTitleEquals(text: string): Promise<void>;
    /**
     * Checks that title does not contain text.
     *
     * ```js
     * I.dontSeeInTitle('Error');
     * ```
     * @param text - value to check.
     * @returns automatically synchronized promise through #recorder
     */
    dontSeeInTitle(text: string): Promise<void>;
    /**
     * Retrieves a page title and returns it to test.
     * Resumes test execution, so **should be used inside async with `await`** operator.
     *
     * ```js
     * let title = await I.grabTitle();
     * ```
     * @returns title
     */
    grabTitle(): Promise<string>;
    /**
     * Checks that a page contains a visible text.
     * Use context parameter to narrow down the search.
     *
     * ```js
     * I.see('Welcome'); // text welcome on a page
     * I.see('Welcome', '.content'); // text inside .content div
     * I.see('Register', {css: 'form.register'}); // use strict locator
     * ```
     * @param text - expected on page.
     * @param [context = null] - (optional, `null` by default) element located by CSS|Xpath|strict locator in which to search for text.
     * @returns automatically synchronized promise through #recorder
     *
     *
     * {{ react }}
     */
    see(text: string, context?: TestMaiT.LocatorOrString): Promise<void>;
    /**
     * Checks that text is equal to provided one.
     *
     * ```js
     * I.seeTextEquals('text', 'h1');
     * ```
     * @param text - element value to check.
     * @param [context = null] - element located by CSS|XPath|strict locator.
     * @returns automatically synchronized promise through #recorder
     */
    seeTextEquals(text: string, context?: TestMaiT.LocatorOrString): Promise<void>;
    /**
     * Opposite to `see`. Checks that a text is not present on a page.
     * Use context parameter to narrow down the search.
     *
     * ```js
     * I.dontSee('Login'); // assume we are already logged in.
     * I.dontSee('Login', '.nav'); // no login inside .nav element
     * ```
     * @param text - which is not present.
     * @param [context = null] - (optional) element located by CSS|XPath|strict locator in which to perfrom search.
     * @returns automatically synchronized promise through #recorder
     *
     *
     * {{ react }}
     */
    dontSee(text: string, context?: TestMaiT.LocatorOrString): Promise<void>;
    /**
     * Checks that the given input field or textarea equals to given value.
     * For fuzzy locators, fields are matched by label text, the "name" attribute, CSS, and XPath.
     *
     * ```js
     * I.seeInField('Username', 'davert');
     * I.seeInField({css: 'form textarea'},'Type your comment here');
     * I.seeInField('form input[type=hidden]','hidden_value');
     * I.seeInField('#searchform input','Search');
     * ```
     * @param field - located by label|name|CSS|XPath|strict locator.
     * @param value - value to check.
     * @returns automatically synchronized promise through #recorder
     */
    seeInField(field: TestMaiT.LocatorOrString, value: TestMaiT.StringOrSecret): Promise<void>;
    /**
     * Checks that value of input field or textarea doesn't equal to given value
     * Opposite to `seeInField`.
     *
     * ```js
     * I.dontSeeInField('email', 'user@user.com'); // field by name
     * I.dontSeeInField({ css: 'form input.email' }, 'user@user.com'); // field by CSS
     * ```
     * @param field - located by label|name|CSS|XPath|strict locator.
     * @param value - value to check.
     * @returns automatically synchronized promise through #recorder
     */
    dontSeeInField(field: TestMaiT.LocatorOrString, value: TestMaiT.StringOrSecret): Promise<void>;
    /**
     * Verifies that the specified checkbox is checked.
     *
     * ```js
     * I.seeCheckboxIsChecked('Agree');
     * I.seeCheckboxIsChecked('#agree'); // I suppose user agreed to terms
     * I.seeCheckboxIsChecked({css: '#signup_form input[type=checkbox]'});
     * ```
     * @param field - located by label|name|CSS|XPath|strict locator.
     * @returns automatically synchronized promise through #recorder
     *
     * Appium: not tested
     */
    seeCheckboxIsChecked(field: TestMaiT.LocatorOrString): Promise<void>;
    /**
     * Verifies that the specified checkbox is not checked.
     *
     * ```js
     * I.dontSeeCheckboxIsChecked('#agree'); // located by ID
     * I.dontSeeCheckboxIsChecked('I agree to terms'); // located by label
     * I.dontSeeCheckboxIsChecked('agree'); // located by name
     * ```
     * @param field - located by label|name|CSS|XPath|strict locator.
     * @returns automatically synchronized promise through #recorder
     *
     * Appium: not tested
     */
    dontSeeCheckboxIsChecked(field: TestMaiT.LocatorOrString): Promise<void>;
    /**
     * Checks that a given Element is visible
     * Element is located by CSS or XPath.
     *
     * ```js
     * I.seeElement('#modal');
     * ```
     * @param locator - located by CSS|XPath|strict locator.
     * @returns automatically synchronized promise through #recorder
     *
     * {{ react }}
     */
    seeElement(locator: TestMaiT.LocatorOrString): Promise<void>;
    /**
     * Opposite to `seeElement`. Checks that element is not visible (or in DOM)
     *
     * ```js
     * I.dontSeeElement('.modal'); // modal is not shown
     * ```
     * @param locator - located by CSS|XPath|Strict locator.
     * @returns automatically synchronized promise through #recorder
     *
     * {{ react }}
     */
    dontSeeElement(locator: TestMaiT.LocatorOrString): Promise<void>;
    /**
     * Checks that a given Element is present in the DOM
     * Element is located by CSS or XPath.
     *
     * ```js
     * I.seeElementInDOM('#modal');
     * ```
     * @param locator - element located by CSS|XPath|strict locator.
     * @returns automatically synchronized promise through #recorder
     */
    seeElementInDOM(locator: TestMaiT.LocatorOrString): Promise<void>;
    /**
     * Opposite to `seeElementInDOM`. Checks that element is not on page.
     *
     * ```js
     * I.dontSeeElementInDOM('.nav'); // checks that element is not on page visible or not
     * ```
     * @param locator - located by CSS|XPath|Strict locator.
     * @returns automatically synchronized promise through #recorder
     */
    dontSeeElementInDOM(locator: TestMaiT.LocatorOrString): Promise<void>;
    /**
     * Checks that the current page contains the given string in its raw source code.
     *
     * ```js
     * I.seeInSource('<h1>Green eggs &amp; ham</h1>');
     * ```
     * @param text - value to check.
     * @returns automatically synchronized promise through #recorder
     */
    seeInSource(text: string): Promise<void>;
    /**
     * Retrieves page source and returns it to test.
     * Resumes test execution, so **should be used inside async function with `await`** operator.
     *
     * ```js
     * let pageSource = await I.grabSource();
     * ```
     * @returns source code
     */
    grabSource(): Promise<string>;
    /**
     * Get JS log from browser. Log buffer is reset after each request.
     * Resumes test execution, so **should be used inside an async function with `await`** operator.
     *
     * ```js
     * let logs = await I.grabBrowserLogs();
     * console.log(JSON.stringify(logs))
     * ```
     * @returns all browser logs
     */
    grabBrowserLogs(): Promise<object[]> | undefined;
    /**
     * Get current URL from browser.
     * Resumes test execution, so should be used inside an async function.
     *
     * ```js
     * let url = await I.grabCurrentUrl();
     * console.log(`Current URL is [${url}]`);
     * ```
     * @returns current URL
     */
    grabCurrentUrl(): Promise<string>;
    /**
     * Checks that the current page does not contains the given string in its raw source code.
     *
     * ```js
     * I.dontSeeInSource('<!--'); // no comments in source
     * ```
     * @param value - to check.
     * @returns automatically synchronized promise through #recorder
     */
    dontSeeInSource(value: string): Promise<void>;
    /**
     * Asserts that an element appears a given number of times in the DOM.
     * Element is located by label or name or CSS or XPath.
     *
     *
     * ```js
     * I.seeNumberOfElements('#submitBtn', 1);
     * ```
     * @param locator - element located by CSS|XPath|strict locator.
     * @param num - number of elements.
     * @returns automatically synchronized promise through #recorder
     *
     * {{ react }}
     */
    seeNumberOfElements(locator: TestMaiT.LocatorOrString, num: number): Promise<void>;
    /**
     * Asserts that an element is visible a given number of times.
     * Element is located by CSS or XPath.
     *
     * ```js
     * I.seeNumberOfVisibleElements('.buttons', 3);
     * ```
     * @param locator - element located by CSS|XPath|strict locator.
     * @param num - number of elements.
     * @returns automatically synchronized promise through #recorder
     *
     * {{ react }}
     */
    seeNumberOfVisibleElements(locator: TestMaiT.LocatorOrString, num: number): Promise<void>;
    /**
     * Checks that all elements with given locator have given CSS properties.
     *
     * ```js
     * I.seeCssPropertiesOnElements('h3', { 'font-weight': "bold"});
     * ```
     * @param locator - located by CSS|XPath|strict locator.
     * @param cssProperties - object with CSS properties and their values to check.
     * @returns automatically synchronized promise through #recorder
     */
    seeCssPropertiesOnElements(
      locator: TestMaiT.LocatorOrString,
      cssProperties: any,
    ): Promise<void>;
    /**
     * Checks that all elements with given locator have given attributes.
     *
     * ```js
     * I.seeAttributesOnElements('//form', { method: "post"});
     * ```
     * @param locator - located by CSS|XPath|strict locator.
     * @param attributes - attributes and their values to check.
     * @returns automatically synchronized promise through #recorder
     */
    seeAttributesOnElements(locator: TestMaiT.LocatorOrString, attributes: any): Promise<void>;
    /**
     * Grab number of visible elements by locator.
     * Resumes test execution, so **should be used inside async function with `await`** operator.
     *
     * ```js
     * let numOfElements = await I.grabNumberOfVisibleElements('p');
     * ```
     * @param locator - located by CSS|XPath|strict locator.
     * @returns number of visible elements
     */
    grabNumberOfVisibleElements(locator: TestMaiT.LocatorOrString): Promise<number>;
    /**
     * Checks that current url contains a provided fragment.
     *
     * ```js
     * I.seeInCurrentUrl('/register'); // we are on registration page
     * ```
     * @param url - a fragment to check
     * @returns automatically synchronized promise through #recorder
     */
    seeInCurrentUrl(url: string): Promise<void>;
    /**
     * Checks that current url does not contain a provided fragment.
     * @param url - value to check.
     * @returns automatically synchronized promise through #recorder
     */
    dontSeeInCurrentUrl(url: string): Promise<void>;
    /**
     * Checks that current url is equal to provided one.
     * If a relative url provided, a configured url will be prepended to it.
     * So both examples will work:
     *
     * ```js
     * I.seeCurrentUrlEquals('/register');
     * I.seeCurrentUrlEquals('http://my.site.com/register');
     * ```
     * @param url - value to check.
     * @returns automatically synchronized promise through #recorder
     */
    seeCurrentUrlEquals(url: string): Promise<void>;
    /**
     * Checks that current url is not equal to provided one.
     * If a relative url provided, a configured url will be prepended to it.
     *
     * ```js
     * I.dontSeeCurrentUrlEquals('/login'); // relative url are ok
     * I.dontSeeCurrentUrlEquals('http://mysite.com/login'); // absolute urls are also ok
     * ```
     * @param url - value to check.
     * @returns automatically synchronized promise through #recorder
     */
    dontSeeCurrentUrlEquals(url: string): Promise<void>;
    /**
     * Executes sync script on a page.
     * Pass arguments to function as additional parameters.
     * Will return execution result to a test.
     * In this case you should use async function and await to receive results.
     *
     * Example with jQuery DatePicker:
     *
     * ```js
     * // change date of jQuery DatePicker
     * I.executeScript(function() {
     *   // now we are inside browser context
     *   $('date').datetimepicker('setDate', new Date());
     * });
     * ```
     * Can return values. Don't forget to use `await` to get them.
     *
     * ```js
     * let date = await I.executeScript(function(el) {
     *   // only basic types can be returned
     *   return $(el).datetimepicker('getDate').toString();
     * }, '#date'); // passing jquery selector
     * ```
     * @param fn - function to be executed in browser context.
     * @param args - to be passed to function.
     * @returns script return value
     *
     *
     *
     * Wraps [execute](http://webdriver.io/api/protocol/execute.html) command.
     */
    executeScript(fn: string | ((...params: any[]) => any), ...args: any[]): Promise<any>;
    /**
     * Executes async script on page.
     * Provided function should execute a passed callback (as first argument) to signal it is finished.
     *
     * Example: In Vue.js to make components completely rendered we are waiting for [nextTick](https://vuejs.org/v2/api/#Vue-nextTick).
     *
     * ```js
     * I.executeAsyncScript(function(done) {
     *   Vue.nextTick(done); // waiting for next tick
     * });
     * ```
     *
     * By passing value to `done()` function you can return values.
     * Additional arguments can be passed as well, while `done` function is always last parameter in arguments list.
     *
     * ```js
     * let val = await I.executeAsyncScript(function(url, done) {
     *   // in browser context
     *   $.ajax(url, { success: (data) => done(data); }
     * }, 'http://ajax.callback.url/');
     * ```
     * @param fn - function to be executed in browser context.
     * @param args - to be passed to function.
     * @returns script return value
     */
    executeAsyncScript(fn: string | ((...params: any[]) => any), ...args: any[]): Promise<any>;
    /**
     * Scroll element into viewport.
     *
     * ```js
     * I.scrollIntoView('#submit');
     * I.scrollIntoView('#submit', true);
     * I.scrollIntoView('#submit', { behavior: "smooth", block: "center", inline: "center" });
     * ```
     * @param locator - located by CSS|XPath|strict locator.
     * @param scrollIntoViewOptions - see https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollIntoView.
     * @returns automatically synchronized promise through #recorder
     */
    scrollIntoView(
      locator: LocatorOrString,
      scrollIntoViewOptions: ScrollIntoViewOptions,
    ): Promise<void>;
    /**
     * Scrolls to element matched by locator.
     * Extra shift can be set with offsetX and offsetY options.
     *
     * ```js
     * I.scrollTo('footer');
     * I.scrollTo('#submit', 5, 5);
     * ```
     * @param locator - located by CSS|XPath|strict locator.
     * @param [offsetX = 0] - (optional, `0` by default) X-axis offset.
     * @param [offsetY = 0] - (optional, `0` by default) Y-axis offset.
     * @returns automatically synchronized promise through #recorder
     */
    scrollTo(locator: TestMaiT.LocatorOrString, offsetX?: number, offsetY?: number): Promise<void>;
    /**
     * Moves cursor to element matched by locator.
     * Extra shift can be set with offsetX and offsetY options.
     *
     * ```js
     * I.moveCursorTo('.tooltip');
     * I.moveCursorTo('#submit', 5,5);
     * ```
     * @param locator - located by CSS|XPath|strict locator.
     * @param [offsetX = 0] - (optional, `0` by default) X-axis offset.
     * @param [offsetY = 0] - (optional, `0` by default) Y-axis offset.
     * @returns automatically synchronized promise through #recorder
     */
    moveCursorTo(
      locator: TestMaiT.LocatorOrString,
      offsetX?: number,
      offsetY?: number,
    ): Promise<void>;
    /**
     * Saves screenshot of the specified locator to ouput folder (set in testmait.conf.ts or testmait.conf.js).
     * Filename is relative to output folder.
     *
     * ```js
     * I.saveElementScreenshot(`#submit`,'debug.png');
     * ```
     * @param locator - element located by CSS|XPath|strict locator.
     * @param fileName - file name to save.
     * @returns automatically synchronized promise through #recorder
     */
    saveElementScreenshot(locator: TestMaiT.LocatorOrString, fileName: string): Promise<void>;
    /**
     * Saves a screenshot to ouput folder (set in testmait.conf.ts or testmait.conf.js).
     * Filename is relative to output folder.
     * Optionally resize the window to the full available page `scrollHeight` and `scrollWidth` to capture the entire page by passing `true` in as the second argument.
     *
     * ```js
     * I.saveScreenshot('debug.png');
     * I.saveScreenshot('debug.png', true) //resizes to available scrollHeight and scrollWidth before taking screenshot
     * ```
     * @param fileName - file name to save.
     * @param [fullPage = false] - (optional, `false` by default) flag to enable fullscreen screenshot mode.
     * @returns automatically synchronized promise through #recorder
     */
    saveScreenshot(fileName: string, fullPage?: boolean): Promise<void>;
    /**
     * Sets cookie(s).
     *
     * Can be a single cookie object or an array of cookies:
     *
     * ```js
     * I.setCookie({name: 'auth', value: true});
     *
     * // as array
     * I.setCookie([
     *   {name: 'auth', value: true},
     *   {name: 'agree', value: true}
     * ]);
     * ```
     * @param cookie - a cookie object or array of cookie objects.
     * @returns automatically synchronized promise through #recorder
     *
     *
     *
     * Uses Selenium's JSON [cookie
     * format](https://code.google.com/p/selenium/wiki/JsonWireProtocol#Cookie_JSON_Object).
     */
    setCookie(cookie: Cookie | Cookie[]): Promise<void>;
    /**
     * Clears a cookie by name,
     * if none provided clears all cookies.
     *
     * ```js
     * I.clearCookie();
     * I.clearCookie('test');
     * ```
     * @param [cookie = null] - (optional, `null` by default) cookie name
     * @returns automatically synchronized promise through #recorder
     */
    clearCookie(cookie?: string): Promise<void>;
    /**
     * Checks that cookie with given name exists.
     *
     * ```js
     * I.seeCookie('Auth');
     * ```
     * @param name - cookie name.
     * @returns automatically synchronized promise through #recorder
     */
    seeCookie(name: string): Promise<void>;
    /**
     * Checks that cookie with given name does not exist.
     *
     * ```js
     * I.dontSeeCookie('auth'); // no auth cookie
     * ```
     * @param name - cookie name.
     * @returns automatically synchronized promise through #recorder
     */
    dontSeeCookie(name: string): Promise<void>;
    /**
     * Gets a cookie object by name.
     * If none provided gets all cookies.
     * Resumes test execution, so **should be used inside async function with `await`** operator.
     *
     * ```js
     * let cookie = await I.grabCookie('auth');
     * assert(cookie.value, '123456');
     * ```
     * @param [name = null] - cookie name.
     * @returns attribute value
     */
    grabCookie(name?: string): any;
    /**
     * Accepts the active JavaScript native popup window, as created by window.alert|window.confirm|window.prompt.
     * Don't confuse popups with modal windows, as created by [various
     * libraries](http://jster.net/category/windows-modals-popups).
     */
    acceptPopup(): void;
    /**
     * Dismisses the active JavaScript popup, as created by window.alert|window.confirm|window.prompt.
     */
    cancelPopup(): void;
    /**
     * Checks that the active JavaScript popup, as created by `window.alert|window.confirm|window.prompt`, contains the
     * given string.
     * @param text - value to check.
     */
    seeInPopup(text: string): void;
    /**
     * Grab the text within the popup. If no popup is visible then it will return null.
     * ```js
     * await I.grabPopupText();
     * ```
     */
    grabPopupText(): Promise<string>;
    /**
     * Presses a key in the browser and leaves it in a down state.
     *
     * To make combinations with modifier key and user operation (e.g. `'Control'` + [`click`](#click)).
     *
     * ```js
     * I.pressKeyDown('Control');
     * I.click('#element');
     * I.pressKeyUp('Control');
     * ```
     * @param key - name of key to press down.
     * @returns automatically synchronized promise through #recorder
     */
    pressKeyDown(key: string): Promise<void>;
    /**
     * Releases a key in the browser which was previously set to a down state.
     *
     * To make combinations with modifier key and user operation (e.g. `'Control'` + [`click`](#click)).
     *
     * ```js
     * I.pressKeyDown('Control');
     * I.click('#element');
     * I.pressKeyUp('Control');
     * ```
     * @param key - name of key to release.
     * @returns automatically synchronized promise through #recorder
     */
    pressKeyUp(key: string): Promise<void>;
    /**
     * Presses a key in the browser (on a focused element).
     *
     * _Hint:_ For populating text field or textarea, it is recommended to use [`fillField`](#fillfield).
     *
     * ```js
     * I.pressKey('Backspace');
     * ```
     *
     * To press a key in combination with modifier keys, pass the sequence as an array. All modifier keys (`'Alt'`, `'Control'`, `'Meta'`, `'Shift'`) will be released afterwards.
     *
     * ```js
     * I.pressKey(['Control', 'Z']);
     * ```
     *
     * For specifying operation modifier key based on operating system it is suggested to use `'CommandOrControl'`.
     * This will press `'Command'` (also known as `'Meta'`) on macOS machines and `'Control'` on non-macOS machines.
     *
     * ```js
     * I.pressKey(['CommandOrControl', 'Z']);
     * ```
     *
     * Some of the supported key names are:
     * - `'AltLeft'` or `'Alt'`
     * - `'AltRight'`
     * - `'ArrowDown'`
     * - `'ArrowLeft'`
     * - `'ArrowRight'`
     * - `'ArrowUp'`
     * - `'Backspace'`
     * - `'Clear'`
     * - `'ControlLeft'` or `'Control'`
     * - `'ControlRight'`
     * - `'Command'`
     * - `'CommandOrControl'`
     * - `'Delete'`
     * - `'End'`
     * - `'Enter'`
     * - `'Escape'`
     * - `'F1'` to `'F12'`
     * - `'Home'`
     * - `'Insert'`
     * - `'MetaLeft'` or `'Meta'`
     * - `'MetaRight'`
     * - `'Numpad0'` to `'Numpad9'`
     * - `'NumpadAdd'`
     * - `'NumpadDecimal'`
     * - `'NumpadDivide'`
     * - `'NumpadMultiply'`
     * - `'NumpadSubtract'`
     * - `'PageDown'`
     * - `'PageUp'`
     * - `'Pause'`
     * - `'Return'`
     * - `'ShiftLeft'` or `'Shift'`
     * - `'ShiftRight'`
     * - `'Space'`
     * - `'Tab'`
     * @param key - key or array of keys to press.
     * @returns automatically synchronized promise through #recorder
     *
     *
     * _Note:_ In case a text field or textarea is focused be aware that some browsers do not respect active modifier when combining modifier keys with other keys.
     */
    pressKey(key: string | string[]): Promise<void>;
    /**
     * Types out the given text into an active field.
     * To slow down typing use a second parameter, to set interval between key presses.
     * _Note:_ Should be used when [`fillField`](#fillfield) is not an option.
     *
     * ```js
     * // passing in a string
     * I.type('Type this out.');
     *
     * // typing values with a 100ms interval
     * I.type('4141555311111111', 100);
     *
     * // passing in an array
     * I.type(['T', 'E', 'X', 'T']);
     *
     * // passing a secret
     * I.type(secret('123456'));
     * ```
     * @param key - or array of keys to type.
     * @param [delay = null] - (optional) delay in ms between key presses
     * @returns automatically synchronized promise through #recorder
     */
    type(key: string | string[], delay?: number): Promise<void>;
    /**
     * Resize the current window to provided width and height.
     * First parameter can be set to `maximize`.
     * @param width - width in pixels or `maximize`.
     * @param height - height in pixels.
     * @returns automatically synchronized promise through #recorder
     *
     * Appium: not tested in web, in apps doesn't work
     */
    resizeWindow(width: number, height: number): Promise<void>;
    /**
     * Calls [focus](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/focus) on the matching element.
     *
     * Examples:
     *
     * ```js
     * I.dontSee('#add-to-cart-btn');
     * I.focus('#product-tile')
     * I.see('#add-to-cart-bnt');
     * ```
     * @param locator - field located by label|name|CSS|XPath|strict locator.
     * @param [options] - Playwright only: [Additional options](https://playwright.dev/docs/api/class-locator#locator-focus) for available options object as 2nd argument.
     * @returns automatically synchronized promise through #recorder
     */
    focus(locator: TestMaiT.LocatorOrString, options?: any): Promise<void>;
    /**
     * Remove focus from a text input, button, etc.
     * Calls [blur](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/focus) on the element.
     *
     * Examples:
     *
     * ```js
     * I.blur('.text-area')
     * ```
     * ```js
     * //element `#product-tile` is focused
     * I.see('#add-to-cart-btn');
     * I.blur('#product-tile')
     * I.dontSee('#add-to-cart-btn');
     * ```
     * @param locator - field located by label|name|CSS|XPath|strict locator.
     * @param [options] - Playwright only: [Additional options](https://playwright.dev/docs/api/class-locator#locator-blur) for available options object as 2nd argument.
     * @returns automatically synchronized promise through #recorder
     */
    blur(locator: TestMaiT.LocatorOrString, options?: any): Promise<void>;
    /**
     * Drag an item to a destination element.
     *
     * ```js
     * I.dragAndDrop('#dragHandle', '#container');
     * ```
     * @param srcElement - located by CSS|XPath|strict locator.
     * @param destElement - located by CSS|XPath|strict locator.
     * @returns automatically synchronized promise through #recorder
     *
     * Appium: not tested
     */
    dragAndDrop(srcElement: LocatorOrString, destElement: LocatorOrString): Promise<void>;
    /**
     * Drag the scrubber of a slider to a given position
     * For fuzzy locators, fields are matched by label text, the "name" attribute, CSS, and XPath.
     *
     * ```js
     * I.dragSlider('#slider', 30);
     * I.dragSlider('#slider', -70);
     * ```
     * @param locator - located by label|name|CSS|XPath|strict locator.
     * @param offsetX - position to drag.
     * @returns automatically synchronized promise through #recorder
     */
    dragSlider(locator: TestMaiT.LocatorOrString, offsetX: number): Promise<void>;
    /**
     * Get all Window Handles.
     * Useful for referencing a specific handle when calling `I.switchToWindow(handle)`
     *
     * ```js
     * const windows = await I.grabAllWindowHandles();
     * ```
     */
    grabAllWindowHandles(): Promise<string[]>;
    /**
     * Get the current Window Handle.
     * Useful for referencing it when calling `I.switchToWindow(handle)`
     * ```js
     * const window = await I.grabCurrentWindowHandle();
     * ```
     */
    grabCurrentWindowHandle(): Promise<string>;
    /**
     * Switch to the window with a specified handle.
     *
     * ```js
     * const windows = await I.grabAllWindowHandles();
     * // ... do something
     * await I.switchToWindow( windows[0] );
     *
     * const window = await I.grabCurrentWindowHandle();
     * // ... do something
     * await I.switchToWindow( window );
     * ```
     * @param window - name of window handle.
     */
    switchToWindow(window: string): void;
    /**
     * Close all tabs except for the current one.
     *
     *
     * ```js
     * I.closeOtherTabs();
     * ```
     * @returns automatically synchronized promise through #recorder
     */
    closeOtherTabs(): Promise<void>;
    /**
     * Pauses execution for a number of seconds.
     *
     * ```js
     * I.wait(2); // wait 2 secs
     * ```
     * @param sec - number of second to wait.
     * @returns automatically synchronized promise through #recorder
     */
    wait(sec: number): Promise<void>;
    /**
     * Waits for element to become enabled (by default waits for 1sec).
     * Element can be located by CSS or XPath.
     * @param locator - element located by CSS|XPath|strict locator.
     * @param [sec = 1] - (optional) time in seconds to wait, 1 by default.
     * @returns automatically synchronized promise through #recorder
     */
    waitForEnabled(locator: TestMaiT.LocatorOrString, sec?: number): Promise<void>;
    /**
     * Waits for element to be present on page (by default waits for 1sec).
     * Element can be located by CSS or XPath.
     *
     * ```js
     * I.waitForElement('.btn.continue');
     * I.waitForElement('.btn.continue', 5); // wait for 5 secs
     * ```
     * @param locator - element located by CSS|XPath|strict locator.
     * @param [sec = null] - (optional, `1` by default) time in seconds to wait
     * @returns automatically synchronized promise through #recorder
     */
    waitForElement(locator: TestMaiT.LocatorOrString, sec?: number): Promise<void>;
    /**
     * Waits for element to be clickable (by default waits for 1sec).
     * Element can be located by CSS or XPath.
     *
     * ```js
     * I.waitForClickable('.btn.continue');
     * I.waitForClickable('.btn.continue', 5); // wait for 5 secs
     * ```
     * @param locator - element located by CSS|XPath|strict locator.
     * @param [sec] - (optional, `1` by default) time in seconds to wait
     * @returns automatically synchronized promise through #recorder
     */
    waitForClickable(locator: TestMaiT.LocatorOrString, sec?: number): Promise<void>;
    /**
     * Waiting for the part of the URL to match the expected. Useful for SPA to understand that page was changed.
     *
     * ```js
     * I.waitInUrl('/info', 2);
     * ```
     * @param urlPart - value to check.
     * @param [sec = 1] - (optional, `1` by default) time in seconds to wait
     * @returns automatically synchronized promise through #recorder
     */
    waitInUrl(urlPart: string, sec?: number): Promise<void>;
    /**
     * Waits for the entire URL to match the expected
     *
     * ```js
     * I.waitUrlEquals('/info', 2);
     * I.waitUrlEquals('http://127.0.0.1:8000/info');
     * ```
     * @param urlPart - value to check.
     * @param [sec = 1] - (optional, `1` by default) time in seconds to wait
     * @returns automatically synchronized promise through #recorder
     */
    waitUrlEquals(urlPart: string, sec?: number): Promise<void>;
    /**
     * Waits for a text to appear (by default waits for 1sec).
     * Element can be located by CSS or XPath.
     * Narrow down search results by providing context.
     *
     * ```js
     * I.waitForText('Thank you, form has been submitted');
     * I.waitForText('Thank you, form has been submitted', 5, '#modal');
     * ```
     * @param text - to wait for.
     * @param [sec = 1] - (optional, `1` by default) time in seconds to wait
     * @param [context = null] - (optional) element located by CSS|XPath|strict locator.
     * @returns automatically synchronized promise through #recorder
     */
    waitForText(text: string, sec?: number, context?: TestMaiT.LocatorOrString): Promise<void>;
    /**
     * Waits for the specified value to be in value attribute.
     *
     * ```js
     * I.waitForValue('//input', "GoodValue");
     * ```
     * @param field - input field.
     * @param value - expected value.
     * @param [sec = 1] - (optional, `1` by default) time in seconds to wait
     * @returns automatically synchronized promise through #recorder
     */
    waitForValue(field: LocatorOrString, value: string, sec?: number): Promise<void>;
    /**
     * Waits for an element to become visible on a page (by default waits for 1sec).
     * Element can be located by CSS or XPath.
     *
     * ```js
     * I.waitForVisible('#popup');
     * ```
     * @param locator - element located by CSS|XPath|strict locator.
     * @param [sec = 1] - (optional, `1` by default) time in seconds to wait
     * @returns automatically synchronized promise through #recorder
     */
    waitForVisible(locator: TestMaiT.LocatorOrString, sec?: number): Promise<void>;
    /**
     * Waits for a specified number of elements on the page.
     *
     * ```js
     * I.waitNumberOfVisibleElements('a', 3);
     * ```
     * @param locator - element located by CSS|XPath|strict locator.
     * @param num - number of elements.
     * @param [sec = 1] - (optional, `1` by default) time in seconds to wait
     * @returns automatically synchronized promise through #recorder
     */
    waitNumberOfVisibleElements(
      locator: TestMaiT.LocatorOrString,
      num: number,
      sec?: number,
    ): Promise<void>;
    /**
     * Waits for an element to be removed or become invisible on a page (by default waits for 1sec).
     * Element can be located by CSS or XPath.
     *
     * ```js
     * I.waitForInvisible('#popup');
     * ```
     * @param locator - element located by CSS|XPath|strict locator.
     * @param [sec = 1] - (optional, `1` by default) time in seconds to wait
     * @returns automatically synchronized promise through #recorder
     */
    waitForInvisible(locator: TestMaiT.LocatorOrString, sec?: number): Promise<void>;
    /**
     * Waits for an element to hide (by default waits for 1sec).
     * Element can be located by CSS or XPath.
     *
     * ```js
     * I.waitToHide('#popup');
     * ```
     * @param locator - element located by CSS|XPath|strict locator.
     * @param [sec = 1] - (optional, `1` by default) time in seconds to wait
     * @returns automatically synchronized promise through #recorder
     */
    waitToHide(locator: TestMaiT.LocatorOrString, sec?: number): Promise<void>;
    /**
     * Waits for an element to become not attached to the DOM on a page (by default waits for 1sec).
     * Element can be located by CSS or XPath.
     *
     * ```js
     * I.waitForDetached('#popup');
     * ```
     * @param locator - element located by CSS|XPath|strict locator.
     * @param [sec = 1] - (optional, `1` by default) time in seconds to wait
     * @returns automatically synchronized promise through #recorder
     */
    waitForDetached(locator: TestMaiT.LocatorOrString, sec?: number): Promise<void>;
    /**
     * Waits for a function to return true (waits for 1 sec by default).
     * Running in browser context.
     *
     * ```js
     * I.waitForFunction(fn[, [args[, timeout]])
     * ```
     *
     * ```js
     * I.waitForFunction(() => window.requests == 0);
     * I.waitForFunction(() => window.requests == 0, 5); // waits for 5 sec
     * I.waitForFunction((count) => window.requests == count, [3], 5) // pass args and wait for 5 sec
     * ```
     * @param fn - to be executed in browser context.
     * @param [argsOrSec = null] - (optional, `1` by default) arguments for function or seconds.
     * @param [sec = null] - (optional, `1` by default) time in seconds to wait
     * @returns automatically synchronized promise through #recorder
     */
    waitForFunction(
      fn: string | ((...params: any[]) => any),
      argsOrSec?: any[] | number,
      sec?: number,
    ): Promise<void>;
    /**
     * Switches frame or in case of null locator reverts to parent.
     *
     * ```js
     * I.switchTo('iframe'); // switch to first iframe
     * I.switchTo(); // switch back to main page
     * ```
     * @param [locator = null] - (optional, `null` by default) element located by CSS|XPath|strict locator.
     * @returns automatically synchronized promise through #recorder
     */
    switchTo(locator?: TestMaiT.LocatorOrString): Promise<void>;
    /**
     * Switch focus to a particular tab by its number. It waits tabs loading and then switch tab.
     *
     * ```js
     * I.switchToNextTab();
     * I.switchToNextTab(2);
     * ```
     * @param [num = 1] - (optional) number of tabs to switch forward, default: 1.
     * @param [sec = null] - (optional) time in seconds to wait.
     * @returns automatically synchronized promise through #recorder
     */
    switchToNextTab(num?: number, sec?: number | null): Promise<void>;
    /**
     * Switch focus to a particular tab by its number. It waits tabs loading and then switch tab.
     *
     * ```js
     * I.switchToPreviousTab();
     * I.switchToPreviousTab(2);
     * ```
     * @param [num = 1] - (optional) number of tabs to switch backward, default: 1.
     * @param [sec = null] - (optional) time in seconds to wait.
     * @returns automatically synchronized promise through #recorder
     */
    switchToPreviousTab(num?: number, sec?: number): Promise<void>;
    /**
     * Close current tab.
     *
     * ```js
     * I.closeCurrentTab();
     * ```
     * @returns automatically synchronized promise through #recorder
     */
    closeCurrentTab(): Promise<void>;
    /**
     * Open new tab and switch to it.
     *
     * ```js
     * I.openNewTab();
     * ```
     * @returns automatically synchronized promise through #recorder
     */
    openNewTab(): Promise<void>;
    /**
     * Grab number of open tabs.
     * Resumes test execution, so **should be used inside async function with `await`** operator.
     *
     * ```js
     * let tabs = await I.grabNumberOfOpenTabs();
     * ```
     * @returns number of open tabs
     */
    grabNumberOfOpenTabs(): Promise<number>;
    /**
     * Reload the current page.
     *
     * ```js
     * I.refreshPage();
     * ```
     * @returns automatically synchronized promise through #recorder
     */
    refreshPage(): Promise<void>;
    /**
     * Scroll page to the top.
     *
     * ```js
     * I.scrollPageToTop();
     * ```
     * @returns automatically synchronized promise through #recorder
     */
    scrollPageToTop(): Promise<void>;
    /**
     * Scroll page to the bottom.
     *
     * ```js
     * I.scrollPageToBottom();
     * ```
     * @returns automatically synchronized promise through #recorder
     */
    scrollPageToBottom(): Promise<void>;
    /**
     * Retrieves a page scroll position and returns it to test.
     * Resumes test execution, so **should be used inside an async function with `await`** operator.
     *
     * ```js
     * let { x, y } = await I.grabPageScrollPosition();
     * ```
     * @returns scroll position
     */
    grabPageScrollPosition(): Promise<PageScrollPosition>;
    /**
     * Set the current geo location
     *
     *
     * ```js
     * I.setGeoLocation(121.21, 11.56);
     * I.setGeoLocation(121.21, 11.56, 10);
     * ```
     * @param latitude - to set.
     * @param longitude - to set
     * @param [altitude = null] - (optional, null by default) to set
     * @returns automatically synchronized promise through #recorder
     */
    setGeoLocation(latitude: number, longitude: number, altitude?: number): Promise<void>;
    /**
     * Return the current geo location
     * Resumes test execution, so **should be used inside async function with `await`** operator.
     *
     * ```js
     * let geoLocation = await I.grabGeoLocation();
     * ```
     */
    grabGeoLocation(): Promise<{ latitude: number; longitude: number; altitude: number }>;
    /**
     * Grab the width, height, location of given locator.
     * Provide `width` or `height`as second param to get your desired prop.
     * Resumes test execution, so **should be used inside an async function with `await`** operator.
     *
     * Returns an object with `x`, `y`, `width`, `height` keys.
     *
     * ```js
     * const value = await I.grabElementBoundingRect('h3');
     * // value is like { x: 226.5, y: 89, width: 527, height: 220 }
     * ```
     *
     * To get only one metric use second parameter:
     *
     * ```js
     * const width = await I.grabElementBoundingRect('h3', 'width');
     * // width == 527
     * ```
     * @param locator - element located by CSS|XPath|strict locator.
     * @param [elementSize] - x, y, width or height of the given element.
     * @returns Element bounding rectangle
     */
    grabElementBoundingRect(
      locator: LocatorOrString,
      elementSize?: string,
    ): Promise<DOMRect> | Promise<number>;
    /**
     * Placeholder for ~ locator only test case write once run on both Appium and WebDriver.
     */
    runOnAndroid(caps: any, fn: any): void;
    /**
     * Placeholder for ~ locator only test case write once run on both Appium and WebDriver.
     */
    runInWeb(): void;
  }
  interface ActorStatic {
    /**
     * add print comment method`
     */
    say(msg: string, color?: string): void;
    /**
     * set the maximum execution time for the next step
     * @param timeout - step timeout in seconds
     */
    limitTime(timeout: number): this;
    retry(opts?: any): this;
  }
  /**
   * Create TestMaiT runner.
   * Config and options should be passed
   */
  class Testmait {
    constructor(config: any, opts: any);
    /**
     * Require modules before testmait running
     */
    requireModules(requiringModules: string[]): void;
    /**
     * Initialize TestMaiT at specific directory.
     * If async initialization is required, pass callback as second parameter.
     */
    init(dir: string): void;
    /**
     * Creates global variables
     */
    initGlobals(dir: string): void;
    /**
     * Executes hooks.
     */
    runHooks(): void;
    /**
     * Executes bootstrap.
     */
    bootstrap(): void;
    /**
     * Executes teardown.
     */
    teardown(): void;
    /**
     * Loads tests by pattern or by config.tests
     */
    loadTests(pattern?: string): void;
    /**
     * Run a specific test or all loaded tests.
     */
    run(test?: string): Promise<void>;
  }
  /**
   * Current configuration
   */
  class Config {
    /**
     * Create a config with default options
     */
    static create(
      newConfig: any,
    ): {
      [key: string]: any;
    };
    /**
     * Load config from a file.
     * If js file provided: require it and get .config key
     * If json file provided: load and parse JSON
     * If directory provided:
     * * try to load `testmait.config.js` from it
     * * try to load `testmait.conf.js` from it
     * * try to load `testmait.js` from it
     * If none of above: fail.
     */
    static load(configFile: string): any;
    /**
     * Get current config.
     */
    static get(key?: string, val?: any): any;
    /**
     * Appends values to current config
     */
    static append(additionalConfig: {
      [key: string]: any;
    }): {
      [key: string]: any;
    };
    /**
     * Resets config to default
     */
    static reset(): {
      [key: string]: any;
    };
  }
  /**
   * Dependency Injection Container
   */
  class Container {
    /**
     * Create container with all required helpers and support objects
     */
    static create(config: any, opts: any): void;
    /**
     * Get all plugins
     */
    static plugins(name?: string): any;
    /**
     * Get all support objects or get support object by name
     */
    static support(name?: string): any;
    /**
     * Get all helpers or get a helper by name
     */
    static helpers(name?: string): any;
    /**
     * Get translation
     */
    static translation(): void;
    /**
     * Get Mocha instance
     */
    static mocha(): any;
    /**
     * Append new services to container
     */
    static append(newContainer: { [key: string]: any }): void;
    /**
     * Clear container
     */
    static clear(
      newHelpers: {
        [key: string]: any;
      },
      newSupport: {
        [key: string]: any;
      },
      newPlugins: {
        [key: string]: any;
      },
    ): void;
    /**
     * Share data across worker threads
     * @param options - set {local: true} to not share among workers
     */
    static share(data: any, options: any): void;
  }
  /**
   * Method collect own property and prototype
   */
  function getObjectMethods(): void;
  /**
   * Datatable class to provide data driven testing
   */
  class DataTable {
    constructor(array: any[]);
    add(array: any[]): void;
    xadd(array: any[]): void;
    filter(func: (...params: any[]) => any): void;
  }
  /**
   * DataTableArgument class to store the Cucumber data table from
   * a step as an object with methods that can be used to access the data.
   */
  class DataTableArgument {
    constructor(gherkinDataTable: any);
    /**
     * Returns the table as a 2-D array
     */
    raw(): string[][];
    /**
     * Returns the table as a 2-D array, without the first row
     */
    rows(): string[][];
    /**
     * Returns an array of objects where each row is converted to an object (column header is the key)
     */
    hashes(): any[];
    /**
     * Returns an object where each row corresponds to an entry
     * (first column is the key, second column is the value)
     */
    rowsHash(): Record<string, string>;
    /**
     * Transposed the data
     */
    transpose(): void;
  }
  namespace event {
    const dispatcher: NodeJS.EventEmitter;
    const test: {
      started: 'test.start';
      before: 'test.before';
      after: 'test.after';
      passed: 'test.passed';
      failed: 'test.failed';
      finished: 'test.finish';
      skipped: 'test.skipped';
    };
    const suite: {
      before: 'suite.before';
      after: 'suite.after';
    };
    const hook: {
      started: 'hook.start';
      passed: 'hook.passed';
    };
    const step: {
      started: 'step.start';
      before: 'step.before';
      after: 'step.after';
      passed: 'step.passed';
      failed: 'step.failed';
      finished: 'step.finish';
      comment: 'step.comment';
    };
    const bddStep: {
      before: 'suite.before';
      after: 'suite.after';
    };
    const all: {
      before: 'global.before';
      after: 'global.after';
      result: 'global.result';
      failures: 'global.failures';
    };
    const multiple: {
      before: 'multiple.before';
      after: 'multiple.after';
    };
    const workers: {
      before: 'workers.before';
      after: 'workers.after';
    };
    function emit(event: string, param?: any): void;
    /**
     * for testing only!
     */
    function cleanDispatcher(): void;
  }
  /**
   * Index file for loading TestMaiT programmatically.
   *
   * Includes Public API objects
   */
  namespace index {
    var testmait: typeof TestMaiT.Testmait;
    var Testmait: typeof TestMaiT.Testmait;
    var output: typeof TestMaiT.output;
    var container: typeof TestMaiT.Container;
    var event: typeof TestMaiT.event;
    var recorder: TestMaiT.recorder;
    var config: typeof TestMaiT.Config;
    var actor: TestMaiT.actor;
    var helper: typeof TestMaiT.Helper;
    var Helper: typeof TestMaiT.Helper;
    var pause: typeof TestMaiT.pause;
    var within: typeof TestMaiT.within;
    var dataTable: typeof TestMaiT.DataTable;
    var dataTableArgument: typeof TestMaiT.DataTableArgument;
    var store: typeof TestMaiT.store;
    var locator: typeof TestMaiT.Locator;
  }
  function addStep(step: any, fn: any): void;
  class FeatureConfig {
    /**
     * Retry this suite for x times
     */
    retry(retries: number): this;
    /**
     * Set timeout for this suite
     */
    timeout(timeout: number): this;
    /**
     * Configures a helper.
     * Helper name can be omitted and values will be applied to first helper.
     */
    config(
      helper:
        | string
        | {
            [key: string]: any;
          },
      obj?: {
        [key: string]: any;
      },
    ): this;
    /**
     * Append a tag name to scenario title
     */
    tag(tagName: string): this;
  }
  class ScenarioConfig {
    /**
     * Declares that test throws error.
     * Can pass an Error object or regex matching expected message.
     */
    throws(err: any): this;
    /**
     * Declares that test should fail.
     * If test passes - throws an error.
     * Can pass an Error object or regex matching expected message.
     */
    fails(): this;
    /**
     * Retry this test for x times
     */
    retry(retries: number): this;
    /**
     * Set timeout for this test
     */
    timeout(timeout: number): this;
    /**
     * Pass in additional objects to inject into test
     */
    inject(obj: { [key: string]: any }): this;
    /**
     * Configures a helper.
     * Helper name can be omitted and values will be applied to first helper.
     */
    config(
      helper:
        | string
        | {
            [key: string]: any;
          },
      obj?: {
        [key: string]: any;
      },
    ): this;
    /**
     * Append a tag name to scenario title
     */
    tag(tagName: string): this;
    /**
     * Dynamically injects dependencies, see https://testmait.io/pageobjects/#dynamic-injection
     */
    injectDependencies(dependencies: { [key: string]: any }): this;
  }
  class Locator {
    constructor(locator: TestMaiT.LocatorOrString, defaultType?: string);
    toString(): string;
    isFuzzy(): boolean;
    isShadow(): boolean;
    isFrame(): boolean;
    isCSS(): boolean;
    isNull(): boolean;
    isXPath(): boolean;
    isCustom(): boolean;
    isStrict(): boolean;
    isAccessibilityId(): boolean;
    isBasic(): boolean;
    toXPath(): string;
    or(locator: TestMaiT.LocatorOrString): Locator;
    find(locator: TestMaiT.LocatorOrString): Locator;
    withChild(locator: TestMaiT.LocatorOrString): Locator;
    withDescendant(locator: TestMaiT.LocatorOrString): Locator;
    at(position: number): Locator;
    first(): Locator;
    last(): Locator;
    withText(text: string): Locator;
    withAttr(attributes: { [key: string]: string }): Locator;
    as(output: string): Locator;
    inside(locator: TestMaiT.LocatorOrString): Locator;
    after(locator: TestMaiT.LocatorOrString): Locator;
    before(locator: TestMaiT.LocatorOrString): Locator;
    static build(locator: TestMaiT.LocatorOrString): Locator;
    /**
     * Filters to modify locators
     */
    static filters: ((arg0: TestMaiT.LocatorOrString, arg1: Locator) => void)[];
    /**
     * Appends new `Locator` filter to an `Locator.filters` array, and returns the new length of the array.
     */
    static addFilter(fn: (...params: any[]) => any): number;
  }
  namespace output {
    var stepShift: number;
    /**
     * Set or return current verbosity level
     */
    function level(level?: number): number;
    /**
     * Print information for a process
     * Used in multiple-run
     */
    function process(process: string | null): string;
    /**
     * Print information in --debug mode
     */
    function debug(msg: string): void;
    /**
     * Print information in --verbose mode
     */
    function log(msg: string): void;
    /**
     * Print error
     */
    function error(msg: string): void;
    /**
     * Print a successful message
     */
    function success(msg: string): void;
    /**
     * Prints plugin message
     */
    function plugin(pluginName: string, msg: string): void;
    /**
     * Print a step
     */
    function step(step: TestMaiT.Step): void;
    namespace suite {
      function started(suite: Mocha.Suite): void;
    }
    namespace test {
      function started(test: Mocha.Test): void;
      function passed(test: Mocha.Test): void;
      function failed(test: Mocha.Test): void;
      function skipped(test: Mocha.Test): void;
    }
    namespace scenario {
      function passed(test: Mocha.Test): void;
      function failed(test: Mocha.Test): void;
    }
    /**
     * Print a text in console log
     */
    function say(message: string, color?: string): void;
    function result(
      passed: number,
      failed: number,
      skipped: number,
      duration: number | string,
    ): void;
  }
  /**
   * Pauses test execution and starts interactive shell
   */
  function pause(passedObject?: { [key: string]: any }): void;
  /**
   * Singleton object to record all test steps as promises and run them in chain.
   */
  interface recorder {
    retries: {
      [key: string]: any;
    }[];
    /**
     * Start recording promises
     */
    start(): void;
    isRunning(): boolean;
    startUnlessRunning(): void;
    /**
     * Add error handler to catch rejected promises
     */
    errHandler(fn: (...params: any[]) => any): void;
    /**
     * Stops current promise chain, calls `catch`.
     * Resets recorder to initial state.
     */
    reset(): void;
    session: TestMaiT.RecorderSession;
    /**
     * Adds a promise to a chain.
     * Promise description should be passed as first parameter.
     * @param [retry] - undefined: `add(fn)` -> `false` and `add('step',fn)` -> `true`
     *     true: it will retries if `retryOpts` set.
     *     false: ignore `retryOpts` and won't retry.
     */
    add(
      taskName: string | ((...params: any[]) => any),
      fn?: (...params: any[]) => any,
      force?: boolean,
      retry?: boolean,
      timeout?: number,
    ): Promise<any>;
    retry(opts: any): any;
    catch(customErrFn?: (...params: any[]) => any): Promise<any>;
    catchWithoutStop(customErrFn: (...params: any[]) => any): Promise<any>;
    /**
     * Adds a promise which throws an error into a chain
     */
    throw(err: any): void;
    saveFirstAsyncError(err: any): void;
    getAsyncErr(): any;
    cleanAsyncErr(): void;
    /**
     * Stops recording promises
     */
    stop(): void;
    /**
     * Get latest promise in chain.
     */
    promise(): Promise<any>;
    /**
     * Get a list of all chained tasks
     */
    scheduled(): string;
    /**
     * Get the queue id
     */
    getQueueId(): number;
    /**
     * Get a state of current queue and tasks
     */
    toString(): string;
  }
  interface RecorderSession {
    running: boolean;
    start(name: string): void;
    restore(name?: string): void;
    catch(fn: (...params: any[]) => any): void;
  }
  class Secret {
    constructor(secret: string);
    toString(): string;
    static secret(...secret: any[]): Secret;
  }
  function session(
    sessionName: TestMaiT.LocatorOrString,
    config:
      | ((...params: any[]) => any)
      | {
          [key: string]: any;
        },
    fn?: (...params: any[]) => any,
  ): any;
  /**
   * Each command in test executed through `I.` object is wrapped in Step.
   * Step allows logging executed commands and triggers hook before and after step execution.
   */
  class Step {
    constructor(helper: TestMaiT.Helper, name: string);
    actor: string;
    helper: TestMaiT.Helper;
    name: string;
    helperMethod: string;
    status: string;
    suffix: string;
    prefix: string;
    comment: string;
    args: any[];
    metaStep: MetaStep;
    stack: string;
    getTimeout(): number | undefined;
    /**
     * @param timeout - timeout in milliseconds or 0 if no timeout
     * @param order - order defines the priority of timeout, timeouts set with lower order override those set with higher order.
     *                         When order below 0 value of timeout only override if new value is lower
     */
    setTimeout(timeout: number, order: number): void;
    setTrace(): void;
    setArguments(args: any[]): void;
    run(...args: any[]): any;
    setStatus(status: string): void;
    humanize(): string;
    humanizeArgs(): string;
    line(): string;
    toString(): string;
    toCode(): string;
    hasBDDAncestor(): boolean;
    static MetaStep: typeof MetaStep;
  }
  class MetaStep extends Step {
    isBDD(): boolean;
    run(): any;
  }
  /**
   * global values for current session
   */
  namespace store {
    var debugMode: boolean;
    var timeouts: boolean;
  }
  /**
   * Describe a "suite" with the given `title`
   * and callback `fn` containing nested suites
   * and/or tests.
   */
  function Feature(
    title: string,
    opts?: {
      [key: string]: any;
    },
  ): FeatureConfig;
  /**
   * Pending test suite.
   */
  const xFeature: TestMaiT.IFeature;
  /**
   * Pending test case.
   */
  const xScenario: TestMaiT.IScenario;
  /**
   * Pending test case with message: 'Test not implemented!'.
   */
  const todo: TestMaiT.IScenario;
  function within(
    context: TestMaiT.LocatorOrString,
    fn: (...params: any[]) => any,
  ): Promise<any> | undefined;
  /**
   * This is a wrapper on top of [Detox](https://github.com/wix/Detox) library, aimied to unify testing experience for TestMaiT framework.
   * Detox provides a grey box testing for mobile applications, playing especially good for React Native apps.
   *
   * Detox plays quite differently from Appium. To establish detox testing you need to build a mobile application in a special way to inject Detox code.
   * This why **Detox is grey box testing** solution, so you need an access to application source code, and a way to build and execute it on emulator.
   *
   * Comparing to Appium, Detox runs faster and more stable but requires an additional setup for build.
   *
   * ### Setup
   *
   * 1. [Install and configure Detox for iOS](https://github.com/wix/Detox/blob/master/docs/Introduction.GettingStarted.md) and [Android](https://github.com/wix/Detox/blob/master/docs/Introduction.Android.md)
   * 2. [Build an application](https://github.com/wix/Detox/blob/master/docs/Introduction.GettingStarted.md#step-4-build-your-app-and-run-detox-tests) using `detox build` command.
   * 3. Install [TestMaiT](https://testmait.io) and detox-helper:
   *
   * ```
   * npm i @testmait/detox-helper --save
   * ```
   *
   * Detox configuration is required in `package.json` under `detox` section.
   *
   * If you completed step 1 and step 2 you should have a configuration similar this:
   *
   * ```js
   *  "detox": {
   *    "configurations": {
   *      "ios.sim.debug": {
   *        "binaryPath": "ios/build/Build/Products/Debug-iphonesimulator/example.app",
   *        "build": "xcodebuild -project ios/example.xcodeproj -scheme example -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build",
   *        "type": "ios.simulator",
   *        "name": "iPhone 7"
   *      }
   *    }
   *  }
   * ```
   *
   *
   * ### Configuration
   *
   * Besides Detox configuration, TestMaiT should also be configured to use Detox.
   *
   * In `testmait.conf.js` enable Detox helper:
   *
   * ```js
   * helpers: {
   *    Detox: {
   *      require: '@testmait/detox-helper',
   *      configuration: '<detox-configuration-name>',
   *    }
   * }
   *
   * ```
   *
   * It's important to specify a package name under `require` section and current detox configuration taken from `package.json`.
   *
   * Options:
   *
   * * `configuration` - a detox configuration name. Required.
   * * `reloadReactNative` - should be enabled for React Native applications.
   * * `reuse` - reuse application for tests. By default, Detox reinstalls and relaunches app.
   * * `registerGlobals` - (default: true) Register Detox helper functions `by`, `element`, `expect`, `waitFor` globally.
   */
  class Detox {
    /**
     * Saves a screenshot to the output dir
     *
     * ```js
     * I.saveScreenshot('main-window.png');
     * ```
     */
    saveScreenshot(name: string): void;
    /**
     * Relaunches an application.
     *
     * ```js
     * I.relaunchApp();
     * ```
     */
    relaunchApp(): void;
    /**
     * Launches an application. If application instance already exists, use [relaunchApp](#relaunchApp).
     *
     * ```js
     * I.launchApp();
     * ```
     */
    launchApp(): void;
    /**
     * Installs a configured application.
     * Application is installed by default.
     *
     * ```js
     * I.installApp();
     * ```
     */
    installApp(): void;
    /**
     * Shakes the device.
     *
     * ```js
     * I.shakeDevice();
     * ```
     */
    shakeDevice(): void;
    /**
     * Goes back on Android
     *
     * ```js
     * I.goBack(); // on Android only
     * ```
     */
    goBack(): void;
    /**
     * Switches device to landscape orientation
     *
     * ```js
     * I.setLandscapeOrientation();
     * ```
     */
    setLandscapeOrientation(): void;
    /**
     * Switches device to portrait orientation
     *
     * ```js
     * I.setPortraitOrientation();
     * ```
     */
    setPortraitOrientation(): void;
    /**
     * Execute code only on iOS
     *
     * ```js
     * I.runOnIOS(() => {
     *    I.click('Button');
     *    I.see('Hi, IOS');
     * });
     * ```
     * @param fn - a function which will be executed on iOS
     */
    runOnIOS(fn: (...params: any[]) => any): void;
    /**
     * Execute code only on Android
     *
     * ```js
     * I.runOnAndroid(() => {
     *    I.click('Button');
     *    I.see('Hi, Android');
     * });
     * ```
     * @param fn - a function which will be executed on android
     */
    runOnAndroid(fn: (...params: any[]) => any): void;
    /**
     * Taps on an element.
     * Element can be located by its text or id or accessibility id.
     *
     * The second parameter is a context element to narrow the search.
     *
     * Same as [click](#click)
     *
     * ```js
     * I.tap('Login'); // locate by text
     * I.tap('~nav-1'); // locate by accessibility label
     * I.tap('#user'); // locate by id
     * I.tap('Login', '#nav'); // locate by text inside #nav
     * I.tap({ ios: 'Save', android: 'SAVE' }, '#main'); // different texts on iOS and Android
     * ```
     */
    tap(locator: TestMaiT.LocatorOrString, context?: TestMaiT.LocatorOrString | null): void;
    /**
     * Multi taps on an element.
     * Element can be located by its text or id or accessibility id.
     *
     * Set the number of taps in second argument.
     * Optionally define the context element by third argument.
     *
     * ```js
     * I.multiTap('Login', 2); // locate by text
     * I.multiTap('~nav', 2); // locate by accessibility label
     * I.multiTap('#user', 2); // locate by id
     * I.multiTap('Update', 2, '#menu'); // locate by id
     * ```
     * @param locator - element to locate
     * @param num - number of taps
     * @param [context = null] - context element
     */
    multiTap(
      locator: TestMaiT.LocatorOrString,
      num: number,
      context?: TestMaiT.LocatorOrString | null,
    ): void;
    /**
     * Taps an element and holds for a requested time.
     *
     * ```js
     * I.longPress('Login', 2); // locate by text, hold for 2 seconds
     * I.longPress('~nav', 1); // locate by accessibility label, hold for second
     * I.longPress('Update', 2, '#menu'); // locate by text inside #menu, hold for 2 seconds
     * ```
     * @param locator - element to locate
     * @param sec - number of seconds to hold tap
     * @param [context = null] - context element
     */
    longPress(
      locator: TestMaiT.LocatorOrString,
      sec: number,
      context?: TestMaiT.LocatorOrString | null,
    ): void;
    /**
     * Clicks on an element.
     * Element can be located by its text or id or accessibility id
     *
     * The second parameter is a context (id | type | accessibility id) to narrow the search.
     *
     * Same as [tap](#tap)
     *
     * ```js
     * I.click('Login'); // locate by text
     * I.click('~nav-1'); // locate by accessibility label
     * I.click('#user'); // locate by id
     * I.click('Login', '#nav'); // locate by text inside #nav
     * I.click({ ios: 'Save', android: 'SAVE' }, '#main'); // different texts on iOS and Android
     * ```
     */
    click(locator: TestMaiT.LocatorOrString, context?: TestMaiT.LocatorOrString | null): void;
    /**
     * Performs click on element with horizontal and vertical offset.
     * An element is located by text, id, accessibility id.
     *
     * ```js
     * I.clickAtPoint('Save', 10, 10);
     * I.clickAtPoint('~save', 10, 10); // locate by accessibility id
     * ```
     * @param [x = 0] - horizontal offset
     * @param [y = 0] - vertical offset
     */
    clickAtPoint(locator: TestMaiT.LocatorOrString, x?: number, y?: number): void;
    /**
     * Checks text to be visible.
     * Use second parameter to narrow down the search.
     *
     * ```js
     * I.see('Record created');
     * I.see('Record updated', '#message');
     * I.see('Record deleted', '~message');
     * ```
     * @param text - to check visibility
     * @param [context = null] - element inside which to search for text
     */
    see(text: string, context?: TestMaiT.LocatorOrString | null): void;
    /**
     * Checks text not to be visible.
     * Use second parameter to narrow down the search.
     *
     * ```js
     * I.dontSee('Record created');
     * I.dontSee('Record updated', '#message');
     * I.dontSee('Record deleted', '~message');
     * ```
     * @param text - to check invisibility
     * @param [context = null] - element in which to search for text
     */
    dontSee(text: string, context?: TestMaiT.LocatorOrString | null): void;
    /**
     * Checks for visibility of an element.
     * Use second parameter to narrow down the search.
     *
     * ```js
     * I.seeElement('~edit'); // located by accessibility id
     * I.seeElement('~edit', '#menu'); // element inside #menu
     * ```
     * @param locator - element to locate
     * @param [context = null] - context element
     */
    seeElement(locator: TestMaiT.LocatorOrString, context?: TestMaiT.LocatorOrString | null): void;
    /**
     * Checks that element is not visible.
     * Use second parameter to narrow down the search.
     *
     * ```js
     * I.dontSeeElement('~edit'); // located by accessibility id
     * I.dontSeeElement('~edit', '#menu'); // element inside #menu
     * ```
     * @param locator - element to locate
     * @param [context = null] - context element
     */
    dontSeeElement(
      locator: TestMaiT.LocatorOrString,
      context?: TestMaiT.LocatorOrString | null,
    ): void;
    /**
     * Checks for existence of an element. An element can be visible or not.
     * Use second parameter to narrow down the search.
     *
     * ```js
     * I.seeElementExists('~edit'); // located by accessibility id
     * I.seeElementExists('~edit', '#menu'); // element inside #menu
     * ```
     * @param locator - element to locate
     * @param [context = null] - context element
     */
    seeElementExists(locator: TestMaiT.LocatorOrString, context?: TestMaiT.LocatorOrString): void;
    /**
     * Checks that element not exists.
     * Use second parameter to narrow down the search.
     *
     * ```js
     * I.dontSeeElementExist('~edit'); // located by accessibility id
     * I.dontSeeElementExist('~edit', '#menu'); // element inside #menu
     * ```
     * @param locator - element to locate
     * @param [context = null] - context element
     */
    dontSeeElementExists(
      locator: TestMaiT.LocatorOrString,
      context?: TestMaiT.LocatorOrString,
    ): void;
    /**
     * Fills in text field in an app.
     * A field can be located by text, accessibility id, id.
     *
     * ```js
     * I.fillField('Username', 'davert');
     * I.fillField('~name', 'davert');
     * I.fillField({ android: 'NAME', ios: 'name' }, 'davert');
     * ```
     * @param field - an input element to fill in
     * @param value - value to fill
     */
    fillField(field: TestMaiT.LocatorOrString, value: string): void;
    /**
     * Clears a text field.
     * A field can be located by text, accessibility id, id.
     *
     * ```js
     * I.clearField('~name');
     * ```
     * @param field - an input element to clear
     */
    clearField(field: TestMaiT.LocatorOrString): void;
    /**
     * Appends text into the field.
     * A field can be located by text, accessibility id, id.
     *
     * ```js
     * I.appendField('name', 'davert');
     * ```
     */
    appendField(field: TestMaiT.LocatorOrString, value: string): void;
    /**
     * Scrolls to the top of an element.
     *
     * ```js
     * I.scrollUp('#container');
     * ```
     */
    scrollUp(locator: TestMaiT.LocatorOrString): void;
    /**
     * Scrolls to the bottom of an element.
     *
     * ```js
     * I.scrollDown('#container');
     * ```
     */
    scrollDown(locator: TestMaiT.LocatorOrString): void;
    /**
     * Scrolls to the left of an element.
     *
     * ```js
     * I.scrollLeft('#container');
     * ```
     */
    scrollLeft(locator: TestMaiT.LocatorOrString): void;
    /**
     * Scrolls to the right of an element.
     *
     * ```js
     * I.scrollRight('#container');
     * ```
     */
    scrollRight(locator: TestMaiT.LocatorOrString): void;
    /**
     * Performs a swipe up inside an element.
     * Can be `slow` or `fast` swipe.
     *
     * ```js
     * I.swipeUp('#container');
     * ```
     * @param locator - an element on which to perform swipe
     * @param [speed = 'slow'] - a speed to perform: `slow` or `fast`.
     */
    swipeUp(locator: TestMaiT.LocatorOrString, speed?: string): void;
    /**
     * Performs a swipe up inside an element.
     * Can be `slow` or `fast` swipe.
     *
     * ```js
     * I.swipeUp('#container');
     * ```
     * @param locator - an element on which to perform swipe
     * @param [speed = 'slow'] - a speed to perform: `slow` or `fast`.
     */
    swipeDown(locator: TestMaiT.LocatorOrString, speed?: string): void;
    /**
     * Performs a swipe up inside an element.
     * Can be `slow` or `fast` swipe.
     *
     * ```js
     * I.swipeUp('#container');
     * ```
     * @param locator - an element on which to perform swipe
     * @param [speed = 'slow'] - a speed to perform: `slow` or `fast`.
     */
    swipeLeft(locator: TestMaiT.LocatorOrString, speed?: string): void;
    /**
     * Performs a swipe up inside an element.
     * Can be `slow` or `fast` swipe.
     *
     * ```js
     * I.swipeUp('#container');
     * ```
     * @param locator - an element on which to perform swipe
     * @param [speed = 'slow'] - a speed to perform: `slow` or `fast`.
     */
    swipeRight(locator: TestMaiT.LocatorOrString, speed?: string): void;
    /**
     * Waits for number of seconds
     *
     * ```js
     * I.wait(2); // waits for 2 seconds
     * ```
     * @param sec - number of seconds to wait
     */
    wait(sec: number): void;
    /**
     * Waits for an element to exist on page.
     *
     * ```js
     * I.waitForElement('#message', 1); // wait for 1 second
     * ```
     * @param locator - an element to wait for
     * @param [sec = 5] - number of seconds to wait, 5 by default
     */
    waitForElement(locator: TestMaiT.LocatorOrString, sec?: number): void;
    /**
     * Waits for an element to be visible on page.
     *
     * ```js
     * I.waitForElementVisible('#message', 1); // wait for 1 second
     * ```
     * @param locator - an element to wait for
     * @param [sec = 5] - number of seconds to wait
     */
    waitForElementVisible(locator: TestMaiT.LocatorOrString, sec?: number): void;
    /**
     * Waits an elment to become not visible.
     *
     * ```js
     * I.waitToHide('#message', 2); // wait for 2 seconds
     * ```
     * @param locator - an element to wait for
     * @param [sec = 5] - number of seconds to wait
     */
    waitToHide(locator: TestMaiT.LocatorOrString, sec?: number): void;
  }
  /**
   * Abstract class.
   * Helpers abstracts test execution backends.
   *
   * Methods of Helper class will be available in tests in `I` object.
   * They provide user-friendly abstracted actions over NodeJS libraries.
   *
   * Hooks (methods starting with `_`) can be used to setup/teardown,
   * or handle execution flow.
   *
   * Methods are expected to return a value in order to be wrapped in promise.
   */
  class Helper {
    constructor(config: any);
    /**
     * Abstract method to provide required config options
     */
    protected static _config(): any;
    /**
     * Abstract method to validate config
     */
    protected _validateConfig(config: any): any;
    /**
     * Sets config for current test
     */
    protected _setConfig(opts: any): void;
    /**
     * Hook executed before all tests
     */
    protected _init(): void;
    /**
     * Hook executed before each test.
     */
    protected _before(test?: Mocha.Test): void;
    /**
     * Hook executed after each test
     */
    protected _after(test?: Mocha.Test): void;
    /**
     * Hook executed after each passed test
     */
    protected _passed(test: Mocha.Test): void;
    /**
     * Hook executed after each failed test
     */
    protected _failed(test: Mocha.Test): void;
    /**
     * Hook executed before each step
     */
    protected _beforeStep(step: TestMaiT.Step): void;
    /**
     * Hook executed after each step
     */
    protected _afterStep(step: TestMaiT.Step): void;
    /**
     * Hook executed before each suite
     */
    protected _beforeSuite(suite: Mocha.Suite): void;
    /**
     * Hook executed after each suite
     */
    protected _afterSuite(suite: Mocha.Suite): void;
    /**
     * Hook executed after all tests are executed
     */
    protected _finishTest(suite: Mocha.Suite): void;
    /**
     * Abstract method to provide common interface to accessing helpers internals inside a test.
     */
    _useTo(): void;
    /**
     * Access another configured helper: `this.helpers['AnotherHelper']`
     */
    readonly helpers: any;
    /**
     * Print debug message to console (outputs only in debug mode)
     */
    debug(msg: string): void;
    debugSection(section: string, msg: string): void;
  }
}

/**
 * timeouts set with order below zero only override timeouts of higher order if their value is smaller
 */
declare var testOrSuite: any;

/**
 * 0-9 - designated for override of timeouts set from code, 5 is used by stepTimeout plugin when stepTimeout.config.overrideStepLimits=true
 */
declare var stepTimeoutHard: any;

/**
 * 10-19 - designated for timeouts set from code, 15 is order of I.setTimeout(t) operation
 */
declare var codeLimitTime: any;

/**
 * 20-29 - designated for timeout settings which could be overriden in tests code, 25 is used by stepTimeout plugin when stepTimeout.config.overrideStepLimits=false
 */
declare var stepTimeoutSoft: any;
