const {
  G2Handlers,
  IFrame,
  HomePage,
  LeftMenuPage,
  CreateTopOrgPage,
  CommonUtils,
  GenericMethods,
  LoginPage,
  TestData,
  TM,
  G2Ussd,
  USSD,
  LoggerFactory,
} = inject();

const logger = LoggerFactory.init();
class AdminPage {
  async navigateToAdminPage(subMenu) {
    await HomePage.clickOnTopAndSubMenu('My Functions', 'Admin');
    await LeftMenuPage.navigateToLeftMenu(subMenu, 'buttonLeftMenu');
  }

  async navigateToCreateAllIdPage(subMenu) {
    await G2Handlers.waitForPageLoad();
    await G2Handlers.clickOnElement('Create', 'buttonCite');
    await G2Handlers.clickOnElement('GenericLocators.Create_Identity');
    await G2Handlers.clickOnElement(subMenu, 'optionsForHover');
  }

  async leftmenunavigation(menu) {
    await LeftMenuPage.navigateToLeftChildMenu('Identity', 'buttonLeftChildMenu');
    await LeftMenuPage.navigateToLeftChildMenu(menu, 'buttonLeftChildMenu');
  }

  async createtrustbank() {
    await LeftMenuPage.navigateToLeftChildMenu('Identity', 'buttonLeftChildMenu');
    await LeftMenuPage.navigateToLeftChildMenu('Service Provider', 'buttonLeftChildMenu');
    await LeftMenuPage.navigateToLeftChildMenu('Bank & Account', 'buttonLeftChildMenu');
    await LeftMenuPage.navigateToLeftChildMenu('Trust Account', 'buttonLeftChildMenu');
    await G2Handlers.waitForPageLoad();
    await G2Handlers.clickOnElement('GenericLocators.Createbank');
    await G2Handlers.clickOnElement('GenericLocators.BankHeadOffice');
    await G2Handlers.clickOnElement('GenericLocators.CENTRALBANKOFLESOTHO');
    await G2Handlers.clickOnElement('GenericLocators.TrustBankdropdown');
    await G2Handlers.clickOnElement('GenericLocators.Bankbranch1');
    await G2Handlers.clickOnElement('GenericLocators.CurrencyInTrustBank');
    await G2Handlers.clickOnElement('GenericLocators.USD');
  }

  async fillRequiredFieldsForIdentityInfoSp(userName, Language, Channel) {
    await G2Handlers.enterValue('User Name', userName, 'textboxUsingLabel');
    await G2Handlers.selectOption('Language', Language, 'customDropdownLocator');
    await G2Handlers.clickOnElement(Channel, 'buttonRadio');
  }

  async fillRequiredFieldsForIdentityInfoOrg(
    shortCode,
    Language,
    AccessChannel,
    UserName,
    msisdn,
    OperatorId,
  ) {
    await G2Handlers.enterValue('Organization Short Code', shortCode, 'textboxUsingLabel');
    TM.scrollIntoView(await CommonUtils.identifyLocator('GenericLocators.ScrollLanguage'), 'false');
    if (AccessChannel.length == 1 && AccessChannel[0] == 'API') {
      await G2Handlers.clickOnElement(AccessChannel[0], 'AddAccessChannel');
      await G2Handlers.enterValue('User Name', UserName, 'textboxUsingLabel');
      await G2Handlers.enterValue('MSISDN', CommonUtils.identifyData(msisdn), 'textboxUsingLabel');
    } else {
      for (var i = 0; i < AccessChannel.length; i++) {
        await G2Handlers.clickOnElement(AccessChannel[i], 'AddAccessChannel');
      }
      if (AccessChannel.length == 1 && AccessChannel[0] == 'Handset') {
        await G2Handlers.enterValue('Operator Id', OperatorId, 'textboxUsingLabel');
        await G2Handlers.enterValue(
          'MSISDN',
          CommonUtils.identifyData(msisdn),
          'textboxUsingLabel',
        );
      } else if (AccessChannel.length == 1 && AccessChannel[0] == 'Web') {
        await G2Handlers.enterValue('User Name', UserName, 'textboxUsingLabel');
      } else {
        await G2Handlers.enterValue('User Name', UserName, 'textboxUsingLabel');
        await G2Handlers.enterValue(
          'MSISDN',
          CommonUtils.identifyData(msisdn),
          'textboxUsingLabel',
        );
        await G2Handlers.enterValue('Operator Id', OperatorId, 'textboxUsingLabel');
      }
    }
    await G2Handlers.selectOption('Language', Language, 'customDropdownLocator');
  }

