const { CommonUtils, TM, TestData, LoggerFactory } = inject();
const logger = LoggerFactory.init();

const { Handlers } = require('./handlers.js');

class Table extends Handlers {
  /**
   * to fetch header and data from table
   *
   * @param {locator} table header locator
   * @param {locator} table data locator
   * @param {String} dynamic field value to store the values from UI
   */
  async fetchTableFromAllDataAlertAndStore(tableHeader, tableData, dataTableMaps) {
    let allDataTableMap = new Map();
    var headerElements = await TM.grabTextFrom(CommonUtils.identifyLocator(tableHeader));
    var dataElements = await TM.grabTextFrom(CommonUtils.identifyLocator(tableData));
    for (let index = 0; index < headerElements.length; index++) {
      allDataTableMap.set(headerElements[index], dataElements[index]);
    }
    TestData.setField(dataTableMaps, allDataTableMap);
    logger.debug('Result table map: ' + allDataTableMap);
  }
}

module.exports = new Table();
module.exports.Table = Table;
