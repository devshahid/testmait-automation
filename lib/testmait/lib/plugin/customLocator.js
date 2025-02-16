const Locator = require('../locator');
const { xpathLocator } = require('../utils');

const defaultConfig = {
  prefix: '$',
  attribute: 'data-test-id',
  strategy: 'xpath',
  showActual: false,
};

/**
 * Creates a [custom locator](https://testmait.io/locators#custom-locators) by using special attributes in HTML.
 *
 * If you have a convention to use `data-test-id` or `data-qa` attributes to mark active elements for e2e tests,
 * you can enable this plugin to simplify matching elements with these attributes:
 *
 * ```js
 * // replace this:
 * I.click({ css: '[data-test-id=register_button]');
 * // with this:
 * I.click('$register_button');
 * ```
 * This plugin will create a valid XPath locator for you.
 *
 * #### Configuration
 *
 * * `enabled` (default: `false`) should a locator be enabled
 * * `prefix` (default: `$`) sets a prefix for a custom locator.
 * * `attribute` (default: `data-test-id`) to set an attribute to be matched.
 * * `strategy` (default: `xpath`) actual locator strategy to use in query (`css` or `xpath`).
 * * `showActual` (default: false) show in the output actually produced XPath or CSS locator. By default shows custom locator value.
 *
 * #### Examples:
 *
 * Using `data-test` attribute with `$` prefix:
 *
 * ```js
 * // in testmait.conf.js
 * plugins: {
 *  customLocator: {
 *    enabled: true,
 *    attribute: 'data-test'
 *  }
 * }
 * ```
 *
 * In a test:
 *
 * ```js
 * I.seeElement('$user'); // matches => [data-test=user]
 * I.click('$sign-up'); // matches => [data-test=sign-up]
 * ```
 *
 * Using `data-qa` attribute with `=` prefix:
 *
 * ```js
 * // in testmait.conf.js
 * plugins: {
 *  customLocator: {
 *    enabled: true,
 *    prefix: '=',
 *    attribute: 'data-qa'
 *  }
 * }
 * ```
 *
 * In a test:
 *
 * ```js
 * I.seeElement('=user'); // matches => [data-qa=user]
 * I.click('=sign-up'); // matches => [data-qa=sign-up]
 * ```
 *
 * Using `data-qa` OR `data-test` attribute with `=` prefix:
 *
 * ```js
 * // in testmait.conf.js
 * plugins: {
 *  customLocator: {
 *    enabled: true,
 *    prefix: '=',
 *    attribute: ['data-qa', 'data-test'],
 *    strategy: 'xpath'
 *  }
 * }
 * ```
 *
 * In a test:
 *
 * ```js
 * I.seeElement('=user'); // matches => //*[@data-qa=user or @data-test=user]
 * I.click('=sign-up'); // matches => //*[data-qa=sign-up or @data-test=sign-up]
 * ```
 *
 * ```js
 * // in testmait.conf.js
 * plugins: {
 *  customLocator: {
 *    enabled: true,
 *    prefix: '=',
 *    attribute: ['data-qa', 'data-test'],
 *    strategy: 'css'
 *  }
 * }
 * ```
 *
 * In a test:
 *
 * ```js
 * I.seeElement('=user'); // matches => [data-qa=user],[data-test=user]
 * I.click('=sign-up'); // matches => [data-qa=sign-up],[data-test=sign-up]
 * ```
 */
module.exports = (config) => {
  config = { ...defaultConfig, ...config };

  Locator.addFilter((value, locatorObj) => {
    if (typeof value !== 'string') return;
    if (!value.startsWith(config.prefix)) return;

    if (!['String', 'Array'].includes(config.attribute.constructor.name)) return;

    const val = value.substr(config.prefix.length);

    if (config.strategy.toLowerCase() === 'xpath') {
      locatorObj.value = `.//*[${
        [].concat(config.attribute)
          .map((attr) => `@${attr}=${xpathLocator.literal(val)}`)
          .join(' or ')}]`;
      locatorObj.type = 'xpath';
    }

    if (config.strategy.toLowerCase() === 'css') {
      locatorObj.value = [].concat(config.attribute)
        .map((attr) => `[${attr}=${val}]`)
        .join(',');
      locatorObj.type = 'css';
    }

    if (config.showActual) {
      locatorObj.output = locatorObj.value;
    }
  });
};