  async fillRequiredFieldForPersonDetails(firstName, lastName, Email) {
    await G2Handlers.verifyText('Personal Details');
    await G2Handlers.enterValue('First Name', firstName, 'textboxUsingLabel');
    await G2Handlers.enterValue('Last Name', lastName, 'textboxUsingLabel');
    // if (dob.includes('Date of Birth'))
    //   await G2Handlers.enterValue('Date of Birth', dob, 'textboxUsingLabel');
    await G2Handlers.enterValue('Email', Email, 'textboxUsingLabel');
  }

  async AddRole(RoleName) {
    if ((RoleName.length == 1 && RoleName[0] == 'All') || RoleName.length == 0) {
      await G2Handlers.clickOnElement(' Add Role ', 'buttonCite');
      await G2Handlers.clickOnElement('createtoporgpage.AddAllProduct');
    } else {
      await G2Handlers.clickOnElement(' Add Role ', 'buttonCite');
      for (var i = 0; i < RoleName.length; i++) {
        await G2Handlers.clickOnElement(RoleName[i], 'AddProduct');
      }
    }
    await G2Handlers.clickOnElement('createtoporgpage.Confrim');
  }

  async createSpOperator(table) {
    let tObj = table.parse().hashes()[0];
    let { UserName, Language, AccessChannel, Email, Gender } = {
      ...tObj,
    };
    let firstName = 'Auto',
      lastName = 'mation';
    //dob = '01-01-1991',
    Language = CommonUtils.identifyData(Language);
    AccessChannel = CommonUtils.identifyData(AccessChannel);
    Email = CommonUtils.identifyData(Email);
    Gender = CommonUtils.identifyData(Gender);
    var RoleName = tObj['Role'].split(',');
    await this.navigateToCreateAllIdPage(' Create SP Operator ');
    await G2Handlers.verifyText('Basic Info');
    await this.fillRequiredFieldsForIdentityInfoSp(UserName, Language, AccessChannel);
    await G2Handlers.clickOnElement(' Next ', 'buttonCite');

    // if (typeof tObj['Rule Profile'] !== 'undefined') {
    // await G2Handlers.selectOption('Rule Profile', tObj['Rule Profile'], 'customDropdownLocator');
    //}

    await this.AddRole(RoleName);
    await G2Handlers.clickOnElement(' Next ', 'buttonCite');
    await this.fillRequiredFieldForPersonDetails(firstName, lastName, Email);

    if (Gender !== 'undefined') {
      await G2Handlers.clickOnElement(Gender, 'buttonRadio');
    }
    await TM.scrollIntoView(CommonUtils.identifyLocator('GenericLocators.AddID'), 'false');

    if (typeof tObj['Preferred Notification Channel'] !== 'undefined') {
      await G2Handlers.selectOption(
        'Preferred Notification Channel',
        tObj['Preferred Notification Channel'],
        'customDropdownLocator',
      );
      if (tObj['Preferred Notification Channel'] == 'Email') {
        await G2Handlers.enterValue(
          'Notification Receiving E-mail',
          tObj['Email'],
          'textboxUsingLabel',
        );
      } else {
        await G2Handlers.enterValue(
          'Notification Receiving MSISDN',
          tObj['Notification Receiving MSISDN'],
          'textboxUsingLabel',
        );
      }
    }
    await G2Handlers.clickOnElement(' Next ', 'buttonCite');
    await G2Handlers.clickOnElement(' Submit ', 'buttonCite');
    await G2Handlers.verifyText('SP Operator created successfully.');
    await G2Handlers.clickOnElement(' View Detail >> ', 'buttonInSpan1');
    await G2Handlers.waitForPageLoad();
  }

  async createOrgOperator(table) {
    let tObj = table.parse().hashes()[0];
    let { ShortCode, Language, UserName, MSISDN, OperatorId, Email, Gender } = {
      ...tObj,
    };
    let firstName = 'Auto',
      lastName = 'mation';
    //dob = '01-01-1991',
    var AccessChannel = tObj['AccessChannel'].split(',');
    var RoleName = tObj['Role'].split(',');
    Language = CommonUtils.identifyData(Language);
    Email = CommonUtils.identifyData(Email);
    Gender = CommonUtils.identifyData(Gender);
    await this.navigateToCreateAllIdPage(' Create Organization Operator ');
    await G2Handlers.verifyText('Identity Info');
    await this.fillRequiredFieldsForIdentityInfoOrg(
      ShortCode,
      Language,
      AccessChannel,
      UserName,
      MSISDN,
      OperatorId,
    );
    await G2Handlers.clickOnElement('Next', 'buttonCite');
    await G2Handlers.verifyText('Profile');
    if (typeof tObj['Rule Profile'] !== 'undefined') {
      await G2Handlers.selectOption('Rule Profile', tObj['Rule Profile'], 'customDropdownLocator');
    }
    await this.AddRole(RoleName);
    await G2Handlers.clickOnElement('Next', 'buttonCite');
    await G2Handlers.verifyText('Personal Details');
    await this.fillRequiredFieldForPersonDetails(firstName, lastName, Email);
    if (Gender !== 'undefined') {
      await G2Handlers.clickOnElement(Gender, 'buttonRadio');
    }
    await TM.scrollIntoView(CommonUtils.identifyLocator('GenericLocators.AddID'), 'false');

    if (typeof tObj['Preferred Notification Channel'] !== 'undefined') {
      await G2Handlers.selectOption(
        'Preferred Notification Channel',
        tObj['Preferred Notification Channel'],
        'customDropdownLocator',
      );
      if (tObj['Preferred Notification Channel'] == 'Email') {
        await G2Handlers.enterValue(
          'Notification Receiving E-mail',
          tObj['Email'],
          'textboxUsingLabel',
        );
      } else {
        await G2Handlers.enterValue(
          'Notification Receiving MSISDN',
          tObj['Notification Receiving MSISDN'],
          'textboxUsingLabel',
        );
      }
    }
    await G2Handlers.clickOnElement('Next', 'buttonCite');
    await G2Handlers.clickOnElement(' Submit ', 'buttonCite');
    await G2Handlers.verifyText('Organization operator created successfully!');
    await G2Handlers.clickOnElement(' View Detail >> ', 'buttonInSpan1');
    await G2Handlers.waitForPageLoad();
  }

