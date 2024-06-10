const { isFunction, isAsyncFunction } = require('./utils');
const output = require('./output');

module.exports = async function (hook, stage) {
  if (!hook) return;
  if (!isFunction(hook)) {
    throw new Error(
      'TestMaiT 3 allows bootstrap/teardown hooks only as async functions. More info:',
    );
  }

  if (stage) output.log(`started ${stage} hook`);
  if (isAsyncFunction(hook)) {
    await hook();
  } else {
    hook();
  }
  if (stage) output.log(`finished ${stage} hook`);
};
