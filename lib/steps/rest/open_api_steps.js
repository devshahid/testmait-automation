const { CommonUtils, TM, OpenApi } = inject();

const _ = require('lodash');

const { flowKeys } = require('../../components/open_api/open_api_handler');

// The keys of the default Open API applications in the test data for sync and async scenarios
const defSyncApp = 'default sync';
const defAsyncApp = 'default async';

// Contains the API request
let request;

// Contains the expected and the actual API response
let expResponse;
let actualResponse;

// Contains the expected and the actual Open API request sent
// to the async listener/simulator in case of an async flow
let expOpenApiRequest;
let actualOpenApiRequest;

// Reset the API flows before and after test scenarios. The Before hook in
// the step definition files are executed after the Background steps defined
// in the BDD feature files. Therefore, test data need to be loaded in a
// step definition that is executed as part of the Background, like the
// application session key validity check below, to avoid unloaded test data.
Before(() => {
  request = {};
  expResponse = {};
  actualResponse = {};
  expOpenApiRequest = {};
  actualOpenApiRequest = {};
});

After(() => {
  request = {};
  expResponse = {};
  actualResponse = {};
  expOpenApiRequest = {};
  actualOpenApiRequest = {};
});

/* eslint-disable-next-line no-undef */
Given(/^the different application session keys are valid$/, async () => {
  await TM.report('Validating the stored application session keys');
  const { appData } = await OpenApTM.getTestData();
  const apps = OpenApTM.getInvalidSessionKeyApps(appData, await OpenApTM.getSessionKeyInfo());
  for (let application of apps) {
    await OpenApTM.generateSessionKey(application);
    await TM.report(`Regenerated session key for the following application: ${application}`);
  }
  await TM.report(`All application session keys were valid`);
});

/* eslint-disable-next-line no-undef */
Given(/^a "([\w\s]+)" sync flow$/, async (flowType) => {
  [request, expResponse] = await OpenApTM.getSyncFlow(flowType, defSyncApp);
});

/* eslint-disable-next-line no-undef */
Given(/^a "([\w\s]+)" sync flow using "([\w\s]+)" application$/, async (flowType, app) => {
  [request, expResponse] = await OpenApTM.getSyncFlow(flowType, app);
});

/* eslint-disable-next-line no-undef */
Given(/^a "([\w\s]+)" sync flow with "([\w\s]+)" side effect$/, async (flowType, sideEffect) => {
  [request, expResponse] = await OpenApTM.getSyncFlow(flowType, defSyncApp, sideEffect);
});

/* eslint-disable-next-line no-undef */
Given(
  /^a "([\w\s]+)" sync flow with "([\w\s]+)" side effect using "([\w\s]+)" application$/,
  async (flowType, sideEffect, app) => {
    [request, expResponse] = await OpenApTM.getSyncFlow(flowType, app, sideEffect);
  },
);

/* eslint-disable-next-line no-undef */
Given(/^a "([\w\s]+)" async flow$/, async (flowType) => {
  [request, expResponse, expOpenApiRequest] = await OpenApTM.getAsyncFlow(flowType, defAsyncApp);
});

/* eslint-disable-next-line no-undef */
Given(/^a "([\w\s]+)" async flow using "([\w\s]+)" application$/, async (flowType, app) => {
  [request, expResponse, expOpenApiRequest] = await OpenApTM.getAsyncFlow(flowType, app);
});

/* eslint-disable-next-line no-undef */
Given(/^a "([\w\s]+)" async flow with "([\w\s]+)" side effect$/, async (flowType, sideEffect) => {
  [request, expResponse, expOpenApiRequest] = await OpenApTM.getAsyncFlow(
    flowType,
    defAsyncApp,
    sideEffect,
  );
});

/* eslint-disable-next-line no-undef */
Given(
  /^a "([\w\s]+)" async flow with "([\w\s]+)" side effect using "([\w\s]+)" application$/,
  async (flowType, sideEffect, app) => {
    [request, expResponse, expOpenApiRequest] = await OpenApTM.getAsyncFlow(
      flowType,
      app,
      sideEffect,
    );
  },
);

/* eslint-disable-next-line no-undef */
Given(/^the following request "(data|headers|params)" modifications$/, async (configKey, table) => {
  let modifications = await CommonUtils.parseTable(table);
  request[configKey] = { ...request[configKey], ...modifications };
  await TM.report(
    `Request ${configKey} after modifications: ${CommonUtils.beautify(request[configKey])}`,
  );
});

