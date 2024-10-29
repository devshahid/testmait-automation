const { LoggerFactory, TM, TestData } = inject();

const assert = require('assert');
const { exec, execSync } = require('child_process');
const { extname, join } = require('path');

const _ = require('lodash');
const fs = require('fs-extra');
//const java = require('java');
const jsonMerge = require('json-merger');
const moment = require('moment');
const { v4: uuidv4 } = require('uuid');

const { globals } = require('../configs/core.js').config;

const logger = LoggerFactory.init();
const config = require('../testmait/lib').config.get();
/** The file path to the session key encrypter program */
const encrypterFp = './bin/encrypter-1.0.0-winamd64.exe';

class CommonUtils {
  constructor() {
    /** The randomly generated UUID without dashes, used in certain test cases */
    this.generatedUuidHex = uuidv4().replace(/-/g, '');
  }

  /**
   * Converts a value to a JSON string with indentation and line breaks for better readability
   *
   * @param {any} value The object or array to JSON stringify
   * @returns {string} The JSON string
   */
  beautify(value) {
    return JSON.stringify(value, null, 2);
  }

  /**
   * Encrypts the provided key with the given public key
   *
   * @param {string} key The key to be encrypted
   * @param {string} publicKey The public key used to encrypt the provided key
   * @returns {string} The encrypted key
   */
  encryptKey(key, publicKey) {
    logger.debug(`Encrypting key: ${key} with public key: ${publicKey}`);

    let cmdResult = execSync(`"${encrypterFp}" ${key} ${publicKey}`).toString().trim();
    logger.debug(cmdResult);

    // The stdout of the encrypter program prints "Encrypted API key: " and then the actual encrypted key
    return cmdResult.substring('Encrypted API key: '.length);
  }

  /**
   * Evaluates simple mathematical expressions
   *
   * @param {number} a The left side operand
   * @param {string} operator The operator
   * @param {number} b The right side operand
   * @returns {number} The result of the mathematical expression
   */
  async evaluate(a, operator, b) {
    let errorMsg = `Unexpected math operator: "${operator}"`;
    switch (operator) {
      case '+':
        return a + b;
      case '-':
        return a - b;
      case '*':
        return a * b;
      case '/':
        return a / b;
      default:
        logger.error(errorMsg);
        await TM.fail(errorMsg);
    }
  }

  loadLocatorsAndTestData() {
    let jsonFile = [];
    //let pageelementlocatorfiles = this.getFileFromDir('lib/locators', ['.json']);
    let pageelementlocatorfiles = this.getFileFromDir(globals.locatorDir, ['.json']);
    //let pageelementlocatorfiles = globals.locatorDir;
    for (let pages = 0; pages < pageelementlocatorfiles.length; pages++) {
      jsonFile[pages] = pageelementlocatorfiles[pages];
    }
    TestData.setField('LocatorList', jsonMerge.mergeFiles(jsonFile));

    let jsonFileData = [];

    //let testDataPath = join(globals.testDataDir, globals.testMarket, globals.testEnvironment);
    let testDataPath = globals.testDataDir;
    // logger.debug('test data directory is - ' + testDataPath);
    // console.log('path:' + testDataPath);
    if (typeof testDataPath !== 'undefined') {
      let testdatafiles = this.getFileFromDir(testDataPath, ['.json']);
      for (let datafile = 0; datafile < testdatafiles.length; datafile++) {
        jsonFileData[datafile] = testdatafiles[datafile];
      }
      TestData.setField('DataList', jsonMerge.mergeFiles(jsonFileData));
    } else {
      logger.info('Data file path does not exist');
    }
    global.explicitWait = this.identifyData('ExplicitWait.Seconds');
    global.helper = Object.keys(config.helpers)[0];
  }

  getFileFromDir(dir, fileTypes) {
    let filesToReturn = [];
    function walkDir(curPath) {
      let files = fs.readdirSync(curPath);
      for (let file in files) {
        let curFile = join(curPath, files[file]);
        if (fs.statSync(curFile).isFile() && fileTypes.indexOf(extname(curFile)) != -1) {
          filesToReturn.push(curFile);
        } else if (fs.statSync(curFile).isDirectory()) {
          walkDir(curFile);
        }
      }
    }
    walkDir(dir);
    return filesToReturn;
  }

