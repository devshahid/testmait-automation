/* eslint-disable max-classes-per-file */
const path = require('path');
const mkdirp = require('mkdirp');
const { Worker } = require('worker_threads');
const { Suite, Test, reporters: { Base } } = require('mocha');
const { EventEmitter } = require('events');
const ms = require('ms');
const Testmait = require('./testmait');
const MochaFactory = require('./mochaFactory');
const Container = require('./container');
const { getTestRoot } = require('./command/utils');
const { isFunction, fileExists } = require('./utils');
const { replaceValueDeep, deepClone } = require('./utils');
const mainConfig = require('./config');
const output = require('./output');
const event = require('./event');
const recorder = require('./recorder');
const runHook = require('./hooks');
const WorkerStorage = require('./workerStorage');
const collection = require('./command/run-multiple/collection');

const pathToWorker = path.join(__dirname, 'command', 'workers', 'runTests.js');

const initializeTestmait = (configPath, options = {}) => {
  const testmait = new Testmait(mainConfig.load(configPath || '.'), options);
  testmait.init(getTestRoot(configPath));
  testmait.loadTests();

  return testmait;
};

const createOutputDir = (configPath) => {
  const config = mainConfig.load(configPath || '.');
  const testRoot = getTestRoot(configPath);
  const outputDir = path.isAbsolute(config.output) ? config.output : path.join(testRoot, config.output);

  if (!fileExists(outputDir)) {
    output.print(`creating output directory: ${outputDir}`);
    mkdirp.sync(outputDir);
  }
};

const populateGroups = (numberOfWorkers) => {
  const groups = [];
  for (let i = 0; i < numberOfWorkers; i++) {
    groups[i] = [];
  }

  return groups;
};

const createWorker = (workerObject) => {
  const worker = new Worker(pathToWorker, {
    workerData: {
      options: simplifyObject(workerObject.options),
      tests: workerObject.tests,
      testRoot: workerObject.testRoot,
      workerIndex: workerObject.workerIndex + 1,
    },
  });
  worker.on('error', err => output.error(`Worker Error: ${err.stack}`));

  WorkerStorage.addWorker(worker);
  return worker;
};

const simplifyObject = (object) => {
  return Object.keys(object)
    .filter((k) => k.indexOf('_') !== 0)
    .filter((k) => typeof object[k] !== 'function')
    .filter((k) => typeof object[k] !== 'object')
    .reduce((obj, key) => {
      obj[key] = object[key];
      return obj;
    }, {});
};

const repackTest = (test) => {
  test = Object.assign(new Test(test.title || '', () => { }), test);
  test.parent = Object.assign(new Suite(test.parent.title), test.parent);
  return test;
};

const createWorkerObjects = (testGroups, config, testRoot, options, selectedRuns) => {
  selectedRuns = options && options.all && config.multiple ? Object.keys(config.multiple) : selectedRuns;
  if (selectedRuns === undefined || !selectedRuns.length || config.multiple === undefined) {
    return testGroups.map((tests, index) => {
      const workerObj = new WorkerObject(index);
      workerObj.addConfig(config);
      workerObj.addTests(tests);
      workerObj.setTestRoot(testRoot);
      workerObj.addOptions(options);
      return workerObj;
    });
  }
  const workersToExecute = [];

  const currentOutputFolder = config.output;
  let currentMochawesomeReportDir;
  let currentMochaJunitReporterFile;

  if (config.mocha && config.mocha.reporterOptions) {
    currentMochawesomeReportDir = config.mocha.reporterOptions?.mochawesome.options.reportDir;
    currentMochaJunitReporterFile = config.mocha.reporterOptions['mocha-junit-reporter'].options.mochaFile;
  }

  collection.createRuns(selectedRuns, config).forEach((worker) => {
    const separator = path.sep;
    const _config = { ...config };
    let workerName = worker.name.replace(':', '_');
    _config.output = `${currentOutputFolder}${separator}${workerName}`;
    if (config.mocha && config.mocha.reporterOptions) {
      _config.mocha.reporterOptions.mochawesome.options.reportDir = `${currentMochawesomeReportDir}${separator}${workerName}`;

      const _tempArray = currentMochaJunitReporterFile.split(separator);
      _tempArray.splice(_tempArray.findIndex(item => item.includes('.xml')), 0, workerName);
      _config.mocha.reporterOptions['mocha-junit-reporter'].options.mochaFile = _tempArray.join(separator);
    }
    workerName = worker.getOriginalName() || worker.getName();
    const workerConfig = worker.getConfig();
    workersToExecute.push(getOverridenConfig(workerName, workerConfig, _config));
  });
  const workers = [];
  let index = 0;
  testGroups.forEach((tests) => {
    const testWorkerArray = [];
    workersToExecute.forEach((finalConfig) => {
      const workerObj = new WorkerObject(index++);
      workerObj.addConfig(finalConfig);
      workerObj.addTests(tests);
      workerObj.setTestRoot(testRoot);
      workerObj.addOptions(options);
      testWorkerArray.push(workerObj);
    });
    workers.push(...testWorkerArray);
  });
  return workers;
};

