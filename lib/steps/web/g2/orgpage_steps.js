// const { TestData } = require("../config/globaltestdata");

//const { OrgPage } = require('../config/pages');

let { TM, CommonUtils, G2Handlers, TestData } = inject();

/* eslint-disable no-undef */
Then(
  /^I check table "([^"]*)" with multiple values as "([^"]*)" and store "([^"]*)" column value in "([^"]*)"$/,
  async (table, uniqueValues, columnNumber, outputVar) => {
    table = CommonUtils.identifyData(table);
    columnNumber = CommonUtils.identifyData(columnNumber);
    await G2Handlers.getValueFromTable(table, uniqueValues, columnNumber, outputVar);
    TM.report(
      'Verified table ' +
        table +
        ' has values ' +
        uniqueValues +
        ' and stored ' +
        columnNumber +
        ' value ' +
        CommonUtils.identifyData(outputVar) +
        ' in ' +
        outputVar,
    );
  },
);

Then(
  /^I check table "([^"]*)" with multiple values as "([^"]*)" and click link in column "([^"]*)"$/,
  async (table, uniqueValues, columnNumber) => {
    table = CommonUtils.identifyData(table);
    columnNumber = CommonUtils.identifyData(columnNumber);
    await G2Handlers.ClikLinkFromTable(table, uniqueValues, columnNumber);
    //  // TM.report(
    //     'Verified table ' +
    //       table +
    //       ' has values ' +
    //       uniqueValues +
    //       ' and stored ' +
    //       columnNumber +
    //       ' value ' +
    //       CommonUtils.identifyData(outputVar) +
    //       ' in ' +
    //       outputVar,
  },
);

Then(
  /^I check table "([^"]*)" with multiple values as "([^"]*)" and click on "([^"]*)" of "([^"]*)" column$/,
  async (table, uniqueValues, operation, columnName) => {
    TestData.setField('menuItem', table);
    table = CommonUtils.identifyData(table);
    await G2Handlers.clickValueOnTableData(table, uniqueValues, operation, columnName);
    TM.report(
      'Verified table ' +
        table +
        ' has values ' +
        uniqueValues +
        ' and clicked on ' +
        operation +
        ' of ' +
        columnName,
    );
  },
);

Then(
  /^I check table in "([^"]*)" with multiple values as "([^"]*)" and click on "([^"]*)" of "([^"]*)" column$/,
  async (table, uniqueValues, operation, columnName) => {
    TestData.setField('menuItem', table);
    table = CommonUtils.identifyData(table);
    await G2Handlers.clickValueOnTableDataIn(table, uniqueValues, operation, columnName);
    TM.report(
      'Verified table ' +
        table +
        ' has values ' +
        uniqueValues +
        ' and clicked on ' +
        operation +
        ' of ' +
        columnName,
    );
  },
);

Then(
  /^I check table of "([^"]*)" with multiple values as "([^"]*)" and click on "([^"]*)" of "([^"]*)" column$/,
  async (table, uniqueValues, operation, columnName) => {
    TestData.setField('menuItem', table);
    table = CommonUtils.identifyData(table);
    await G2Handlers.clickValueInTableData(table, uniqueValues, operation, columnName);
    TM.report(
      'Verified table ' +
        table +
        ' has values ' +
        uniqueValues +
        ' and clicked on ' +
        operation +
        ' of ' +
        columnName,
    );
  },
);

Then(
  /^I check table "([^"]*)" with multiple values as "([^"]*)" and click on link "([^"]*)" of "([^"]*)" column$/,
  async (table, uniqueValues, operation, columnName) => {
    table = CommonUtils.identifyData(table);
    await G2Handlers.clickLinkOnTableData(table, uniqueValues, operation, columnName);
    TM.report(
      'Verified table ' +
        table +
        ' has values ' +
        uniqueValues +
        ' and clicked on ' +
        operation +
        ' of ' +
        columnName,
    );
  },
);

Then(
  /^I check table "([^"]*)" with multiple values as "([^"]*)" and update the rule profile in the column "([^"]*)" to "([^"]*)"$/,
  async (table, uniqueValues, columnName, ruleProfileName) => {
    table = CommonUtils.identifyData(table);
    await G2Handlers.updateTheRuleProfile(table, uniqueValues, columnName, ruleProfileName);
    TM.report(
      'Verified table ' +
        table +
        ' has values ' +
        uniqueValues +
        ' and updated the rule profile in to ' +
        ruleProfileName +
        ' in the column ' +
        columnName,
    );
  },
);