  identifyLocator(locator) {
    if (typeof TestData.getLocator(locator) !== 'undefined') {
      return TestData.getLocator(locator);
    } else {
      return locator;
    }
  }

  identifyData(value) {
    if (typeof TestData.getField(value) !== 'undefined') {
      return TestData.getField(value);
    } else if (typeof TestData.getData(value) !== 'undefined') {
      return TestData.getData(value);
    } else {
      return value;
    }
  }

  async getDateInFormat(strSysDateTime) {
    let addSubHour, addSubMin;
    if (
      typeof TestData.getData('AddorSubHour') !== 'undefined' &&
      typeof TestData.getData('AddorSubMin') !== 'undefined'
    ) {
      addSubHour = TestData.getData('AddorSubHour');
      addSubMin = TestData.getData('AddorSubMin');
    } else {
      addSubHour = 0;
      addSubMin = 0;
    }
    var d = new Date();
    d.setHours(d.getHours() + parseInt(addSubHour));
    d.setMinutes(d.getMinutes() + parseInt(addSubMin));
    let dformat =
      [d.getMonth() + 1, d.getDate(), d.getFullYear()].join('-') +
      ' ' +
      [d.getHours(), d.getMinutes(), d.getSeconds()].join(':');
    TestData.setField(strSysDateTime, dformat);
  }

  async getModifiedDate(strDate, strModificationType, value, strModifiedDate) {
    if (typeof TestData.getField(strDate) !== 'undefined') {
      let d = new Date(TestData.getField(strDate));
      logger.debug('Date to be modified: ' + d);
      if (strModificationType === 'Add Hours') {
        d.setHours(d.getHours() + parseInt(value));
      } else if (strModificationType === 'Add Minutes') {
        d.setMinutes(d.getMinutes() + parseInt(value));
      } else if (strModificationType === 'Add Seconds') {
        d.setSeconds(d.getSeconds() + parseInt(value));
      }
      let dt = moment(d).format('DD-MM-yyyy HH:mm:ss');
      TestData.setField(strModifiedDate, dt);
      logger.debug('modified date : ' + dt);
    } else {
      throw new Error('Date variable not found');
    }
  }

  async compareFieldValuesWithList(locator, expectedData) {
    logger.debug('Locator value of field ' + this.identifyLocator(locator));
    var actualDropdownValues = await TM.grabTextFromAll(this.identifyLocator(locator));
    actualDropdownValues = actualDropdownValues.map((string) => string.trim());
    var expectedDataList = expectedData[0].split(',');
    expectedDataList = expectedDataList.map((string) => string.trim());
    assert.strictEqual(
      _.isEqual(actualDropdownValues, expectedDataList),
      true,
      'Dropdown values doesnt match',
    );
  }

  /**
   * Parses the table from a BDD test scenario step
   *
   * @param {object} table The TestMaiT table from the BDD step
   * @param {boolean} [regenerate=true] Indicates if a placeholder value should be replaced with a newly generated or the previously generated value
   * @returns {Promise<object>} The parsed object with the table's first element as key and second element as value
   */
  async parseTable(table, regenerate = true) {
    await this._validateTable(table);
    let parsedData = {};
    const table2D = table.parse().raw();
    for (const tableRow of table2D) {
      parsedData[tableRow[0]] = tableRow[1];
    }

    parsedData = await this.replacePlaceholderValues(parsedData, regenerate);
    await TM.report(`Parsed table: ${this.beautify(parsedData)}`);
    return parsedData;
  }

