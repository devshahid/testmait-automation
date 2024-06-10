const { Handlers } = require('./handlers');
const { Assert, TM, CommonUtils, TestData, LoggerFactory } = inject();
const logger = LoggerFactory.init();
var { assert } = require('chai');

class G2Handlers extends Handlers {
  buttonInSpan1 = locate("//span[text()='REPLACE_LOCATOR']");
  buttonInSpandialog = locate("//div[@role='dialog']//span[contains(text(),'REPLACE_LOCATOR')]");
  buttonInTopMenu = locate('li').withText('REPLACE_LOCATOR');
  buttonInLink = locate('a').withText('REPLACE_LOCATOR');
  buttonLeftMenu = locate("//div[contains(text(),'REPLACE_LOCATOR')]");
  buttonLeftChildMenuConfig = locate("//a[contains(text(),'REPLACE_LOCATOR')]");
  buttonLeftChildMenu = locate(
    "//div[contains(@class, 'layout-container')]//div[contains(@class, 'sidebar')]//*[text()='REPLACE_LOCATOR']",
  );
  buttonInDiv = locate('button').withText('REPLACE_LOCATOR').inside('.form-btns');
  buttonInPopup = locate(
    "//div[contains(@class,'popwin')]//div[contains(text(),'REPLACE_LOCATOR')]",
  );
  buttonTopMenu = locate('span').withText('REPLACE_LOCATOR');
  buttonSubMenu = locate(
    "//div[contains(@style,'display: block')]//a[contains(text(),'REPLACE_LOCATOR')]",
  );
  buttonImgIcon = locate("//div[contains(text(),'REPLACE_LOCATOR')]//..//div//img");
  buttonRadio = locate(
    ".//label[contains(@class,'el-radio')]//span[text()[normalize-space()='REPLACE_LOCATOR']]",
  );
  buttonCite = locate('button').withText('REPLACE_LOCATOR');
  buttonCiteInNotification = locate('cite').withText('REPLACE_LOCATOR');
  buttonInLabel = locate('label').withText('REPLACE_LOCATOR');
  buttonLinkInDropdown = locate(
    "//div[contains(@style,'display: block')]//li[contains(@class,'a_link')]//a[contains(text(), 'REPLACE_LOCATOR')]",
  );
  buttonForRegion = locate(
    "((//div[@role='treeitem']//span[contains(., 'REPLACE_LOCATOR')]/..//label[@class='el-checkbox'])[1]//span)[1]",
  );
  textboxUsingLabel = locate('input').inside(locate('.el-form-item').withText('REPLACE_LOCATOR'));
  buttonChangelanguage = locate(
    "//div[@role='dialog']//input[@id='REPLACE_LOCATOR' or @placeholder='Please select language']",
  );
  RadioYesNo = locate("//span[@class='el-radio__label' and text()='REPLACE_LOCATOR']");
  textboxForCreateAllIdPage = locate("//div[text():'REPLACE_LOCATOR']//..//input");
  customDropdownLocator = locate('input').inside(
    locate('.el-form-item').withText('REPLACE_LOCATOR'),
  );
  customDropdownLocatorUser = locate('input').inside(
    locate('.el-input__inner').withText('REPLACE_LOCATOR'),
  );
  textboxusingId = locate("//input[@id='REPLACE_LOCATOR']");
  customDropdownLocatorValue = locate('li')
    .withText('REPLACE_LOCATOR')
    .inside('.el-select-dropdown');
  bankInTopOrg = locate(
    "(//li[contains(@class,'el-select-dropdown__item')]//span[contains(text(),'REPLACE_LOCATOR')])[2]",
  );