const indexOfSmallestElement = (groups) => {
  let i = 0;
  for (let j = 1; j < groups.length; j++) {
    if (groups[j - 1].length > groups[j].length) {
      i = j;
    }
  }
  return i;
};

const convertToMochaTests = (testGroup) => {
  const group = [];
  if (testGroup instanceof Array) {
    const mocha = MochaFactory.create({}, {});
    mocha.files = testGroup;
    mocha.loadFiles();
    mocha.suite.eachTest((test) => {
      group.push(test.uid);
    });
    mocha.unloadFiles();
  }

  return group;
};

const getOverridenConfig = (workerName, workerConfig, config) => {
  // clone config
  const overriddenConfig = deepClone(config);

  // get configuration
  const browserConfig = workerConfig.browser;

  for (const key in browserConfig) {
    overriddenConfig.helpers = replaceValueDeep(overriddenConfig.helpers, key, browserConfig[key]);
  }

  // override tests configuration
  if (overriddenConfig.tests) {
    overriddenConfig.tests = workerConfig.tests;
  }

  if (overriddenConfig.gherkin && workerConfig.gherkin && workerConfig.gherkin.features) {
    overriddenConfig.gherkin.features = workerConfig.gherkin.features;
  }
  return overriddenConfig;
};

class WorkerObject {
  /**
   * @param {Number} workerIndex - Unique ID for worker
   */
  constructor(workerIndex) {
    this.workerIndex = workerIndex;
    this.options = {};
    this.tests = [];
    this.testRoot = getTestRoot();
  }

  addConfig(config) {
    const oldConfig = JSON.parse(this.options.override || '{}');
    const newConfig = {
      ...oldConfig,
      ...config,
    };
    this.options.override = JSON.stringify(newConfig);
  }

  addTestFiles(testGroup) {
    this.addTests(convertToMochaTests(testGroup));
  }

  addTests(tests) {
    this.tests = this.tests.concat(tests);
  }

  setTestRoot(path) {
    this.testRoot = getTestRoot(path);
  }

  addOptions(opts) {
    this.options = {
      ...this.options,
      ...opts,
    };
  }
}

class Workers extends EventEmitter {
  /**
   * @param {Number} numberOfWorkers
   * @param {Object} config
   */
  constructor(numberOfWorkers, config = { by: 'test' }) {
    super();
    this.setMaxListeners(50);
    this.testmait = initializeTestmait(config.testConfig, config.options);
    this.failuresLog = [];
    this.errors = [];
    this.numberOfWorkers = 0;
    this.closedWorkers = 0;
    this.workers = [];
    this.stats = {
      passes: 0,
      failures: 0,
      tests: 0,
      pending: 0,
    };
    this.testGroups = [];

    createOutputDir(config.testConfig);
    if (numberOfWorkers) this._initWorkers(numberOfWorkers, config);
  }

  _initWorkers(numberOfWorkers, config) {
    this.splitTestsByGroups(numberOfWorkers, config);
    this.workers = createWorkerObjects(this.testGroups, this.testmait.config, config.testConfig, config.options, config.selectedRuns);
    this.numberOfWorkers = this.workers.length;
  }

  /**
   * This splits tests by groups.
   * Strategy for group split is taken from a constructor's config.by value:
   *
   * `config.by` can be:
   *
   * - `suite`
   * - `test`
   * - function(numberOfWorkers)
   *
   * This method can be overridden for a better split.
   */
  splitTestsByGroups(numberOfWorkers, config) {
    if (isFunction(config.by)) {
      const createTests = config.by;
      const testGroups = createTests(numberOfWorkers);
      if (!(testGroups instanceof Array)) {
        throw new Error('Test group should be an array');
      }
      for (const testGroup of testGroups) {
        this.testGroups.push(convertToMochaTests(testGroup));
      }
    } else if (typeof numberOfWorkers === 'number' && numberOfWorkers > 0) {
      this.testGroups = config.by === 'suite' ? this.createGroupsOfSuites(numberOfWorkers) : this.createGroupsOfTests(numberOfWorkers);
    }
  }

  /**
   * Creates a new worker
   *
   * @returns {WorkerObject}
   */
  spawn() {
    const worker = new WorkerObject(this.numberOfWorkers);
    this.workers.push(worker);
    this.numberOfWorkers += 1;
    return worker;
  }

  /**
   * @param {Number} numberOfWorkers
   */
  createGroupsOfTests(numberOfWorkers) {
    const files = this.testmait.testFiles;
    const mocha = Container.mocha();
    mocha.files = files;
    mocha.loadFiles();

    const groups = populateGroups(numberOfWorkers);
    let groupCounter = 0;

    mocha.suite.eachTest((test) => {
      const i = groupCounter % groups.length;
      if (test) {
        groups[i].push(test.uid);
        groupCounter++;
      }
    });
    return groups;
  }