  /**
   * Replaces any placeholder values with the preset or generated values
   *
   * @param {object} data The current data of the API request/response in the axios config
   * @param {boolean} regenerate Flag to indicate the usage of a previously generated UUID
   */
  async replacePlaceholderValues(data, regenerate = true) {
    let modData = _.cloneDeep(data);

    for (let [key, value] of Object.entries(modData)) {
      // First capturing group ([\w\s]+) - any word and whitespace characters
      // Non capturing group (?: ...)? - one or zero occurence of the operator and the operand below
      // Second capturing group ([-+*/]) - the mathematical operator
      // Third capturing group (\d+) - the operand
      let match = /{{ ([\w\s]+)(?: ([-+*/]) (\d+))? }}/g.exec(value);
      if (match) {
        let presetKey = match[1];
        let operator = match[2];
        let secondOperand = match[3];
        switch (presetKey) {
          case 'uuid':
            this.generatedUuidHex = regenerate ? uuidv4().replace(/-/g, '') : this.generatedUuidHex;
            modData[key] = value.replace(
              new RegExp(_.escapeRegExp(`{{ ${presetKey} }}`), 'g'),
              this.generatedUuidHex,
            );
            break;
          default:
            // If a math expression is captured in the regexp, evaluate it then replace the placeholder value
            if (operator && secondOperand) {
              modData[key] = value.replace(
                new RegExp(_.escapeRegExp(`{{ ${presetKey} ${operator} ${secondOperand} }}`), 'g'),
                TestData.getData('preset')[presetKey],
              );
              modData[key] = await this.evaluate(
                _.toNumber(modData[key]),
                operator,
                _.toNumber(secondOperand),
              );
            }
            // Else just simply replace the placeholder value
            else {
              modData[key] = value.replace(
                new RegExp(_.escapeRegExp(`{{ ${presetKey} }}`), 'g'),
                TestData.getData('preset')[presetKey],
              );
            }
            break;
        }
      }
    }

    logger.debug(`Replaced placeholder values: ${this.beautify(modData)}`);
    return modData;
  }

  /**
   * Sleeps for the given time, use with async/await
   *
   * @param {number} milliseconds Time to sleep for in milliseconds
   * @returns {Promise} The promise which can be awaited to settle in the given time
   */
  sleep(milliseconds) {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
  }

  /**
   * Validate that a table is properly defined in a BDD test scenario step
   *
   * @param {object} table The TestMaiT table from the BDD step
   */
  async _validateTable(table) {
    if (table == null) {
      let errorMsg = 'No table provided in BDD step';
      logger.error(errorMsg);
      await TM.fail(errorMsg);
    }
  }

