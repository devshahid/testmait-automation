const Step = require('./step');
const { MetaStep } = require('./step');
const container = require('./container');
const { methodsOfObject } = require('./utils');
const recorder = require('./recorder');
const event = require('./event');
const store = require('./store');
const output = require('./output');

/**
 * @interface
 * @alias ActorStatic
 */
class Actor {
  /**
   * add print comment method`
   * @param {string} msg
   * @param {string} color
   * @return {Promise<any> | undefined}
   * @inner
   */
  say(msg, color = 'cyan') {
    return recorder.add(`say ${msg}`, () => {
      event.emit(event.step.comment, msg);
      output.say(msg, `${color}`);
    });
  }

  /**
   * @function
   * @param {*} opts
   * @return {this}
   * @inner
   */
  retry(opts) {
    if (opts === undefined) opts = 1;
    recorder.retry(opts);
    // remove retry once the step passed
    recorder.add(() => event.dispatcher.once(event.step.finished, () => recorder.retries.pop()));
    return this;
  }
}

/**
 * Fetches all methods from all enabled helpers,
 * and makes them available to use from I. object
 * Wraps helper methods into promises.
 * @ignore
 */
module.exports = function (obj = {}) {
  if (!store.actor) {
    store.actor = new Actor();
  }
  const actor = store.actor;

  const translation = container.translation();

  if (Object.keys(obj).length > 0) {
    Object.keys(obj).forEach((action) => {
      const actionAlias = translation.actionAliasFor(action);

      const currentMethod = obj[action];
      const ms = new MetaStep('I', action);
      if (translation.loaded) {
        ms.name = actionAlias;
        ms.actor = translation.I;
      }
      ms.setContext(actor);
      actor[action] = actor[actionAlias] = ms.run.bind(ms, currentMethod);
    });
  }

  const helpers = container.helpers();

  const supportedHelpers = Object.keys(helpers);
  let activeHelperName = supportedHelpers[0];
  // add methods from enabled helpers
  Object.keys(helpers)
    .map((key) => helpers[key])
    .forEach((helper) => {
      methodsOfObject(helper, 'Helper')
        .filter((method) => method !== 'constructor' && method[0] !== '_')
        .forEach((action) => {
          const actionAlias = translation.actionAliasFor(action);
          if (!actor[action]) {
            actor[action] = actor[actionAlias] = function () {
              const activeHelper = helpers[activeHelperName][action]
                ? helpers[activeHelperName]
                : helper;
              const step = new Step(activeHelper, action);
              if (translation.loaded) {
                step.name = actionAlias;
                step.actor = translation.I;
              }
              // add methods to promise chain
              return recordStep(step, Array.from(arguments));
            };
          }
        });
    });

  actor.switchHelper = (name) => {
    if (supportedHelpers.indexOf(name) === -1) {
      recorder.add(
        `${name} is not a valid helper name. Only the following helpers are supported: ${supportedHelpers.join(
          ',',
        )}`,
        () => output.say(`${name} is an invalid option`),
      );
      return;
    }
    //recorder.add(`Changing helper to ${name}`, () => output.say(`Using ${name}`));
    activeHelperName = name;
  };
  actor.say = (msg) => recorder.add(`say ${msg}`, () => output.say(msg));
  actor.retry = Actor.retry;

  return actor;
};

function recordStep(step, args) {
  step.status = 'queued';
  step.setArguments(args);

  // run async before step hooks
  event.emit(event.step.before, step);

  const task = `${step.name}: ${step.humanizeArgs()}`;
  let val;

  // run step inside promise
  recorder.add(task, () => {
    if (!step.startTime) {
      // step can be retries
      event.emit(event.step.started, step);
      step.startTime = Date.now();
    }
    return (val = step.run(...args));
  });

  event.emit(event.step.after, step);

  recorder.add('step passed', () => {
    step.endTime = Date.now();
    event.emit(event.step.passed, step, val);
    event.emit(event.step.finished, step);
  });

  recorder.catchWithoutStop((err) => {
    step.status = 'failed';
    step.endTime = Date.now();
    event.emit(event.step.failed, step);
    event.emit(event.step.finished, step);
    throw err;
  });

  recorder.add('return result', () => val);
  // run async after step hooks

  return recorder.promise();
}