  async createSpOpsForTestDataCreation(operatorName) {
    var items = CommonUtils.identifyData('SP Operators');
    if (Object.keys(items).length > 0) {
      let operator = 'SP Operators.' + operatorName;
      await G2Handlers.waitForPageLoad();
      await this.navigateToAdminPage('Manage SP Operator');
      //Initialise variables
      let idType = TestData.getData(operator + '.IDType');
      //create sp operator
      await IFrame.switchToNextFrame();
      await G2Handlers.verifyText('Manage SP Operator');
      await G2Handlers.clickOnElement('Add', 'buttonCite');
      await G2Handlers.verifyText('Create SP Operator');
      await this.fillRequiredFieldsForIdentityInfoSp(
        CommonUtils.identifyData(operator + '.UserID'),
        CommonUtils.identifyData('Generic.Access Channel'),
      );
      if (typeof TestData.getData('Generic.Language') !== 'undefined')
        await G2Handlers.selectOption(
          'Language',
          CommonUtils.identifyData('Generic.Language'),
          'customDropdownLocator',
        );
      await G2Handlers.clickOnElement('Next', 'buttonInDiv');
      await this.fillRequiredFieldForAssignRoleForSpOp(
        CommonUtils.identifyData(operator + '.Role'),
      );
      await G2Handlers.clickOnElement('Next', 'buttonInDiv');
      await G2Handlers.verifyText('Personal Details');
      await this.fillRequiredFieldForPersonDetails(
        CommonUtils.identifyData(operator + '.FirstName'),
        CommonUtils.identifyData(operator + '.LastName'),
        CommonUtils.identifyData('Generic.Date Of Birth'),
        CommonUtils.identifyData('Generic.Email ID'),
        CommonUtils.identifyData('Generic.Notification Channel'),
      );
      if (TestData.getData('Generic.OTP Active')) {
        await G2Handlers.selectOption(
          'OTP Status',
          CommonUtils.identifyData('Generic.OTP Status'),
          'customDropdownLocator',
        );
      }
      if (typeof TestData.getData('Generic.Operator Department') !== 'undefined') {
        await G2Handlers.selectOption(
          'Operator Department',
          CommonUtils.identifyData('Generic.Operator Department'),
          'customDropdownLocator',
        );
      }
      if (typeof TestData.getData('Generic.Internal Staff') !== 'undefined') {
        await G2Handlers.selectOption(
          'Internal Staff',
          CommonUtils.identifyData('Generic.Internal Staff'),
          'customDropdownLocator',
        );
      }
      if (typeof TestData.getData('Generic.Line Manager or Head') !== 'undefined') {
        await G2Handlers.enterValue(
          'Line Manager or Head',
          CommonUtils.identifyData('Generic.Line Manager or Head'),
          'textboxUsingLabel',
        );
      }
      if (typeof TestData.getData('Generic.Operator Company') !== 'undefined') {
        await G2Handlers.enterValue(
          'Operator Company',
          CommonUtils.identifyData('Generic.Operator Company'),
          'textboxUsingLabel',
        );
      }
      if (typeof idType !== 'undefined') {
        await this.fillRequiredFieldsForIDDetails(
          idType,
          CommonUtils.identifyData(operator + '.IDNumber'),
        );
      }
      await G2Handlers.clickOnElement('Next', 'buttonInDiv');
      await G2Handlers.clickOnElement('Submit', 'buttonInDiv');
      await IFrame.switchToCurrentWindowHandle();
      await G2Handlers.clickOnElement('Yes', 'buttonInPopup');
      await G2Handlers.waitForPageLoad();
      await IFrame.switchToCurrentWindowHandle();
      await IFrame.switchToMainPage();
      await IFrame.switchToLastFrame();
      await IFrame.switchToNextFrame();
      await G2Handlers.waitForPageLoad();
      await GenericMethods.makerChecker();
      await GenericMethods.approveOrRejectGroupTask('Approve', 'Creation SP Operator');
      await HomePage.clickOnLogout();
      logger.info('Waiting for Email service to get the password to reset....');
      await TM.wait(60);
      let { initialPassword } = await GenericMethods.getDataFromEmail('Create SP Operator');
      //reset password
      await LoginPage.navigateToPortal('sp');
      await this.resetOperator(operator, initialPassword);
    }
  }