/* eslint-disable-next-line no-undef */
Given(
  /^the following request "(data|headers|params)" modifications from the cached "(sync response|async openapi request)" data$/,
  async (configKey, cacheSection, table) => {
    let parsedTable = await CommonUtils.parseTable(table);

    let modifications = await OpenApTM.getInfoFromApiFlowCache(
      cacheSection === 'sync response' ? flowKeys.syncRespFlowKey : flowKeys.asyncOpenApiReqFlowKey,
      parsedTable,
    );

    request[configKey] = { ...request[configKey], ...modifications };
    await TM.report(
      `Request ${configKey} after modifications: ${CommonUtils.beautify(request[configKey])}`,
    );
  },
);

/* eslint-disable-next-line no-undef */
Given(
  /^the following expected sync response data modifications from the cached sync response data$/,
  async (table) => {
    let parsedTable = await CommonUtils.parseTable(table);

    let modifications = await OpenApTM.getInfoFromApiFlowCache(
      flowKeys.syncRespFlowKey,
      parsedTable,
    );

    expResponse.data = { ...expResponse.data, ...modifications };
    await TM.report(
      `Expected sync response data after modifications: ${CommonUtils.beautify(expResponse.data)}`,
    );
  },
);

/* eslint-disable-next-line no-undef */
Given(
  /^the following expected async openapi request data modifications from the cached async openapi request data$/,
  async (table) => {
    let parsedTable = await CommonUtils.parseTable(table);

    let modifications = await OpenApTM.getInfoFromApiFlowCache(
      flowKeys.asyncOpenApiReqFlowKey,
      parsedTable,
    );

    expOpenApiRequest.data = { ...expOpenApiRequest.data, ...modifications };
    await TM.report(
      `Expected Open API request data after modifications: ${CommonUtils.beautify(
        expOpenApiRequest.data,
      )}`,
    );
  },
);

/* eslint-disable-next-line no-undef */
Given(
  /^the following request "(data|headers|params)" modifications from the "(sync response|async openapi request)" data stored as "([\w\s]+)"$/,
  async (configKey, storeSection, transactionName, table) => {
    let parsedTable = await CommonUtils.parseTable(table);

    let modifications = await OpenApTM.getInfoFromApiFlowStore(
      storeSection === 'sync response' ? flowKeys.syncRespFlowKey : flowKeys.asyncOpenApiReqFlowKey,
      parsedTable,
      transactionName,
    );

    request[configKey] = { ...request[configKey], ...modifications };
    await TM.report(
      `Request ${configKey} after modifications: ${CommonUtils.beautify(request[configKey])}`,
    );
  },
);

/* eslint-disable-next-line no-undef */
Given(
  /^the following expected sync response data modifications from the sync response data stored as "([\w\s]+)"$/,
  async (transactionName, table) => {
    let parsedTable = await CommonUtils.parseTable(table);

    let modifications = await OpenApTM.getInfoFromApiFlowStore(
      flowKeys.syncRespFlowKey,
      parsedTable,
      transactionName,
    );

    expResponse.data = { ...expResponse.data, ...modifications };
    await TM.report(
      `Expected sync response data after modifications: ${CommonUtils.beautify(expResponse.data)}`,
    );
  },
);

/* eslint-disable-next-line no-undef */
Given(
  /^the following expected async openapi request data modifications from the async openapi request data stored as "([\w\s]+)"$/,
  async (transactionName, table) => {
    let parsedTable = await CommonUtils.parseTable(table);

    let modifications = await OpenApTM.getInfoFromApiFlowStore(
      flowKeys.asyncOpenApiReqFlowKey,
      parsedTable,
      transactionName,
    );

    expOpenApiRequest.data = { ...expOpenApiRequest.data, ...modifications };
    await TM.report(
      `Expected Open API request data after modifications: ${CommonUtils.beautify(
        expOpenApiRequest.data,
      )}`,
    );
  },
);

/* eslint-disable-next-line no-undef */
Given(/^a regenerated session key for the "([\w\s]+)" application$/, async (app) => {
  await OpenApTM.generateSessionKey(app);
  await TM.report(`Regenerated session key for the following application: ${app}`);
});

