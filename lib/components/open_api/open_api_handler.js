const { CommonUtils, Csv, TM, LoggerFactory, TestData } = inject();

const fs = require('fs');
const https = require('https');
const { join } = require('path');

const _ = require('lodash');
const axios = require('axios');

const { globals, rest } = require('../../configs/core.js').config;
const { context } = require('../../utils/context.js');

const logger = LoggerFactory.init();

/** The file path to the JSON file where the application session keys are stored */
const sessionFp = join(globals.outputDir, 'gaf_open_api_session_keys.json');
/** The file path to the JSON file where the cached (temporary) API flow data is stored */
const cachedApiFlowFp = join(globals.outputDir, 'gaf_open_api_cached_flow.json');
/** The file path to the JSON file where the saved (presistent) API flow data is stored */
const savedApiFlowFp = join(globals.outputDir, 'gaf_open_api_saved_responses.json');

/** The key in the test data for the API request */
const reqFlowKey = 'request';
/** The key in the test data for the sync API response */
const syncRespFlowKey = 'sync response';
/** The key in the test data for the async API response */
const asyncRespFlowKey = 'async response';
/** The key in the test data for the async Open API request */
const asyncOpenApiReqFlowKey = 'async openapi request';

/** CSV scenario column header for transaction recording */
const csvScenario = 'Scenario';
/** CSV API response code column header for transaction recording */
const csvRespCode = 'Open API Response Code';
/** CSV API response description column header for transaction recording */
const csvRespDesc = 'Open API Response Description';
/** CSV transaction ID column header for transaction recording */
const csvTransactionId = 'Transaction ID';
/** CSV API request data column header for transaction recording */
const csvReqData = 'Global Automation Framework API Request Data';
/** CSV column headers for transaction recording */
const csvHeaders = [csvScenario, csvRespCode, csvRespDesc, csvTransactionId, csvReqData];

/**
 * The Open API execution handler
 *
 * @class
 */
class OpenApi {
  constructor() {
    /** @type {boolean} Indicates if data is found for a given API flow side effect */
    this.sideEffectDataFound = false;

    /** @type {boolean} Indicates if an API flow has been cached recently */
    this.apiFlowCached = false;

    Csv.setHeaders(csvHeaders);
  }

  /**
   * Gets the initial API flow
   *
   * @param {object} scenarioConfig The scenario specific REST flow data
   * @param {(reqFlowKey|syncRespFlowKey|asyncRespFlowKey|asyncOpenApiReqFlowKey)} flowKey The key for the relevant flow data
   * @returns {object} The common API flow configuration object
   */
  getInitialFlow(scenarioConfig, flowKey) {
    let commonData = TestData.getData('common');

    // Include the common axios configuration
    let initialFlow = commonData[flowKey];

    // Include and/or possibly override with common scenario specific axios config
    let commonScenarioConfig = _.has(scenarioConfig, `common.${flowKey}`)
      ? scenarioConfig.common[flowKey]
      : {};
    initialFlow = _.has(commonScenarioConfig, '_override_')
      ? delete commonScenarioConfig['_override_'] && commonScenarioConfig
      : { ...initialFlow, ...commonScenarioConfig };

    logger.debug(`Created initial flow: ${CommonUtils.beautify(initialFlow)}`);
    return initialFlow;
  }

  /**
   * Gets the axios request configuration of the API flow
   *
   * @param {object} envData Environment data including the URL information of the Open API portal
   * @param {object} scenarioConfig The scenario specific REST flow data
   * @param {string} application The Open API application for which the request is sent to
   * @param {string} [sideEffect] The optional side effect to the scenario
   * @returns {Promise<object>} The built request object, which can be used directly as an axios configuration
   */
  async getFlowRequest(envData, scenarioConfig, application, sideEffect = '') {
    this.sideEffectDataFound = false;

    let request = this.getInitialFlow(scenarioConfig, reqFlowKey);
    request.url = this.getRequestUrl(envData, scenarioConfig);
    request.headers = this.getRequestHeaders(
      request.headers,
      scenarioConfig,
      await this.getBearerToken(application),
      sideEffect,
    );
    request.data = await this.getFlowData(request.data, scenarioConfig, reqFlowKey, sideEffect);
    request.params = await this.getRequestParams(request.params, scenarioConfig, sideEffect);

    if (sideEffect && !this.sideEffectDataFound) {
      let errorMsg = `Side effect is required, but no side effect specific request test data exists for "${sideEffect}"`;
      logger.error(errorMsg);
      await TM.fail(errorMsg);
    }

    logger.debug(`Created request flow config: ${CommonUtils.beautify(request)}`);
    return request;
  }

