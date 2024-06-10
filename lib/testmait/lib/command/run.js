const {
  getConfig, printError, getTestRoot, createOutputDir,
} = require('./utils');
const Config = require('../config');
const Testmait = require('../testmait');

module.exports = async function (test, options) {
  // registering options globally to use in config
  // Backward compatibility for --profile
  process.profile = options.profile;

  if (options.profile) {
    process.env.profile = options.profile;
  }

  const configFile = options.config;

  let config = getConfig(configFile);
  if (options.override) {
    config = Config.append(JSON.parse(options.override));
  }
  const testRoot = getTestRoot(configFile);
  createOutputDir(config, testRoot);

  const testmait = new Testmait(config, options);

  try {
    testmait.init(testRoot);
    await testmait.bootstrap();
    testmait.loadTests(test);

    if (options.verbose) {
      global.debugMode = true;
      const { getMachineInfo } = require('./info');
      await getMachineInfo();
    }

    await testmait.run();
  } catch (err) {
    printError(err);
    process.exitCode = 1;
  } finally {
    await testmait.teardown();
  }
};