  async fillRequiredFieldForAssignRoleForSpOp(role) {
    role = role.split('|');
    await G2Handlers.clickOnElement('Add', 'buttonCite');
    await G2Handlers.waitForPageLoad();
    await IFrame.switchToPopUpWindow();
    for (let i = 0; i < role.length; i++) {
      await CreateTopOrgPage.selectProduct(role[i], 'Role', 'createtoporgpage.Role');
    }
    await G2Handlers.clickOnElement('OK', 'buttonInDiv');
    await IFrame.switchToCurrentWindowHandle();
    await IFrame.switchToMainPage();
    await IFrame.switchToLastFrame();
    await IFrame.switchToNextFrame();
    await G2Handlers.clickOnElement('Next', 'buttonInDiv');
  }

  async fillRequiredFieldsForIDDetails(idType, idNumber) {
    await CreateTopOrgPage.selectValueOnTable('ID Type', idType, 'customerpage.ID_Details');
    if (typeof idNumber !== 'undefined') {
      await CreateTopOrgPage.enterValueOnTable('ID Number', idNumber, 'customerpage.ID_Details');
    }
  }

  async resetOperator(operator, oldPassword) {
    logger.info('Initial password : ' + oldPassword);
    await G2Handlers.enterValue('Login.UserName', operator + '.UserID');
    await G2Handlers.enterValue('Login.Password', oldPassword);
    await G2Handlers.enterValue('Login.VerificationCode', '1111');
    if (operator.includes('org')) {
      await G2Handlers.enterValue(
        'Login.ShortCode',
        CommonUtils.identifyData(operator + '.Shortcode'),
      );
    }
    if (CommonUtils.identifyData('Login.SP-Url').includes('tz')) {
      await G2Handlers.clickOnElement('Login Service Agreement', 'buttonInLink');
      await G2Handlers.clickOnElement('Continue', 'buttonInDiv');
    }
    await G2Handlers.clickOnElement('Login.LoginBtn');
    await IFrame.switchToCurrentWindowHandle();
    await IFrame.switchToMainPage();
    await G2Handlers.enterValue('Old password', oldPassword, 'textboxUsingLabel');
    await G2Handlers.enterValue(
      'New password',
      CommonUtils.identifyData(operator + '.password'),
      'textboxUsingLabel',
    );
    await G2Handlers.enterValue(
      'Confirm password',
      CommonUtils.identifyData(operator + '.password'),
      'textboxUsingLabel',
    );
    // await G2Handlers.enterValue(
    //   'GenericLocators.Question1',
    //   CommonUtils.identifyData('Generic.Question 1'),
    // );
    // await G2Handlers.waitForPageLoad();
    // await TM.wait(5);
    // await G2Handlers.enterValue(
    //   'GenericLocators.Answer1',
    //   CommonUtils.identifyData('Generic.Answer 1'),
    // );
    // await G2Handlers.enterValue(
    //   'GenericLocators.Answer1',
    //   CommonUtils.identifyData('Generic.Answer 1'),
    // );
    var questions = TestData.getData('Questions');
    if (Object.keys(questions).length > 0) {
      for (var i = 0; i < Object.keys(questions).length; i++) {
        var ques = 'Questions.' + Object.keys(questions)[i];
        let childItems = TestData.getData(ques);
        let que = ques + '.' + Object.keys(childItems)[0];
        let ans = ques + '.' + Object.keys(childItems)[1];
        let quesLocator = CommonUtils.identifyLocator('GenericLocators.Question1');
        let ansLocator = CommonUtils.identifyLocator('GenericLocators.Answer1');
        await G2Handlers.enterValue(quesLocator.replace('REPLACE_TEXT', i), que);
        await TM.wait(1);
        await G2Handlers.enterValue(ansLocator.replace('REPLACE_TEXT', i), ans);
        await G2Handlers.enterValue(ansLocator.replace('REPLACE_TEXT', i), ans);
      }
    }

    await G2Handlers.waitForPageLoad();
    await TM.wait(5);
    await G2Handlers.clickOnElement('Submit', 'buttonInDiv');
    await IFrame.switchToCurrentWindowHandle();
    let noOfEle = await G2Handlers.grabNumberOfVisibleElements('GenericLocators.WinMsg');
    if (noOfEle !== 0) {
      await G2Handlers.clickOnElement('Yes', 'buttonInPopup');
    } else {
      await IFrame.switchToCurrentWindowHandle();
      await IFrame.switchToMainPage();
      await G2Handlers.clickOnElement('Submit', 'buttonInDiv');
      await IFrame.switchToCurrentWindowHandle();
      await G2Handlers.clickOnElement('Yes', 'buttonInPopup');
    }
    await IFrame.switchToCurrentWindowHandle();
    await IFrame.switchToMainPage();
    await G2Handlers.clickOnElement('Return to login page', 'buttonInDiv');
  }