  async runBatchFile(fileName) {
    //runs the batch file based on the input - fileName
    if (fileName != '') {
      exec(fileName, (err, stdout) => {
        if (err) {
          logger.error(err);
          return;
        }
        logger.info('Result from batch' + stdout);
      });
    } else {
      logger.debug('filename is empty');
    }
  }
  async createDirectory(dirName, currentPath) {
    const dirPath = currentPath + '\\' + dirName;
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirName);
    } else {
      fs.readdirSync(dirPath).forEach(async (file) => {
        let curPath = dirPath + '\\' + file;
        if (!fs.lstatSync(curPath).isDirectory()) {
          await fs.unlinkSync(curPath);
        }
      });
    }
  }

  async deleteDirectory(dirPath) {
    if (fs.existsSync(dirPath) && fs.lstatSync(dirPath).isDirectory()) {
      fs.readdirSync(dirPath).forEach(async (file) => {
        let curPath = dirPath + '\\' + file;
        if (fs.lstatSync(curPath).isDirectory()) {
          await this.deleteDirectory(curPath);
        } else {
          await fs.unlinkSync(curPath);
        }
      });
      await fs.rmdirSync(dirPath);
    }
  }

  async generateRandomNumbers(outVar, randNum) {
    let value;
    if (randNum.includes('RAND')) {
      var arr = randNum.split('_');
      let len = arr[arr.length - 1];
      if (arr.length == 2) {
        value = Math.floor(
          Math.pow(10, len - 1) + Math.random() * (Math.pow(10, len) - Math.pow(10, len - 1) - 1),
        );
        value = value.toString();
      } else {
        value = Math.floor(
          Math.pow(10, len - 1) + Math.random() * (Math.pow(10, len) - Math.pow(10, len - 1) - 1),
        );
        value = arr[0] + value;
      }
    } else {
      value = this.identifyData(randNum);
    }
    TestData.setField(outVar, value);
    return value;
  }

  async generateRandomAlphabetString() {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let randomString = '';

    for (let i = 0; i < 4; i++) {
      const randomIndex = Math.floor(Math.random() * alphabet.length);
      randomString += alphabet.charAt(randomIndex);
    }

    return randomString;
  }

  generateRandomPassword() {
    const lowercaseChars = 'abcdefghijklmnopqrstuvwxyz';
    const uppercaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const digitChars = '0123456789';
    const specialChars = '@#$';

    const getRandomChar = (charSet) => charSet[Math.floor(Math.random() * charSet.length)];

    let password =
      getRandomChar(lowercaseChars) +
      getRandomChar(uppercaseChars) +
      getRandomChar(digitChars) +
      getRandomChar(specialChars);

    for (let i = password.length; i < 12; i++) {
      const allChars = lowercaseChars + uppercaseChars + digitChars + specialChars;
      password += getRandomChar(allChars);
    }
    return password;
  }

  formateDate(strDate, strFormat) {
    let addSubHour, addSubMin;
    if (
      typeof this.identifyData('AddorSubHour') !== 'undefined' &&
      typeof this.identifyData('AddorSubMin') !== 'undefined'
    ) {
      addSubHour = this.identifyData('AddorSubHour');
      addSubMin = this.identifyData('AddorSubMin');
    } else {
      addSubHour = 0;
      addSubMin = 0;
    }

    strDate.setHours(strDate.getHours() + parseInt(addSubHour));
    strDate.setMinutes(strDate.getMinutes() + parseInt(addSubMin));
    let formatedData;
    function pad2(n) {
      return n < 10 ? '0' + n : n;
    }
    switch (strFormat) {
      case 'yyyyMMddHHmmss':
        formatedData =
          strDate.getFullYear().toString() +
          pad2(strDate.getMonth() + 1) +
          pad2(strDate.getDate()) +
          pad2(strDate.getHours()) +
          pad2(strDate.getMinutes()) +
          pad2(strDate.getSeconds());
        break;
      default:
        formatedData =
          [strDate.getMonth() + 1, strDate.getDate(), strDate.getFullYear()].join('-') +
          ' ' +
          [strDate.getHours(), strDate.getMinutes(), strDate.getSeconds()].join(':');
    }

    return formatedData;
  }
  /**
   *
   * @param {Object} inputObj inputObj contains key value pair details like,path to jar and other dependency jars, method to invoke and dependent parameters
   * @param {string} parameter to be changed
   */
  // TODO - to remove java deps
  // executeMethodFromJAR(inputObj, inputVaue) {
  //   var dependencies = fs.readdirSync(inputObj.baseDir);
  //   for (let dependency of dependencies) java.classpath.push(inputObj.baseDir + '/' + dependency);
  //   var result = java.callStaticMethodSync(
  //     inputObj.className,
  //     inputObj.methodName,
  //     inputObj.param1,
  //     inputObj.param2,
  //     inputVaue,
  //   );
  //   logger.debug('Result from invoked method call from java class' + result);
  //   return result;
  // }

  convertToCamelCase = (tableFieldHeaders) => {
    function toCamelCase(str) {
      return (
        str
          // Remove special characters and split by space or newline or slash
          .replace(/[^a-zA-Z0-9\s]/g, '')
          .split(/\s+/)
          // Capitalize first letter of each word (except first) and join
          .map((word, index) =>
            index === 0
              ? word.toLowerCase()
              : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
          )
          .join('')
      );
    }

    return tableFieldHeaders
      .map((header) => toCamelCase(header))
      .filter((header) => header.toLowerCase() !== 'col' && !header.toLowerCase().includes('coll')) // Remove 'col'
      .map((header) => {
        // Rename specific fields
        if (header === 'baseColorType' || header === 'chassisColorType') return 'baseColor';
        if (header === 'notesVariations') return 'variations';
        return header;
      });
  };
}

module.exports = new CommonUtils();
