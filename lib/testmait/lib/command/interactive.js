const { getConfig, getTestRoot } = require('./utils');
const recorder = require('../recorder');
const Testmait = require('../testmait');
const Container = require('../container');
const event = require('../event');
const output = require('../output');
const webHelpers = require('../plugin/standardActingHelpers');

module.exports = async function (path, options) {
  // Backward compatibility for --profile
  process.profile = options.profile;
  process.env.profile = options.profile;
  const configFile = options.config;

  const config = getConfig(configFile);
  const testsPath = getTestRoot(configFile);

  const testmait = new Testmait(config, options);
  testmait.init(testsPath);

  try {
    await testmait.bootstrap();

    if (options.verbose) output.level(3);

    output.print('Starting interactive shell for current suite...');
    recorder.start();
    event.emit(event.suite.before, {
      fullTitle: () => 'Interactive Shell',
      tests: [],
    });
    event.emit(event.test.before, {
      title: '',
      artifacts: {},
    });

    const enabledHelpers = Container.helpers();
    for (const helperName of Object.keys(enabledHelpers)) {
      if (webHelpers.includes(helperName)) {
        const TM = enabledHelpers[helperName];
        recorder.add(() => TM.amOnPage('/'));
        recorder.catchWithoutStop((e) =>
          output.print(`Error while loading home page: ${e.message}}`),
        );
        break;
      }
    }
    require('../pause')();
    // recorder.catchWithoutStop((err) => console.log(err.stack));
    recorder.add(() => event.emit(event.test.after, {}));
    recorder.add(() => event.emit(event.suite.after, {}));
    recorder.add(() => event.emit(event.all.result, {}));
    recorder.add(() => testmait.teardown());
  } catch (err) {
    output.error(`Error while running bootstrap file :${err}`);
  }
};