  async createOrgOpsForTestDataCreation(admin) {
    var items = CommonUtils.identifyData('Org Operators');
    if (Object.keys(items).length > 0) {
      let operator = 'Org Operators.' + admin;
      await G2Handlers.waitForPageLoad();
      await this.navigateToAdminPage('Manage Organization Operator');
      await IFrame.switchToNextFrame();
      await G2Handlers.verifyText('Manage Organization Operator');
      await G2Handlers.clickOnElement('Add', 'buttonCite');
      await G2Handlers.verifyText('Create Organization Operator');
      await this.fillRequiredFieldsForIdentityInfoOrg(
        CommonUtils.identifyData(operator + '.Shortcode'),
        CommonUtils.identifyData(operator + '.Access Channel'),
        CommonUtils.identifyData(operator + '.UserID'),
        TestData.getData(operator + '.OperatorID'),
      );
      if (typeof TestData.getData('Generic.Language') !== 'undefined')
        await G2Handlers.selectOption(
          'Language',
          CommonUtils.identifyData('Generic.Language'),
          'customDropdownLocator',
        );
      await G2Handlers.clickOnElement('Next', 'buttonInDiv');
      await this.fillRequiredFieldForAssignRoleForSpOp(
        CommonUtils.identifyData(operator + '.Roles'),
      );
      await G2Handlers.clickOnElement('Next', 'buttonInDiv');
      await G2Handlers.verifyText('Personal Details');
      await this.fillRequiredFieldForPersonDetails(
        CommonUtils.identifyData(operator + '.FirstName'),
        CommonUtils.identifyData(operator + '.LastName'),
        CommonUtils.identifyData('Generic.Date Of Birth'),
        CommonUtils.identifyData('Generic.Email ID'),
        CommonUtils.identifyData('Generic.Notification Channel'),
      );
      await G2Handlers.selectOption(
        'OTP Status',
        CommonUtils.identifyData('Generic.OTP Status'),
        'customDropdownLocator',
      );
      if (typeof TestData.getData(operator + '.IdType') !== 'undefined') {
        await this.fillRequiredFieldsForIDDetails(
          CommonUtils.identifyData(operator + '.IdType'),
          CommonUtils.identifyData(operator + '.IdNumber'),
        );
      }
      await G2Handlers.clickOnElement('Next', 'buttonInDiv');
      await G2Handlers.clickOnElement('Submit', 'buttonInDiv');
      await IFrame.switchToCurrentWindowHandle();
      await G2Handlers.clickOnElement('Yes', 'buttonInPopup');
      await G2Handlers.waitForPageLoad();
      await IFrame.switchToCurrentWindowHandle();
      await IFrame.switchToMainPage();
      await IFrame.switchToLastFrame();
      await IFrame.switchToNextFrame();
      await G2Handlers.waitForPageLoad();
      await GenericMethods.makerChecker();
      await GenericMethods.approveOrRejectGroupTask('Approve', 'Creation Organization Operator');
      await HomePage.clickOnLogout();
      logger.info('Waiting for Email service to get the password to reset....');
      await TM.wait(60);
      let { initialPassword } = await GenericMethods.getDataFromEmail(
        'Create Organization Operator',
        operator,
      );
      //reset password
      await LoginPage.navigateToPortal('org');
      // await TM.see('Organization Portal');
      await G2Handlers.waitForPageLoad();
      await this.resetOperator(operator, initialPassword);
    }
  }

  async addBankAccount(bank, branch, accountName, accountNumber) {
    await G2Handlers.clickOnElement('Add', 'buttonCite');
    await IFrame.switchToCurrentWindowHandle();
    await G2Handlers.selectOption('Bank', bank, 'customDropdownLocator');
    await G2Handlers.selectOption('Bank Branch', branch, 'customDropdownLocator');
    await G2Handlers.enterValue('Bank Account Name', accountName, 'textboxUsingLabel');
    await G2Handlers.enterValue('Bank Account Number', accountNumber, 'textboxUsingLabel');
    await G2Handlers.clickOnElement('Submit', 'buttonInDiv');
  }