  customTextAreaLocator = locate('textarea').inside(
    locate('.el-form-item').withText('REPLACE_LOCATOR'),
  );
  remarkTextlocator = locate("//textarea[@id='editLanguageFormRemark']");
  newGroupNameLocator = locate("//div[@class='el-input el-input--small']//input");
  remarklocator = locate("//textarea[@class='el-textarea__inner']");
  productStatusEdit = locate(
    "//td[contains(text(),'REPLACE_LOCATOR')]//..//following-sibling::div//select[contains(@name,'.status')]",
  );
  textboxUsingLabelInDialogWindow = locate(
    "//div[@role='dialog']//input[ancestor::*[contains(concat(' ', normalize-space(./@class), ' '), ' el-form-item ')][contains(., 'REPLACE_LOCATOR')]]",
  );
  textboxOperatorId = locate(
    "//span[text()='REPLACE_LOCATOR']//parent::div//following-sibling::div[@class='el-dialog__body']//child::form//child::div[@class='el-form-item__content']//child::textarea[@placeholder='Please enter content']",
  );
  SubmitButtonForOperatorID = locate(
    "//*[text()='REPLACE_LOCATOR']//parent::div//following-sibling::*[@class='el-dialog__footer']//child::span[contains(text(),'Submit')]",
  );
  textAreaLoc = locate("//textarea[@placeholder='REPLACE_LOCATOR']");
  customTextAreaLocatorInDialogWindow = locate(
    "//div[@role='dialog']//textarea[ancestor::*[contains(concat(' ', normalize-space(./@class), ' '), ' el-descriptions ') or contains(concat(' ', normalize-space(./@class), ' '), ' el-form-item ')][contains(., 'REPLACE_LOCATOR')]]",
  );
  RemarkMsisdntextlocator = locate(
    "//div[@aria-label='Edit MSISDN']//div//textarea[@id='editLanguageFormRemark']",
  );
  toggleSwitchInDiv = locate(
    ".//span[contains(., 'REPLACE_LOCATOR')]//span[ancestor::*[contains(concat(' ', normalize-space(./@class), ' '), ' el-form-item ')]]",
  );
  tabsInDiv = locate('div').withText('REPLACE_LOCATOR').inside('.el-tabs__nav');
  buttonInDropDown = locate(".//input[contains(@placeholder, 'REPLACE_LOCATOR')]");
  textInSearchFor = locate(".//input[contains(@placeholder, 'REPLACE_LOCATOR')]");
  searchBtn = locate("//i[@class='el-input__icon el-icon-search search-btn']");
  selectdrp = locate("//ul[@class='el-menu el-menu']//li[@class='el-menu-item is-active']");
  buttonInBankDropDown = locate(".//input[contains(@id, 'REPLACE_LOCATOR')]");
  textboxUsingLabelInMessageDialogWindow = locate(
    "//div[@role='dialog']//input[ancestor::*[contains(concat(' ', normalize-space(./@class), ' '), ' el-message-box ')][contains(., 'REPLACE_LOCATOR')]]",
  );
  optionsForHover = locate(
    "//ul[@class='next']//li//div[@class='listName']//span[contains(text(),'REPLACE_LOCATOR')]",
  );
  optionForHoverInBank = locate(
    "(//li[@class='el-select-dropdown__item']//span[text()='REPLACE_LOCATOR'])[2]",
  );
  optionInBank = locate(
    "//li[@class='el-select-dropdown__item hover']//span[contains(text(),'REPLACE_LOCATOR')]",
  );
  buttonRadioInDialogWindow = locate(
    "//div[@role='dialog']//span[@class='el-radio__input' and input[@value='REPLACE_LOCATOR']]",
  );
  checkboxInDialogWindow = locate(
    "(//div[@role='dialog']//*[contains(@class, 'el-table')]//span[@class='el-checkbox__inner'])[REPLACE_LOCATOR]",
  );
  checkBox = locate(
    "(.//span[ancestor::*[contains(concat(' ', normalize-space(./@class), ' '), ' el-checkbox ')][contains(., 'REPLACE_LOCATOR')]])[1]",
  );
  buttonToView = locate('span').withText('REPLACE_LOCATOR');
  Assettype = locate("//*[@class='el-select-dropdown__item']//span[text()='REPLACE_LOCATOR']");
  buttonDropDownInDialogWindow = locate(
    "//div[@role='dialog']//input[@id='REPLACE_LOCATOR' or @placeholder='Please select status']",
  );
  buttonDropDownGroupIdentityStatus = locate(
    "//label[text()='REPLACE_LOCATOR']//following-sibling::div//child::input[@placeholder='Please select']",
  );
  buttonDropDownValueOrg = locate(
    "//*[text()='REPLACE_LOCATOR'][ancestor::*[contains(concat(' ', normalize-space(./@class), ' '), ' el-select-dropdown ')]]",
  );
  buttonTillstatus = locate(
    "//div[@role='dialog']//input[@id='REPLACE_LOCATOR' or @placeholder='Please select']",
  );
  buttonDropdownoper = locate("//div[@role='dialog']//input[@placeholder='Please select']");
  OrgbuttonDropDownInDialogWindow = locate(
    "//div[@role='dialog']//input[contains(@placeholder, 'REPLACE_LOCATOR')]",
  );
  customDropdownloc = locate(
    "//ul[@class='el-scrollbar__view el-select-dropdown__list']//li[@class='el-select-dropdown__item']//span[contains(text(),'REPLACE_LOCATOR')]",
  );
  customDropdownloc1 = locate(
    "le//ul[@class='el-scrollbar__view el-sect-dropdown__list']//li[contains(@class, 'el-select-dropdown') and contains(.//span, 'REPLACE_LOCATOR')]",
  );
  customDropdownloc2 = locate(
    "//ul[@class='el-scrollbar__view el-select-dropdown__list']//li[@class='el-select-dropdown__item']//span[text(),'REPLACE_LOCATOR']//parent::li",
  );
  SubmitButton = locate(
    "//*[text()='REPLACE_LOCATOR']//parent::div//following-sibling::*[@class='el-dialog__footer']//child::span[text()=' Submit ']",
  );
  buttonDropDown = locate("//*[@id='REPLACE_LOCATOR']");
  msisdnText = locate("//input[@id='newMsisdn']");
  optionUserService = locate(
    "//li[contains(@class, 'el-select-dropdown') and contains(.//span, 'REPLACE_LOCATOR')]",
  );
  AddProduct = locate(
    "//div[text()='REPLACE_LOCATOR']//ancestor::tr//td//span[@class='el-checkbox__inner']",
  );
  AddAccessChannel = locate(
    "//span[text()=' REPLACE_LOCATOR ']//ancestor::label//span//span[@class='el-checkbox__inner']",
  );
  textBoxForProduct = locate(
    "//div[@role='dialog']//span[contains(.,'Add Product')]//ancestor::div//label[contains(., 'REPLACE_LOCATOR')]/..//input[@placeholder='Please enter']",
  );
  buttonInProduct = locate(
    "//div[@role='dialog' and @aria-label='Add Product']//button[contains(., 'REPLACE_LOCATOR')]",
  );
  optionForRegInTopOrg = locate(
    "//div[@role='dialog']//span[contains(., 'REPLACE_LOCATOR')]//ancestor::div//div[@class='select_tree_container']//input[@type='text']",
  );
  confirmButtonInRegion = locate(
    "//div[@aria-label='Select Region']//span[contains(., 'REPLACE_LOCATOR')]",
  );
  grabTextfromlabel = locate(
    "//p[text()='REPLACE_LOCATOR']//following-sibling::p[@class='descriptions-item__content']",
  );
  debitAndCreditPartyOptions = locate(
    ".//div[contains(@class, 'el-select-dropdown__wrap el-scrollbar__wrap')])[4]//li//span[text()='REPLACE_LOCATOR']",
  );