/* eslint-disable-next-line no-undef */
When(/^the sync flow is executed/, async () => {
  actualResponse = await OpenApTM.sendRequest(request);
});

/* eslint-disable-next-line no-undef */
When(/^the async flow is executed/, async () => {
  actualResponse = await OpenApTM.sendRequest(request);

  // If the request to the Open API portal fails with a client error, then
  // the portal will not send a request to the async listener/simulator, the
  // transaction will fail straight away, so the listener does not need to be polled
  if (!_.inRange(expResponse.status, 400, 500)) {
    await TM.assertHasProperty(
      actualResponse.data,
      'output_ConversationID',
      'Missing data field in the Open API portal response',
    );
    let originalConversationId = actualResponse.data['output_ConversationID'];
    let listenerRequest = OpenApTM.getListenerRequest(originalConversationId);
    actualOpenApiRequest = await OpenApTM.pollListenerForOpenApiAsyncRequest(
      listenerRequest,
      originalConversationId,
    );
  } else {
    actualOpenApiRequest = {};
  }
  await TM.report('Async flow executed');
});

/* eslint-disable-next-line no-undef */
When(/^the async flow request is sent to Open API/, async () => {
  actualResponse = await OpenApTM.sendRequest(request);

  // If the request to the Open API portal fails with a client error, then
  // the portal will not send a request to the async listener/simulator, the
  // transaction will fail straight away
  if (!_.inRange(expResponse.status, 400, 500)) {
    await TM.assertHasProperty(
      actualResponse.data,
      'output_ConversationID',
      'Missing data field in the Open API portal response',
    );
    TM.report('Async flow executed');
  } else {
    actualOpenApiRequest = {};
  }
});

/* eslint-disable-next-line no-undef */
Then(/^the sync response is validated$/, async () => {
  await OpenApTM.validateResponse(actualResponse, expResponse);
});

/* eslint-disable-next-line no-undef */
Then(/^the async flow is validated$/, async () => {
  await OpenApTM.validateResponse(actualResponse, expResponse);

  // If the request to the Open API portal fails with a client error, then the
  // portal will not send a request to the async listener/simulator, the transaction
  // will fail straight away, so the Open API request does not need to be validated
  if (!_.inRange(expResponse.status, 400, 500)) {
    await OpenApTM.validateResponse(actualOpenApiRequest, expOpenApiRequest, false);
  }
});

/* eslint-disable-next-line no-undef */
Then(/^the async flow response is received from async listener and validated$/, async () => {
  let originalConversationId = actualResponse.data['output_ConversationID'];
  let listenerRequest = OpenApTM.getListenerRequest(originalConversationId);
  actualOpenApiRequest = await OpenApTM.pollListenerForOpenApiAsyncRequest(
    listenerRequest,
    originalConversationId,
  );

  TM.report('Validating async response');
  await OpenApTM.validateResponse(actualResponse, expResponse);

  // If the request to the Open API portal fails with a client error, then the
  // portal will not send a request to the async listener/simulator, the transaction
  // will fail straight away, so the Open API request does not need to be validated
  if (!_.inRange(expResponse.status, 400, 500)) {
    await OpenApTM.validateResponse(actualOpenApiRequest, expOpenApiRequest, false);
  }
});

/* eslint-disable-next-line no-undef */
Then(/^the sync API flow is cached$/, async () => {
  await OpenApTM.cacheApiFlow(request, actualResponse);
  await TM.report('Sync API flow is cached');
});

/* eslint-disable-next-line no-undef */
Then(/^the async API flow is cached$/, async () => {
  await OpenApTM.cacheApiFlow(request, actualResponse, actualOpenApiRequest);
  await TM.report('Async API flow is cached');
});

/* eslint-disable-next-line no-undef */
Then(/^the sync API flow is stored as "([\w\s]+)"$/, async (transactionName) => {
  await OpenApTM.storeApiFlows(transactionName, request, actualResponse, undefined);
  await TM.report(`Sync API flow is stored as "${transactionName}"`);
});

/* eslint-disable-next-line no-undef */
Then(/^the async API flow is stored as "([\w\s]+)"$/, async (transactionName) => {
  await OpenApTM.storeApiFlows(transactionName, request, actualResponse, actualOpenApiRequest);
  await TM.report(`Async API flow is stored as "${transactionName}"`);
});
