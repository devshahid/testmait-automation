const { LoggerFactory } = inject();
const logger = LoggerFactory.init();

const createtoporgpage = require('./createtoporgpage');
const robot = require('robotjs');
const { join } = require('path');
const { globals } = require('../../configs/core.js').config;

const {
  TM,
  IFrame,
  HomePage,
  LoginPage,
  TestData,
  CommonUtils,
  LeftMenuPage,
  G2Handlers,
  Email,
  Assert,
  ButtonLink,
  AdminPage,
} = inject();

class GenericMethods extends Helper {
  async makerChecker() {
    let value = 'Off';
    await G2Handlers.waitForPageLoad();
    let noOfEle = await TM.grabNumberOfVisibleElements(
      CommonUtils.identifyLocator('GenericLocators.MakerChecker'),
    );
    if (noOfEle !== 0) {
      let makerCheckerElementInDiv = await TM.grabTextFrom(
        CommonUtils.identifyLocator('GenericLocators.MakerChecker'),
      );

      if (makerCheckerElementInDiv.includes('approved by ')) {
        value = 'On';
      }

      TestData.setField('makerChecker', value);
    }
  }
  async approveOrRejectGroupTask(approveOrReject, tableData) {
    await G2Handlers.waitForPageLoad;
    await IFrame.switchToMainPage();
    await HomePage.clickOnLogout('sp');
    await TM.amOnPage(CommonUtils.identifyData('Login.SP-Url'));
    await G2Handlers.waitForPageLoad;
    await LoginPage.login('sp_generic');
    //await LoginPage.login('sp_generic');
    await LeftMenuPage.navigateToLeftChildMenu('Task Center', 'buttonLeftChildMenu');
    await LeftMenuPage.navigateToLeftChildMenu('Group Task', 'buttonLeftChildMenu');
    TestData.setField('menuItem', 'MakerChecker');
    await G2Handlers.clickValueOnTableData('Table.MakerChecker', tableData, 'Process', 'Operation');
    if (approveOrReject == 'Approve') {
      await G2Handlers.clickOnElement(approveOrReject, 'buttonToView');
    } else {
      // await ButtonLink.clickOnElement('GenericLocators.ToggleSwitchMakerChecker');
      await G2Handlers.clickOnElement(approveOrReject, 'buttonToView');
    }
    await G2Handlers.enterValue(
      'GenericLocators.TextAreaMakerChecker',
      CommonUtils.identifyData('Reason Description'),
    );
    await ButtonLink.clickOnElement('GenericLocators.SubmitInGroupTask');
    await HomePage.clickOnLogout('sp');
    await TM.clearCookie();
    await TM.amOnPage(CommonUtils.identifyData('Login.SP-Url'));
    await G2Handlers.waitForPageLoad;
    await LoginPage.login('sp');
  }

  async navigateToInfoPageAfterSearch(pageName, tObj) {
    let searchValue = CommonUtils.identifyData(tObj['SearchValue']),
      tableValues = CommonUtils.identifyData(tObj['TableValues']),
      query = CommonUtils.identifyData(tObj['Query Condition']),
      orgShortcode = CommonUtils.identifyData(tObj['Organization Short Code']),
      operatorId = CommonUtils.identifyData(tObj['Operator Id']),
      Tillmsisdn = CommonUtils.identifyData(tObj['MSISDN']),
      Tillnumber = CommonUtils.identifyData(tObj['Till Number']),
      closesearch = CommonUtils.identifyData(tObj['CloseTheSearch']),
      idtype = CommonUtils.identifyData(tObj['ID Type']),
      id = CommonUtils.identifyData(tObj['ID']),
      firstname = CommonUtils.identifyData(tObj['First Name']),
      lastname = CommonUtils.identifyData(tObj['Last Name']),
      middlename = CommonUtils.identifyData(tObj['Middle Name']),
      searchby = CommonUtils.identifyData(tObj['SearchBy']);

    await AdminPage.leftmenunavigation(pageName);
    if (pageName == 'Till') {
      if (query == 'MSISDN') {
        await G2Handlers.selectOption('Query Condition', query, 'customDropdownLocator');
        await G2Handlers.enterValue('MSISDN', Tillmsisdn, 'textboxUsingLabel');
      } else if (query == 'Till Number + Organization Short Code') {
        await G2Handlers.selectOption('Query Condition', query, 'customDropdownLocator');
        await G2Handlers.enterValue('Till Number', Tillnumber, 'textboxUsingLabel');
        await G2Handlers.enterValue('Organization Short Code', orgShortcode, 'textboxUsingLabel');
      }
    } else if (pageName == 'Customer') {
      if (searchby == 'MSISDN') {
        await G2Handlers.enterValue('GenericLocators.MsisdnCustomer', searchValue);
      } else if (searchby == 'ID') {
        await G2Handlers.selectOption('Search By', searchby, 'customDropdownLocator');
        await G2Handlers.selectOption('ID Type', idtype, 'customDropdownLocator');
        await G2Handlers.enterValue('GenericLocators.EnterCustomerID', id);
      } else if (searchby == 'First Name + Last Name') {
        await G2Handlers.selectOption('Search By', searchby, 'customDropdownLocator');
        await G2Handlers.enterValue('First Name', firstname, 'textboxUsingLabel');
        await G2Handlers.enterValue('Last Name', lastname, 'textboxUsingLabel');
      } else {
        await G2Handlers.selectOption('Search By', searchby, 'customDropdownLocator');
        await G2Handlers.enterValue('Middle Name', middlename, 'textboxUsingLabel');
      }
    } else if (pageName == 'Organization Operator') {
      await G2Handlers.enterValue(tObj['SearchBy'], searchValue, 'textboxUsingLabel');
      await G2Handlers.enterValue('Operator Id', operatorId, 'textboxUsingLabel');
    } else {
      await G2Handlers.enterValue(tObj['SearchBy'], searchValue, 'textboxUsingLabel');
    }
    await G2Handlers.clickOnElement('Search', 'buttonCite');
    await TM.wait(1);
    /*Here We can close the search*/
    var remark = 'Closing this ' + pageName + ' for Testing Purpose';
    if (typeof closesearch !== 'undefined' && closesearch == 'yes') {
      await G2Handlers.clickValueOnTableData(
        tObj['TableId'],
        tableValues + '|' + tObj['Status'],
        'Close',
        'Operation',
      );
      await G2Handlers.enterTextAreaValue('Remark', remark, 'customTextAreaLocatorInDialogWindow');
      if (pageName == 'Customer' || pageName == 'Organization') {
        await G2Handlers.clickOnElement('Submit', 'buttondialoguewithindex');
      } else if (pageName == 'Organization Operator') {
        await G2Handlers.clickOnElement('Confirm', 'buttonSpanwithindex');
      } else {
        await G2Handlers.clickOnElement('Confirm', 'buttondialoguewithindex');
      }
    } else {
      await G2Handlers.clickValueOnTableData(
        tObj['TableId'],
        tableValues + '|' + tObj['Status'],
        'Detail',
        'Operation',
      );
    }
    await G2Handlers.waitForPageLoad();
    await G2Handlers.verifyText(searchValue);
  }

  async closeTheOrg(pageName, tObj) {
    let searchValue = CommonUtils.identifyData(tObj['SearchValue']),
      tableValues = CommonUtils.identifyData(tObj['TableValues']),
      orgShortcode = CommonUtils.identifyData(tObj['Organization Short Code']);
    await AdminPage.leftmenunavigation('Organization');
    await G2Handlers.enterValue(tObj['SearchBy'], searchValue, 'textboxUsingLabel');
    await G2Handlers.clickOnElement('Search', 'buttonCite');
    await TM.wait(1);
    await G2Handlers.clickValueOnTableData(
      tObj['TableId'],
      tableValues + '|' + tObj['Status'],
      'Detail',
      'Operation',
    );
    await G2Handlers.enterTextAreaValue('Remark', 'Test', 'customTextAreaLocatorInDialogWindow');
    await G2Handlers.clickOnElement('Submit', 'buttondialoguewithindex');
    await G2Handlers.clickOnElement('GenericLocators.Confirm');
  }

  async editMsisdnStatus(msisdn) {
    // let identityMsisdnEdit = 'orgpage.edit Msisdn';
    // TM.wait('5');
    await G2Handlers.clickOnElement('GenericLocators.EditMSISDNSP');
    // await G2Handlers.clickOnElement(identityMsisdnEdit);
    await G2Handlers.enterTextAreaValue('Please enter', msisdn, 'msisdnText');
    await G2Handlers.enterTextAreaValue(
      'Please enter content',
      CommonUtils.identifyData('Reason Description'),
      'RemarkMsisdntextlocator',
    );
    await ButtonLink.clickOnElement('GenericLocators.TillMsisdnSubmit');
    await G2Handlers.verifyText('MSISDN edited successfully');
  }

  async orgeditIdentityStatus(status) {
    let identityStatusEdit = 'orgpage.Identity Status Edit1';
    TM.wait('5');
    await G2Handlers.clickOnElement(identityStatusEdit);
    await G2Handlers.selectOption('Please select', status, 'OrgbuttonDropDownInDialogWindow');

    await G2Handlers.enterTextAreaValue(
      'Please enter',
      CommonUtils.identifyData('Reason Description'),
      'textAreaLoc',
    );
    await ButtonLink.clickOnElement('GenericLocators.OrgTillStatus');
    // await G2Handlers.verifyText('Change Status SUCCESS');
  }