  /**
   * Gets the axios request configuration for the async listener/simulator
   *
   * @param {string} conversationId The original conversation ID for which we expect a request from the Open API portal
   * @returns {object} The built request object, which can be used directly as an axios configuration
   */
  getListenerRequest(conversationId) {
    let request = _.clone(TestData.getData('common')['async listener']);

    request.url += conversationId;
    return request;
  }

  /**
   * Gets the expected response of the API flow
   *
   * @param {object} scenarioConfig The scenario specific REST flow data
   * @param {(reqFlowKey|syncRespFlowKey|asyncRespFlowKey|asyncOpenApiReqFlowKey)} flowKey The key for the relevant flow data
   * @param {string} [sideEffect] The optional side effect to the scenario, e.g. 'invalid amount'
   * @returns {Promise<object>} The expected response of the API flow
   */
  async getFlowResponse(scenarioConfig, flowKey, sideEffect = '') {
    this.sideEffectDataFound = false;

    let response = this.getInitialFlow(scenarioConfig, flowKey);
    response.data = await this.getFlowData(response.data, scenarioConfig, flowKey, sideEffect);
    response.status = this.getStatusCode(response.status, scenarioConfig, flowKey, sideEffect);

    if (sideEffect && !this.sideEffectDataFound) {
      let errorMsg = `Side effect is required, but no side effect specific response test data exists for "${sideEffect}"`;
      logger.error(errorMsg);
      await TM.fail(errorMsg);
    }

    logger.debug(`Created response flow: ${CommonUtils.beautify(response)}`);
    return response;
  }

  /**
   * Get the bearer token used in the authorization header
   *
   * @param {string} application The application for which the bearer token is retrieved
   * @returns {Promise<string>} The bearer token
   */
  async getBearerToken(application) {
    let sessionKeyInfo = await this.getSessionKeyInfo();
    logger.debug(`Parsed session key info: ${CommonUtils.beautify(sessionKeyInfo)}`);
    let bearerToken = sessionKeyInfo[application].encryptedSessionKey;
    logger.debug(`Bearer token: ${bearerToken}`);
    return bearerToken;
  }

  /**
   * Gets the headers of the API request
   *
   * @param {object} headers The current headers of the API request in the axios config
   * @param {object} scenarioConfig The scenario specific REST flow data
   * @param {string} bearerToken The bearer token to be used in the Authorization header
   * @param {string} [sideEffect] The optional side effect to the scenario, e.g. 'invalid amount'
   * @returns {object} The full header object of the request
   */
  getRequestHeaders(headers, scenarioConfig, bearerToken, sideEffect = '') {
    let finalHeaders = _.cloneDeep(headers);

    // Include and/or possibly override with common scenario specific request headers
    let scenarioHeaders = _.has(scenarioConfig, `common.${reqFlowKey}.headers`)
      ? scenarioConfig.common[reqFlowKey].headers
      : {};
    finalHeaders = _.has(scenarioHeaders, '_override_')
      ? delete scenarioHeaders['_override_'] && scenarioHeaders
      : { ...finalHeaders, ...scenarioHeaders };

    if (sideEffect) {
      let commonData = TestData.getData('common');
      let commonSideEffectExists = _.has(commonData, `${sideEffect}.${reqFlowKey}.headers`);
      let scenarioSideEffectExists = _.has(scenarioConfig, `${sideEffect}.${reqFlowKey}.headers`);

      if (commonSideEffectExists || scenarioSideEffectExists) {
        this.sideEffectDataFound = true;
      }

      // Include and/or possibly override with any common side effect specific request headers
      let commonSideEffectHeaders = commonSideEffectExists
        ? commonData[sideEffect][reqFlowKey].headers
        : {};
      finalHeaders = _.has(commonSideEffectHeaders, '_override_')
        ? delete commonSideEffectHeaders['_override_'] && commonSideEffectHeaders
        : { ...finalHeaders, ...commonSideEffectHeaders };

      // Include and/or possibly override with any scenario side effect specific request headers
      let sideEffectHeaders = scenarioSideEffectExists
        ? scenarioConfig[sideEffect][reqFlowKey].headers
        : {};
      finalHeaders = _.has(sideEffectHeaders, '_override_')
        ? delete sideEffectHeaders['_override_'] && sideEffectHeaders
        : { ...finalHeaders, ...sideEffectHeaders };
    }

    // Possibly replace the placeholder bearer token with the actual bearer token
    finalHeaders['Authorization'] = finalHeaders['Authorization'].replace(
      '{{ bearerToken }}',
      bearerToken,
    );

    logger.debug(`Created request headers: ${CommonUtils.beautify(finalHeaders)}`);
    return finalHeaders;
  }

