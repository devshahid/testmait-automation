const { CommonUtils, LoggerFactory } = inject();

const { resolve } = require('path');

const xlsx = require('xlsx');

const { globals } = require('../configs/core.js').config;

const logger = LoggerFactory.init();

class Csv {
  constructor() {
    this.filename = resolve(
      `${globals.outputDir}/gaf_transactions_${new Date().toISOString().replace(/[:-]/g, '_')}.csv`,
    );
    this.headers = [];
    this.workBook = null;
    this.workSheet = null;
  }

  setHeaders(headers) {
    this.headers = headers;
  }

  getWorkBook() {
    try {
      this.workBook = xlsx.readFile(this.filename);
      this.workSheet = this.workBook.Sheets[this.workBook.SheetNames[0]];
      logger.debug(`CSV file opened: ${this.filename}`);
    } catch {
      this.workBook = xlsx.utils.book_new();
      this.workBook.SheetNames.push('1');
      this.workSheet = xlsx.utils.json_to_sheet([], { header: this.headers });
      this.workBook.Sheets[this.workBook.SheetNames[0]] = this.workSheet;
      xlsx.writeFile(this.workBook, this.filename, { bookType: 'csv' });
      logger.debug(`CSV file created: ${this.filename}`);
    }
  }

  /**
   *
   * @param {object} workSheetData
   */
  addTransactions(workSheetData) {
    this.getWorkBook();
    xlsx.utils.sheet_add_json(this.workSheet, workSheetData, {
      origin: -1,
      header: this.headers,
      skipHeader: true,
    });
    xlsx.writeFile(this.workBook, this.filename);
    logger.debug(`Transaction added to CSV file: ${CommonUtils.beautify(workSheetData)}`);
  }
}

module.exports = new Csv();
module.exports.Csv = Csv;
