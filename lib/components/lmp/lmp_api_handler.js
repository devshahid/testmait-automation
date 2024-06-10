const { CommonUtils, TM, LoggerFactory, TestData } = inject();

const https = require('https');

const _ = require('lodash');
const axios = require('axios');

const logger = LoggerFactory.init();

/**
 * The Loan Marketplace (LMP) API execution handler
 *
 * @class
 */
class LmpApi {
  constructor() {
    /**
     * The axios instance used for handling the API requests
     *
     * @type {axios.AxiosInstance}
     */
    this.axios = axios.default.create({ httpsAgent: new https.Agent({ keepAlive: true }) });
  }

  /**
   * Sets the API request configuration
   */
  _setRequest() {
    // Generate credentials for HTTP basic access authentication
    let username = this.environmentData.username;
    let password = this.environmentData.password;

    // Encode the username:password string in Base64
    let basicAuthCredentials = Buffer.from(`${username}:${password}`).toString('base64');

    this.request = { ...this.commonData.request, ...this.endpointData.request };

    this.request.headers['Authorization'] = _.replace(
      this.request.headers['Authorization'],
      '{{ credentials }}',
      basicAuthCredentials,
    );
  }

  /**
   * Sets the expected API response
   */
  _setExpectedResponse() {
    this.expectedResponse = this.endpointData.response;
  }

  /**
   * Sets the API flow data
   *
   * @param {string} endpoint The endpoint to which the API request is sent to
   */
  async setFlow(endpoint) {
    this.endpointData = TestData.getData(`lmp.apTM.${endpoint}`);

    this._setRequest();
    this._setExpectedResponse();

    let msg = `Parsed request: ${CommonUtils.beautify(this.request)}`;
    logger.info(msg);
    await TM.report(msg);

    msg = `Parsed expected response: ${CommonUtils.beautify(this.expectedResponse)}`;
    await TM.report(msg);
    logger.info(msg);
  }

  /**
   * Gets the actual API response
   *
   * @returns {axios.AxiosResponse} The received API response
   */
  getActualResponse() {
    return this.actualResponse;
  }

  /**
   * Gets the expected API response
   *
   * @returns {axios.AxiosResponse} The expected API response
   */
  getExpectedResponse() {
    return this.expectedResponse;
  }

  /**
   * Executes an API flow with axios
   */
  async executeFlow() {
    let msg = `Sending request with config: ${CommonUtils.beautify(this.request)}`;
    logger.info(msg);
    await TM.report(msg);

    let axiosResponse;
    try {
      axiosResponse = await this.axios(this.request);
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
    logger.info(msg);
    await TM.report(msg);
  }

  /**
   * Resets the test data and API flows between test scenarios
   */
  resetFlow() {
    this.commonData = this.commonData || TestData.getData('lmp.apTM.common');
    this.environmentData = this.environmentData || TestData.getData('lmp.apTM.environment');

    this.endpointData = {};

    this.request = {};

    this.actualResponse = {};
    this.expectedResponse = {};
  }

  /**
   * Validates the received API response
   */
  async validateResponse() {
    await TM.report('Validating response');

    // Validate response status code
    await TM.assertEqual(
      _.toNumber(this.actualResponse.status),
      _.toNumber(this.expectedResponse.status),
      'The received response status code is incorrect',
    );

    // Validate response data
    await TM.assertTrue(
      _.isEqual(this.actualResponse.data, this.expectedResponse.data),
      `The received response data is incorrect, expected data: ${CommonUtils.beautify(
        this.expectedResponse.data,
      )} \n --- Actual data: --- \n ${CommonUtils.beautify(this.actualResponse.data)}`,
    );

    await TM.report('Response validated');
  }
}

module.exports = new LmpApi();
module.exports.LmpApi = LmpApi;