  /**
   * Gets the params of the API request
   *
   * @param {object} headers The current params of the API request in the axios config
   * @param {object} scenarioConfig The scenario specific REST flow data
   * @param {string} [sideEffect] The optional side effect to the scenario, e.g. 'invalid amount'
   * @returns {Promise<object>} The full params object of the request
   */
  async getRequestParams(params, scenarioConfig, sideEffect = '') {
    let finalParams = _.cloneDeep(params);

    // Include and/or possibly override with common scenario specific request headers
    let scenarioParams = _.has(scenarioConfig, `common.${reqFlowKey}.params`)
      ? scenarioConfig.common[reqFlowKey].params
      : {};
    finalParams = _.has(scenarioParams, '_override_')
      ? delete scenarioParams['_override_'] && scenarioParams
      : { ...finalParams, ...scenarioParams };

    if (sideEffect) {
      let commonData = TestData.getData('common');
      let commonSideEffectExists = _.has(commonData, `${sideEffect}.${reqFlowKey}.params`);
      let scenarioSideEffectExists = _.has(scenarioConfig, `${sideEffect}.${reqFlowKey}.params`);

      if (commonSideEffectExists || scenarioSideEffectExists) {
        this.sideEffectDataFound = true;
      }

      // Include and/or possibly override with any common side effect specific request params
      let commonSideEffectParams = commonSideEffectExists
        ? commonData[sideEffect][reqFlowKey].params
        : {};
      finalParams = _.has(commonSideEffectParams, '_override_')
        ? delete commonSideEffectParams['_override_'] && commonSideEffectParams
        : { ...finalParams, ...commonSideEffectParams };

      // Include and/or possibly override with any scenario side effect specific request params
      let sideEffectParams = scenarioSideEffectExists
        ? scenarioConfig[sideEffect][reqFlowKey].params
        : {};
      finalParams = _.has(sideEffectParams, '_override_')
        ? delete sideEffectParams['_override_'] && sideEffectParams
        : { ...finalParams, ...sideEffectParams };
    }

    finalParams = await CommonUtils.replacePlaceholderValues(finalParams);

    logger.debug(`Created request params: ${CommonUtils.beautify(finalParams)}`);
    return finalParams;
  }

  /**
   * Gets the full URL of the API request
   *
   * @param {object} envData Environment data including the URL information of the Open API portal
   * @param {object} scenarioConfig The scenario specific REST flow data
   * @returns {string} The full URL of the request
   */
  getRequestUrl(envData, scenarioConfig) {
    let url = scenarioConfig.common[reqFlowKey].url;
    if (/^https?:\/\//.test(url)) {
      return url;
    } else {
      let baseUrl = envData.baseUrl.replace('{{ environment }}', envData.urlConfig.environment);
      let baseEndpoint = envData.baseEndpoint
        .replace('{{ site }}', envData.urlConfig.site)
        .replace('{{ market }}', envData.urlConfig.market);
      url = `${baseUrl}/${baseEndpoint}/${url}/`;
    }

    logger.debug(`Created request URL: ${url}`);
    return url;
  }

  /**
   * Gets the expected status code
   *
   * @param {number} status The current status code in the axios config
   * @param {object} scenarioConfig The scenario specific REST flow data
   * @param {(reqFlowKey|syncRespFlowKey|asyncRespFlowKey|asyncOpenApiReqFlowKey)} flowKey The key for the relevant flow data
   * @param {string} [sideEffect] The optional side effect to the scenario, e.g. 'invalid amount'
   * @returns {number} The expected status code of the API flow
   */
  getStatusCode(status, scenarioConfig, flowKey, sideEffect = '') {
    let finalStatus = _.clone(status);

    let commonData = TestData.getData('common');

    if (sideEffect) {
      let commonSideEffectExists = _.has(commonData, `${sideEffect}.${flowKey}.status`);
      let scenarioSideEffectExists = _.has(scenarioConfig, `${sideEffect}.${flowKey}.status`);

      if (commonSideEffectExists || scenarioSideEffectExists) {
        this.sideEffectDataFound = true;
      }

      // Possibly override with any common side effect specific status
      finalStatus = commonSideEffectExists ? commonData[sideEffect][flowKey].status : finalStatus;
      // Possibly override with any scenario side effect specific status
      finalStatus = scenarioSideEffectExists
        ? scenarioConfig[sideEffect][flowKey].status
        : finalStatus;
    }

    logger.debug(`Created status code: ${finalStatus}`);
    return finalStatus;
  }