  async editIdentityStatus(detail, status) {
    let identityStatusEdit = null;
    if (detail == 'Customer') {
      identityStatusEdit = 'customerpage.Modify_Status';
      await G2Handlers.clickOnElement(identityStatusEdit);
      await G2Handlers.selectOption(
        'Please select status',
        status,
        'OrgbuttonDropDownInDialogWindow',
      );
    } else if (detail == 'Organization') {
      identityStatusEdit = 'orgpage.editStatusInOrg';
      await G2Handlers.clickOnElement(identityStatusEdit);
      await G2Handlers.selectOption(
        'Please select status',
        status,
        'OrgbuttonDropDownInDialogWindow',
      );
      await G2Handlers.selectOption('Please Select', 'Not Use', 'OrgbuttonDropDownInDialogWindow');
    } else if (detail == 'Organization operator') {
      identityStatusEdit = 'orgpage.editStatusInOrg';
      await G2Handlers.clickOnElement(identityStatusEdit);
      await G2Handlers.selectOption('newStatus', status, 'buttonDropDownInDialogWindow');
      await G2Handlers.selectOption('reasonId', 'Not Use', 'buttonDropDownInDialogWindow');
    } else if (detail == 'Group') {
      identityStatusEdit = 'orgpage.Identity Status Edit';
      await G2Handlers.clickOnElement(identityStatusEdit);
      await G2Handlers.selectOption(
        'New Identity Status',
        status,
        'buttonDropDownGroupIdentityStatus',
      );
    } else {
      identityStatusEdit = 'orgpage.editStatusInTill';
      await G2Handlers.clickOnElement(identityStatusEdit);
      await G2Handlers.selectOption('newStatus', status, 'buttonTillstatus');
    }
    await G2Handlers.enterTextAreaValue(
      'Remark',
      CommonUtils.identifyData('Reason Description'),
      'customTextAreaLocatorInDialogWindow',
    );

    if (detail == 'Customer' || detail == 'Organization') {
      await ButtonLink.clickOnElement('GenericLocators.SubmitButtonInOrgChangeStatus');
    } else if (detail == 'Organization operator') {
      await ButtonLink.clickOnElement('GenericLocators.ConfirmProduct');
    } else if (detail == 'Group') {
      await ButtonLink.clickOnElement('GenericLocators.SubmitButtonInGroupChangeStatus');
    } else {
      await ButtonLink.clickOnElement('GenericLocators.TillstatusSubmit');
    }
    if (detail == 'Organization' || detail == 'Organization operator') {
      await G2Handlers.clickOnElement('GenericLocators.ConfirmMakerchecker');
    }
  }
  async editcusIdentityStatus(status) {
    let identityStatusEdit = 'orgpage.Identity Status Edit';
    TM.wait('5');
    await G2Handlers.clickOnElement(identityStatusEdit);
    await G2Handlers.selectOption('newStatus', status, 'buttonDropDownInDialogWindow');
    //await G2Handlers.selectOption('reasonId', 'Not Use', 'buttonDropDownInDialogWindow');
    await G2Handlers.enterTextAreaValue(
      'Remark',
      CommonUtils.identifyData('Reason Description'),
      'customTextAreaLocatorInDialogWindow',
    );
    await ButtonLink.clickOnElement('GenericLocators.SubmitChangeStatusCustomer');
    //await G2Handlers.verifyText('Change Status SUCCESS!');
  }
  async defaultOperatorId(value, remark) {
    let defaultOperatorIdEdit = 'orgpage.default operator Edit';
    TM.wait('5');
    await G2Handlers.clickOnElement(defaultOperatorIdEdit);
    await G2Handlers.selectOption('Please select', value, 'buttonDropdownoper');
    await G2Handlers.enterTextAreaValue('Please enter content', remark, 'remarkTextlocator');
    await ButtonLink.clickOnElement('GenericLocators.SubmitChangesOperatorID');
  }
  async changeAccountstatusTable(status, account) {
    await TM.scrollIntoView(CommonUtils.identifyLocator('GenericLocators.ScrollExport'), 'false');
    //await G2Handlers.waitForPageLoad();
    await TM.wait(3);
    await G2Handlers.clickOnElement(account, 'changeAccountStatus');
    await G2Handlers.selectOption(
      'Please select status',
      status,
      'OrgbuttonDropDownInDialogWindow',
    );
    await G2Handlers.enterTextAreaValue(
      'Remark',
      CommonUtils.identifyData('Reason Description'),
      'customTextAreaLocatorInDialogWindow',
    );
    await G2Handlers.clickOnElement('GenericLocators.SubmitChangesOperatorID');
    await G2Handlers.clickOnElement('GenericLocators.SubmitAccountStatus');
  }
  async LanguageEdit(value, remark) {
    let EditLanguage = 'orgpage.edit language';
    TM.wait('5');
    await G2Handlers.clickOnElement(EditLanguage);
    await G2Handlers.selectOption('Please select language', value, 'buttonChangelanguage');
    await G2Handlers.enterTextAreaValue('Please enter content', remark, 'remarklocator');
    await ButtonLink.clickOnElement('GenericLocators.SubmitLanguage');
  }
  async LanguageEditInorg(value, remark) {
    let EditLanguageinOrg = 'orgpage.LanguageeditinOrg';
    TM.wait('5');
    await G2Handlers.clickOnElement(EditLanguageinOrg);
    await G2Handlers.clickOnElement('GenericLocators.Dropdown');
    await G2Handlers.clickOnElement(value, 'buttonDropDownValueOrg');
    await G2Handlers.enterTextAreaValue('Please enter content', remark, 'remarklocator');
    await ButtonLink.clickOnElement('GenericLocators.SubmitChangesOperatorID');
  }