  /**
   * @param {Number} numberOfWorkers
   */
  createGroupsOfSuites(numberOfWorkers) {
    const files = this.testmait.testFiles;
    const groups = populateGroups(numberOfWorkers);

    const mocha = Container.mocha();
    mocha.files = files;
    mocha.loadFiles();
    mocha.suite.suites.forEach((suite) => {
      const i = indexOfSmallestElement(groups);
      suite.tests.forEach((test) => {
        if (test) {
          groups[i].push(test.uid);
        }
      });
    });
    return groups;
  }

  /**
   * @param {Object} config
   */
  overrideConfig(config) {
    for (const worker of this.workers) {
      worker.addConfig(config);
    }
  }

  async bootstrapAll() {
    return runHook(this.testmait.config.bootstrapAll, 'bootstrapAll');
  }

  async teardownAll() {
    return runHook(this.testmait.config.teardownAll, 'teardownAll');
  }

  run() {
    this.stats.start = new Date();
    recorder.startUnlessRunning();
    event.dispatcher.emit(event.workers.before);
    recorder.add('starting workers', () => {
      for (const worker of this.workers) {
        const workerThread = createWorker(worker);
        this._listenWorkerEvents(workerThread);
      }
    });
    return new Promise(resolve => {
      this.on('end', resolve);
    });
  }

  /**
   * @returns {Array<WorkerObject>}
   */
  getWorkers() {
    return this.workers;
  }

  /**
   * @returns {Boolean}
   */
  isFailed() {
    return (this.stats.failures || this.errors.length) > 0;
  }

  _listenWorkerEvents(worker) {
    worker.on('message', (message) => {
      output.process(message.workerIndex);

      // deal with events that are not test cycle related
      if (!message.event) {
        return this.emit('message', message);
      }

      switch (message.event) {
        case event.all.failures:
          this.failuresLog = this.failuresLog.concat(message.data.failuresLog);
          this._appendStats(message.data.stats);
          break;
        case event.suite.before:
          this.emit(event.suite.before, repackTest(message.data));
          break;
        case event.hook.failed:
          this.emit(event.hook.failed, repackTest(message.data));
          this.errors.push(message.data.err);
          break;
        case event.test.before:
          this.emit(event.test.before, repackTest(message.data));
          break;
        case event.test.started:
          this.emit(event.test.started, repackTest(message.data));
          break;
        case event.test.failed:
          this.emit(event.test.failed, repackTest(message.data));
          break;
        case event.test.passed:
          this.emit(event.test.passed, repackTest(message.data));
          break;
        case event.test.skipped:
          this.emit(event.test.skipped, repackTest(message.data));
          break;
        case event.test.finished:
          this.emit(event.test.finished, repackTest(message.data));
          break;
        case event.test.after:
          this.emit(event.test.after, repackTest(message.data));
          break;
        case event.step.finished:
          this.emit(event.step.finished, message.data);
          break;
        case event.step.started:
          this.emit(event.step.started, message.data);
          break;
        case event.step.passed:
          this.emit(event.step.passed, message.data);
          break;
        case event.step.failed:
          this.emit(event.step.failed, message.data);
          break;
      }
    });

    worker.on('error', (err) => {
      this.errors.push(err);
    });

    worker.on('exit', () => {
      this.closedWorkers += 1;
      if (this.closedWorkers === this.numberOfWorkers) {
        this._finishRun();
      }
    });
  }

  _finishRun() {
    event.dispatcher.emit(event.workers.after);
    if (this.isFailed()) {
      process.exitCode = 1;
    } else {
      process.exitCode = 0;
    }
    // removed this.finishedTests because in all /lib only first argument (!this.isFailed()) is used)
    this.emit(event.all.result, !this.isFailed());
    this.emit('end'); // internal event
  }

  _appendStats(newStats) {
    this.stats.passes += newStats.passes;
    this.stats.failures += newStats.failures;
    this.stats.tests += newStats.tests;
    this.stats.pending += newStats.pending;
  }

  printResults() {
    this.stats.end = new Date();
    this.stats.duration = this.stats.end - this.stats.start;

    // Reset process for logs in main thread
    output.process(null);
    output.print();

    this.failuresLog = this.failuresLog
      .filter(log => log.length && typeof log[1] === 'number')
      // mocha/lib/reporters/base.js
      .map(([format, num, title, message, stack], i) => [format, i + 1, title, message, stack]);

    if (this.failuresLog.length) {
      output.print();
      output.print('-- FAILURES:');
      this.failuresLog.forEach(log => output.print(...log));
    }

    output.result(this.stats.passes, this.stats.failures, this.stats.pending, ms(this.stats.duration));
  }
}

module.exports = Workers;
