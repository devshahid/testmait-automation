const { getConfig, getTestRoot } = require('./utils');
const Config = require('../config');
const Testmait = require('../testmait');
const output = require('../output');
const event = require('../event');
const store = require('../store');
const Container = require('../container');

module.exports = async function (test, options) {
  if (options.grep) process.env.grep = options.grep.toLowerCase();
  const configFile = options.config;
  let testmait;

  const testRoot = getTestRoot(configFile);
  let config = getConfig(configFile);
  if (options.override) {
    config = Config.append(JSON.parse(options.override));
  }

  if (config.plugins) {
    // disable all plugins by default, they can be enabled with -p option
    for (const plugin in config.plugins) {
      // if `-p all` is passed, then enabling all plugins, otherwise plugins could be enabled by `-p customLocator,commentStep,tryTo`
      config.plugins[plugin].enabled = options.plugins === 'all';
    }
  }

  try {
    testmait = new Testmait(config, options);
    testmait.init(testRoot);

    if (options.bootstrap) await testmait.bootstrap();

    testmait.loadTests();
    store.dryRun = true;

    if (!options.steps && !options.verbose && !options.debug) {
      printTests(testmait.testFiles);
      return;
    }
    event.dispatcher.on(event.all.result, printFooter);
    testmait.run(test);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

function printTests(files) {
  const figures = require('figures');
  const colors = require('chalk');

  output.print(output.styles.debug(`Tests from ${global.codecept_dir}:`));
  output.print();

  const mocha = Container.mocha();
  mocha.files = files;
  mocha.loadFiles();

  let numOfTests = 0;
  let numOfSuites = 0;
  const filteredSuites = [];

  for (const suite of mocha.suite.suites) {
    if (process.env.grep && suite.title.toLowerCase().includes(process.env.grep)) {
      filteredSuites.push(suite);
    }
  }
  const displayedSuites = process.env.grep ? filteredSuites : mocha.suite.suites;
  for (const suite of displayedSuites) {
    output.print(`${colors.white.bold(suite.title)} -- ${output.styles.log(suite.file || '')} -- ${suite.tests.length} tests`);
    numOfSuites++;

    for (const test of suite.tests) {
      numOfTests++;
      output.print(`  ${output.styles.scenario(figures.checkboxOff)} ${test.title}`);
    }
  }

  output.print('');
  output.success(`  Total: ${numOfSuites} suites | ${numOfTests} tests  `);
  printFooter();
  process.exit(0);
}

function printFooter() {
  output.print();
  output.print('--- DRY MODE: No tests were executed ---');
}