  async initiateTransaction(tObj) {
    let {
      Transaction_Services,
      Reason_Type,
      Receiver_Identifier_MSISDN,
      Receiver_Identifier_Short_Code,
      Receiver_Identifier_Till_MSISDN,
      Amount,
      Reason,
      Primary_Identifier_ShortCode,
      Receiving_Bank_Account,
      Primary_Identifier_Account_Type,
      Receiver_Identifier_Account,
      Receiver_Identifier_Account_Type,
      Requester_Type,
      Requester_MSISDN,
    } = { ...tObj };
    let trans = CommonUtils.identifyData(tObj['Transaction_Services']);
    let number = await G2Handlers.grabNumberOfVisibleElements(
      CommonUtils.identifyData('InitiateTransPage.Sp'),
    );
    let ReceiverIdentifier = CommonUtils.identifyData(tObj['Receiver_Identifier_Account_Type']);
    await G2Handlers.waitForPageLoad();
    if (number == 0) {
      //org portal transaction
      await G2Handlers.clickOnElement('Identity Center', 'buttonInTopMenu');
      await G2Handlers.clickOnElement('Transaction Center', 'buttonInTopMenu');
      await TM.scrollIntoView(CommonUtils.identifyLocator('InitiateTransPage.TranService'), 'true');
      //Trans service
      if (typeof Transaction_Services !== 'undefined') {
        await G2Handlers.selectOption(
          'Transaction Services',
          Transaction_Services,
          'customDropdownLocator',
        );
      }
      //Reasontype
      if (typeof Reason_Type !== 'undefined') {
        await G2Handlers.selectOption('Reason Type', Reason_Type, 'customDropdownLocator');
      }
      //Primary shortcode
      if (typeof Primary_Identifier_ShortCode !== 'undefined') {
        await G2Handlers.enterValue(
          'Short Code',
          Primary_Identifier_ShortCode,
          'textboxUsingLabel',
        );
      }
      //primary acc type
      if (typeof Primary_Identifier_Account_Type !== 'undefined') {
        await G2Handlers.selectOption(
          CommonUtils.identifyLocator('InitiateTransPage.Primary_Identifier_Account_org'),
          Primary_Identifier_Account_Type,
        );
      }
      //Requester Type
      if (typeof Requester_Type !== 'undefined') {
        await TM.scrollIntoView(
          CommonUtils.identifyLocator('InitiateTransPage.ScrollDetails'),
          'true',
        );
        await G2Handlers.selectOption(
          CommonUtils.identifyLocator('InitiateTransPage.Requester'),
          Requester_Type,
        );
        await G2Handlers.enterValue('InitiateTransPage.RequesterMsisdn', Requester_MSISDN);
        Requester_MSISDN;
      }

      //Rec Acc Type
      if (typeof Receiver_Identifier_Account_Type !== 'undefined') {
        await TM.scrollIntoView(
          CommonUtils.identifyLocator('InitiateTransPage.ScrollRecIdentifier'),
          'false',
        );
        //logic-shortcode
        if (ReceiverIdentifier == 'Short Code') {
          await G2Handlers.selectOption(
            CommonUtils.identifyLocator('InitiateTransPage.Receiver_Identifier_Account_org'),
            Receiver_Identifier_Account_Type,
          );
          await G2Handlers.enterValue(
            'InitiateTransPage.RecShortcode',
            Receiver_Identifier_Short_Code,
          );
          await TM.scrollIntoView(
            CommonUtils.identifyLocator('InitiateTransPage.ScrollDetails'),
            'true',
          );
          await G2Handlers.clickOnElement('Verify', 'buttonToView');
        } //Till Msisdn
        else if (ReceiverIdentifier == 'Till MSISDN') {
          await G2Handlers.selectOption(
            CommonUtils.identifyLocator('InitiateTransPage.Receiver_Identifier_Account_org'),
            Receiver_Identifier_Account_Type,
          );
          await G2Handlers.enterValue(
            'InitiateTransPage.RecTillMsisdn',
            Receiver_Identifier_Till_MSISDN,
          );
          await TM.scrollIntoView(
            CommonUtils.identifyLocator('InitiateTransPage.ScrollDetails'),
            'true',
          );
          await G2Handlers.clickOnElement('Verify', 'buttonToView');
        } //Msisdn
        else if (ReceiverIdentifier == 'MSISDN') {
          await G2Handlers.clickOnElement(
            CommonUtils.identifyLocator('InitiateTransPage.Receiver_Identifier_Account_org'),
          );
          await G2Handlers.clickOnElement(
            CommonUtils.identifyLocator('InitiateTransPage.RecMSISDNInDropdown'),
          );

          await G2Handlers.enterValue('InitiateTransPage.RecMsisdn', Receiver_Identifier_MSISDN);
          await TM.scrollIntoView(
            CommonUtils.identifyLocator('InitiateTransPage.ScrollDetails'),
            'true',
          );
          await G2Handlers.clickOnElement('Verify', 'buttonToView');
        }
      }
      //Receiver iden Account
      if (typeof Receiver_Identifier_Account !== 'undefined') {
        await G2Handlers.clickOnElement(
          CommonUtils.identifyLocator('InitiateTransPage.RecAccountName'),
        );
        await G2Handlers.clickOnElement(Receiver_Identifier_Account, '  buttonSpanwithindex');
      }
      //Amount
      await TM.scrollIntoView(CommonUtils.identifyLocator('InitiateTransPage.Amount(M)'), 'false');
      await G2Handlers.enterValue('InitiateTransPage.AmountOrg', Amount);

      //BankAcc
      if (typeof Receiving_Bank_Account !== 'undefined') {
        await TM.scrollIntoView(
          CommonUtils.identifyLocator('InitiateTransPage.ScrollBank'),
          'false',
        );
        await G2Handlers.selectOption(
          CommonUtils.identifyLocator('InitiateTransPage.RecBankOrg'),
          Receiving_Bank_Account,
        );
      }
      await G2Handlers.enterTextAreaValue('Remark', Reason, 'customTextAreaLocator');
      await G2Handlers.selectOption(
        CommonUtils.identifyLocator('InitiateTransPage.Reasondrop'),
        'Input Manually ...',
      );
      await G2Handlers.enterValue('InitiateTransPage.ReasonOrg', Reason);
      await G2Handlers.clickOnElement(' Submit ', 'buttonCite');
      await G2Handlers.waitForPageLoad();
      let Error = await G2Handlers.grabNumberOfVisibleElements(
        CommonUtils.identifyData('InitiateTransPage.Error'),
      );
      if (Error == 1) {
        await G2Handlers.clickOnElement(CommonUtils.identifyLocator('InitiateTransPage.Confirm'));
      } else {
        await IFrame.switchToCurrentWindowHandle();
        let popup = await G2Handlers.grabNumberOfVisibleElements(
          "//div[@role='dialog' and @aria-label='Transaction Budget Confirm']",
        );
        let popup1 = await G2Handlers.grabNumberOfVisibleElements(
          "//div[@role='dialog' and @aria-label='Transaction Budget']",
        );
        if (popup !== 0) {
          await G2Handlers.clickOnElement('Confirm', 'buttonSpanwithindex');
        }
        if (popup1 !== 0) {
          await G2Handlers.clickOnElement(' Continue ', 'buttonSpanwithindex');
        }
        await TM.scrollPageToTop();
        await G2Handlers.clickOnElement(' View Detail >> ', 'buttonToView');
        await TM.switchToNextTab();
        await G2Handlers.waitForPageLoad();
        let receiptNum = await TM.grabTextFrom(
          "//label[text()='Receipt No.']//following-sibling::div",
        );
        TestData.setField('transactionReceiptNum', receiptNum);
        let status = await TM.grabTextFrom("//label[text()='Status']//following-sibling::div");
        TestData.setField('strStatus', status);
      }
    } else {
      //Sp- portal
      await ButtonLink.clickOnElement('GenericLocators.Transaction');
      await ButtonLink.clickOnElement('GenericLocators.InitiateTransaction');
      if (typeof Transaction_Services !== 'undefined') {
        await G2Handlers.selectOption(
          'Transaction Services',
          Transaction_Services,
          'customDropdownLocator',
        );
      }
      if (typeof Reason_Type !== 'undefined') {
        await G2Handlers.selectOption('Reason Type', Reason_Type, 'customDropdownLocator');
      }
      if (typeof Primary_Identifier_Account_Type !== 'undefined') {
        await G2Handlers.selectOption(
          CommonUtils.identifyLocator('InitiateTransPage.Primary_Identifier_Account_Type'),
          Primary_Identifier_Account_Type,
        );
      }
      if (typeof Receiver_Identifier_Account_Type !== 'undefined') {
        await G2Handlers.selectOption(
          CommonUtils.identifyLocator('InitiateTransPage.Receiver_Identifier_Account_Type'),
          Receiver_Identifier_Account_Type,
        );
        if (ReceiverIdentifier == 'Short Code') {
          await G2Handlers.enterValue(
            'Short Code',
            Receiver_Identifier_Short_Code,
            'textboxUsingLabel',
          );
          await G2Handlers.clickOnElement(' Verify ', 'buttonInSpan1');
        } else if (ReceiverIdentifier == 'Till MSISDN') {
          await G2Handlers.enterValue(
            'Till MSISDN',
            Receiver_Identifier_Till_MSISDN,
            'textboxUsingLabel',
          );
          await G2Handlers.clickOnElement(' Verify ', 'buttonInSpan1');
        } else if (ReceiverIdentifier == 'MSISDN') {
          await G2Handlers.enterValue('MSISDN', Receiver_Identifier_MSISDN, 'textboxUsingLabel');
          await G2Handlers.clickOnElement(' Verify ', 'buttonInSpan1');
        }
      }
      if (typeof Receiver_Identifier_Account !== 'undefined') {
        await G2Handlers.clickOnElement(
          CommonUtils.identifyLocator('InitiateTransPage.Receiver_Identifier_Account'),
        );
        await G2Handlers.clickOnElement(Receiver_Identifier_Account, 'buttonInSpan1');
      }
      await G2Handlers.enterValue('InitiateTransPage.Amount', Amount);

      if (typeof Receiving_Bank_Account !== 'undefined') {
        await G2Handlers.selectOption(
          CommonUtils.identifyLocator('InitiateTransPage.RecBankAcc'),
          Receiving_Bank_Account,
        );
      }
      await G2Handlers.enterTextAreaValue('Remark', Reason, 'customTextAreaLocator');
      await G2Handlers.selectOption(
        CommonUtils.identifyLocator('InitiateTransPage.Reasondrop'),
        'Input Manually ...',
      );
      await G2Handlers.enterValue('InitiateTransPage.Reason', Reason);
      await G2Handlers.clickOnElement(' Submit ', 'buttonCite');
      await G2Handlers.waitForPageLoad();
      await IFrame.switchToCurrentWindowHandle();
      let popup = await G2Handlers.grabNumberOfVisibleElements(
        "//div[@role='dialog' and @aria-label='Transaction Budget']",
      );
      if (popup !== 0) {
        await G2Handlers.clickOnElement(' Continue ', 'buttonCite');
      }
      // if (trans == 'Salary Payment To Customer') {
      //   await G2Handlers.verifyText(
      //     'The transaction has been processed, and need be approved by another operator.',
      //   );
      // } else {
      //   await G2Handlers.verifyText('Initiate Transaction submitted successfully.');
      // }
      await G2Handlers.clickOnElement(' View Detail >> ', 'buttonToView');
      await G2Handlers.waitForPageLoad();
      TM.waitForElement(await CommonUtils.identifyLocator('InitiateTransPage.ReceiptNo'));
      let receiptNum = await TM.grabTextFrom(
        "//p[text()=' Receipt No.  ']//following-sibling::p[@class='descriptions-item__content']",
      );

      TestData.setField('transactionReceiptNum', receiptNum);
      let status = await TM.grabTextFrom(
        "//p[text()=' Status  ']//following-sibling::p[@class='descriptions-item__content']",
      );
      TestData.setField('strStatus', status);
    }
  }

  async verifyTakeACall(tObj) {
    let query = CommonUtils.identifyData(tObj['Query Condition']),
      firstname = CommonUtils.identifyData(tObj['First Name']),
      lastname = CommonUtils.identifyData(tObj['Last Name']),
      middlename = CommonUtils.identifyData(tObj['Middle Name']),
      idtype = CommonUtils.identifyData(tObj['ID Type']),
      id = CommonUtils.identifyData(tObj['ID']),
      identityId = CommonUtils.identifyData(tObj['Identity ID']),
      custype = CommonUtils.identifyData(tObj['Customer Type']),
      msisdn = CommonUtils.identifyData(tObj['MSISDN']),
      btn = CommonUtils.identifyData(tObj['btnName']),
      dob = CommonUtils.identifyData(tObj['Date of Birth']),
      secret = CommonUtils.identifyData(tObj['SecretAnswer']);

    await LeftMenuPage.navigateToLeftChildMenu('User Service', 'buttonLeftChildMenu');
    await G2Handlers.selectOption('Query Condition', query, 'customDropdownLocator');
    if (query == 'Identity Id') {
      await G2Handlers.selectOption('Customer Type', custype, 'customDropdownLocator');
      await G2Handlers.enterValue('Identity ID', identityId, 'textboxUsingLabel');
    } else if (query == 'MSISDN') {
      await G2Handlers.enterValue('MSISDN', msisdn, 'textboxUsingLabel');
    } else if (query == 'First Name + Last Name') {
      await G2Handlers.enterValue('First Name', firstname, 'textboxUsingLabel');
      await G2Handlers.enterValue('Last Name', lastname, 'textboxUsingLabel');
    } else if (query == 'Middle Name') {
      await G2Handlers.enterValue('Middle Name', middlename, 'textboxUsingLabel');
    } else if (query == 'ID') {
      await G2Handlers.selectOption('ID Type', idtype, 'customDropdownLocator');
      await G2Handlers.enterValue('ID', id, 'textboxUsingLabel');
    } else {
      await G2Handlers.enterValue('Date of Birth', dob, 'textboxUsingLabel');
    }

    await G2Handlers.clickOnElement(' Search ', 'buttonCite');
    await TM.wait(3);
    await G2Handlers.clickOnElement(' Search ', 'buttonCite');
    await G2Handlers.clickValueOnTableData(
      'Table.CustomerInUserService',
      msisdn + '|',
      'Detail',
      'Operation',
    );

    await G2Handlers.verifyText('Verify Customer');
    await G2Handlers.waitForPageLoad();

    await this.clickOnAllButton(btn);
    await TM.scrollIntoView(
      CommonUtils.identifyLocator('GenericLocators.ScrollVerification'),
      'false',
    );
    await this.clickOnAllButton(btn);
    if (secret !== 'udefined') {
      await G2Handlers.enterValue('Secret Answer', secret, 'textboxUsingLabel');
    }
  }