  documentreceived = locate(
    "(//ul[@class='el-scrollbar__view el-select-dropdown__list']//li[contains(@class,'el-select-dropdown')]//span[text()='REPLACE_LOCATOR'])[2]",
  );
  idtype = locate(
    "(//*[@class='el-scrollbar__view el-select-dropdown__list']//li[contains(@class, 'el-select-dropdown__item')]//span[text()='REPLACE_LOCATOR'])[2]",
  );
  contactTypeIdOptions = locate(
    "(.//div[contains(@class, 'el-select-dropdown__wrap el-scrollbar__wrap')])[12]//li//span[text()='REPLACE_LOCATOR']",
  );
  buttonSpanwithindex = locate("(//span[text()='REPLACE_LOCATOR'])[2]");
  buttondialoguewithindex = locate(
    "(//div[@role='dialog']//span[contains(text(),'REPLACE_LOCATOR')])[1]",
  );
  spanButtonContains = locate("//span[contains(text(),'REPLACE_LOCATOR')]");
  changeAccountStatus = locate(
    "(.//*[./@class = 'table-region']//tr[contains(., 'REPLACE_LOCATOR')]//*[text()='Change Status'])[2]",
  );
  CreateBankAccount = locate("(//span[contains(text(),'REPLACE_LOCATOR')])[2]");
  craeteBankId = locate(
    "//ul[@class='el-scrollbar__view el-select-dropdown__list']//span[text()='REPLACE_LOCATOR']",
  );
  createAssettype = locate(
    "(//ul[@class='el-scrollbar__view el-select-dropdown__list']//li[@class='el-select-dropdown__item']//span[contains(text(),'REPLACE_LOCATOR')])[2]",
  );
  /**
   * to click on element
   *
   * @param {object} locator
   * @param {object} customLocator picksup the property of this class and parameter is optional
   */
  async clickOnElement(locator, customLocator) {
    await this.waitForPageLoad();
    await super.clickOnElement(locator, this[customLocator]);
    await this.waitForPageLoad();
  }

