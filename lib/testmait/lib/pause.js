const colors = require('chalk');
const readline = require('readline');
const ora = require('ora-classic');
const debug = require('debug')('testmait:pause');

const container = require('./container');
const history = require('./history');
const store = require('./store');
const AiAssistant = require('./ai');
const recorder = require('./recorder');
const event = require('./event');
const output = require('./output');
const { methodsOfObject } = require('./utils');
const { convertBDDToCode } = require('./conversion.js');
// npm install colors
let rl;
let nextStep;
let finish;
let next;
let registeredVariables = {};
const aiAssistant = new AiAssistant();

/**
 * Pauses test execution and starts interactive shell
 */
const pause = function (passedObject = {}) {
  if (store.dryRun) return;

  next = false;
  // add listener to all next steps to provide next() functionality
  event.dispatcher.on(event.step.after, () => {
    recorder.add('Start next pause session', () => {
      if (!next) return;
      return pauseSession();
    });
  });
  recorder.add('Start new session', () => pauseSession(passedObject));
};

function pauseSession(passedObject = {}) {
  registeredVariables = passedObject;
  recorder.session.start('pause');
  if (!next) {
    let vars = Object.keys(registeredVariables).join(', ');
    if (vars) vars = `(vars: ${vars})`;
    //ZeroQE Change Start
    // output.print(colors.yellow(' Interactive shell started'));
    // output.print(colors.yellow(' Use JavaScript syntax to try steps in action'));
    // output.print(colors.yellow(` - Press ${colors.bold('ENTER')} to run the next step`));
    // output.print(colors.yellow(` - Press ${colors.bold('TAB')} twice to see all available commands`));
    // output.print(colors.yellow(` - Type ${colors.bold('exit')} + Enter to exit the interactive shell`));
    // output.print(colors.yellow(` - Prefix ${colors.bold('=>')} to run js commands ${colors.bold(vars)}`));
    //ZeroQE Change End

    if (aiAssistant.isEnabled) {
      // ZeroQE Change
      // output.print(
      //   colors.blue(
      //     ` ${colors.bold(
      //       'OpenAI is enabled! (experimental)',
      //     )} Write what you want and make OpenAI run it`,
      //   ),
      // );
      output.print(
        colors.blue(
          ` ${colors.bold('OpenAI is enabled!')} Write what you want and make OpenAI run it`,
        ),
      );
      // ZeroQE Change Start
      // output.print(colors.blue(' Please note, only HTML fragments with interactive elements are sent to OpenAI'));
      // output.print(colors.blue(' Ideas: ask it to fill forms for you or to click'));
      // ZeroQE Change End
    } else {
      output.print(
        colors.blue(
          ` Enable OpenAI assistant by setting ${colors.bold('OPENAI_API_KEY')} env variable`,
        ),
      );
    }
  }
  rl = readline.createInterface(process.stdin, process.stdout, completer);
  rl.on('line', parseInput);
  rl.on('close', () => {
    if (!next) console.log('Exiting interactive shell....');
  });
  return new Promise((resolve) => {
    finish = resolve;
    // eslint-disable-next-line
    return askForStep();
  });
}