  async clickOnAllButton(btnName) {
    let noOfEle = null;
    let locator = null;
    logger.debug('Clicking on all Button - ' + btnName);
    await G2Handlers.waitForPageLoad();
    if (btnName.toLowerCase() == 'pass') {
      locator = CommonUtils.identifyLocator('GenericLocators.PassButtonForTakeACall');
      noOfEle = await TM.grabNumberOfVisibleElements(locator);
    } else {
      locator = CommonUtils.identifyLocator('GenericLocators.FailButtonForTakeACall');
      noOfEle = await TM.grabNumberOfVisibleElements(locator);
    }
    if (noOfEle != 0) {
      for (let i = 1; i <= noOfEle; i++) {
        TM.click(locator);
      }
    } else {
      logger.info('Button not found - ' + btnName);
      throw new Error('Button not found for ' + btnName);
    }
  }

  async switchToCurrentWindowFrame() {
    await IFrame.switchToCurrentWindowHandle();
    await IFrame.switchToMainPage();
    await IFrame.switchToLastFrame();
    await IFrame.switchToNextFrame();
  }

  async switchToLeftHandMenuIframe() {
    await IFrame.switchToMainPage();
    await IFrame.switchToCurrentWindowHandle();
    await IFrame.switchToLastFrame();
  }

  async enterValueOnTable(columnName, value, tableName) {
    var locator =
      CommonUtils.identifyLocator(tableName) +
      CommonUtils.identifyLocator('GenericLocators.CommonPathForTable');
    locator = locator.replace('REPLACE_TEXT', columnName);
    let columnIndexInInt = 0;
    if (columnName == 'ID Number') {
      columnIndexInInt = 2;
    }
    var tableItemField = locate(
      locator +
        "/../../../../..//table[@class='el-table__body']/tbody//td[" +
        columnIndexInInt +
        ']//input',
    );
    await G2Handlers.enterValue(tableItemField, value);
  }

  async selectValueOnTable(columnName, value, tableName) {
    var locator =
      CommonUtils.identifyLocator(tableName) +
      CommonUtils.identifyLocator('GenericLocators.CommonPathForTable');
    locator = locator.replace('REPLACE_TEXT', columnName);
    let columnIndexInInt = 0;
    if (columnName == 'ID Type') {
      columnIndexInInt = 1;
    } else if (columnName == 'Document Received') {
      columnIndexInInt = 4;
    }

    var tableItemField = locate(
      locator +
        "/../../../../..//table[@class='el-table__body']/tbody//td[" +
        columnIndexInInt +
        ']//input',
    );
    await G2Handlers.clickOnElement(tableItemField);
    await G2Handlers.clickOnElement(value, 'contactTypeIdOptions');
  }

  async editKYCInfo(tObj) {
    let {
      First_Name,
      Last_Name,
      Sourceof_Funds,
      Trust_Level,
      Date_Of_Birth,
      Secret_Answer,
      Reason,
      ID_Type,
      ID_Number,
      Document_Received,
      GuardianID_Number,
      Post_Code,
      City_Town,
      Secret_Question,
      Postal_Address,
      Physical_Address,
      Betting,
      AddressLine,
      PreferredContact_Number,
    } = { ...tObj };
    await IFrame.switchToNextFrame();
    await G2Handlers.clickOnElement('KYC Info', 'buttonLeftMenu');
    await G2Handlers.clickOnElement('GenericLocators.EditKYC');
    if (typeof Trust_Level !== 'undefined') {
      await G2Handlers.selectOption('Trust Level', Trust_Level, 'customDropdownLocator');
    }
    if (typeof First_Name !== 'undefined') {
      await G2Handlers.enterValue('First Name', First_Name, 'textboxUsingLabel');
    }
    if (typeof Last_Name !== 'undefined') {
      await G2Handlers.enterValue('Last Name', Last_Name, 'textboxUsingLabel');
    }
    if (typeof Date_Of_Birth !== 'undefined') {
      await G2Handlers.selectOption('Date Of Birth', Date_Of_Birth, 'customDropdownLocator');
    }
    if (typeof Secret_Answer !== 'undefined') {
      await G2Handlers.enterValue('Secret Answer', Secret_Answer, 'textboxUsingLabel');
    }
    if (typeof GuardianID_Number !== 'undefined') {
      await G2Handlers.enterValue('Guardian ID Number', GuardianID_Number, 'textboxUsingLabel');
    }
    if (typeof Post_Code !== 'undefined') {
      await G2Handlers.enterValue('Post Code', Post_Code, 'textboxUsingLabel');
    }
    if (typeof Postal_Address !== 'undefined') {
      await G2Handlers.enterValue('Postal Address', Postal_Address, 'textboxUsingLabel');
    }
    if (typeof Physical_Address !== 'undefined') {
      await G2Handlers.enterValue('Physical Address', Physical_Address, 'textboxUsingLabel');
    }
    if (typeof City_Town !== 'undefined') {
      await G2Handlers.enterValue('City or Town', City_Town, 'textboxUsingLabel');
    }
    if (typeof Secret_Question !== 'undefined') {
      await G2Handlers.selectOption('Secret Question', Secret_Question, 'customDropdownLocator');
    }
    if (typeof Betting !== 'undefined') {
      await G2Handlers.selectOption('Betting and Gaming', Betting, 'customDropdownLocator');
    }

    if (typeof Secret_Answer !== 'undefined') {
      await G2Handlers.enterValue('Secret Answer', Secret_Answer, 'textboxUsingLabel');
    }
    if (typeof PreferredContact_Number !== 'undefined') {
      await G2Handlers.enterValue(
        'Preferred Contact Phone Number',
        PreferredContact_Number,
        'textboxUsingLabel',
      );
    }
    if (typeof ID_Type !== 'undefined') {
      await this.selectValueOnTable(
        'ID Type',
        ID_Type,
        'createtoporgpage.Organization_Contact_Details',
      );
    }
    if (typeof ID_Number !== 'undefined') {
      await this.enterValueOnTable(
        'ID Number',
        ID_Number,
        'createtoporgpage.Organization_Contact_Details',
      );
    }
    if (typeof Document_Received !== 'undefined') {
      await G2Handlers.clickOnElement('createtoporgpage.Document_Received');
      //await this.selectValueOnTable(
      //'Document Received',
      //Document_Received,
      //'createtoporgpage.Organization_Contact_Details',
      // );
      await G2Handlers.clickOnElement(Document_Received, 'documentreceived');
    }
    if (typeof Sourceof_Funds !== 'undefined') {
      await G2Handlers.selectOption('Source of Funds', Sourceof_Funds, 'customDropdownLocator');
    }
    if (typeof AddressLine !== 'undefined') {
      await G2Handlers.enterValue('Address Line 1', AddressLine, 'textboxUsingLabel');
    }
    await G2Handlers.enterTextAreaValue('Remark', Reason, 'customTextAreaLocator');
    await G2Handlers.clickOnElement('GenericLocators.Button-list');
    let popup = await G2Handlers.grabNumberOfVisibleElements(
      CommonUtils.identifyLocator('createtoporgpage.CustomerKYCPopup'),
    );
    if (popup == 1) {
      await G2Handlers.clickOnElement('createtoporgpage.ConfirmKYC');
    }
    let sucess = await G2Handlers.grabNumberOfVisibleElements(
      CommonUtils.identifyLocator('createtoporgpage.success'),
    );
    if (sucess == 1) {
      await G2Handlers.clickOnElement('GenericLocators.ConfirmException');
    }
  }
  async enterkycValueOnTable(columnName, value, tableName) {
    var locator =
      CommonUtils.identifyLocator(tableName) +
      CommonUtils.identifyLocator('GenericLocators.CommonPathForTable');
    locator = locator.replace('REPLACE_TEXT', columnName);
    let columnIndexInInt = 0;
    if (columnName == 'Contact Type') {
      columnIndexInInt = 1;
    } else if (columnName == 'Contact First Name') {
      columnIndexInInt = 2;
    } else if (columnName == 'Contact Surname') {
      columnIndexInInt = 4;
    } else if (columnName == 'Contact Phone Number') {
      columnIndexInInt = 5;
    } else if (columnName == 'Contact ID Type') {
      columnIndexInInt = 6;
    } else {
      columnIndexInInt = 7;
    }
    var tableItemField = locate(
      locator +
        "/../../../../..//table[@class='el-table__body']/tbody//td[" +
        columnIndexInInt +
        ']//input',
    );
    await G2Handlers.enterValue(tableItemField, value);
  }

  async selectkycValueOnTable(columnName, value, tableName) {
    var locator =
      CommonUtils.identifyLocator(tableName) +
      CommonUtils.identifyLocator('GenericLocators.CommonPathForTable');
    locator = locator.replace('REPLACE_TEXT', columnName);
    let columnIndexInInt = 0;
    if (columnName == 'Contact Type') {
      columnIndexInInt = 1;
    } else if (columnName == 'Contact First Name') {
      columnIndexInInt = 2;
    } else if (columnName == 'Contact Phone Number') {
      columnIndexInInt = 5;
    } else if (columnName == 'Contact ID Type') {
      columnIndexInInt = 6;
    } else {
      columnIndexInInt = 7;
    }
    var tableItemField = locate(
      locator +
        "/../../../../..//table[@class='el-table__body']/tbody//td[" +
        columnIndexInInt +
        ']//input',
    );
    await G2Handlers.clickOnElement(tableItemField);
    await G2Handlers.clickOnElement(value, 'contactTypeIdOptions');
  }
  async selectRegion(regionName) {
    await G2Handlers.clickOnElement('createtoporgpage.Region_Ellipsis');
    await G2Handlers.enterValue('Select Region', regionName, 'optionForRegInTopOrg');
    await G2Handlers.clickOnElement(regionName, 'buttonForRegion');
    await G2Handlers.clickOnElement(' Confirm ', 'confirmButtonInRegion');
  }

