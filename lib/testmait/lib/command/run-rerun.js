const { getConfig, getTestRoot } = require('./utils');
const { printError, createOutputDir } = require('./utils');
const Config = require('../config');
const Testmait = require('../rerun');

module.exports = async function (test, options) {
  // registering options globally to use in config
  // Backward compatibility for --profile
  process.profile = options.profile;
  process.env.profile = options.profile;
  const configFile = options.config;

  let config = getConfig(configFile);
  if (options.override) {
    config = Config.append(JSON.parse(options.override));
  }
  const testRoot = getTestRoot(configFile);
  createOutputDir(config, testRoot);

  function processError(err) {
    printError(err);
    process.exit(1);
  }
  const testmait = new Testmait(config, options);

  try {
    testmait.init(testRoot);

    await testmait.bootstrap();
    testmait.loadTests(test);
    await testmait.run();
  } catch (err) {
    printError(err);
    process.exitCode = 1;
  } finally {
    await testmait.teardown();
  }
};
