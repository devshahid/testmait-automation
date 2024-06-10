const assert = require('assert');

const _ = require('lodash');
const Helper = require('../testmait/lib/helper.js');

class Reporter extends Helper {
  /**
   * Displays the message and the calling BDD step in Allure while doing nothing else
   *
   * @param {string} message The message to be displayed in the report
   */
  report(message) {
    _.noop(message);
  }

  /**
   * Fails with the given error message
   *
   * @param {string} message The error message
   */
  fail(message) {
    assert.fail(message);
  }
}

module.exports = Reporter;
