const debug = require('debug')('testmait:heal');
const colors = require('chalk');
const Container = require('../container');
const AiAssistant = require('../ai');
const recorder = require('../recorder');
const event = require('../event');
const output = require('../output');
const supportedHelpers = require('./standardActingHelpers');
const { resolve, sep } = require('path');
const path = require('path');
const { exist } = require('joi');
const fs = require('fs');
const glob = require('glob');

let dotenvPath = resolve(process.env.AI_DOTENV_PATH || `${process.cwd()}/.env`);

let healloadResult = require('dotenv').config(
  process.env.AI_DOTENV_PATH === undefined ? {} : { path: dotenvPath },
);
let healcoreDir = `${__dirname}/../../../../`;

let healprojectName = path.basename(resolve(process.env.AI_PROJECT_NAME || 'demo1'));
//let projectName = path.basename(resolve(process.env.AI_PROJECT_NAME));

//let workspaceDir = resolve(process.env.AI_WORKSPACE_DIR || `${coreDir}/${workspacePrefix}`);
let healworkspaceDir = resolve(
  process.env.AI_WORKSPACE_DIR || `${healcoreDir}/projects/${healprojectName}`,
);

let healfeatureDir = `${healworkspaceDir}/features`;

const defaultConfig = {
  healLimit: 10,
  healSteps: [
    'click',
    'fillField',
    'appendField',
    'selectOption',
    'attachFile',
    'checkOption',
    'uncheckOption',
    'doubleClick',
  ],
};

/**
 * Self-healing tests with OpenAI.
 *
 * This plugin is experimental and requires OpenAI API key.
 *
 * To use it you need to set OPENAI_API_KEY env variable and enable plugin inside the config.
 *
 * ```js
 * plugins: {
 *   heal: {
 *    enabled: true,
 *   }
 * }
 * ```
 *
 * More config options are available:
 *
 * * `healLimit` - how many steps can be healed in a single test (default: 2)
 * * `healSteps` - which steps can be healed (default: all steps that interact with UI, see list below)
 *
 * Steps to heal:
 *
 * * `click`
 * * `fillField`
 * * `appendField`
 * * `selectOption`
 * * `attachFile`
 * * `checkOption`
 * * `uncheckOption`
 * * `doubleClick`
 *
 */