/* eslint-disable */
async function parseInput(cmd) {
  rl.pause();
  next = false;
  recorder.session.start('pause');
  store.debugMode = false;
  if (cmd === '') next = true;
  if (!cmd || cmd === 'resume' || cmd === 'exit') {
    finish();
    recorder.session.restore();
    rl.close();
    history.save();
    return nextStep();
  }
  for (const k of Object.keys(registeredVariables)) {
    eval(`var ${k} = registeredVariables['${k}'];`); // eslint-disable-line no-eval
  }

  let executeCommand = Promise.resolve();

  const getCmd = () => {
    debug('Command:', cmd);
    return cmd;
  };

  store.debugMode = true;
  let isCustomCommand = false;
  let lastError = null;
  let isAiCommand = false;
  let $res;
  try {
    const locate = global.locate; // enable locate in this context
    const TM = container.support('TM');
    if (cmd.trim().startsWith('=>')) {
      isCustomCommand = true;
      cmd = cmd.trim().substring(2, cmd.length);
    } else if (
      aiAssistant.isEnabled &&
      !cmd.match(/^\w+\(/) &&
      cmd.includes(' ') &&
      !cmd.includes('without ai')
    ) {
      const currentOutputLevel = output.level();
      output.level(0);
      const res = TM.grabSource();
      isAiCommand = true;
      executeCommand = executeCommand.then(async () => {
        try {
          const html = await res;
          aiAssistant.setHtmlContext(html);
        } catch (err) {
          output.print(output.styles.error(' ERROR '), "Can't get HTML context", err.stack);
          return;
        } finally {
          output.level(currentOutputLevel);
        }
        // aiAssistant.mockResponse("```js\nI.click('Sign in');\n```");
        const spinner = ora('Processing OpenAI request...').start();
        cmd = await aiAssistant.writeSteps(cmd);
        spinner.stop();
        output.print('');

        // ZeroQE Change start
        //output.print(colors.blue(aiAssistant.getResponse()));
        // This is to send lines to convert into BDD . Somehow it doesn't work with .join('\n')
        const lines = cmd.split('\n').filter((line) => line.trim().startsWith('TM.'));
        // This is to send commmands to cli for execution
        cmd = cmd
          .split('\n')
          .filter((line) => line.trim().startsWith('TM.'))
          .join('\n');

        //  output.print(colors.green(cmd));
        const allsteps = convertToBdd(lines);

        // ZeroQE Change end

        output.print('');
        //return cmd;
        return cmd;
      });
    } else {
      if (cmd.includes('without ai')) {
        cmd = cmd.replace('without ai', '');
        const bddtoprint = cmd;
        cmd = convertBDDToCode(cmd);
        cmd = `${cmd}`;
        const lines = cmd.split('\n').filter((line) => line.trim().startsWith('TM.'));
        // const allsteps = convertToBdd(lines);
        output.print(`${bddtoprint}`);
        output.print('');
      } else {
        cmd = `TM.${cmd}`;
      }
    }
    executeCommand = executeCommand
      .then(async () => {
        const cmds = getCmd()
          .split('TM')
          .map((cmd) => cmd.trim())
          .filter((cmd) => cmd !== '');
        // output.print('Commands:', cmds);
        for (const cmd of cmds) {
          const modifiedCmd = `TM${cmd}`;
          //output.print(`Executing command: ${modifiedCmd}\n`);
          await eval(modifiedCmd); // eslint-disable-line no-eval
        }
      })
      .catch((err) => {
        debug(err);
        if (isAiCommand) return;
        //if (!lastError) output.print(output.styles.error(' ERROR '), err.message);
        debug(err.stack);

        lastError = err.message;
      });

    const val = await executeCommand;

    if (isCustomCommand) {
      if (val !== undefined) console.log('Result', '$res=', val); // eslint-disable-line
      $res = val;
    }

    if (cmd?.startsWith('TM.see') || cmd?.startsWith('TM.dontSee')) {
      output.print(output.styles.success('  OK  '), cmd);
    }
    if (cmd?.startsWith('TM.grab')) {
      output.print(output.styles.debug(val));
    }

    history.push(cmd); // add command to history when successful
  } catch (err) {
    if (!lastError) output.print(output.styles.error(' ERROR '), err.message);
    lastError = err.message;
  }
  recorder.session.catch((err) => {
    const msg = err.cliMessage ? err.cliMessage() : err.message;

    // pop latest command from history because it failed
    history.pop();

    if (isAiCommand) return;
    if (!lastError) output.print(output.styles.error(' FAIL '), msg);
    lastError = err.message;
  });
  recorder.add('ask for next step', askForStep);
  nextStep();
}
/* eslint-enable */

//ZeroQE Code Change start

function convertToBdd(cmd) {
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

  const bddSteps = [];

  for (const line of cmd) {
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
        const replacedString3 = replacedString2.replace(/"'/g, '"').replace(/'"/g, '"');
        output.print(`${replacedString3}`);
        bddSteps.push(replacedString3); // Store the converted step
        break; // Stop after the first match
      }
    }
  }
  //console.log(`${bddSteps}`)
  return bddSteps;
}

// function convertBDDToCode(cmd) {
//   const conversionRules = [
//     {
//       regex: /(?:fill|enter)(?:\s+\w+)*\s+"([^"]+)"(?:\s+\w+)*\s+"([^"]+)"/i,
//       template: "fillField('$var1', '$var2')",
//     },
//     {
//       regex: /I\.selectOption\(([^)]+),([^)]+)\)/,
//       template: 'When I select option "$var1" with value "$var2"',
//     },
//     {
//       regex: /I\.click\(([^)]+)\)/,
//       template: 'When I click "$var1"',
//     },
//     {
//       regex: /click\s+on(?:\s+\w+)*\s+"([^"]+)"/i,
//       template: "click('$var1')",
//     },
//     // Add more conversion rules for other commands as needed
//   ];

//   let convertedOutput = cmd; // Default to the original cmd if no match found

//   for (const rule of conversionRules) {
//     const match = cmd.match(rule.regex);
//     let var1 = null;
//     let var2 = null;
//     if (match && match[1]) {
//       var1 = match[1].trim(); // Trim whitespace from the captured value
//     }
//     if (match && match[2]) {
//       var2 = match[2].trim(); // Trim whitespace from the captured value
//     }

//     if (match) {
//       convertedOutput = rule.template.replace(/\$([0-9]+)/g, (match, index) => {
//         return match === '$1' ? match : match[index];
//       });

//       const replacedString = convertedOutput.replace('$var1', var1);
//       const replacedString2 = replacedString.replace('$var2', var2);
//       convertedOutput = replacedString2.replace(/"'/g, '"').replace(/'"/g, '"');
//       break; // Stop after the first match
//     }
//   }
//   return convertedOutput;
// }

function askForStep() {
  return new Promise((resolve) => {
    nextStep = resolve;
    rl.setPrompt(' TM.', 3);
    rl.resume();
    rl.prompt([false]);
  });
}

function completer(line) {
  const TM = container.support('TM');
  const completions = methodsOfObject(TM);
  const hits = completions.filter((c) => {
    if (c.indexOf(line) === 0) {
      return c;
    }
    return null;
  });
  return [hits && hits.length ? hits : completions, line];
}

module.exports = pause;
