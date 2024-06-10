const { CommonUtils, LmpApi, LoggerFactory, OpenApi } = inject();

const _ = require('lodash');
const event = require('../testmait').event;
const { context } = require('../utils/context');

const logger = LoggerFactory.init();

module.exports = () => {
  event.dispatcher.on(event.all.before, () => {
    CommonUtils.loadLocatorsAndTestData();
  });

  event.dispatcher.on(event.test.before, (test) => {
    // Reload the test data before every test in case it is modified in certain scenarios
    CommonUtils.loadLocatorsAndTestData();

    logger.info(`Executing scenario: ${context.scenario.title}`);
    logger.info(`Scenario tags: ${_.join(context.scenario.tags, ' ')}`);

    // If both the @LMP and @API tags are present on the test, reset the LMP API flows
    if (_.difference(['@LMP', '@API'], test.tags).length === 0) LmpApi.resetFlow();
  });

  event.dispatcher.on(event.test.after, () => {
    // Delete the cached API flows after tests
    OpenApi.deleteCachedApiFlow();
  });
};