  async createTillForTestDataCreation(tillRef) {
    var op = CommonUtils.identifyData('Tills');
    if (Object.keys(op).length > 0) {
      let tilloperator = 'Tills.' + tillRef;
      await CreateTopOrgPage.navigateToCreateAllIdPage('Create Till');
      await IFrame.switchToNextFrame();
      await G2Handlers.verifyText('Create Till');
      await G2Handlers.enterValue(
        'Organization Short Code',
        CommonUtils.identifyData(tilloperator + '.Shortcode'),
        'textboxUsingLabel',
      );
      await G2Handlers.enterValue(
        'MSISDN',
        CommonUtils.identifyData(tilloperator + '.MSISDN'),
        'textboxUsingLabel',
      );
      await G2Handlers.enterValue(
        'Till Number',
        CommonUtils.identifyData(tilloperator + '.TillNumber'),
        'textboxUsingLabel',
      );
      if (typeof TestData.getData('Generic.Language') !== 'undefined')
        await G2Handlers.selectOption(
          'Language',
          CommonUtils.identifyData('Generic.Language'),
          'customDropdownLocator',
        );
      if (CommonUtils.identifyData(tilloperator + '.OperatorID') !== 'undefined') {
        await G2Handlers.selectOption(
          'Default Operator ID',
          CommonUtils.identifyData(tilloperator + '.OperatorID'),
          'customDropdownLocator',
        );
      }
      await this.fillRequiredFieldForAssignRoleForSpTill(
        CommonUtils.identifyData(tilloperator + '.Product'),
      );
      await G2Handlers.clickOnElement('Next', 'buttonInDiv');
      await G2Handlers.clickOnElement('Submit', 'buttonInDiv');
      await IFrame.switchToCurrentWindowHandle();
      await G2Handlers.clickOnElement('Yes', 'buttonInPopup');
      await G2Handlers.waitForPageLoad();
      await IFrame.switchToCurrentWindowHandle();
      await IFrame.switchToMainPage();
      await IFrame.switchToLastFrame();
      await IFrame.switchToNextFrame();
      await G2Handlers.waitForPageLoad();
      await GenericMethods.makerChecker();
      await GenericMethods.approveOrRejectGroupTask('Approve', 'Creation Till');
      //enable this code when handsets attached for execution
      // await TM.switchHelper('Appium');
      // await G2Ussd.checkMessage('successfully added', 'USSD.Sender', tilloperator);
      // await TM.switchHelper('WebDriver');
      // await LoginPage.login('sp');
      // await HomePage.clickOnTopAndSubMenu('Search', 'Organization Operator');
      // await G2Handlers.enterValue(
      //   'Operator ID',
      //   CommonUtils.identifyData(tilloperator + '.OperatorID'),
      //   'textboxUsingLabel',
      // );
      // await G2Handlers.enterValue(
      //   'Operator ID',
      //   CommonUtils.identifyData(tilloperator + '.OperatorID'),
      //   'textboxUsingLabel',
      // );
      // await G2Handlers.clickOnElement('Search', 'buttonInDiv');
      // await TM.wait(1);
      // await G2Handlers.clickOnElement('Search', 'buttonInDiv');
      // await G2Handlers.clickValueOnTableData(
      //   'Table.Organization Operator',
      //   tilloperator + '.OperatorID',
      //   'Details',
      //   'Operation',
      // );
      // await HomePage.clickOnCloseTabNearHome();
      // await IFrame.switchToLastFrame();
      // await IFrame.switchToNextFrame();
      // await G2Handlers.verifyText('Organization Operator Info');
      // await G2Handlers.clickOnElement('Reset PIN', 'buttonCite');
      // await IFrame.switchToPopUpWindow();
      // await G2Handlers.enterTextAreaValue('Reason', 'test');
      // await G2Handlers.clickOnElement('Submit', 'buttonInDiv');
      // await IFrame.switchToCurrentWindowHandle();
      // await G2Handlers.clickOnElement('Confirm', 'buttonInPopup');
      // await HomePage.clickOnCloseTabNearHome();
      // await HomePage.clickOnLogout();
      // await TM.switchHelper('Appium');
      // let assistantID = CommonUtils.identifyData(tilloperator + '.OperatorID');
      // TestData.setField('EnterAssistantID', assistantID);
      // let strInitialPin = await G2Ussd.getPIN('Confirmed', tilloperator);
      // TestData.setField('EnterInitPin', strInitialPin);
      // logger.info('Initial PIN is ' + strInitialPin);
      // await USSD.dialUSSD('USSD.Code', tilloperator);
      // await G2Ussd.selectService('Till.Activate_Till', tilloperator);
      // await G2Ussd.checkMessage('activated', 'USSD.Sender', tilloperator);
      // await TM.switchHelper('WebDriver');
    }
  }