  /**
   * to move cursor on element
   *
   * @param {object} locator
   * @param {object} customLocator picksup the property of this class and parameter is optional
   */
  async moveOnElement(locator, customLocator) {
    await this.waitForPageLoad();
    await super.moveCursorTo(locator, this[customLocator]);
    await this.waitForPageLoad();
  }

  async doubleClick(locator, customLocator) {
    await this.waitForPageLoad();
    await super.doubleClickOnElement(locator, this[customLocator]);
    await this.waitForPageLoad();
  }

  /**
   * to click on element
   *
   * @param {object} locator
   * @param {object} customLocator picksup the property of this class and parameter is optional
   */
  async selectRadioOrCheckbox(locator, customLocator) {
    await this.waitForPageLoad();
    await super.selectRadioOrCheckbox(locator, this[customLocator]);
    await this.waitForPageLoad();
  }

  async verifyText(locator) {
    await this.waitForPageLoad();
    await TM.waitForText(CommonUtils.identifyData(locator), global.explicitWait);
    await Assert.verifyText(CommonUtils.identifyData(locator));
    await TM.report('Verified text ' + CommonUtils.identifyData(locator));
  }

  async waitForPageLoad() {
    let pageLoadlocator = CommonUtils.identifyLocator('GenericLocators.pageLoadlocator');
    await TM.waitForInvisible(pageLoadlocator, 30);
  }

  async verifyTextNotPresent(locator) {
    await this.waitForPageLoad();
    await Assert.verifyTextNotPresent(locator);
    await TM.report('Verified text ' + CommonUtils.identifyLocator(locator) + ' is not displayed');
  }

  async checkLessThan(value1, compare, value2) {
    if (compare === 'less than') {
      assert.isBelow(
        parseInt(CommonUtils.identifyData(value1)),
        parseInt(CommonUtils.identifyData(value2)),
      );
    } else {
      assert.isAtLeast(
        parseInt(CommonUtils.identifyData(value1)),
        parseInt(CommonUtils.identifyData(value2)),
      );
    }
    TM.report('Checked that ' + value1 + ' is ' + compare + '' + value2);
  }

