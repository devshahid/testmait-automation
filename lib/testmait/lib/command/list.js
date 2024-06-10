const { getConfig, getTestRoot } = require('./utils');
const Testmait = require('../testmait');
const container = require('../container');
const { getParamsToString } = require('../parser');
const { methodsOfObject } = require('../utils');
const output = require('../output');

module.exports = function (path) {
  const testsPath = getTestRoot(path);
  const config = getConfig(testsPath);
  const testmait = new Testmait(config, {});
  testmait.init(testsPath);

  output.print('List of test actions: -- ');
  const helpers = container.helpers();
  const supportI = container.support('TM');
  const actions = [];
  for (const name in helpers) {
    const helper = helpers[name];
    methodsOfObject(helper).forEach((action) => {
      const params = getParamsToString(helper[action]);
      actions[action] = 1;
      output.print(` ${output.colors.grey(name)} TM.${output.colors.bold(action)}(${params})`);
    });
  }
  for (const name in supportI) {
    if (actions[name]) {
      continue;
    }
    const actor = supportI[name];
    const params = getParamsToString(actor);
    output.print(` TM.${output.colors.bold(name)}(${params})`);
  }
  output.print('PS: Actions are retrieved from enabled helpers. ');
  output.print('Implement custom actions in your helper classes.');
};