  /**
   * Gets the scenario specific data of the API request/response
   *
   * @param {object} data The current data of the API request/response in the axios config
   * @param {object} scenarioConfig The scenario specific REST flow data
   * @param {(reqFlowKey|syncRespFlowKey|asyncRespFlowKey|asyncOpenApiReqFlowKey)} flowKey The key for the relevant flow data
   * @param {string} [sideEffect] The optional side effect to the scenario, e.g. 'invalid amount'
   * @returns {Promise<object>} The full data/body object of the request/response
   */
  async getFlowData(data, scenarioConfig, flowKey, sideEffect = '') {
    let finalData = _.cloneDeep(data);

    // Include and/or possibly override with common scenario specific data
    let commonScenarioData = _.has(scenarioConfig, `common.${flowKey}.data`)
      ? scenarioConfig.common[flowKey].data
      : {};
    finalData = _.has(commonScenarioData, '_override_')
      ? delete commonScenarioData['_override_'] && commonScenarioData
      : { ...finalData, ...commonScenarioData };

    if (sideEffect) {
      let commonData = TestData.getData('common');
      let commonSideEffectExists = _.has(commonData, `${sideEffect}.${flowKey}.data`);
      let scenarioSideEffectExists = _.has(scenarioConfig, `${sideEffect}.${flowKey}.data`);

      if (commonSideEffectExists || scenarioSideEffectExists) {
        this.sideEffectDataFound = true;
      }

      // Include and/or possibly override with any common side effect specific data
      let commonSideEffectData = commonSideEffectExists ? commonData[sideEffect][flowKey].data : {};
      finalData = _.has(commonSideEffectData, '_override_')
        ? delete commonSideEffectData['_override_'] && commonSideEffectData
        : { ...finalData, ...commonSideEffectData };

      // Include and/or possibly override with any scenario side effect specific data
      let sideEffectData = scenarioSideEffectExists ? scenarioConfig[sideEffect][flowKey].data : {};
      finalData = _.has(sideEffectData, '_override_')
        ? delete sideEffectData['_override_'] && sideEffectData
        : { ...finalData, ...sideEffectData };
    }

    finalData = await CommonUtils.replacePlaceholderValues(finalData, flowKey === reqFlowKey);

    logger.debug(`Created flow data: ${CommonUtils.beautify(finalData)}`);
    return finalData;
  }

  /**
   * Gets the request config and the expected response for a synchronous API flow
   *
   * @param {string} flowType The specific REST flow to get the data for
   * @param {string} application The Open API application for which the request is sent to
   * @param {string} [sideEffect] The optional side effect to the scenario, e.g. 'invalid amount'
   * @returns {Promise<Array<object>>} The request configuration and the expected response object
   */
  async getSyncFlow(flowType, application, sideEffect = '') {
    let msg = `Creating sync flow data for ${flowType} flow using ${application} application`;
    msg = sideEffect ? `${msg} with ${sideEffect} side effect` : msg;
    logger.info(msg);
    await TM.report(msg);

    const { envData, scenarioConfig } = await this.getTestData(flowType);
    let request = await this.getFlowRequest(envData, scenarioConfig, application, sideEffect);
    let expSyncResponse = await this.getFlowResponse(scenarioConfig, syncRespFlowKey, sideEffect);

    msg = `Created sync flow request: ${CommonUtils.beautify(request)}`;
    logger.info(msg);
    await TM.report(msg);

    msg = `Created sync flow expected response: ${CommonUtils.beautify(expSyncResponse)}`;
    logger.info(msg);
    await TM.report(msg);

    return [request, expSyncResponse];
  }

  /**
   * Gets the request config, the expected response and the expected Open API async request for an asynchronous API flow
   *
   * @param {string} flowType The specific REST flow to get the data for
   * @param {string} application The Open API application for which the request is sent to
   * @param {string} [sideEffect] The optional side effect to the scenario, e.g. 'invalid amount'
   * @returns {Promise<Array<object>>} The request configuration and the expected response and Open API request object
   */
  async getAsyncFlow(flowType, application, sideEffect = '') {
    let msg = `Creating async flow data for ${flowType} flow using ${application} application`;
    msg = sideEffect ? `${msg} with ${sideEffect} side effect` : msg;
    logger.info(msg);
    await TM.report(msg);

    const { envData, scenarioConfig } = await this.getTestData(flowType);
    let request = await this.getFlowRequest(envData, scenarioConfig, application, sideEffect);
    let expAsyncResponse = await this.getFlowResponse(scenarioConfig, asyncRespFlowKey, sideEffect);

    // If the request to the Open API portal fails with a client error, then
    // the portal will not send a request to the async listener/simulator, the
    // transaction will fail straight away, so the listener does not need to be polled
    let expOpenApiRequest = !_.inRange(expAsyncResponse.status, 400, 500)
      ? await this.getFlowResponse(scenarioConfig, asyncOpenApiReqFlowKey, sideEffect)
      : {};

    msg = `Created async flow request: ${CommonUtils.beautify(request)}`;
    logger.info(msg);
    await TM.report(msg);

    msg = `Created async flow expected response: ${CommonUtils.beautify(expAsyncResponse)}`;
    logger.info(msg);
    await TM.report(msg);

    msg = `Created async flow expected Open API request: ${CommonUtils.beautify(
      expOpenApiRequest,
    )}`;
    logger.info(msg);
    await TM.report(msg);

    return [request, expAsyncResponse, expOpenApiRequest];
  }