  async checkValueisGreaterThan(strTempString1, strTempString2, strAmount) {
    let intTempString1 = CommonUtils.identifyData(strTempString1);
    let intTempString2 = CommonUtils.identifyData(strTempString2);
    intTempString1 = intTempString1.toString().replace(/M|Tsh|GHS|,/gi, '');
    intTempString2 = intTempString2.toString().replace(/M|Tsh|GHS|,/gi, '');
    intTempString1 = parseFloat(intTempString1);
    intTempString2 = parseFloat(intTempString2);
    let intAmount = parseFloat(CommonUtils.identifyData(strAmount));
    TM.report(
      'Verifying amount is credited or not with values : ' +
        intTempString1 +
        ', ' +
        intTempString2 +
        ', ' +
        intAmount,
    );
    if (intTempString1 >= intTempString2 + intAmount) {
      TM.report('The Value is Credited');
    } else if (intTempString1 > intTempString2 - intAmount) {
      TM.report('The Value is Credited with some charges deducted');
    } else {
      TM.fail('The amount is not Credited');
    }
  }

  async checkValueisLessThan(strTempString1, strTempString2, strAmount) {
    let intTempString1 = CommonUtils.identifyData(strTempString1);
    let intTempString2 = CommonUtils.identifyData(strTempString2);
    intTempString1 = intTempString1.toString().replace(/M|Tsh|,|GHS/gi, '');
    intTempString2 = intTempString2.toString().replace(/M|Tsh|,|GHS/gi, '');
    intTempString1 = parseFloat(intTempString1);
    intTempString2 = parseFloat(intTempString2);
    let intAmount = parseFloat(CommonUtils.identifyData(strAmount));
    TM.report(
      'Verifying amount is debited or not with values : ' +
        intTempString1 +
        ', ' +
        intTempString2 +
        ', ' +
        intAmount,
    );
    if (intTempString1 <= intTempString2 - intAmount) {
      TM.report('The Value is Debited');
    } else {
      TM.fail('The amount is not Debited');
    }
  }

  /**
   * Used to select option by passing dropdown field name and Option value
   * @param {*} dropdown field name
   * @param {*} option value
   */
  async selectOption(dropdown, option, customLocator) {
    await this.waitForPageLoad();
    option = CommonUtils.identifyData(option);
    await super.clickOnElement(dropdown, this[customLocator]);
    await super.clickOnElement(option, this.customDropdownLocatorValue);
    await this.waitForPageLoad();
  }
  async selectOption1(locator, value) {
    await this.waitForPageLoad();
    value = CommonUtils.identifyData(value);
    await super.clickOnElement(locator);
    await super.clickOnElement(value, this.customDropdownloc2);
    await this.waitForPageLoad();
  }

  async selectOption2(dropdown, option, customLocator) {
    await this.waitForPageLoad();
    option = CommonUtils.identifyData(option);
    await super.clickOnElement(dropdown, this[customLocator]);
    await super.clickOnElement(option, this.buttonDropDownValueOrg);
    await this.waitForPageLoad();
  }

  async getValueFromTable(tableId, uniqueValues, columnNumber, outputVar) {
    await this.waitForPageLoad();
    if (tableId == 'table-region') {
      let arr = uniqueValues.split('|');
      var path = locate("[class='" + tableId + "'] tr");

      arr.forEach((item) => {
        item = CommonUtils.identifyData(item);
        item = item.toString();
        path = path.withText(item);
      });
    } else {
      path = locate(".//*[./@class = '" + tableId + "']");
    }

    if (columnNumber !== '') {
      path = path.toString();
      path = path.replace('{xpath: ', '');
      path = path.replace('}', '');
      path = locate('(' + path + '//*[text()])[' + columnNumber + ']');
    }

    let value = await TM.grabTextFrom(path);
    value = value.trim();
    TestData.setField(outputVar, value);
  }