module.exports = function (config = {}) {
  const aiAssistant = new AiAssistant();

  let currentTest = null;
  let currentStep = null;
  let healedSteps = 0;

  const healSuggestions = [];

  config = Object.assign(defaultConfig, config);

  event.dispatcher.on(event.test.before, (test) => {
    currentTest = test;
    healedSteps = 0;
  });

  event.dispatcher.on(event.step.started, (step) => (currentStep = step));

  event.dispatcher.on(event.step.before, () => {
    const store = require('../store');
    if (store.debugMode) return;
    recorder.catchWithoutStop(async (err) => {
      if (!aiAssistant.isEnabled) throw err;
      if (!currentStep) throw err;
      if (!config.healSteps.includes(currentStep.name)) throw err;
      const test = currentTest;
      if (healedSteps >= config.healLimit) {
        output.print(colors.bold.red(`Can't heal more than ${config.healLimit} step(s) in a test`));
        output.print('Entire flow can be broken, please check it manually');
        output.print('or increase healing limit in heal plugin config');

        throw err;
      }

      recorder.session.start('heal');
      const helpers = Container.helpers();
      let helper;

      for (const helperName of supportedHelpers) {
        if (Object.keys(helpers).indexOf(helperName) > -1) {
          helper = helpers[helperName];
        }
      }

      if (!helper) throw err; // no helpers for html

      const step = test.steps[test.steps.length - 1];
      debug('Self-healing started', step.toCode());

      const currentOutputLevel = output.level();
      output.level(0);
      const html = await helper.grabHTMLFrom('body');
      output.level(currentOutputLevel);

      if (!html) throw err;

      aiAssistant.setHtmlContext(html);
      await tryToHeal(step, err);
      recorder.session.restore();
    });
  });

  event.dispatcher.on(event.all.result, () => {
    if (!healSuggestions.length) return;

    const { print } = output;

    print('');
    print('===================');
    print(colors.bold.green('Self-Healing Report:'));

    print(`${colors.bold(healSuggestions.length)} step(s) were healed by AI`);

    let i = 1;
    print('');
    print('Suggested changes:');
    print('');

    for (const suggestion of healSuggestions) {
      print(`${i}. To fix ${colors.bold.blue(suggestion.test.title)}`);
      print('Replace the failed code with:');
      //ZeroQE changes start

      //print(colors.red(`- ${suggestion.step.toCode()}`));
      const existingcode = convertToBdd(`[${suggestion.step.toCode()}]`);
      //print(colors.red(`- ${existingcode}`));
      //print(colors.green(`+ ${suggestion.snippet}`));
      const healedcode = convertToBdd(`[${suggestion.snippet}]`);
      //print(colors.green(`- ${healedcode}`));
      const parts = suggestion.test.title.split(' @'); // Split the string at the "@" symbol
      // Extract the portion before the "@" symbol
      const scenarioName = parts[0];
      replaceLineInFeatureFiles(scenarioName, existingcode, healedcode);
      //print(suggestion.step.line());
      print('');
      i++;
    }
  });
  //ZeroQE Method
  function replaceLineInFeatureFiles(scenarioName, existingLine, newLine) {
    const featureFiles = glob.sync(`${healfeatureDir}/*.feature`.replace(/\//g, sep)); // Adjust the glob pattern as needed

    featureFiles.forEach((file) => {
      const fileContent = fs.readFileSync(file, 'utf8');
      const lines = fileContent.split('\n');

      let isInTargetScenario = false;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.trim().startsWith('Scenario:') && isInTargetScenario) {
          isInTargetScenario = false;
        }

        if (line.trim().startsWith('Scenario:' + scenarioName)) {
          isInTargetScenario = true;
        }
        if (isInTargetScenario && line.includes(existingLine)) {
          lines[i] = newLine;
        }
      }

      const updatedFileContent = lines.join('\n');
      fs.writeFileSync(file, updatedFileContent);
    });
  }

  function convertToBdd(cmd) {
    // Split the input string into an array of lines
    const cmdLines = cmd.split('\n');

    const conversionRules = [
      {
        regex: /TM\.fillField\(([^)]+),([^)]+)\)/,
        template: 'When I fill field for "$var1" with value "$var2"',
      },
      {
        regex: /TM\.click\(([^)]+)\)/,
        template: 'When I click "$var1"',
      },
      // Add more conversion rules for other commands as needed
    ];

    let bddSteps = '';

    for (const line of cmdLines) {
      let convertedOutput = line; // Default to the original line if no match found

      for (const rule of conversionRules) {
        const match = line.match(rule.regex);
        let var1 = null;
        let var2 = null;
        if (match && match[1]) {
          var1 = match[1].trim(); // Trim whitespace from the captured value
        }
        if (match && match[2]) {
          var2 = match[2].trim(); // Trim whitespace from the captured value
        }

        if (match) {
          convertedOutput = rule.template.replace(/\$([0-9]+)/g, (match, index) => {
            return match === '$1' ? match : match[index];
          });
          const replacedString = convertedOutput.replace('$var1', var1);
          const replacedString2 = replacedString.replace('$var2', var2);
          const replacedString3 = replacedString2
            .replace(/"'/g, '"')
            .replace(/'"/g, '"')
            .replace(/""/g, '"');

          bddSteps = replacedString3; // Store the converted step
          break; // Stop after the first match
        }
      }
    }
    //console.log(`${bddSteps}`)
    //const bddStepsString = bddSteps.join('\n');
    return bddSteps;
  }
  async function tryToHeal(failedStep, err) {
    output.debug(`Running OpenAI to heal ${failedStep.toCode()} step`);

    //ZeroQE Change
    let maxRetries = 3;
    let retryCount = 0;
    let codeSnippets = [];
    do {
      output.debug(`Try ${retryCount}`);
      codeSnippets = await aiAssistant.healFailedStep(failedStep, err, currentTest);
      output.debug(`Received ${codeSnippets.length} suggestions from OpenAI`);
      retryCount++;
    } while (codeSnippets.length === 0 && retryCount < maxRetries);

    output.debug(`Received ${codeSnippets.length} suggestions from OpenAI`);
    const TM = Container.support('TM'); // eslint-disable-line

    for (const codeSnippet of codeSnippets) {
      try {
        debug('Executing', codeSnippet);
        await eval(codeSnippet); // eslint-disable-line

        healSuggestions.push({
          test: currentTest,
          step: failedStep,
          snippet: codeSnippet,
        });

        //output.print(colors.bold.green('  Code healed successfully'));
        healedSteps++;
        return;
      } catch (err) {
        debug('Failed to execute code', err);
      }
    }

    output.debug(`Couldn't heal the code for ${failedStep.toCode()}`);
  }
};