  async editorgKYCInfo(tObj) {
    let {
      Trust_Level,
      Classi_fication,
      Region,
      contactType,
      contactFirstName,
      contactSurname,
      contactPhoneNumber,
      contactIDNumber,
      contactIdType,
      OrganisationCategoryCode,
      OfficePhoneNumber,
      PreferredNotificationChannel,
      NotificationReceivingEmail,
      ContactPhysicalAddress,
      ContactAddress2,
      ContactPostCode,
      ContactCityorTown,
      PreferredNotificationLanguage,
      currency,
      Reason,
      City_Town,
      TypeofBusiness,
      Postal_Address,
      Physical_Address,
      Settlementnumber,
    } = { ...tObj };
    //let regionName = CommonUtils.identifyData(tObj['Region']);
    await IFrame.switchToNextFrame();
    await G2Handlers.clickOnElement('KYC Info', 'buttonLeftMenu');
    await G2Handlers.clickOnElement('GenericLocators.EditKYC');

    if (typeof Trust_Level !== 'undefined') {
      await G2Handlers.selectOption('Trust Level', Trust_Level, 'customDropdownLocator');
    }
    if (typeof Classi_fication !== 'undefined') {
      await G2Handlers.selectOption('Classification', Classi_fication, 'customDropdownLocator');
    }
    if (typeof Region !== 'undefined') {
      await this.selectRegion(Region);
    }
    if (typeof Settlementnumber !== 'undefined') {
      await G2Handlers.enterValue('Settlement number', Settlementnumber, 'textboxUsingLabel');
    }

    if (typeof Postal_Address !== 'undefined') {
      await G2Handlers.enterValue('Postal Address', Postal_Address, 'textboxUsingLabel');
    }
    if (typeof Physical_Address !== 'undefined') {
      await G2Handlers.enterValue('Physical Address', Physical_Address, 'textboxUsingLabel');
    }
    if (typeof OfficePhoneNumber !== 'undefined') {
      await G2Handlers.enterValue('Office Phone Number', OfficePhoneNumber, 'textboxUsingLabel');
    }

    if (typeof City_Town !== 'undefined') {
      await G2Handlers.enterValue('City or Town', City_Town, 'textboxUsingLabel');
    }

    if (typeof TypeofBusiness !== 'undefined') {
      await G2Handlers.clickOnElement('GenericLocators.Organizationcategory');
      await G2Handlers.clickOnElement(TypeofBusiness, 'buttonInSpan1');
    }
    if (typeof OrganisationCategoryCode !== 'undefined') {
      await G2Handlers.clickOnElement('GenericLocators.OrganisationCategoryCode');
      await G2Handlers.clickOnElement(OrganisationCategoryCode, 'buttonInSpan1');
    }

    if (typeof PreferredNotificationChannel !== 'undefined') {
      await G2Handlers.selectOption(
        'Preferred Notification Channel',
        PreferredNotificationChannel,
        'customDropdownLocator',
      );
    }
    if (typeof NotificationReceivingEmail !== 'undefined') {
      await G2Handlers.enterValue(
        'Notification Receiving E-mail',
        NotificationReceivingEmail,
        'customDropdownLocator',
      );
    }

    if (typeof PreferredNotificationLanguage !== 'undefined') {
      await G2Handlers.selectOption(
        'Preferred Notification Language',
        PreferredNotificationLanguage,
        'customDropdownLocator',
      );
    }

    if (typeof ContactPhysicalAddress !== 'undefined') {
      await G2Handlers.enterValue(
        'Contact Physical Address',
        ContactPhysicalAddress,
        'customDropdownLocator',
      );
    }

    if (typeof ContactAddress2 !== 'undefined') {
      await G2Handlers.enterValue('Contact Address 2', ContactAddress2, 'customDropdownLocator');
    }

    if (typeof ContactPostCode !== 'undefined') {
      await G2Handlers.enterValue('Contact Post Code', ContactPostCode, 'customDropdownLocator');
    }

    if (typeof ContactCityorTown !== 'undefined') {
      await G2Handlers.enterValue(
        'Contact City or Town',
        ContactCityorTown,
        'customDropdownLocator',
      );
    }

    if (typeof contactType !== 'undefined') {
      await this.selectkycValueOnTable(
        'Contact Type',
        contactType,
        'createtoporgpage.Organization_Contact_Details',
      );
    }
    if (typeof contactFirstName !== 'undefined') {
      await this.enterkycValueOnTable(
        'Contact First Name',
        contactFirstName,
        'createtoporgpage.Organization_Contact_Details',
      );
    }

    if (typeof contactSurname !== 'undefined') {
      await this.enterkycValueOnTable(
        'Contact Surname',
        contactSurname,
        'createtoporgpage.Organization_Contact_Details',
      );
    }
    if (typeof contactPhoneNumber !== 'undefined') {
      await this.enterkycValueOnTable(
        'Contact Phone Number',
        contactPhoneNumber,
        'createtoporgpage.Organization_Contact_Details',
      );
    }
    await TM.scrollIntoView(CommonUtils.identifyLocator('GenericLocators.ScrollContactNo'), 'true');
    if (typeof contactIDNumber !== 'undefined') {
      await this.enterkycValueOnTable(
        'Contact ID Number',
        contactIDNumber,
        'createtoporgpage.Organization_Contact_Details',
      );
    }

    if (typeof contactIdType !== 'undefined') {
      await this.selectkycValueOnTable(
        'Contact ID Type',
        contactIdType,
        'createtoporgpage.Organization_Contact_Details',
      );
    }
    if (typeof currency !== 'undefined') {
      await G2Handlers.enterValue('Currency', currency, 'textboxUsingLabel');
    }
    await G2Handlers.enterTextAreaValue('Remark', Reason, 'customTextAreaLocator');
    await G2Handlers.clickOnElement('GenericLocators.Button-list');
    await G2Handlers.clickOnElement('GenericLocators.Confirm');
  }

  async getTotalRecords(tableID) {
    tableID = CommonUtils.identifyData(tableID);
    let count = await TM.grabTextFrom("label[id='" + tableID + "_page_totalRecord']");
    if (parseInt(count) >= 0) {
      return parseInt(count);
    } else {
      throw new Error('Total records : ' + count);
    }
  }

  async verifyTakeACallForOrganization(tObj) {
    let {
      ShortCode,
      TillNo,
      UserName,
      OperatorID,
      PassOrFail,
      // DateOfBirth,
      // IDNumberDropdown,
      // BalanceOfAccount,
      // AmountOfLastFiveTransactions,
    } = {
      ...tObj,
    };
    await LeftMenuPage.navigateToLeftChildMenu('User Service', 'buttonLeftChildMenu');
    await G2Handlers.clickOnElement('GenericLocators.UserServiceFuncDropdown');
    await G2Handlers.clickOnElement('Organization Operator', 'optionUserService');
    if (typeof TillNo !== 'undefined') {
      await G2Handlers.enterValue('Till No.', TillNo, 'textboxUsingLabel');
    }
    if (typeof ShortCode !== 'undefined') {
      await G2Handlers.enterValue('Organization Short Code', ShortCode, 'textboxUsingLabel');
    }
    if (typeof OperatorID !== 'undefined') {
      await G2Handlers.enterValue('Operator Id', OperatorID, 'textboxUsingLabel');
    }
    if (typeof UserName !== 'undefined') {
      await G2Handlers.enterValue('User Name', UserName, 'textboxUsingLabel');
    }
    await G2Handlers.clickOnElement(' Search ', 'buttonCite');
    await TM.wait(3);
    await G2Handlers.clickOnElement(' Search ', 'buttonCite');
    await G2Handlers.clickValueOnTableData(
      'Table.CustomerInUserService',
      ShortCode + '|',
      'Detail',
      'Operation',
    );

    await G2Handlers.verifyText('Verify Organization Operator');
    await G2Handlers.waitForPageLoad();
    await this.clickOnAllButton(PassOrFail);
    await TM.scrollIntoView(
      CommonUtils.identifyLocator('GenericLocators.ScrollRegisterDate'),
      'false',
    );
    await this.clickOnAllButton(PassOrFail);
  }

  async downloadFile(fileType) {
    await TM.switchHelper('WebDriver');
    TM.wait(15);
    await TM.amInPath('output/downloads');
    let downloadedFileNames = await TM.grabFileNames();
    fileType = fileType.toLowerCase();
    let fileFormat = undefined;
    if (fileType == 'excel') {
      fileFormat = 'xls';
    } else if (fileType == 'xml') {
      fileFormat = 'XML';
    } else if (fileType == 'pdf') {
      fileFormat = 'pdf';
    } else {
      fileFormat = 'csv';
    }
    logger.info('Downloaded file is', fileFormat);
    for (let i = 0; i < downloadedFileNames.length; i++) {
      if (downloadedFileNames[i].toLowerCase().includes(fileFormat)) {
        logger.info('file is downloaded');
        break;
      }
      if (i == downloadedFileNames.length && downloadedFileNames[i].includes(fileFormat)) {
        logger.info('File is downloaded');
      } else {
        throw new Error('unable to download file');
      }
    }
    await CommonUtils.deleteDirectory(globals.outputDir + '\\downloads');
  }

  async formStringAndStoreInAVariable(value1, value2, separator) {
    let formedString = value1 + separator + value2;
    return formedString;
  }

  // TODO - Commented to remove robotjs deps
  // async fileUpload(filePath) {
  //   let testXmlDataPath = join(
  //     globals.testDataDir,
  //     globals.testMarket,
  //     globals.testEnvironment,
  //     'BulkTest',
  //   );
  //   await G2Handlers.clickOnElement('GenericLocators.Upload');
  //   let path = testXmlDataPath + '\\' + filePath;
  //   logger.debug('path : ' + path);
  //   await robot.typeString(path);
  //   await robot.keyTap('enter');
  //   await TM.wait(8);
  //   //await G2Handlers.clickOnElement('GenericLocators.Upload');
  // }

  async findElementWithTagAndValue(locator, locatorValue, strText, strVariable) {
    strText = CommonUtils.identifyData(strText);
    if (
      (await TM.grabNumberOfVisibleElements(
        '//' + locatorValue + "[contains(text(),'" + strText + "')]",
      )) === 0
    ) {
      TestData.setField(strVariable, 'null');
    } else {
      TestData.setField(strVariable, strText);
    }
  }