  async ClikLinkFromTable(tableId, uniqueValues, columnNumber) {
    await this.waitForPageLoad();
    if (tableId == 'table-region') {
      let arr = uniqueValues.split('|');
      var path = locate("[class='" + tableId + "'] tr");

      arr.forEach((item) => {
        item = CommonUtils.identifyData(item);
        item = item.toString();
        path = path.withText(item);
      });
    } else {
      path = locate(".//*[./@class = '" + tableId + "']");
    }

    if (columnNumber !== '') {
      path = path.toString();
      path = path.replace('{xpath: ', '');
      path = path.replace('}', '');
      path = locate('(' + path + '//*[text()])[' + columnNumber + ']');
    }
    await this.clickOnElement(path);
  }

  async clickValueOnTableData(tableId, uniqueValues, operation) {
    await this.waitForPageLoad();
    tableId = CommonUtils.identifyData(tableId);
    let arr = uniqueValues.split('|');
    var path = locate("[class='" + tableId + "'] tr");

    let menuItem = null;
    if (TestData.getField('menuItem').includes('.')) {
      menuItem = TestData.getField('menuItem').split('.')[1];
    } else {
      menuItem = TestData.getField('menuItem');
    }

    if (menuItem == 'Till') {
      arr.forEach((item) => {
        item = CommonUtils.identifyData(item);
        path = path.withText(item);
      });
      path = path.find("//*[text()=' " + operation + " ']");
    } else if (menuItem == 'ProjectManagement') {
      arr.forEach((item) => {
        item = CommonUtils.identifyData(item);
        path = path.withText(item);
      });
      path = path.find("//*[text()='" + operation + " ']");
    } else if (menuItem == 'Organization') {
      path = path.find("//*[@id='handleView0']");
    } else if (menuItem == 'BankAccountCreated') {
      arr.forEach((item) => {
        item = CommonUtils.identifyData(item);
        path = path.withText(item);
      });
      path = path.find("//*[text()='" + operation + "']");
    } else if (menuItem == 'CloseOrganization') {
      path = locate(".//*[./@class = '" + tableId + "']//tr//*[text()=' Close ']");
    } else if (menuItem == 'Organization Operator') {
      path = locate("(.//*[./@class = '" + tableId + "']//tr//*[text()=' " + operation + " '])[2]");
    } else if (menuItem == 'MakerChecker') {
      path = locate(
        ".//*[./@class = '" +
          tableId +
          '\']//b[contains(text(),"' +
          uniqueValues +
          '")]/parent::div/parent::div//span[text()=\' ' +
          operation +
          " ']",
      );
    } else if (menuItem == 'RemoveTillProduct') {
      arr.forEach((item) => {
        item = CommonUtils.identifyData(item);
        path = path.withText(item);
      });
      path = path.find("//*[text()=' " + operation + " ']");
    } else {
      path = path.find("//*[normalize-space(text())='" + operation + "']");
    }

    await this.clickOnElement(path);
  }

  async ClikOnTableTransStatus(tableId, uniqueValues, operation) {
    tableId = CommonUtils.identifyData(tableId);
    // let arr = uniqueValues.split('|');
    var path = locate("[class='" + tableId + "'] tr");
    let menuItem = null;
    if (TestData.getField('menuItem').includes('.')) {
      menuItem = TestData.getField('menuItem').split('.')[1];
    } else {
      menuItem = TestData.getField('menuItem');
    }
    if (menuItem == 'ReviewTransaction') {
      // arr.forEach((item) => {
      // item = CommonUtils.identifyData(item);
      // path = path.withText(item);
      // });
      path = path.find("//*[text()=' " + operation + " ']");
    } else {
      path = path.find("//*[text()=' " + operation + " ']");
    }
    await this.clickOnElement(path);
  }

