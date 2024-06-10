/**
 * Index file for loading TestMaiT programmatically.
 *
 * Includes Public API objects
 * @alias index
 * @namespace
 */
module.exports = {
  /** @type {typeof TestMaiT.Testmait} */
  testmait: require('./testmait'),
  /** @type {typeof TestMaiT.Testmait} */
  Testmait: require('./testmait'),
  /** @type {typeof TestMaiT.output} */
  output: require('./output'),
  /** @type {typeof TestMaiT.Container} */
  container: require('./container'),
  /** @type {typeof TestMaiT.event} */
  event: require('./event'),
  /** @type {TestMaiT.recorder} */
  recorder: require('./recorder'),
  /** @type {typeof TestMaiT.Config} */
  config: require('./config'),
  /** @type {TestMaiT.actor} */
  actor: require('./actor'),
  /** @type {typeof TestMaiT.Helper} */
  helper: require('./helper'),
  /** @type {typeof TestMaiT.Helper} */
  Helper: require('./helper'),
  /** @type {typeof TestMaiT.pause} */
  pause: require('./pause'),
  /** @type {typeof TestMaiT.within} */
  within: require('./within'),
  /**  @type {typeof TestMaiT.DataTable} */
  dataTable: require('./data/table'),
  /**  @type {typeof TestMaiT.DataTableArgument} */
  dataTableArgument: require('./data/dataTableArgument'),
  /** @type {typeof TestMaiT.store} */
  store: require('./store'),
  /** @type {typeof TestMaiT.Locator} */
  locator: require('./locator'),

  Workers: require('./workers'),
};