  async fillRequiredFieldForAssignRoleForSpTill(product) {
    product = product.split('|');
    for (var i = 0; i < product.length; i++) {
      await G2Handlers.doubleClick("option[title='" + product[i] + "']");
    }
  }

  async changeNotificationChannel(operatorRef) {
    var items = CommonUtils.identifyData('ChangeNotificationChannel');
    if (Object.keys(items).length > 0) {
      let changeNotificationChannel = 'ChangeNotificationChannel.' + operatorRef;
      let shortCode = CommonUtils.identifyData(changeNotificationChannel + '.Shortcode');
      let searchValue = CommonUtils.identifyData(changeNotificationChannel + '.OperatorID');
      await HomePage.clickOnTopAndSubMenu('Search', 'Organization Operator');
      await G2Handlers.enterValue('Organization Short Code', shortCode, 'textboxUsingLabel');
      await G2Handlers.enterValue('Operator ID', searchValue, 'textboxUsingLabel');
      await G2Handlers.clickOnElement('Search', 'buttonInDiv');
      await TM.wait(1);
      await G2Handlers.clickOnElement('Search', 'buttonInDiv');
      await G2Handlers.clickValueOnTableData(
        'dataList',
        searchValue + '|' + 'Active',
        'Details',
        'Operation',
      );
      await HomePage.clickOnCloseTabNearHome();
      await IFrame.switchToLastFrame();
      await IFrame.switchToNextFrame();
      await G2Handlers.verifyText('Organization Operator Info');
      await IFrame.switchToNextFrame();
      await G2Handlers.clickOnElement('KYC Info', 'buttonInLabel');
      await G2Handlers.clickOnElement('GenericLocators.KYC_Info_Edit');
      await G2Handlers.selectOption(
        'Preferred Notification Channel',
        changeNotificationChannel + '.Notification Channel',
        'customDropdownLocator',
      );
      await G2Handlers.enterValue(
        'Notification Receiving MSISDN',
        CommonUtils.identifyData(changeNotificationChannel + '.Notification Receiving MSISDN'),
        'textboxUsingLabel',
      );
      await G2Handlers.enterTextAreaValue(
        'Reason',
        CommonUtils.identifyData('Reason Description'),
        'customTextAreaLocator',
      );
      await G2Handlers.clickOnElement('Submit', 'buttonInDiv');
      await G2Handlers.waitForPageLoad();
      await TM.wait(3);
      await IFrame.switchToMainPage();
      await IFrame.switchToCurrentWindowHandle();
      await G2Handlers.clickOnElement('Confirm', 'buttonInDiv');
      await HomePage.clickOnLogout();
      TM.report('The Notification Channel is changed for the Short Code ' + shortCode);
    }
  }

  async recycleMSISDN(msisdn) {
    await G2Handlers.waitForPageLoad();
    await this.leftmenunavigation('Recycled MSISDN');
    await G2Handlers.clickOnElement(' Recycle ', 'buttonCite');
    await G2Handlers.enterValue(
      'MSISDN',
      CommonUtils.identifyData(msisdn).toString(),
      'textboxUsingLabelInDialogWindow',
    );
    await G2Handlers.clickOnElement('customerpage.VerifyInRecycle');

    let number = await G2Handlers.grabNumberOfVisibleElements(
      CommonUtils.identifyData('customerpage.MsisdnExist'),
    );

    if (number == 0) {
      await G2Handlers.enterValue(
        'Remark',
        'Automation Testing Purpose',
        'customTextAreaLocatorInDialogWindow',
      );
      await G2Handlers.clickOnElement('customerpage.SubmitMSISDN');
      await G2Handlers.clickOnElement('GenericLocators.ConfirmException');
    } else {
      TM.report('This MSISDN is already recycled or not assigned to any customer or till.');
    }
  }