  async ClikOnTableAccountStatus(tableId, uniqueValues, operation) {
    tableId = CommonUtils.identifyData(tableId);
    let arr = uniqueValues.split('|');
    var path = locate("[class='" + tableId + "'] tr");
    let menuItem = null;
    if (TestData.getField('menuItem').includes('.')) {
      menuItem = TestData.getField('menuItem').split('.')[1];
    } else {
      menuItem = TestData.getField('menuItem');
    }
    if (menuItem == 'ReviewTransaction') {
      arr.forEach((item) => {
        item = CommonUtils.identifyData(item);
        path = path.withText(item);
      });
      path = path.find("//*[text()='" + operation + "']");
    } else {
      path = path.find("//*[text()=' " + operation + " ']");
    }
    await this.clickOnElement(path);
  }

  async clickValueOnTableDataIn(tableId, uniqueValues, operation) {
    await this.waitForPageLoad();
    tableId = CommonUtils.identifyData(tableId);
    let arr = uniqueValues.split('|');
    var path = locate("[class='" + tableId + "'] tr");

    let menuItem = null;
    if (TestData.getField('menuItem').includes('.')) {
      menuItem = TestData.getField('menuItem').split('.')[1];
    } else {
      menuItem = TestData.getField('menuItem');
    }

    if (menuItem == 'Till') {
      arr.forEach((item) => {
        item = CommonUtils.identifyData(item);
        path = path.withText(item);
      });
      path = path.find("//*[text()=' " + operation + " ']");
    } else if (menuItem == 'ProjectManagement') {
      arr.forEach((item) => {
        item = CommonUtils.identifyData(item);
        path = path.withText(item);
      });
      path = path.find("//*[text()='" + operation + " ']");
    } else if (menuItem == 'Organization') {
      path = path.find("//*[@id='handleView0']");
    } else if (menuItem == 'BankAccountCreated') {
      arr.forEach((item) => {
        item = CommonUtils.identifyData(item);
        path = path.withText(item);
      });
      path = path.find("//*[text()='" + operation + "']");
    } else {
      path = path.find("//*[@title='" + operation + "']");
    }
    await this.clickOnElement(path);
  }

  async clickValueInTableData(tableId, uniqueValues, operation) {
    await this.waitForPageLoad();
    tableId = CommonUtils.identifyData(tableId);
    let arr = uniqueValues.split('|');
    var path = locate("[class='" + tableId + "'] tr");

    let menuItem = null;
    if (TestData.getField('menuItem').includes('.')) {
      menuItem = TestData.getField('menuItem').split('.')[1];
    } else {
      menuItem = TestData.getField('menuItem');
    }

    if (menuItem == 'Till') {
      arr.forEach((item) => {
        item = CommonUtils.identifyData(item);
        path = path.withText(item);
      });
      path = path.find("//*[text() ='" + operation + "']");
    } else if (menuItem == 'ProjectManagement') {
      arr.forEach((item) => {
        item = CommonUtils.identifyData(item);
        path = path.withText(item);
      });
      path = path.find("//*[text() ='" + operation + "']");
    } else if (menuItem == 'Organization') {
      path = path.find("//*[@id='handleView0']");
    } else if (menuItem == 'BankAccountCreated') {
      arr.forEach((item) => {
        item = CommonUtils.identifyData(item);
        path = path.withText(item);
      });
      path = path.find("//*[text() ='" + operation + "']");
    } else {
      path = path.find("//*[text()='" + operation + "']");
    }
    await this.clickOnElement(path);
  }

  async clickLinkOnTableData(tableId, uniqueValues, operation, columnName) {
    await this.waitForPageLoad();
    let arr = uniqueValues.split('|');
    var path = locate("[id='" + tableId + "'] tr");
    arr.forEach((item) => {
      item = CommonUtils.identifyData(item);
      path = path.withText(item);
    });
    let columnLocator = locate(
      "//div[@id='" + tableId + "']//label[@title='" + columnName + "']/..",
    );
    let columnIndex = await TM.grabAttributeFrom(columnLocator, 'colmarker');
    path = path.find(
      '//td[' +
        ++columnIndex +
        "]//a[contains(text(),'" +
        CommonUtils.identifyData(operation) +
        "')]",
    );
    await this.clickOnElement(path);
  }