  async getDataFromEmail(subject) {
    let initialPassword, initialPin, passwordString, pinString, pinMatch, subStr;
    let { emailBody } = await Email.getMessage(subject, Date.now() - 20 * 24 * 3600 * 1000);
    passwordString = CommonUtils.identifyData('Generic.Password Regex');
    subStr = new RegExp(passwordString, 'i');
    initialPassword = emailBody
      .split(subStr)[1]
      .substring(0, CommonUtils.identifyData('Generic.Password Length'));
    TestData.setField('initialPassword', initialPassword);
    pinString = /PIN is\s+(.+)./;
    pinMatch = pinString.exec(emailBody);
    if (pinMatch !== null) {
      initialPin = pinMatch[1].substring(0, 4);
    }
    return { initialPassword, initialPin };
  }

  async topupIdentities(receiverType, fundIndentityVal) {
    key = fundIndentityVal + '.TopUp';
    var key, identytyVal;
    if (receiverType === 'Short Code') {
      identytyVal = CommonUtils.identifyData(fundIndentityVal + '.ShortCode');
    } else {
      identytyVal = CommonUtils.identifyData(fundIndentityVal + '.MSISDN');
    }
    await G2Handlers.waitForPageLoad();
    var childItems = CommonUtils.identifyData(key);
    if (Object.keys(childItems).length > 0) {
      for (var j = 0; j < Object.keys(childItems).length; j++) {
        let value = key + '.' + Object.keys(childItems)[j];
        await HomePage.clickOnTopAndSubMenu('Search', 'Service Provider');
        await LeftMenuPage.navigateToLeftChildMenu('Initiate Transaction', 'buttonLeftChildMenu');
        await IFrame.switchToLastFrame();
        await IFrame.switchToNextFrame();
        await Assert.verifyText('Initiate Transaction');
        await G2Handlers.selectOption(
          'Transaction Type',
          'Journal Entry Transaction',
          'customDropdownLocator',
        );
        await G2Handlers.selectOption('Reason Type', 'Journal Entry', 'customDropdownLocator');
        await G2Handlers.selectOption('InitiateTransPage.Primary_Identifier_Type', 'SP');
        await G2Handlers.selectOption(
          'InitiateTransPage.Primary_Identifier_Account_Type',
          'M-PESA Account',
        );
        await G2Handlers.selectOption(
          CommonUtils.identifyLocator('InitiateTransPage.Receiver_Identifier_Type'),
          receiverType,
        );
        if (receiverType === 'Short Code') {
          await G2Handlers.enterValue(
            'InitiateTransPage.Receiver_Identifier_Short_Code',
            identytyVal,
          );
        } else {
          await G2Handlers.enterValue('InitiateTransPage.Receiver_Identifier_MSISDN', identytyVal);
        }
        await G2Handlers.clickOnElement('Verify', 'buttonInDiv');
        await G2Handlers.clickOnElement('Verify', 'buttonInDiv');
        await TM.wait(2);
        await G2Handlers.selectOption(
          CommonUtils.identifyLocator('InitiateTransPage.Receiver_Identifier_Account_Type'),
          Object.keys(childItems)[j],
        );
        await G2Handlers.enterValue('InitiateTransPage.Amount', value);
        await G2Handlers.enterValue('InitiateTransPage.Reason', 'test');
        await G2Handlers.clickOnElement('Submit', 'buttonInDiv');
        await G2Handlers.waitForPageLoad();
        await this.makerChecker();
        await this.approveOrRejectGroupTask('Approve', 'Journal Entry Transaction');
      }
    }
    await HomePage.clickOnLogout();
  }

  async createBulkPlan(tObj) {
    let { BulkType, PlanName, File, ScheduleTime } = { ...tObj };
    await HomePage.clickOnTopAndSubMenu('My Functions', 'Bulk');
    await G2Handlers.waitForPageLoad();
    TM.wait(2);
    await IFrame.switchToLastFrame();
    await IFrame.switchToNextFrame();
    await G2Handlers.clickOnElement('Add', 'buttonCite');
    await G2Handlers.selectOption('Bulk Type', BulkType, 'customDropdownLocator');
    await G2Handlers.enterValue('Plan Name', PlanName, 'textboxUsingLabel');
    await G2Handlers.clickOnElement('GenericLocators.FileSelect');
    //await this.fileUpload(File);
    await G2Handlers.clickOnElement(ScheduleTime, 'buttonRadio');
    await G2Handlers.clickOnElement('Submit', 'buttonInDiv');
    await IFrame.switchToCurrentWindowHandle();
    await G2Handlers.verifyText('Yes');
    await G2Handlers.clickOnElement('Yes', 'buttonInPopup');
    await IFrame.switchToMainPage();
    await IFrame.switchToLastFrame();
    await IFrame.switchToNextFrame();
  }

  async createBankAccount(tObj) {
    let { BankName, BankBranch, BankAccountName, BankAccountNumber } = { ...tObj };
    await G2Handlers.verifyText('Label.Bank Account');
    await G2Handlers.clickOnElement('Add', 'buttonCite');
    await IFrame.switchToPopUpWindow();
    await G2Handlers.selectOption('Bank', BankName, 'customDropdownLocator');
    await G2Handlers.selectOption('Bank Branch', BankBranch, 'customDropdownLocator');
    await G2Handlers.enterValue('Bank Account Name', BankAccountName, 'textboxUsingLabel');
    await G2Handlers.enterValue('Bank Account Number', BankAccountNumber, 'textboxUsingLabel');
    await G2Handlers.clickOnElement('Submit', 'buttonInDiv');
    await IFrame.switchToMainPage();
    await IFrame.switchToCurrentWindowHandle();
    await this.makerChecker();
    await G2Handlers.clickOnElement('Confirm', 'buttonInDiv');
  }

  async editIdentityStatusOfAccount(tableValues, status) {
    await G2Handlers.clickValueOnTableData('Table.Accounts', tableValues, 'Edit', 'Operation');
    await G2Handlers.selectOption('GenericLocators.AccountStatusEdit', status);
    if (
      (await TM.grabNumberOfVisibleElements(
        G2Handlers.formCustomLocator('Reason', G2Handlers.customTextAreaLocator),
      )) !== 0
    ) {
      await G2Handlers.enterTextAreaValue('Reason', status.toString(), 'customTextAreaLocator');
    } else {
      await G2Handlers.enterTextAreaValue('Remark', status.toString(), 'customTextAreaLocator');
    }
    await G2Handlers.clickOnElement('Submit', 'buttonInDiv');
    await IFrame.switchToMainPage();
    await IFrame.switchToCurrentWindowHandle();
    await this.makerChecker();
    await G2Handlers.clickOnElement('Confirm', 'buttonInDiv');
  }

  async manipulatingValues(valueOfLimit, value, newValueOfLimit) {
    valueOfLimit = TestData.getField(valueOfLimit);
    var num = valueOfLimit.replace(/[^0-9.]/gi, '');
    var newValue = undefined;
    if (value.match('-')) {
      if (parseFloat(num) == 0) {
        newValue = '-' + value;
      } else {
        newValue = parseFloat(num) + parseFloat(value);
      }
    } else {
      newValue = parseFloat(num) + parseFloat(value);
    }
    TestData.setField(newValueOfLimit, newValue);
  }

  async getTheBalance(storedBalance, value) {
    storedBalance = TestData.getField(storedBalance);
    var num = storedBalance.replace(/[^0-9.]/gi, '');
    num = parseFloat(num);
    TestData.setField(value, num);
  }

  async verifyTakeACallCounterIncreasesByOne() {
    let finalCounter = await G2Handlers.grabNumberOfVisibleElements(
      'GenericLocators.TakeACallTableValueLocator',
    );
    let initialCounter = TestData.getField('counterVal');
    if (finalCounter == initialCounter + 1) {
      TM.report(
        'Counter increased by one. Initial Counter: ' +
          initialCounter +
          ' Final Counter: ' +
          finalCounter,
      );
    } else {
      Assert.fail('Counter not increased');
    }
  }

  async switchToTab() {
    await TM.switchToNextTab();
  }

  async getValueFromTableBasedonRowAndColumn(tableID, rowNum, columnNum, outputVar) {
    tableID = CommonUtils.identifyData(tableID);
    let tableVal = await TM.grabTextFrom(
      "//div[@id='" + tableID + "']//tr[" + rowNum + ']//td[' + columnNum + ']',
    );
    TestData.setField(outputVar, tableVal);
  }

  async verifyValuesAreSortedInAscendingOrder(firstVal, secondVal) {
    firstVal = TestData.getField(firstVal);
    secondVal = TestData.getField(secondVal);
    if (secondVal >= firstVal) {
      TM.report('Values are sorted in ascending order');
    } else {
      throw new Error('Values are not sorted');
    }
  }

  async verifyValuesAreSortedInDescendingOrder(firstVal, secondVal) {
    firstVal = TestData.getField(firstVal);
    secondVal = TestData.getField(secondVal);
    if (secondVal <= firstVal) {
      TM.report('Values are sorted in descending order');
    } else {
      throw new Error('Values are not sorted');
    }
  }

  async clickOnSortForTable(sortBy, tableID, sortOrder) {
    tableID = CommonUtils.identifyData(tableID);
    let count = 0;
    while (count == 0) {
      count = await G2Handlers.grabNumberOfVisibleElements(
        "//div[@id='" +
          tableID +
          "']//th[@sortdir='" +
          sortOrder +
          "']//label[contains(text(),'" +
          sortBy +
          "')]",
      );
      await G2Handlers.clickOnElement(
        "//div[@id='" + tableID + "']//label[contains(text(),'" + sortBy + "')]",
      );
    }
  }