  async createCustomersUsingTestdataCreationFile(custRef) {
    var op = CommonUtils.identifyData('Customers');
    if (Object.keys(op).length > 0) {
      let customer = 'Customers.' + custRef;
      let custMSISDN = CommonUtils.identifyData(customer + '.MSISDN');
      CommonUtils.generateRandomNumbers('IDNumber', 'RAND_9');
      await CreateTopOrgPage.navigateToCreateAllIdPage('Create Customer');
      await IFrame.switchToNextFrame();
      await G2Handlers.verifyText('Create Customer');
      await IFrame.switchToNextFrame();
      let product = CommonUtils.identifyData(customer + '.Product Name');
      await CreateTopOrgPage.selectProduct(
        product,
        'Product Name',
        'createtoporgpage.ProductList_Table',
      );
      await G2Handlers.enterValue('MSISDN', custMSISDN, 'textboxUsingLabel');
      TM.wait(2);
      if (typeof TestData.getData('Generic.Language') !== 'undefined')
        await G2Handlers.selectOption(
          'Language',
          CommonUtils.identifyData('Generic.Language'),
          'customDropdownLocator',
        );
      await G2Handlers.enterValue(
        'First Name',
        CommonUtils.identifyData(customer + '.First Name'),
        'textboxUsingLabel',
      );
      await G2Handlers.enterValue(
        'Last Name',
        CommonUtils.identifyData(customer + '.Last Name'),
        'textboxUsingLabel',
      );
      await G2Handlers.enterValue(
        'Date of Birth',
        CommonUtils.identifyData('Generic.Date Of Birth'),
        'textboxUsingLabel',
      );
      await G2Handlers.enterValue(
        'City/Town',
        CommonUtils.identifyData('Generic.City/Town'),
        'textboxUsingLabel',
      );
      await G2Handlers.enterValue(
        'Physical Address',
        CommonUtils.identifyData('Generic.Address'),
        'textboxUsingLabel',
      );
      if (typeof TestData.getData('Generic.Secret Question') !== 'undefined') {
        await G2Handlers.selectOption(
          'Secret Question',
          CommonUtils.identifyData('Generic.Secret Question'),
          'customDropdownLocator',
        );
        await G2Handlers.enterValue(
          'Label.Secret Answer',
          CommonUtils.identifyData('Generic.Answer 1'),
          'textboxUsingLabel',
        );
        await G2Handlers.enterValue(
          'Label.Secret Answer',
          CommonUtils.identifyData('Generic.Answer 1'),
          'textboxUsingLabel',
        );
      }
      if (typeof TestData.getData(customer + '.ID Type') !== 'undefined')
        await CreateTopOrgPage.selectValueOnTable(
          'ID Type',
          CommonUtils.identifyData(customer + '.ID Type'),
          'customerpage.ID_Details',
        );
      if (typeof TestData.getField('IDNumber') !== 'undefined')
        await CreateTopOrgPage.enterValueOnTable(
          'ID Number',
          TestData.getField('IDNumber'),
          'customerpage.ID_Details',
        );

      if (typeof TestData.getData(customer + '.Document Received') !== 'undefined') {
        await CreateTopOrgPage.selectValueOnTable(
          'Document Received',
          CommonUtils.identifyData(customer + '.Document Received'),
          'customerpage.ID_Details',
        );
      }
      let preferredNotificationChannel = TestData.getData(
        customer + '.Preferred Notification Channel',
      );
      if (typeof preferredNotificationChannel !== 'undefined') {
        await G2Handlers.selectOption(
          'Preferred Notification Channel',
          preferredNotificationChannel,
          'customDropdownLocator',
        );
        await G2Handlers.selectOption(
          'Preferred Notification Channel',
          preferredNotificationChannel,
          'customDropdownLocator',
        );
        if (preferredNotificationChannel.includes('Email')) {
          await G2Handlers.enterValue(
            'Notification Receiving E-mail',
            CommonUtils.identifyData('Generic.Email ID'),
            'textboxUsingLabel',
          );
        } else {
          await G2Handlers.enterValue(
            'Notification Receiving MSISDN',
            custMSISDN,
            'textboxUsingLabel',
          );
        }
      }
      await G2Handlers.clickOnElement('Next', 'buttonInDiv');
      await IFrame.switchToCurrentWindowHandle();
      await IFrame.switchToMainPage();
      await IFrame.switchToLastFrame();
      await IFrame.switchToNextFrame();
      await G2Handlers.verifyText(customer + '.Trust Level');

      await G2Handlers.clickOnElement('Next', 'buttonInDiv');
      await G2Handlers.clickOnElement('Submit', 'buttonInDiv');
      await GenericMethods.makerChecker();
      await GenericMethods.approveOrRejectGroupTask('Approve', 'Create Customer');
      await HomePage.clickOnLogout();

      let isDeviceActivate = TestData.getData(customer + '.Activate');
      if (typeof isDeviceActivate !== 'undefined' && isDeviceActivate) {
        logger.info(
          'Activating customer from device as per test data creation file: please wait it will complete the process...',
        );
        let deviceRef = CommonUtils.identifyData(customer + '.Device Reference');
        this.activateFromDevice(deviceRef);
      }
    }
  }

  async activateFromDevice(deviceReference) {
    let strInitialPin = await G2Ussd.getPIN('activate', deviceReference);
    TestData.setField('EnterInitPin', strInitialPin);
    await USSD.dialUSSD(CommonUtils.identifyData('USSD.Code'), deviceReference);
    await G2Ussd.selectService(
      CommonUtils.identifyData('Customer.Change Initial Start Pin'),
      deviceReference,
    );
    await G2Ussd.checkMessage('activated', 'USSD.Sender', deviceReference);
    logger.info('Completed activating the customer ...');
  }
}

module.exports = new AdminPage();
module.exports.AdminPage = AdminPage;