  /**
   * to enter value in textbox
   *
   * @param {object} locator
   * @param {string} textValue is value to set in textbox
   */
  async enterValue(locator, textValue, customLocator) {
    await this.waitForPageLoad();
    super.enterValue(locator, CommonUtils.identifyData(textValue), this[customLocator]);
    await this.waitForPageLoad();
  }

  /**
   * to enter value to textbox by passing text area field name and value
   * @param {*} label
   * @param {*} value
   */
  async enterTextAreaValue(label, value, customLocator) {
    await this.waitForPageLoad();
    await super.enterTextAreaValue(label, value, this[customLocator]);
    await this.waitForPageLoad();
  }

  async getValueFromLabel(label, storeOutput) {
    let value;
    await this.waitForPageLoad();
    if (typeof TestData.getLocator(label) !== 'undefined') {
      await TM.waitForElement(CommonUtils.identifyLocator(label), global.explicitWait);
      value = await TM.grabTextFrom(CommonUtils.identifyLocator(label));
    } else {
      // let locator = locate('label').inside(
      //   locate('.el-col').withChild('.el-form-item').withText(label)
      // );
      let locator = locate(
        ".//label[ancestor::*[contains(concat(' ', normalize-space(./@class), ' '), ' el-col ')][./child::*[contains(concat(' ', normalize-space(./@class), ' '), ' el-form-item ')]][contains(., '" +
          label +
          "')]]//following-sibling::div",
      );
      await TM.waitForElement(locator, global.explicitWait);
      value = await TM.grabTextFrom(locator);
    }
    logger.info('Value from label or fetched : ' + value);
    TestData.setField(storeOutput, value);
    await this.waitForPageLoad();
  }

  async getValueFromLabelIn(label, storeOutput) {
    let value;
    await this.waitForPageLoad();
    if (typeof TestData.getLocator(label) !== 'undefined') {
      await TM.waitForElement(CommonUtils.identifyLocator(label), global.explicitWait);
      value = await TM.grabTextFrom(CommonUtils.identifyLocator(label));
    } else {
      let locator = locate(
        "//p[text()='" + label + "']//following-sibling::p[@class='descriptions-item__content']",
      );

      await TM.waitForElement(locator, global.explicitWait);
      value = await TM.grabTextFrom(locator);
    }
    logger.info('Value from label or fetched : ' + value);
    TestData.setField(storeOutput, value);
    await this.waitForPageLoad();
  }

  /**
   * to click on element
   *
   * @param {object} locator
   * @param {object} customLocator picksup the property of this class and parameter is optional
   */
  async grabNumberOfVisibleElements(locator, customLocator) {
    await this.waitForPageLoad();
    let number = await super.grabNumberOfVisibleElements(locator, this[customLocator]);
    await this.waitForPageLoad();
    return number;
  }

  async updateTheRuleProfile(tableId, uniqueValues, columnName, ruleProfileName) {
    await this.waitForPageLoad();
    let arr = uniqueValues.split('|');
    var path = locate("[id='" + tableId + "'] tr");
    arr.forEach((item) => {
      item = CommonUtils.identifyData(item);
      path = path.withText(item);
    });
    let columnLocator = locate(
      "//div[@id='" + tableId + "']//label[@title='" + columnName + "']/..",
    );
    let columnIndex = await TM.grabAttributeFrom(columnLocator, 'colmarker');
    path = path.find('//td[' + ++columnIndex + ']//img');
    await this.clickOnElement(path);
    await this.waitForPageLoad();
    await super.selectOption(
      TestData.getLocator('GenericLocators.RuleProfileSelect'),
      CommonUtils.identifyData(ruleProfileName),
    );
    await this.waitForPageLoad();
    await this.enterTextAreaValue(
      'Reason',
      CommonUtils.identifyData('Reason Description'),
      'customTextAreaLocator',
    );
    await this.clickOnElement('Submit', 'buttonInDiv');
  }
}

module.exports = new G2Handlers();
module.exports.G2Handlers = G2Handlers;