  async editStatusOfProduct(tableId, tableValues, status) {
    await G2Handlers.clickValueOnTableData(tableId, tableValues, 'Edit', 'Operation');
    let locator = G2Handlers.formCustomLocator(tableValues, G2Handlers.productStatusEdit);
    await G2Handlers.selectOption(locator, status);
    if (
      (await TM.grabNumberOfVisibleElements(
        G2Handlers.formCustomLocator('Reason', G2Handlers.customTextAreaLocator),
      )) !== 0
    ) {
      await G2Handlers.enterTextAreaValue('Reason', status.toString(), 'customTextAreaLocator');
    } else {
      await G2Handlers.enterTextAreaValue('Remark', status.toString(), 'customTextAreaLocator');
    }
    await G2Handlers.clickOnElement('Submit', 'buttonInDiv');
    await IFrame.switchToMainPage();
    await IFrame.switchToCurrentWindowHandle();
    await this.makerChecker();
    await G2Handlers.clickOnElement('Confirm', 'buttonInDiv');
  }

  async clickOnTheChildOrgFromTheList(childOrgShortCodeValue, locator) {
    await G2Handlers.enterValue(CommonUtils.identifyLocator(locator), childOrgShortCodeValue);
    await G2Handlers.clickOnElement(
      CommonUtils.identifyLocator('GenericLocators.EffectiveChildrenSearchButton'),
    );
    await G2Handlers.clickOnElement(
      CommonUtils.identifyLocator('GenericLocators.EffectiveChildrenResult'),
    );
  }

  async verifyTheTextInTheKycPopUp(textString) {
    let value = await TM.grabTextFrom('//body');
    value = value.trim;
    let result = value.search(textString);
    //document.getElementById('popwin_close').click();
    return result;
  }

  async checkIfEditIdentityStatusButtonAvailable() {
    if (
      TM.grabNumberOfVisibleElements(CommonUtils.identifyLocator('orgpage.Identity Status Edit')) >=
      1
    ) {
      TestData.setField('isEditIdentityStatusButtonAvailable', 'Yes');
    } else {
      TestData.setField('isEditIdentityStatusButtonAvailable', 'No');
    }
  }

  async checkingTheGivenTextInBigHeadings(textString) {
    let stringIsAvailable = 'No';
    await G2Handlers.waitForPageLoad();
    let noOfEle = await TM.grabNumberOfVisibleElements(
      CommonUtils.identifyLocator('GenericLocators.MakerChecker'),
    );
    if (noOfEle !== 0) {
      let makerCheckerElementInDiv = await TM.grabTextFrom(
        CommonUtils.identifyLocator('GenericLocators.MakerChecker'),
      );
      if (makerCheckerElementInDiv.includes(textString)) {
        stringIsAvailable = 'Yes';
      }
      await Assert.verifyIfTwoStringsAreEqual(stringIsAvailable, 'Yes');
    }
  }

  async operations(Operations) {
    let number = await G2Handlers.grabNumberOfVisibleElements(
      CommonUtils.identifyData('createtoporgpage.OperatorID'),
    );
    // console.log(number);
    if (number == 0) {
      await G2Handlers.clickOnElement('createtoporgpage.operationValueinCustomer');
      await G2Handlers.clickOnElement(Operations, 'optionUserService');
      if (Operations == 'Unlock PIN') {
        await G2Handlers.clickOnElement('No', 'RadioYesNo');
        await G2Handlers.enterTextAreaValue(
          Operations,
          'Automation Testing Purpose',
          'textboxOperatorId',
        );
        await G2Handlers.clickOnElement(Operations, 'SubmitButtonForOperatorID');
      } else if (Operations == 'Close the Call') {
        await G2Handlers.enterTextAreaValue(
          'Close Call',
          'Automation Testing Purpose',
          'textboxOperatorId',
        );
        await G2Handlers.clickOnElement('Close Call', 'SubmitButton');
      } else {
        await G2Handlers.enterTextAreaValue(
          Operations,
          'Automation Testing Purpose',
          'textboxOperatorId',
        );
        await G2Handlers.clickOnElement(Operations, 'SubmitButtonForOperatorID');
      }
    } else {
      await G2Handlers.clickOnElement('createtoporgpage.operationValueinOperator');
      await G2Handlers.clickOnElement(Operations, 'optionUserService');
      if (Operations == 'Unlock PIN') {
        await G2Handlers.clickOnElement('No', 'RadioYesNo');
      } else if (Operations == 'Close Operator') {
        await G2Handlers.selectOption('Reason', 'Not Use', 'customDropdownLocator');
      }
      await G2Handlers.enterTextAreaValue(
        Operations,
        'Automation Testing Purpose',
        'textboxOperatorId',
      );
      await G2Handlers.clickOnElement(Operations, 'SubmitButtonForOperatorID');
    }
  }

  async navigateToTillPageForCreation(pageName, tObj) {
    await this.switchToLeftHandMenuIframe();
    await LeftMenuPage.navigateToLeftChildMenu('Identity', 'buttonLeftChildMenu');
    await LeftMenuPage.navigateToLeftChildMenu(pageName, 'buttonLeftChildMenu');
    await this.switchToCurrentWindowFrame();
    await ButtonLink.clickOnElement('GenericLocators.CreateButton');
    await G2Handlers.enterValue(
      'Label.Organization Short Code',
      tObj['OrganizationShortCode'].toString(),
      'textboxUsingLabel',
    );
    await G2Handlers.enterValue('Label.MSISDN', tObj['MSISDN'].toString(), 'textboxUsingLabel');
    if (tObj['TillNumber'] != undefined) {
      await G2Handlers.enterValue(
        'Label.Till Number',
        tObj['TillNumber'].toString(),
        'textboxUsingLabel',
      );
    }
    await G2Handlers.selectOption('Language', tObj['Language'], 'customDropdownLocator');
    await G2Handlers.selectOption(
      'Label.Default Operator ID',
      tObj['DefaultOperatorID'],
      'customDropdownLocator',
    );
    TM.scrollIntoView(CommonUtils.identifyLocator('GenericLocators.UnselectAllButton'), 'false');
    TM.wait('5');
    await ButtonLink.clickOnElement('GenericLocators.SelectAllButton');
    await G2Handlers.clickOnElement('Submit', 'buttonCite');
    await G2Handlers.verifyText('Till created successfully, please wait for approving');
  }

  async createCustomerdetails(tObj) {
    let productname = CommonUtils.identifyData(tObj['Product Name']),
      product = CommonUtils.identifyData(tObj['Product Name']),
      firstname = CommonUtils.identifyData(tObj['First Name']),
      lastname = CommonUtils.identifyData(tObj['Last Name']),
      middlename = CommonUtils.identifyData(tObj['Middle Name']),
      cityOrTown = CommonUtils.identifyData(tObj['City or Town']),
      SecretQuestion = CommonUtils.identifyData(tObj['Secret Question']),
      Idtype = CommonUtils.identifyData(tObj['ID Type']),
      iDnumber = CommonUtils.identifyData(tObj['ID Number']),
      msisdn = CommonUtils.identifyData(tObj['MSISDN']),
      secret = CommonUtils.identifyData(tObj['SecretAnswer']),
      documentReceived = CommonUtils.identifyData(tObj['Document Received']);
    await G2Handlers.waitForPageLoad();
    await G2Handlers.clickOnElement('Create', 'buttonCite');
    await G2Handlers.clickOnElement('GenericLocators.Create_Identity');
    await G2Handlers.clickOnElement(' Create Customer ', 'optionsForHover');
    await G2Handlers.clickOnElement('+ Add Basic Product ', 'buttonCite');
    await G2Handlers.enterValue('Product Name', productname, 'textboxUsingLabel');
    await G2Handlers.clickOnElement('GenericLocators.SearchReceipt');
    await G2Handlers.clickOnElement(product, 'AddProduct');
    await G2Handlers.clickOnElement('GenericLocators.ConfirmProduct');
    await TM.scrollIntoView(CommonUtils.identifyLocator('GenericLocators.registeredType'), 'false');
    await G2Handlers.enterValue('MSISDN', msisdn, 'textboxUsingLabel');
    //await G2Handlers.enterValue('MSISDN', msisdn, 'textboxUsingLabel');
    await G2Handlers.enterValue('First Name', firstname, 'textboxUsingLabel');
    await G2Handlers.enterValue('Last Name', lastname, 'textboxUsingLabel');
    await G2Handlers.enterValue('Middle Name', middlename, 'textboxUsingLabel');
    await G2Handlers.clickOnElement('GenericLocators.DateInorgportal');
    for (let a = 1; a < 12; a++) {
      await G2Handlers.clickOnElement('GenericLocators.Selectedyear');
    }
    await G2Handlers.clickOnElement('GenericLocators.DateofBirth');
    await G2Handlers.clickOnElement(' Male ', 'buttonRadio');
    await G2Handlers.enterValue('City or Town', cityOrTown, 'textboxUsingLabel');
    await G2Handlers.selectOption('Secret Question', SecretQuestion, 'customDropdownLocator');
    await G2Handlers.enterValue('Secret Answer', secret, 'textboxUsingLabel');
    await G2Handlers.clickOnElement('Add ID', 'buttonCite');
    await G2Handlers.clickOnElement('GenericLocators.idtype');
    await G2Handlers.clickOnElement(Idtype, 'idtype');
    await G2Handlers.enterValue('GenericLocators.idtype1', iDnumber);
    await G2Handlers.clickOnElement('GenericLocators.Documentdropdown');
    await G2Handlers.clickOnElement(documentReceived, 'documentreceived');
    await G2Handlers.clickOnElement('Next', 'buttonCite');
    await G2Handlers.clickOnElement('Next', 'buttonCite');
    await G2Handlers.clickOnElement(' Submit ', 'buttonCite');
    await G2Handlers.verifyText('Create completed.');
    await G2Handlers.clickOnElement(' View Detail >> ', 'buttonInSpan1');
    await TM.wait(5);
    await G2Handlers.waitForPageLoad();
  }

  async navigateToTransactionReceiptNo(TransReceipt) {
    await this.switchToLeftHandMenuIframe();
    await LeftMenuPage.navigateToLeftChildMenu('Transaction', 'buttonLeftChildMenu');
    await G2Handlers.enterValue('Label.ReceiptNo', TransReceipt.toString(), 'textboxUsingLabel');
    await G2Handlers.clickOnElement('GenericLocators.ReceiptDetail');
  }