  /**
   * Generates an enrypted session key for the given Open API application
   *
   * @param {string} application The application for which the key is going to be generated
   * @param {boolean} [store] Optional flag to store the generated session key in a file, true by default
   */
  async generateSessionKey(application, store = true) {
    logger.debug(`Generating session key for ${application} application`);
    const { appData, envData, scenarioConfig } = await this.getTestData('generate session key');

    let request = this.getInitialFlow(scenarioConfig, reqFlowKey);
    request.url = this.getRequestUrl(envData, scenarioConfig);

    // Use the encrypted API key of the given application as the bearer token
    request.headers = this.getRequestHeaders(
      request.headers,
      scenarioConfig,
      CommonUtils.encryptKey(appData[application].apiKey, envData.publicKey),
    );

    let expResponse = await this.getFlowResponse(scenarioConfig, syncRespFlowKey);

    let response = await this.sendRequest(request, false);

    // Response code should indicate success, and the response data should contain the session ID
    if (
      !Object.prototype.hasOwnProperty.call(response.data, 'output_SessionID') ||
      _.toNumber(expResponse.status) !== _.toNumber(response.status)
    ) {
      let errorMsg = `Session key generation unsuccessful, response data: ${CommonUtils.beautify(
        response.data,
      )}`;
      logger.error(errorMsg);
      await TM.fail(errorMsg);
    }

    let sessionKey = response.data['output_SessionID'];

    if (store) {
      await this.storeEncryptedSessionKey(
        application,
        appData[application].apiKey,
        CommonUtils.encryptKey(sessionKey, envData.publicKey),
      );
    }

    logger.debug(`Session key for ${application} application generated`);
  }

  /**
   * Stores the encrypted session key in a file
   *
   * @param {string} application The application the session key belongs to
   * @param {string} apiKey The unencrypted API key for the given application
   * @param {string} encryptedKey The encrypted session key
   * @param {number} [sessionKeyLifetimeHours] Optional lifetime of the session key in hours, default is 24
   */
  async storeEncryptedSessionKey(application, apiKey, encryptedKey, sessionKeyLifetimeHours = 24) {
    let sessionKeyInfo = await this.getSessionKeyInfo();

    // Set the session key and API key properties for the encrypted key
    sessionKeyInfo[application] = {};
    sessionKeyInfo[application].apiKey = apiKey;
    sessionKeyInfo[application].encryptedSessionKey = encryptedKey;

    // Calculate the session key lifetime in UTC
    let expiresAt = new Date();
    expiresAt.setUTCHours(expiresAt.getUTCHours() + sessionKeyLifetimeHours);
    sessionKeyInfo[application].expiresAt = expiresAt;

    // Write the updated session key information back to the file
    let contentToWrite = CommonUtils.beautify(sessionKeyInfo) + '\n';
    fs.writeFileSync(sessionFp, contentToWrite);
    logger.debug(
      `Stored a session key expiring at ${expiresAt} for ${application} application: ${encryptedKey}`,
    );
  }

  /**
   * Gets the stored session key information from a file
   *
   * @returns {Promise<object>} The session key information object
   */
  async getSessionKeyInfo() {
    return this._getFileContent(sessionFp);
  }

  /**
   * Gets the list of applications which do not have a valid session key stored
   *
   * @param {object} appData The test data for the different Open API applications
   * @param {object} sessionKeyInfo The session key information object
   * @returns {Array<string>} The list applications where the session key is invalid
   */
  getInvalidSessionKeyApps(appData, sessionKeyInfo) {
    let invalidSessionKeys = [];

    for (let application of Object.keys(appData)) {
      if (!this.isSessionKeyValid(application, appData[application].apiKey, sessionKeyInfo)) {
        invalidSessionKeys.push(application);
      }
    }

    logger.debug(
      Array.isArray(invalidSessionKeys) && invalidSessionKeys.length
        ? `Invalid session keys: ${CommonUtils.beautify(invalidSessionKeys)}`
        : 'No invalid session keys found',
    );
    return invalidSessionKeys;
  }

