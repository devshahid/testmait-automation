#!/usr/bin/env node
const _ = require('lodash');
const { execSync } = require('child_process');

const args = require('./configs/core.js').args;
const report = require('./utils/report.js');
const { globals, plugins } = require('./configs/core.js').config;

const testmaitNpmScript = 'aiautomation';

function main() {
  // Decide if tests are going to be executed with TestMaiT
  let run = args ? args[0] === 'run' && !_.includes(args, '--help') : false;
  if (plugins.allure.enabled && run) {
    report.prepareReport();
  }
  try {
    // Pass through CLI args to npm run via convict, the double dash between the npm script and the arguments is
    // needed to avoid feeding the arguments to npm itself, and instead pass them through to the TestMaiT script
    execSync(`npm --prefix "${globals.coreDir}" run ${testmaitNpmScript} -- ${_.join(args, ' ')}`, {
      stdio: 'inherit',
    });
  } catch {
    if (run) {
      //  console.warn('Test execution failed');
    } else {
      //  console.warn('An error occured');
    }
  }
  if (plugins.allure.enabled && run) {
    report.finishReport();
  }
}

// Execute only if module is run directly from Node.js
if (require.main === module) {
  main();
}

module.exports = main;