  async navigateToTransactionapproveOrReject(tableData, TransReceipt, approveOrReject) {
    await G2Handlers.clickOnElement('GenericLocators.Transaction');
    await G2Handlers.clickOnElement('GenericLocators.ReviewTransactionBo');
    if (approveOrReject == 'Complete') {
      await G2Handlers.clickOnElement('Search', 'buttonCite');
      await G2Handlers.ClikOnTableTransStatus(tableData, TransReceipt, approveOrReject);
      await G2Handlers.clickOnElement('GenericLocators.ReasonInTransaction');
      await G2Handlers.clickOnElement('GenericLocators.InputManualyinTransaction');
      await G2Handlers.enterTextAreaValue('', 'Test', 'customTextAreaLocator');
      await G2Handlers.clickOnElement('Submit', 'buttonCite');
    }
    await G2Handlers.selectOption(
      'Query Mode',
      'Transactions as Receipt No.',
      'customDropdownLocator',
    );
    await G2Handlers.enterValue('Label.ReceiptNo', TransReceipt.toString(), 'textboxUsingLabel');
    TestData.setField('menuItem', tableData);
    CommonUtils.identifyData(tableData);
    if (approveOrReject == 'Approve') {
      await G2Handlers.clickOnElement('Search', 'buttonCite');
      await G2Handlers.ClikOnTableTransStatus(tableData, TransReceipt, approveOrReject);
      await G2Handlers.clickOnElement('GenericLocators.ReasonInTransaction');
      await G2Handlers.clickOnElement('GenericLocators.InputManualyinTransaction');
      await G2Handlers.enterTextAreaValue('', 'Test', 'customTextAreaLocator');
      await G2Handlers.clickOnElement('Submit', 'buttonCite');
      await G2Handlers.verifyText('Transaction approved successfully.');
    } else if (approveOrReject == 'Reverse') {
      await G2Handlers.clickOnElement('Search', 'buttonCite');
      await G2Handlers.ClikOnTableTransStatus(tableData, TransReceipt, approveOrReject);
      await G2Handlers.clickOnElement('GenericLocators.ReasonInTransaction');
      await G2Handlers.clickOnElement('GenericLocators.InputManualyinTransaction');
      await G2Handlers.enterTextAreaValue('', 'Test', 'customTextAreaLocator');
      await G2Handlers.clickOnElement('Submit', 'buttonCite');
      await G2Handlers.clickOnElement('GenericLocators.ConfirmException');
      // await G2Handlers.verifyText('Transaction reversed successfully.');
    } else if (approveOrReject == 'Reversal') {
      let Status = 'Approve';
      await G2Handlers.clickOnElement('Search', 'buttonCite');
      await G2Handlers.ClikOnTableTransStatus(tableData, TransReceipt, Status);
      await G2Handlers.clickOnElement('GenericLocators.ReasonInTransaction');
      await G2Handlers.clickOnElement('GenericLocators.InputManualyinTransaction');
      await G2Handlers.enterTextAreaValue('', 'Test', 'customTextAreaLocator');
      await G2Handlers.clickOnElement('Submit', 'buttonCite');
      await G2Handlers.verifyText('Transaction approved successfully.');
      await G2Handlers.waitForPageLoad();
      await TM.wait(5);
      let Status2 = 'Reverse';
      await G2Handlers.clickOnElement('Search', 'buttonCite');
      await G2Handlers.ClikOnTableTransStatus(tableData, TransReceipt, Status2);
      await G2Handlers.clickOnElement('GenericLocators.ReasonInTransaction');
      await G2Handlers.clickOnElement('GenericLocators.InputManualyinTransaction');
      await G2Handlers.enterTextAreaValue('', 'Test', 'customTextAreaLocator');
      await G2Handlers.clickOnElement('Submit', 'buttonCite');
      await G2Handlers.clickOnElement('GenericLocators.ConfirmException');
      // await G2Handlers.verifyText('Transaction reversed successfully.');
    } else if (approveOrReject == 'Reject') {
      await G2Handlers.clickOnElement('Search', 'buttonCite');
      await G2Handlers.ClikOnTableTransStatus(tableData, TransReceipt, approveOrReject);
      await G2Handlers.clickOnElement('GenericLocators.ReasonInTransaction');
      await G2Handlers.clickOnElement('GenericLocators.InputManualyinTransaction');
      await G2Handlers.enterTextAreaValue('', 'Test', 'customTextAreaLocator');
      await G2Handlers.clickOnElement('Submit', 'buttonCite');
      // await G2Handlers.verifyText('Transaction rejected successfully.');
    }
  }

  async AccountStatusChange(tableData, accountName, operation, status) {
    TestData.setField('menuItem', tableData);
    CommonUtils.identifyData(tableData);
    await G2Handlers.ClikOnTableAccountStatus(tableData, accountName, operation);
    await G2Handlers.selectOption('newStatus', status.toString(), 'buttonDropDownInDialogWindow');
    await G2Handlers.enterTextAreaValue(
      'Remark',
      CommonUtils.identifyData('Reason Description'),
      'customTextAreaLocatorInDialogWindow',
    );
    await ButtonLink.clickOnElement('GenericLocators.SubmitChangesOperatorID1');
    await G2Handlers.clickOnElement('GenericLocators.ConfirmException');
  }

  async createBankAccountOrgandSp(tObj) {
    let {
      BankName,
      BankID,
      Currency,
      AssertType,
      BankAccountName,
      BankAccountNumber,
      Organization,
      ServiceProvider,
    } = { ...tObj };
    if (typeof Organization !== 'undefined') {
      await G2Handlers.clickOnElement('GenericLocators.BankAccountOrganization');
      await G2Handlers.clickOnElement('Add', 'buttonCite');
      await G2Handlers.clickOnElement('GenericLocators.BankHODropdownSP');
      await G2Handlers.clickOnElement(BankName, 'CreateBankAccount');
      await G2Handlers.clickOnElement('GenericLocators.BanklabelDropDown');
      await G2Handlers.clickOnElement(BankID, 'craeteBankId');
      await G2Handlers.clickOnElement('GenericLocators.AssetTypeSP');
      await G2Handlers.clickOnElement(AssertType, 'createAssettype');
      await G2Handlers.selectOption('Currency', Currency, 'customDropdownLocator');
      await G2Handlers.enterValue('GenericLocators.AccountName', BankAccountName);
      await G2Handlers.enterValue('Account Number', BankAccountNumber, 'textboxUsingLabel');
      await G2Handlers.clickOnElement('Submit', 'buttonCite');
    }
    if (typeof ServiceProvider !== 'undefined') {
      await LeftMenuPage.navigateToLeftChildMenu('Identity', 'buttonLeftChildMenu');
      await LeftMenuPage.navigateToLeftChildMenu('Service Provider', 'buttonLeftChildMenu');
      await LeftMenuPage.navigateToLeftChildMenu('Bank & Account', 'buttonLeftChildMenu');
      await LeftMenuPage.navigateToLeftChildMenu('Bank Account', 'buttonLeftChildMenu');
      await G2Handlers.clickOnElement('Add', 'buttonCite');
      await G2Handlers.clickOnElement('GenericLocators.BankHODropdownSP');
      await G2Handlers.clickOnElement(BankName, 'CreateBankAccount');
      await G2Handlers.clickOnElement('GenericLocators.BanklabelDropDown');
      await G2Handlers.clickOnElement(BankID, 'craeteBankId');
      await G2Handlers.clickOnElement('GenericLocators.AssetTypeSP');
      await G2Handlers.clickOnElement(AssertType, 'createAssettype');
      await G2Handlers.selectOption('Currency', Currency, 'customDropdownLocator');
      await G2Handlers.enterValue('GenericLocators.AccountName', BankAccountName);
      await G2Handlers.enterValue('Account Number', BankAccountNumber, 'textboxUsingLabel');
      await G2Handlers.clickOnElement('Submit', 'buttonCite');
    }
  }
  async verifyOrgAction(tObj) {
    let { Log, Table, Tablevalue, Sp, Org } = { ...tObj };
    if (typeof Sp !== 'undefined') {
      await LeftMenuPage.navigateToLeftChildMenu('Audit Log', 'buttonLeftChildMenu');
      await LeftMenuPage.navigateToLeftChildMenu(Log, 'buttonLeftChildMenu');
      TestData.setField('menuItem', Table);
      Table = CommonUtils.identifyData(Table);
      await G2Handlers.clickValueOnTableData(Table, Tablevalue, 'Detail', 'Operation');
      if (Log == 'Customer Care Audit Log') {
        await ButtonLink.clickOnElement('GenericLocators.ClosebuttonINaudit');
      } else {
        await ButtonLink.clickOnElement('GenericLocators.CloseViewDetails');
      }
    }
    if (typeof Org !== 'undefined') {
      await G2Handlers.clickOnElement('Audit Log', 'tabsInDiv');
      await G2Handlers.selectOption('Category', Log, 'customDropdownLocator');
      await G2Handlers.clickOnElement(' Search ', 'buttonCite');
      TestData.setField('menuItem', Table);
      Table = CommonUtils.identifyData(Table);
      await G2Handlers.clickValueOnTableData(Table, Tablevalue, 'Detail', 'Operation');
      await TM.wait(6);
      await ButtonLink.clickOnElement('GenericLocators.Closebutton');
    }
  }

  async GroupNameEdit(value, remark) {
    let EditGroupName = 'orgpage.edit language';
    TM.wait('5');
    await G2Handlers.clickOnElement(EditGroupName);
    await G2Handlers.enterTextAreaValue('New Group Name', value, 'newGroupNameLocator');
    await G2Handlers.enterTextAreaValue('Remark', remark, 'remarklocator');
    await ButtonLink.clickOnElement('GenericLocators.SubmitGroupName');
  }
}
module.exports = new GenericMethods();
module.exports.GenericMethods = GenericMethods;