  /**
   * Determines the validity of the session key for the given Open API application
   *
   * @param {string} application The Open API application the key belongs to
   * @param {string} apiKey The unencrypted API key for the given application
   * @param {object} sessionKeyInfo The session key information object
   * @param {number} timeAllowanceMilli Time the key still needs to be valid for in milliseconds, default 2 hours
   * @returns {boolean} True if the key is considered valid, false otherwise
   */
  isSessionKeyValid(application, apiKey, sessionKeyInfo, timeAllowanceMilli = 2 * 60 * 60 * 1000) {
    let isKeyValid = false;

    // Key is valid if the session key for the application exists, the
    // unencrypted API key matches and there is enough time until it expires
    if (sessionKeyInfo[application] == null) {
      isKeyValid = false;
    } else if (
      sessionKeyInfo[application].apiKey === apiKey &&
      sessionKeyInfo[application].encryptedSessionKey &&
      new Date(sessionKeyInfo[application].expiresAt) - timeAllowanceMilli > new Date()
    ) {
      isKeyValid = true;
    }
    return isKeyValid;
  }

  /**
   * Sends a request with axios
   *
   * @param {object} config The configuration of the axios request
   * @returns {Promise<object>} The received axios response object
   */
  async sendRequest(config, recordingAllowed = true) {
    let msg = `Sending request with config: ${CommonUtils.beautify(config)}`;
    logger.info(msg);
    await TM.report(msg);

    // Add client certificate to the API request if mutual TLS authentication is configured
    if (rest.tls.maEnabled) {
      try {
        config.httpsAgent = new https.Agent({
          keepAlive: true,
          cert: fs.readFileSync(rest.tls.clientCertPub),
          key: fs.readFileSync(rest.tls.clientCertPriv),
        });
      } catch (error) {
        let errorMsg = `An error occured while providing the client certificate - ${error}`;
        logger.error(errorMsg);
        await TM.fail(errorMsg);
      }
    } else {
      config.httpsAgent = new https.Agent({ keepAlive: true });
    }

    let axiosResponse;
    try {
      axiosResponse = await axios(config);
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

    let response = {};
    response.data = axiosResponse.data;
    response.status = axiosResponse.status;

    if (rest.recordTransactions.enabled && recordingAllowed) {
      let workSheetData = {};
      workSheetData[csvScenario] = context.scenario.title;
      workSheetData[csvReqData] = JSON.stringify(config.data);
      workSheetData[csvRespCode] = response.data['output_ResponseCode'];
      workSheetData[csvRespDesc] = response.data['output_ResponseDesc'];
      workSheetData[csvTransactionId] = response.data['output_TransactionID'];
      Csv.addTransactions([workSheetData]);
    }

    msg = `Received response: ${CommonUtils.beautify(response)}`;
    logger.info(msg);
    await TM.report(msg);

    return response;
  }

  /**
   * Polls the async listener/simulator until the Open API async request arrives
   *
   * @param {object} config The configuration of the axios request to poll the listener with
   * @param {string} conversationId The conversation ID which needs to be polled from the listener
   * @returns {Promise<object>} The received axios response object
   */
  async pollListenerForOpenApiAsyncRequest(config, conversationId) {
    logger.debug(`Polling listener with config: ${CommonUtils.beautify(config)}`);

    let axiosResponse;
    // Try to poll the listener/simulator 15 times, every 5 seconds until the conversation ID is found
    for (let i = 0; i < 15; i++) {
      try {
        axiosResponse = await axios(config);
      } catch (error) {
        axiosResponse = error.response;
      }
      // Stop polling if the response contains the original conversation ID, meaning
      // that the Open API portal sent the async request to the listener/simulator
      if (axiosResponse.data['input_OriginalConversationID'] === conversationId) {
        logger.debug(`Original conversation ID found: ${conversationId}`);
        break;
      }
      // Fail if the expected request did not arrive to the listener/simulator
      if (i === 14) {
        logger.debug(
          `Last response status received: ${CommonUtils.beautify(axiosResponse.status)}`,
        );
        logger.debug(`Last response data received: ${CommonUtils.beautify(axiosResponse.data)}`);
        let errorMsg = 'The async request from the Open API portal did not arrive in time';
        logger.error(errorMsg);
        await TM.fail(errorMsg);
      }
      // Wait 5 seconds before polling again
      await CommonUtils.sleep(5 * 1000);
    }

    let response = {};
    response.data = axiosResponse.data;
    response.status = axiosResponse.status;

    let msg = `Received response from the async listener: ${CommonUtils.beautify(response)}`;
    logger.debug(msg);
    await TM.report(msg);

    return response;
  }

  /**
   * Builds a JSON string from the given API flow to be stored in a file
   *
   * @param {axios.AxiosRequestConfig} request The axios request configuration of the API flow
   * @param {axios.AxiosResponse} actualResponse The received API response of the flow
   * @param {axios.AxiosResponse} actualOpenApiRequest The Open API request received by the async listener/simulator
   * @returns {string} The API flow to be cached/saved
   */
  _buildApiFlowFileContent(request, actualResponse, actualOpenApiRequest) {
    // Build file content
    let fileContent = {};
    fileContent.feature = context.feature.title;
    fileContent.scenario = context.scenario.title;
    fileContent.storedAt = new Date();
    fileContent.testEnvironment = globals.testEnvironment;
    fileContent.testMarket = globals.testMarket;

    fileContent[reqFlowKey] = {};
    fileContent[reqFlowKey].headers = request.headers;
    fileContent[reqFlowKey].url = request.url;
    fileContent[reqFlowKey].method = request.method;
    fileContent[reqFlowKey].data = request.data;

    if (actualOpenApiRequest === undefined) {
      fileContent[syncRespFlowKey] = actualResponse;
    } else {
      fileContent[asyncRespFlowKey] = actualResponse;
      fileContent[asyncOpenApiReqFlowKey] = actualOpenApiRequest;
    }

    return CommonUtils.beautify(fileContent) + '\n';
  }

  /**
   * Gets the content of the given file as a JSON object
   *
   * @param {string} filePath The path to the file
   * @returns {object} The parsed JSON object
   */
  _getFileContent(filePath) {
    let fileContent;

    // Parse the file content, return empty object if file doesn't exist or there is a parsing error
    try {
      fileContent = JSON.parse(fs.readFileSync(filePath));
    } catch {
      fileContent = {};
    }

    return fileContent;
  }

  /**
   * Deletes the API flow cache file
   */
  deleteCachedApiFlow() {
    if (this.apiFlowCached && fs.existsSync(cachedApiFlowFp)) {
      fs.unlinkSync(cachedApiFlowFp);
    }

    this.apiFlowCached = false;
  }

  /**
   * Caches the given API flow in a file
   *
   * @param {axios.AxiosRequestConfig} request The axios request configuration of the API flow
   * @param {axios.AxiosResponse} actualResponse The received API response of the flow
   * @param {axios.AxiosResponse} actualOpenApiRequest The Open API request received by the async listener/simulator
   */
  cacheApiFlow(request, actualResponse, actualOpenApiRequest) {
    let fileContent = this._buildApiFlowFileContent(request, actualResponse, actualOpenApiRequest);

    fs.writeFileSync(cachedApiFlowFp, fileContent);

    // Setting this flag to true will allow the loader plugin to delete the cache at the end of the test scenario
    this.apiFlowCached = true;

    logger.debug(`API flow cached in "${cachedApiFlowFp}": ${fileContent}`);
  }

  /**
   * Gets a field from the temporary API flow cache
   *
   * @param {(syncRespFlowKey|asyncOpenApiReqFlowKey)} cacheSection The key for the relevant section of the cached API flow
   * @param {object} parsedTable The parsed BDD step table object with the table's first element as key and second element as value
   * @returns {Promise<object>} The required modification object from the cache
   */
  async getInfoFromApiFlowCache(cacheSection, parsedTable) {
    let fileContent = this._getFileContent(cachedApiFlowFp);

    let info = {};

    for (let [configFieldKey, cacheFieldKey] of Object.entries(parsedTable)) {
      let value = fileContent[cacheSection].data[cacheFieldKey];

      if (value === undefined) {
        let errorMsg = `Data not found in cache for "${cacheSection}" with key: "${cacheFieldKey}"`;
        logger.error(errorMsg);
        await TM.fail(errorMsg);
      }

      info[configFieldKey] = value;
    }

    return info;
  }

  /**
   * Store the given API flow with the given name in a file
   *
   * @param {string} transactionName The name of the API transaction
   * @param {axios.AxiosRequestConfig} request The axios request configuration of the API flow
   * @param {axios.AxiosResponse} actualResponse The received API response of the flow
   * @param {axios.AxiosResponse} actualOpenApiRequest The Open API request received by the async listener/simulator
   */
  storeApiFlows(transactionName, request, actualResponse, actualOpenApiRequest) {
    let transactionData = this._buildApiFlowFileContent(
      request,
      actualResponse,
      actualOpenApiRequest,
    );

    let fileContent = this._getFileContent(savedApiFlowFp);

    if (actualOpenApiRequest === undefined) {
      fileContent[`${transactionName} sync`] = JSON.parse(transactionData);
    } else {
      fileContent[`${transactionName} async`] = JSON.parse(transactionData);
    }

    fs.writeFileSync(savedApiFlowFp, CommonUtils.beautify(fileContent) + '\n');
    logger.debug(`Transaction saved in "${savedApiFlowFp}": ${transactionData}`);
  }

  /**
   * Gets a field for the given transaction from the stored persistent API flows
   *
   * @param {(syncRespFlowKey|asyncOpenApiReqFlowKey)} storeSection The key for the relevant section of the stored API flow
   * @param {object} parsedTable The parsed BDD step table object with the table's first element as key and second element as value
   * @param {string} transactionName The name of the relevant transaction in the stored API flows
   * @returns {Promise<object>} The required modification object from the stored API flows
   */
  async getInfoFromApiFlowStore(storeSection, parsedTable, transactionName) {
    let fileContent = this._getFileContent(savedApiFlowFp);

    let info = {};

    /** @type {('sync'|'async')} Async and sync transaction names are automatically postfixed in API flows file */
    let postfix = storeSection.startsWith('sync') ? ' sync' : ' async';

    for (let [configFieldKey, storeFieldKey] of Object.entries(parsedTable)) {
      let value = fileContent[transactionName + postfix][storeSection].data[storeFieldKey];

      if (value === undefined) {
        let errorMsg = `Data not found in store for "${storeSection}" section with key: "${storeFieldKey}"`;
        logger.error(errorMsg);
        await TM.fail(errorMsg);
      }

      info[configFieldKey] = value;
    }

    return info;
  }

  /**
   * Gets all the test data for a certain type of REST flow
   *
   * @param {string} flowType The specific REST flow to get the data for
   * @returns {Promise<object>} The Open API application, environment and flow related test data
   */
  async getTestData(flowType) {
    let appData = TestData.getData('applications');
    let envData = TestData.getData('environment');
    let scenarioConfig = TestData.getData(flowType);

    if (appData === undefined || envData === undefined) {
      let errorMsg = `Application or environment data undefined for: "${globals.testMarket}/${globals.testEnvironment}"`;
      logger.error(errorMsg);
      await TM.fail(errorMsg);
    }

    return { appData: appData, envData: envData, scenarioConfig: scenarioConfig };
  }

  /**
   * Validates the API response
   *
   * @param {axios.AxiosResponse} actualResponse The actual API response
   * @param {axios.AxiosResponse} expectedResponse The expected API response
   * @param {boolean} [strict=true] If false, extra data fields in the response do not cause failures
   */
  async validateResponse(actualResponse, expectedResponse, strict = true) {
    await TM.report('Validating response');

    // Validate response status code
    await TM.assertEqual(
      _.toNumber(actualResponse.status),
      _.toNumber(expectedResponse.status),
      'The received response status code is incorrect',
    );

    // Validate response data fields
    if (strict === true) {
      await TM.assertDeepEqual(
        Object.keys(actualResponse.data).sort(),
        Object.keys(expectedResponse.data).sort(),
        'The received response data fields are incorrect',
      );
    } else {
      await TM.assertTrue(
        Object.keys(expectedResponse.data).every(
          (key) => Object.keys(actualResponse.data).indexOf(key) > -1,
        ),
        'Not every data field was found',
      );
    }

    await TM.report(
      'Response data fields validated, ignoring keys where the value can be anything',
    );

    // Keys already verified at this point, deleting all fields from the
    // expected response object where we are not interested in the value
    // to verify the rest against the actual response data
    Object.keys(expectedResponse.data).forEach(
      (key) =>
        !expectedResponse.data[key] &&
        expectedResponse.data[key] !== undefined &&
        delete expectedResponse.data[key],
    );
    await TM.assertContain(
      actualResponse.data,
      expectedResponse.data,
      'The received response data field values are incorrect',
    );
    await TM.report('Response validated');
  }
}

module.exports = new OpenApi();
module.exports.OpenApi = OpenApi;

module.exports.flowKeys = {
  /** @type {reqFlowKey} The key in the test data for the API request */
  reqFlowKey: reqFlowKey,
  /** @type {syncRespFlowKey} The key in the test data for the sync API response */
  syncRespFlowKey: syncRespFlowKey,
  /** @type {asyncRespFlowKey} The key in the test data for the async API response */
  asyncRespFlowKey: asyncRespFlowKey,
  /** @type {asyncOpenApiReqFlowKey} The key in the test data for the async Open API request */
  asyncOpenApiReqFlowKey: asyncOpenApiReqFlowKey,
};
