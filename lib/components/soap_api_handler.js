const { TM, LoggerFactory, CommonUtils } = inject();
const { globals } = require('../configs/core.js').config;

const https = require('https');

const axios = require('axios');
const fs = require('fs-extra');
const _ = require('lodash');

const { join } = require('path');

const logger = LoggerFactory.init();

/**
 * The Soap API execution handler
 * @class
 */
class SoapApi {
  constructor() {
    /**
     * The axios instance used for handling the API requests
     *
     * @type {axios.AxiosInstance}
     */
    this.axios = axios.default.create({ httpsAgent: new https.Agent({ keepAlive: true }) });
    this.actualResponse = {};
    this.expectedResponse = {};
  }

  /**
   * method renders generic api keys into request xml which are in {{}}
   * @param {string} reqName xml name to which SOAP action or method to execute
   * @param {Object} apiKeys Object contains which api keys should be rendered in xml, picked from testdata or property files
   * @param {string} projCode root node value to point project soap api data in test data files
   */
  renderApiKeys(reqName, apiKeys, projCode) {
    let activateCustReq = fs.readFileSync(
      join(globals.testDataDir, globals.testMarket, globals.testEnvironment, reqName + '.xml'),
      {
        encoding: 'utf-8',
      },
    );
    for (const apiKey of apiKeys) {
      if (typeof activateCustReq != 'undefined' && activateCustReq.includes(apiKey)) {
        activateCustReq = activateCustReq.replace(
          new RegExp(_.escapeRegExp(`{{ ${apiKey} }}`), 'g'),
          CommonUtils.identifyData(projCode + '.apTM.' + apiKey),
        );
      }
    }
    let headers = CommonUtils.identifyData(projCode + '.common.request.headers');
    let baseUrl = CommonUtils.identifyData(projCode + '.common.request.baseURL');
    let method = CommonUtils.identifyData(projCode + '.common.request.method');
    this.getResultsUrl = CommonUtils.identifyData(projCode + '.apTM.getResultsURL');
    this.getResultMethod = CommonUtils.identifyData(projCode + '.apTM.getResultMethod');

    this.request = { activateCustReq, headers, baseUrl, method };
  }

  /**
   *method renders specific input data into request xml which are in {{}}
   * @param {Object} inputDataObj Object contains which input data specific to this request and api encrypted field values
   * inputDataObj ceated just before calling callAPI method
   */
  renderInputData(inputDataObj) {
    let tempActivateCustReq = this.request.activateCustReq;
    for (var key in inputDataObj) {
      if (typeof tempActivateCustReq != 'undefined' && tempActivateCustReq.includes(key)) {
        tempActivateCustReq = tempActivateCustReq.replace(
          new RegExp(_.escapeRegExp(`{{ ${key} }}`), 'g'),
          inputDataObj[key],
        );
      }
    }
    this.request.activateCustReq = tempActivateCustReq;
  }

  /**
   * Sets the API request configuration
   */
  _setRequest() {
    this.request = {
      method: this.request.method,
      url: this.request.baseUrl,
      headers: this.request.headers,
      data: this.request.activateCustReq,
    };
    logger.debug('API request : ' + this.request);
  }

  /**
   * Sets the expected API response
   */
  _setExpectedResponse(projCode) {
    this.expectedResponse = CommonUtils.identifyData(projCode + '.common.response');
  }

  /**
   * method to handle soap request execution flow and handle response
   * @param {string} reqName xml name to which SOAP action or method to execute
   * @param {Object} apiKeys Object contains which api keys should be rendered in xml, picked from testdata or property files
   * @param {Object} inputDataObj Object contains which input data specific to this request and api encrypted field values
   * @param {string} projCode root node value to point project soap api data in test data files
   */
  async callApi(reqName, apiKeys, inputDataObj, projCode) {
    this.renderApiKeys(reqName, apiKeys, projCode);
    this.renderInputData(inputDataObj);
    this._setRequest();
    this._setExpectedResponse(projCode);
    await this.sendApiReq();
    this.getConversationID();
    await this.validateResponse('responseDesc');
    //Reset request for GetResult Http Request
    this.resetRequest();
    this._setRequest();
    //call apI to getResults with converstaion ID
    logger.info('Waiting before sending request to GetResult Request');
    await TM.wait(30);
    await this.sendApiReq();
    await this.validateResponse('finalResponseDesc');
  }

  /**
   * Reset the request object
   */
  resetRequest() {
    let tempHeaders = this.request.headers;
    this.request = {};
    this.request.method = this.getResultMethod;
    this.request.baseUrl = this.getResultsUrl + this.conversationID;
    this.request.headers = tempHeaders;
    this.request.activateCustReq = {};
  }

  /**
   * reset response actual Object
   */
  resetResponse() {
    this.actualResponse = {};
  }

  /**
   * Executes an API flow with axios
   */
  async sendApiReq() {
    let msg = `Sending request with config: ${CommonUtils.beautify(this.request)}`;
    logger.info(msg);
    let axiosResponse;

    try {
      axiosResponse = await axios(this.request);
    } catch (error) {
      // Axios raises an error if the response status code is not 2xx, which is acceptable in most cases
      if (error.response) {
        axiosResponse = error.response;
      }
      // Otherwise, there might be a legitimate error happening while sending the request
      else {
        let errorMsg = `An error occured while trying to send API request - ${error}`;
        logger.error(errorMsg);
        await TM.fail(errorMsg);
      }
    }
    this.actualResponse.data = axiosResponse.data;
    this.actualResponse.status = axiosResponse.status;

    msg = `Received response: ${CommonUtils.beautify(this.actualResponse)}`;
    logger.info(axiosResponse);
  }

  getConversationID() {
    let actualResData = this.actualResponse.data;
    var match = actualResData.split('<res:ConversationID>')[1].split('</res:ConversationID>');
    logger.info('Coversation ID from response : ' + match[0]);
    this.conversationID = match[0];
  }

  /**
   * Validates the received API response
   */
  async validateResponse(verifyValue) {
    let actualResStatus = this.actualResponse.status;
    let expectedResStatus = this.expectedResponse.status;
    // Validate response status code
    if (actualResStatus == expectedResStatus) {
      TM.report(
        `Expected status code: ${CommonUtils.beautify(
          expectedResStatus,
        )} // Actual status code: ${CommonUtils.beautify(actualResStatus)}`,
      );
    } else {
      await TM.fail('Received unexpected Status code ' + actualResStatus);
    }

    let valActualData = this.actualResponse.data;
    let valExpData = this.expectedResponse.data[verifyValue];

    if (typeof valExpData != 'undefined' && valExpData !== null) {
      // Validate response data
      if (valActualData.includes(valExpData)) {
        TM.report(
          `Expected data: ${CommonUtils.beautify(
            valExpData,
          )} \n --- Actual data: --- \n ${CommonUtils.beautify(valActualData)}`,
        );
      } else {
        await TM.fail('Response description not includes ' + valExpData);
      }
    } else {
      await TM.report('Expected Data not provided');
    }
    await TM.report('Response validated');
  }
}

module.exports = new SoapApi();
module.exports.SoapApi = SoapApi;
